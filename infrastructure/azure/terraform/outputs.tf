# Outputs for Azure Infrastructure

output "resource_group_name" {
  description = "Resource group name"
  value       = azurerm_resource_group.main.name
}

output "server_app_service_url" {
  description = "Server App Service URL"
  value       = "https://${azurerm_linux_web_app.server.default_hostname}"
}

output "client_app_service_url" {
  description = "Client App Service URL"
  value       = "https://${azurerm_linux_web_app.client.default_hostname}"
}

output "postgres_fqdn" {
  description = "PostgreSQL server FQDN"
  value       = azurerm_postgresql_flexible_server.main.fqdn
  sensitive   = true
}

output "redis_hostname" {
  description = "Redis cache hostname"
  value       = azurerm_redis_cache.main.hostname
  sensitive   = true
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}

output "cdn_endpoint_url" {
  description = "Azure Front Door endpoint URL"
  value       = "https://${azurerm_cdn_frontdoor_endpoint.main.host_name}"
}

output "storage_account_name" {
  description = "Storage account name"
  value       = azurerm_storage_account.main.name
}

output "application_insights_instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}

output "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID"
  value       = azurerm_log_analytics_workspace.main.id
}
