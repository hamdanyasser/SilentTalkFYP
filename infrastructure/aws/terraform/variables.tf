# Variables for AWS Infrastructure

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (production, staging, etc.)"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# RDS Configuration
variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "rds_allocated_storage" {
  description = "Initial allocated storage for RDS (GB)"
  type        = number
  default     = 100
}

variable "rds_max_allocated_storage" {
  description = "Maximum allocated storage for RDS autoscaling (GB)"
  type        = number
  default     = 500
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "silenttalk_prod"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "silenttalk_admin"
  sensitive   = true
}

# Redis Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.medium"
}

# ECS Container Configuration
variable "server_container_image" {
  description = "Docker image for server"
  type        = string
  default     = "ghcr.io/silenttalk/silenttalk-fyp/server:latest"
}

variable "client_container_image" {
  description = "Docker image for client"
  type        = string
  default     = "ghcr.io/silenttalk/silenttalk-fyp/client:latest"
}

# TURN Server Configuration
variable "turn_instance_type" {
  description = "EC2 instance type for TURN server"
  type        = string
  default     = "t3.medium"
}

variable "ec2_key_name" {
  description = "EC2 key pair name for SSH access"
  type        = string
}

# Domain Configuration
variable "api_domain" {
  description = "Domain name for API"
  type        = string
}

variable "cdn_domain" {
  description = "Domain name for CDN"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for SSL/TLS"
  type        = string
}

variable "cors_origin" {
  description = "Allowed CORS origin"
  type        = string
}

# Monitoring Configuration
variable "alert_emails" {
  description = "Email addresses for alerts"
  type        = list(string)
  default     = []
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for alerts"
  type        = string
  default     = ""
  sensitive   = true
}

# WAF Configuration
variable "geo_blocking_enabled" {
  description = "Enable geo-blocking in WAF"
  type        = bool
  default     = false
}

variable "blocked_countries" {
  description = "List of country codes to block"
  type        = list(string)
  default     = []
}
