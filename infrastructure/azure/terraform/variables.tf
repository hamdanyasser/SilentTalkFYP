# Variables for Azure Infrastructure

variable "azure_region" {
  description = "Azure region for deployment"
  type        = string
  default     = "eastus"
}

variable "environment" {
  description = "Environment name (production, staging, etc.)"
  type        = string
  default     = "production"
}

variable "vnet_address_space" {
  description = "Address space for VNet"
  type        = string
  default     = "10.1.0.0/16"
}

# PostgreSQL Configuration
variable "postgres_sku_name" {
  description = "PostgreSQL SKU name"
  type        = string
  default     = "GP_Standard_D2s_v3"  # General Purpose, 2 vCPU, 8GB RAM
}

variable "postgres_storage_mb" {
  description = "PostgreSQL storage in MB"
  type        = number
  default     = 131072  # 128GB
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "silenttalk_prod"
}

variable "db_username" {
  description = "Database admin username"
  type        = string
  default     = "silenttalk_admin"
  sensitive   = true
}

# Redis Configuration
variable "redis_capacity" {
  description = "Redis cache capacity (0-6 for Premium)"
  type        = number
  default     = 1  # 6GB
}

# App Service Configuration
variable "app_service_sku" {
  description = "App Service Plan SKU"
  type        = string
  default     = "P1v3"  # Premium v3, 2 vCPU, 8GB RAM
}

# Container Configuration
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

# Domain Configuration
variable "cors_origin" {
  description = "Allowed CORS origin"
  type        = string
  default     = "https://silenttalk.com"
}

# Monitoring Configuration
variable "alert_emails" {
  description = "Email addresses for alerts"
  type        = list(string)
  default     = []
}
