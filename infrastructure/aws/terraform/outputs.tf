# Outputs for AWS Infrastructure

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = module.alb.dns_name
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.domain_name
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.redis.primary_endpoint
  sensitive   = true
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = module.s3.bucket_name
}

output "turn_server_ips" {
  description = "TURN server public IPs"
  value       = module.turn_server.public_ips
}

output "secrets_arns" {
  description = "ARNs of secrets in Secrets Manager"
  value = {
    database = module.secrets.database_secret_arn
    redis    = module.secrets.redis_secret_arn
    jwt      = module.secrets.jwt_secret_arn
  }
  sensitive = true
}

output "monitoring_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = module.monitoring.dashboard_url
}

output "backup_vault_name" {
  description = "AWS Backup vault name"
  value       = module.backup.vault_name
}

output "waf_web_acl_id" {
  description = "WAF Web ACL ID"
  value       = module.waf.web_acl_id
}
