# AWS Infrastructure for SilentTalk FYP
# NFR-002 (Scalability) and NFR-003 (Reliability)

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "silenttalk-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "silenttalk-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "SilentTalk-FYP"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CostCenter  = "Production"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Local variables
locals {
  name_prefix = "silenttalk-${var.environment}"
  azs         = slice(data.aws_availability_zones.available.names, 0, 3)

  common_tags = {
    Name        = local.name_prefix
    Environment = var.environment
    Project     = "SilentTalk-FYP"
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  name_prefix        = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = local.azs

  tags = local.common_tags
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security"

  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id

  tags = local.common_tags
}

# RDS PostgreSQL with Multi-AZ
module "rds" {
  source = "./modules/rds"

  name_prefix           = local.name_prefix
  vpc_id                = module.vpc.vpc_id
  subnet_ids            = module.vpc.private_subnet_ids
  security_group_ids    = [module.security_groups.rds_security_group_id]

  # Database configuration
  engine_version        = "15.4"
  instance_class        = var.rds_instance_class
  allocated_storage     = var.rds_allocated_storage
  max_allocated_storage = var.rds_max_allocated_storage

  # Multi-AZ for high availability
  multi_az              = true

  # Backup configuration - every 6 hours
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  # Performance Insights
  performance_insights_enabled = true

  # Enhanced monitoring
  monitoring_interval = 60

  tags = local.common_tags
}

# ElastiCache Redis with Multi-AZ
module "redis" {
  source = "./modules/redis"

  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.redis_security_group_id]

  # Redis configuration
  node_type                  = var.redis_node_type
  num_cache_nodes            = 3
  automatic_failover_enabled = true
  multi_az_enabled           = true

  # Backup configuration
  snapshot_retention_limit = 7
  snapshot_window         = "02:00-03:00"

  tags = local.common_tags
}

# ECS Cluster
module "ecs" {
  source = "./modules/ecs"

  name_prefix = local.name_prefix

  # Container Insights for monitoring
  container_insights = true

  tags = local.common_tags
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"

  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.public_subnet_ids
  security_group_ids = [module.security_groups.alb_security_group_id]

  # SSL/TLS configuration
  certificate_arn = var.acm_certificate_arn
  ssl_policy      = "ELBSecurityPolicy-TLS13-1-2-2021-06" # TLS 1.3

  # Health check configuration
  health_check_path     = "/health"
  health_check_interval = 30
  health_check_timeout  = 5
  healthy_threshold     = 2
  unhealthy_threshold   = 3

  tags = local.common_tags
}

# ECS Services for Client and Server
module "ecs_service_server" {
  source = "./modules/ecs-service"

  name_prefix        = "${local.name_prefix}-server"
  cluster_id         = module.ecs.cluster_id
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.ecs_security_group_id]

  # Container configuration
  container_image = var.server_container_image
  container_port  = 5000
  cpu             = 1024
  memory          = 2048

  # Auto-scaling configuration - 70% CPU threshold
  desired_count    = 3
  min_capacity     = 3
  max_capacity     = 10
  cpu_threshold    = 70
  memory_threshold = 80

  # Load balancer configuration
  target_group_arn = module.alb.server_target_group_arn

  # Environment variables from Secrets Manager
  secrets_arns = [
    module.secrets.database_secret_arn,
    module.secrets.redis_secret_arn,
    module.secrets.jwt_secret_arn
  ]

  environment_variables = {
    NODE_ENV    = "production"
    PORT        = "5000"
    LOG_LEVEL   = "info"
    CORS_ORIGIN = var.cors_origin
  }

  tags = local.common_tags
}

module "ecs_service_client" {
  source = "./modules/ecs-service"

  name_prefix        = "${local.name_prefix}-client"
  cluster_id         = module.ecs.cluster_id
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.ecs_security_group_id]

  # Container configuration
  container_image = var.client_container_image
  container_port  = 8080
  cpu             = 512
  memory          = 1024

  # Auto-scaling configuration - 70% CPU threshold
  desired_count    = 3
  min_capacity     = 3
  max_capacity     = 10
  cpu_threshold    = 70
  memory_threshold = 80

  # Load balancer configuration
  target_group_arn = module.alb.client_target_group_arn

  environment_variables = {
    REACT_APP_API_URL = "https://${var.api_domain}"
    REACT_APP_WS_URL  = "wss://${var.api_domain}"
  }

  tags = local.common_tags
}

# S3 Buckets for storage
module "s3" {
  source = "./modules/s3"

  name_prefix = local.name_prefix

  # Bucket configuration
  versioning_enabled = true

  # Lifecycle rules for cost optimization
  lifecycle_rules = [
    {
      id      = "archive-old-objects"
      enabled = true

      transition = [
        {
          days          = 90
          storage_class = "GLACIER"
        }
      ]
    }
  ]

  tags = local.common_tags
}

# CloudFront CDN
module "cloudfront" {
  source = "./modules/cloudfront"

  name_prefix = local.name_prefix

  # Origin configuration
  alb_domain_name = module.alb.dns_name
  s3_bucket_domain_name = module.s3.bucket_regional_domain_name

  # CDN configuration
  domain_aliases = [var.cdn_domain]
  certificate_arn = var.acm_certificate_arn

  # TLS 1.3 configuration
  minimum_protocol_version = "TLSv1.3_2021"

  # Caching configuration
  default_ttl = 3600
  max_ttl     = 86400
  min_ttl     = 0

  tags = local.common_tags
}

# Secrets Manager
module "secrets" {
  source = "./modules/secrets"

  name_prefix = local.name_prefix

  # Database credentials
  database_secret = {
    username = var.db_username
    password = random_password.db_password.result
    host     = module.rds.endpoint
    port     = 5432
    database = var.db_name
  }

  # Redis credentials
  redis_secret = {
    host     = module.redis.primary_endpoint
    port     = 6379
    password = random_password.redis_password.result
  }

  # JWT secret
  jwt_secret = random_password.jwt_secret.result

  tags = local.common_tags
}

# TURN Server for WebRTC
module "turn_server" {
  source = "./modules/turn"

  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.public_subnet_ids
  security_group_ids = [module.security_groups.turn_security_group_id]

  # Instance configuration
  instance_type = var.turn_instance_type
  key_name      = var.ec2_key_name

  # TURN configuration
  turn_port       = 3478
  turn_tls_port   = 5349
  turn_min_port   = 49152
  turn_max_port   = 65535

  # Auto-scaling
  min_size         = 2
  max_size         = 6
  desired_capacity = 2

  tags = local.common_tags
}

# CloudWatch Monitoring and Alarms
module "monitoring" {
  source = "./modules/monitoring"

  name_prefix = local.name_prefix

  # ECS monitoring
  ecs_cluster_name      = module.ecs.cluster_name
  ecs_service_names     = [
    module.ecs_service_server.service_name,
    module.ecs_service_client.service_name
  ]

  # RDS monitoring
  rds_instance_id = module.rds.instance_id

  # Redis monitoring
  redis_cluster_id = module.redis.cluster_id

  # ALB monitoring
  alb_arn_suffix = module.alb.arn_suffix
  target_group_arn_suffixes = [
    module.alb.server_target_group_arn_suffix,
    module.alb.client_target_group_arn_suffix
  ]

  # SNS topic for alerts
  sns_topic_arn = module.alerts.sns_topic_arn

  tags = local.common_tags
}

# SNS Alerts
module "alerts" {
  source = "./modules/alerts"

  name_prefix = local.name_prefix

  # Alert email addresses
  email_endpoints = var.alert_emails

  # Slack webhook (optional)
  slack_webhook_url = var.slack_webhook_url

  tags = local.common_tags
}

# WAF for rate limiting and security
module "waf" {
  source = "./modules/waf"

  name_prefix = local.name_prefix

  # Associate with ALB
  alb_arn = module.alb.arn

  # Rate limiting rules
  rate_limit_rules = [
    {
      name     = "general-rate-limit"
      priority = 1
      limit    = 2000
      period   = 300 # 5 minutes
    },
    {
      name     = "api-rate-limit"
      priority = 2
      limit    = 1000
      period   = 300 # 5 minutes
      path     = "/api/*"
    }
  ]

  # Geo-blocking (optional)
  geo_blocking_enabled = var.geo_blocking_enabled
  blocked_countries    = var.blocked_countries

  tags = local.common_tags
}

# Backup configuration
module "backup" {
  source = "./modules/backup"

  name_prefix = local.name_prefix

  # Backup vault
  vault_name = "${local.name_prefix}-backup-vault"

  # Backup plan - every 6 hours
  backup_plan_name = "${local.name_prefix}-backup-plan"
  backup_schedule  = "cron(0 */6 * * ? *)" # Every 6 hours
  retention_days   = 30

  # Resources to backup
  resource_arns = [
    module.rds.arn,
    module.s3.bucket_arn
  ]

  tags = local.common_tags
}

# Random passwords
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "random_password" "redis_password" {
  length  = 32
  special = false # Redis doesn't support special characters well
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}
