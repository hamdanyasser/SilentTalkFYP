# Azure Infrastructure for SilentTalk FYP
# NFR-002 (Scalability) and NFR-003 (Reliability)

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "silenttalk-terraform-rg"
    storage_account_name = "silenttalkterraform"
    container_name       = "tfstate"
    key                  = "production.terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = false
    }
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
  }
}

# Data sources
data "azurerm_client_config" "current" {}

# Local variables
locals {
  name_prefix = "silenttalk-${var.environment}"
  location    = var.azure_region

  common_tags = {
    Project     = "SilentTalk-FYP"
    Environment = var.environment
    ManagedBy   = "Terraform"
    CostCenter  = "Production"
  }
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${local.name_prefix}-rg"
  location = local.location

  tags = local.common_tags
}

# Virtual Network (Multi-AZ equivalent in Azure)
resource "azurerm_virtual_network" "main" {
  name                = "${local.name_prefix}-vnet"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  address_space       = [var.vnet_address_space]

  tags = local.common_tags
}

# Subnets
resource "azurerm_subnet" "app_service" {
  name                 = "${local.name_prefix}-app-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [cidrsubnet(var.vnet_address_space, 8, 1)]

  delegation {
    name = "app-service-delegation"

    service_delegation {
      name = "Microsoft.Web/serverFarms"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/action"
      ]
    }
  }
}

resource "azurerm_subnet" "database" {
  name                 = "${local.name_prefix}-db-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [cidrsubnet(var.vnet_address_space, 8, 2)]

  delegation {
    name = "postgresql-delegation"

    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action"
      ]
    }
  }
}

resource "azurerm_subnet" "redis" {
  name                 = "${local.name_prefix}-redis-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [cidrsubnet(var.vnet_address_space, 8, 3)]
}

# PostgreSQL Flexible Server with Zone-Redundancy
resource "azurerm_postgresql_flexible_server" "main" {
  name                = "${local.name_prefix}-postgres"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  administrator_login    = var.db_username
  administrator_password = random_password.db_password.result

  sku_name   = var.postgres_sku_name
  version    = "15"
  storage_mb = var.postgres_storage_mb

  # Zone-redundancy for high availability (Multi-AZ equivalent)
  zone                      = "1"
  high_availability {
    mode                      = "ZoneRedundant"
    standby_availability_zone = "2"
  }

  # Backup configuration - every 6 hours via retention
  backup_retention_days = 30
  geo_redundant_backup_enabled = true

  # Network configuration
  delegated_subnet_id = azurerm_subnet.database.id
  private_dns_zone_id = azurerm_private_dns_zone.postgres.id

  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgres]

  tags = local.common_tags
}

# PostgreSQL Database
resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = var.db_name
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Private DNS Zone for PostgreSQL
resource "azurerm_private_dns_zone" "postgres" {
  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.main.name

  tags = local.common_tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "${local.name_prefix}-postgres-dns-link"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  virtual_network_id    = azurerm_virtual_network.main.id

  tags = local.common_tags
}

# Azure Cache for Redis (Premium tier with zone redundancy)
resource "azurerm_redis_cache" "main" {
  name                = "${local.name_prefix}-redis"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  capacity            = var.redis_capacity
  family              = "P"  # Premium tier
  sku_name            = "Premium"

  # Zone redundancy (Multi-AZ equivalent)
  zones = ["1", "2", "3"]

  # Redis configuration
  redis_version        = "6"
  enable_non_ssl_port  = false
  minimum_tls_version  = "1.3"  # TLS 1.3 requirement

  # Backup configuration
  redis_configuration {
    enable_authentication = true
    maxmemory_policy     = "allkeys-lru"

    # Daily backup
    rdb_backup_enabled = true
    rdb_backup_frequency = 360  # Every 6 hours in minutes
    rdb_backup_max_snapshot_count = 7
    rdb_storage_connection_string = azurerm_storage_account.backups.primary_blob_connection_string
  }

  # Network configuration
  subnet_id = azurerm_subnet.redis.id

  tags = local.common_tags
}

# App Service Plan with Auto-Scaling
resource "azurerm_service_plan" "main" {
  name                = "${local.name_prefix}-asp"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  os_type  = "Linux"
  sku_name = var.app_service_sku

  # Zone redundancy
  zone_balancing_enabled = true

  tags = local.common_tags
}

# Auto-Scale Settings for App Service Plan (70% CPU threshold)
resource "azurerm_monitor_autoscale_setting" "app_service" {
  name                = "${local.name_prefix}-autoscale"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  target_resource_id  = azurerm_service_plan.main.id

  profile {
    name = "Auto scale based on CPU"

    capacity {
      default = 3
      minimum = 3
      maximum = 10
    }

    # Scale out rule (70% CPU threshold)
    rule {
      metric_trigger {
        metric_name        = "CpuPercentage"
        metric_resource_id = azurerm_service_plan.main.id
        operator           = "GreaterThan"
        statistic          = "Average"
        threshold          = 70
        time_aggregation   = "Average"
        time_grain         = "PT1M"
        time_window        = "PT5M"
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }

    # Scale in rule
    rule {
      metric_trigger {
        metric_name        = "CpuPercentage"
        metric_resource_id = azurerm_service_plan.main.id
        operator           = "LessThan"
        statistic          = "Average"
        threshold          = 30
        time_aggregation   = "Average"
        time_grain         = "PT1M"
        time_window        = "PT5M"
      }

      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT10M"
      }
    }
  }

  tags = local.common_tags
}

# App Service for Server
resource "azurerm_linux_web_app" "server" {
  name                = "${local.name_prefix}-api"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id

  site_config {
    always_on = true

    application_stack {
      docker_image     = split(":", var.server_container_image)[0]
      docker_image_tag = split(":", var.server_container_image)[1]
    }

    # TLS 1.3 configuration
    minimum_tls_version = "1.3"

    # Health check
    health_check_path = "/health"

    # CORS
    cors {
      allowed_origins = [var.cors_origin]
    }
  }

  # App settings (environment variables)
  app_settings = {
    NODE_ENV                          = "production"
    PORT                              = "5000"
    LOG_LEVEL                         = "info"
    WEBSITES_PORT                     = "5000"
    DOCKER_REGISTRY_SERVER_URL        = "https://ghcr.io"
    WEBSITES_ENABLE_APP_SERVICE_STORAGE = "false"

    # Reference Key Vault secrets
    DATABASE_URL = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=database-url)"
    REDIS_URL    = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=redis-url)"
    JWT_SECRET   = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=jwt-secret)"
  }

  # Managed identity for Key Vault access
  identity {
    type = "SystemAssigned"
  }

  # Network integration
  virtual_network_subnet_id = azurerm_subnet.app_service.id

  tags = local.common_tags
}

# App Service for Client
resource "azurerm_linux_web_app" "client" {
  name                = "${local.name_prefix}-web"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id

  site_config {
    always_on = true

    application_stack {
      docker_image     = split(":", var.client_container_image)[0]
      docker_image_tag = split(":", var.client_container_image)[1]
    }

    # TLS 1.3 configuration
    minimum_tls_version = "1.3"

    # Health check
    health_check_path = "/health"
  }

  app_settings = {
    REACT_APP_API_URL                 = "https://${azurerm_linux_web_app.server.default_hostname}"
    REACT_APP_WS_URL                  = "wss://${azurerm_linux_web_app.server.default_hostname}"
    WEBSITES_PORT                     = "8080"
    DOCKER_REGISTRY_SERVER_URL        = "https://ghcr.io"
    WEBSITES_ENABLE_APP_SERVICE_STORAGE = "false"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = local.common_tags
}

# Storage Account for Blob Storage
resource "azurerm_storage_account" "main" {
  name                     = "${replace(local.name_prefix, "-", "")}storage"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "ZRS"  # Zone-redundant storage
  account_kind             = "StorageV2"

  # TLS 1.3 configuration
  min_tls_version = "TLS1_2"  # Azure doesn't support TLS 1.3 min yet, but 1.2 is enforced

  # Blob properties
  blob_properties {
    versioning_enabled = true

    delete_retention_policy {
      days = 30
    }

    container_delete_retention_policy {
      days = 30
    }
  }

  tags = local.common_tags
}

# Storage Account for Backups
resource "azurerm_storage_account" "backups" {
  name                     = "${replace(local.name_prefix, "-", "")}backups"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "GRS"  # Geo-redundant for backups
  account_kind             = "StorageV2"

  tags = local.common_tags
}

# Blob Container
resource "azurerm_storage_container" "uploads" {
  name                  = "uploads"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Azure CDN with Azure Front Door (includes WAF and rate limiting)
resource "azurerm_cdn_frontdoor_profile" "main" {
  name                = "${local.name_prefix}-cdn"
  resource_group_name = azurerm_resource_group.main.name
  sku_name            = "Premium_AzureFrontDoor"  # Premium for WAF

  tags = local.common_tags
}

# Front Door Endpoint
resource "azurerm_cdn_frontdoor_endpoint" "main" {
  name                     = "${local.name_prefix}-endpoint"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id

  tags = local.common_tags
}

# Front Door Origin Group
resource "azurerm_cdn_frontdoor_origin_group" "app" {
  name                     = "app-origin-group"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id

  load_balancing {
    sample_size                 = 4
    successful_samples_required = 3
  }

  health_probe {
    path                = "/health"
    request_type        = "HEAD"
    protocol            = "Https"
    interval_in_seconds = 30
  }
}

# Front Door Origin (App Service)
resource "azurerm_cdn_frontdoor_origin" "app" {
  name                          = "app-origin"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.app.id

  enabled                        = true
  host_name                      = azurerm_linux_web_app.client.default_hostname
  http_port                      = 80
  https_port                     = 443
  origin_host_header             = azurerm_linux_web_app.client.default_hostname
  priority                       = 1
  weight                         = 1000
  certificate_name_check_enabled = true
}

# WAF Policy with Rate Limiting
resource "azurerm_cdn_frontdoor_firewall_policy" "main" {
  name                              = "${replace(local.name_prefix, "-", "")}wafpolicy"
  resource_group_name               = azurerm_resource_group.main.name
  sku_name                          = azurerm_cdn_frontdoor_profile.main.sku_name
  enabled                           = true
  mode                              = "Prevention"

  # Rate limiting rules
  custom_rule {
    name                           = "RateLimitRule"
    enabled                        = true
    priority                       = 1
    rate_limit_duration_in_minutes = 5
    rate_limit_threshold           = 2000
    type                           = "RateLimitRule"
    action                         = "Block"

    match_condition {
      match_variable     = "RequestUri"
      operator           = "Contains"
      match_values       = ["/"]
      transforms         = ["Lowercase"]
    }
  }

  # API-specific rate limiting
  custom_rule {
    name                           = "APIRateLimitRule"
    enabled                        = true
    priority                       = 2
    rate_limit_duration_in_minutes = 5
    rate_limit_threshold           = 1000
    type                           = "RateLimitRule"
    action                         = "Block"

    match_condition {
      match_variable     = "RequestUri"
      operator           = "BeginsWith"
      match_values       = ["/api"]
      transforms         = ["Lowercase"]
    }
  }

  # Managed rule sets
  managed_rule {
    type    = "Microsoft_DefaultRuleSet"
    version = "2.1"
    action  = "Block"
  }

  managed_rule {
    type    = "Microsoft_BotManagerRuleSet"
    version = "1.0"
    action  = "Block"
  }

  tags = local.common_tags
}

# Key Vault for Secrets Management
resource "azurerm_key_vault" "main" {
  name                = "${local.name_prefix}-kv"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tenant_id           = data.azurerm_client_config.current.tenant_id

  sku_name = "premium"

  # TLS 1.3 requirement (minimum TLS 1.2 in Azure)
  network_acls {
    bypass         = "AzureServices"
    default_action = "Allow"  # Change to "Deny" and add specific network rules for production
  }

  # Soft delete and purge protection
  soft_delete_retention_days = 90
  purge_protection_enabled   = true

  tags = local.common_tags
}

# Key Vault Access Policy for App Services
resource "azurerm_key_vault_access_policy" "server" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_linux_web_app.server.identity[0].principal_id

  secret_permissions = [
    "Get",
    "List"
  ]
}

# Key Vault Secrets
resource "azurerm_key_vault_secret" "database_url" {
  name         = "database-url"
  value        = "postgresql://${var.db_username}:${random_password.db_password.result}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${var.db_name}?sslmode=require"
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_key_vault_access_policy.server]
}

resource "azurerm_key_vault_secret" "redis_url" {
  name         = "redis-url"
  value        = "rediss://:${azurerm_redis_cache.main.primary_access_key}@${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port}/0"
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_key_vault_access_policy.server]
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret"
  value        = random_password.jwt_secret.result
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_key_vault_access_policy.server]
}

# Azure Monitor - Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${local.name_prefix}-logs"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = local.common_tags
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "${local.name_prefix}-appinsights"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"

  tags = local.common_tags
}

# Azure Monitor Action Group for Alerts
resource "azurerm_monitor_action_group" "main" {
  name                = "${local.name_prefix}-action-group"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "silenttalk"

  dynamic "email_receiver" {
    for_each = var.alert_emails
    content {
      name          = "email-${email_receiver.key}"
      email_address = email_receiver.value
    }
  }

  tags = local.common_tags
}

# Azure Monitor Alerts
resource "azurerm_monitor_metric_alert" "high_cpu" {
  name                = "${local.name_prefix}-high-cpu"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_service_plan.main.id]
  description         = "Alert when CPU exceeds 70%"

  criteria {
    metric_namespace = "Microsoft.Web/serverFarms"
    metric_name      = "CpuPercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 70
  }

  window_size        = "PT5M"
  frequency          = "PT1M"
  severity           = 2

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = local.common_tags
}

resource "azurerm_monitor_metric_alert" "high_memory" {
  name                = "${local.name_prefix}-high-memory"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_service_plan.main.id]
  description         = "Alert when memory exceeds 80%"

  criteria {
    metric_namespace = "Microsoft.Web/serverFarms"
    metric_name      = "MemoryPercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  window_size        = "PT5M"
  frequency          = "PT1M"
  severity           = 2

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = local.common_tags
}

# Azure Backup Vault
resource "azurerm_data_protection_backup_vault" "main" {
  name                = "${local.name_prefix}-backup-vault"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  datastore_type      = "VaultStore"
  redundancy          = "GeoRedundant"

  tags = local.common_tags
}

# Random passwords
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}
