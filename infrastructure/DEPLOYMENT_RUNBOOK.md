# Production Deployment Runbook

**SilentTalk FYP - Production Infrastructure**
**NFR-002 (Scalability) | NFR-003 (Reliability)**

This runbook provides comprehensive deployment procedures for AWS and Azure cloud environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Deployment](#aws-deployment)
3. [Azure Deployment](#azure-deployment)
4. [TURN Server Setup](#turn-server-setup)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring and Alerts](#monitoring-and-alerts)
7. [Backup and Recovery](#backup-and-recovery)
8. [Troubleshooting](#troubleshooting)
9. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Required Tools

Install the following tools before deployment:

```bash
# Terraform
curl -fsSL https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip -o terraform.zip
unzip terraform.zip && sudo mv terraform /usr/local/bin/

# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# kubectl (for Kubernetes deployments)
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Verify Installations

```bash
terraform version  # Should show v1.5.0+
aws --version      # Should show aws-cli/2.x
az version         # Should show Azure CLI version
kubectl version --client
helm version
```

### Required Access

- [ ] AWS Account with AdministratorAccess or custom deployment role
- [ ] Azure Subscription with Contributor role
- [ ] GitHub Container Registry (GHCR) read access
- [ ] DNS access for domain configuration
- [ ] SSL/TLS certificates for domains

### Environment Setup

```bash
# Set environment variables
export AWS_PROFILE=silenttalk-production
export AWS_REGION=us-east-1
export TF_VAR_environment=production

# For Azure
export ARM_SUBSCRIPTION_ID="your-subscription-id"
export ARM_TENANT_ID="your-tenant-id"
```

---

## AWS Deployment

### Step 1: Prepare Terraform State Backend

Create S3 bucket and DynamoDB table for Terraform state:

```bash
# Create S3 bucket for state
aws s3 mb s3://silenttalk-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket silenttalk-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket silenttalk-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name silenttalk-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Step 2: Configure Variables

```bash
cd infrastructure/aws/terraform

# Copy example configuration
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Required Configuration:**

```hcl
# terraform.tfvars
aws_region  = "us-east-1"
environment = "production"

# Container images (use specific versions, not 'latest')
server_container_image = "ghcr.io/your-org/silenttalk-fyp/server:1.0.0"
client_container_image = "ghcr.io/your-org/silenttalk-fyp/client:1.0.0"

# Domain configuration
api_domain = "api.silenttalk.com"
cdn_domain = "cdn.silenttalk.com"

# ACM certificate ARN (must be created beforehand)
acm_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/abc123"

# CORS origin
cors_origin = "https://silenttalk.com"

# Alert emails
alert_emails = ["devops@silenttalk.com"]

# EC2 key pair for TURN servers
ec2_key_name = "silenttalk-production"
```

### Step 3: Create SSL/TLS Certificates

```bash
# Request ACM certificate
aws acm request-certificate \
  --domain-name silenttalk.com \
  --subject-alternative-names "*.silenttalk.com" \
  --validation-method DNS \
  --region us-east-1

# Get certificate ARN
aws acm list-certificates --region us-east-1

# Add DNS validation records
# Follow AWS Console instructions or use:
aws acm describe-certificate \
  --certificate-arn <your-cert-arn> \
  --region us-east-1
```

**Wait for certificate validation** (usually 5-30 minutes)

### Step 4: Initialize Terraform

```bash
cd infrastructure/aws/terraform

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Review execution plan
terraform plan -out=tfplan
```

**Review the plan carefully:**
- [ ] VPC and subnets in 3 availability zones
- [ ] RDS PostgreSQL with Multi-AZ
- [ ] ElastiCache Redis with Multi-AZ
- [ ] ECS Fargate services with auto-scaling
- [ ] ALB with TLS 1.3 configuration
- [ ] CloudFront CDN
- [ ] S3 buckets with versioning
- [ ] Secrets Manager secrets
- [ ] CloudWatch alarms and dashboards
- [ ] AWS Backup plan (6-hour intervals)
- [ ] WAF with rate limiting

### Step 5: Deploy Infrastructure

```bash
# Apply Terraform configuration
terraform apply tfplan

# This will take 15-30 minutes
# Monitor progress and address any errors
```

**Expected Output:**
```
Apply complete! Resources: 127 added, 0 changed, 0 destroyed.

Outputs:

alb_dns_name = "silenttalk-prod-alb-123456789.us-east-1.elb.amazonaws.com"
cloudfront_domain_name = "d1234567890.cloudfront.net"
ecs_cluster_name = "silenttalk-production-cluster"
rds_endpoint = <sensitive>
redis_endpoint = <sensitive>
```

### Step 6: Configure DNS

```bash
# Get ALB DNS name
ALB_DNS=$(terraform output -raw alb_dns_name)

# Get CloudFront domain
CDN_DNS=$(terraform output -raw cloudfront_domain_name)

# Create DNS records (example using Route53)
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.silenttalk.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "'"$ALB_DNS"'"}]
      }
    }]
  }'

# Configure CDN domain
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "cdn.silenttalk.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "'"$CDN_DNS"'"}]
      }
    }]
  }'
```

### Step 7: Verify Deployment

```bash
# Check ECS services
aws ecs list-services --cluster silenttalk-production-cluster

# Check service health
aws ecs describe-services \
  --cluster silenttalk-production-cluster \
  --services silenttalk-production-server silenttalk-production-client

# Test health endpoints
curl -I https://api.silenttalk.com/health
# Expected: HTTP/2 200

# Check TLS version
openssl s_client -connect api.silenttalk.com:443 -tls1_3
# Should connect successfully with TLS 1.3

# Verify auto-scaling policies
aws application-autoscaling describe-scalable-targets \
  --service-namespace ecs
```

---

## Azure Deployment

### Step 1: Azure Login and Setup

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "Your Subscription Name"

# Create resource group
az group create \
  --name silenttalk-production-rg \
  --location eastus

# Create storage account for Terraform state
az storage account create \
  --name silenttalkterraform \
  --resource-group silenttalk-production-rg \
  --location eastus \
  --sku Standard_LRS \
  --encryption-services blob

# Get storage account key
ACCOUNT_KEY=$(az storage account keys list \
  --resource-group silenttalk-production-rg \
  --account-name silenttalkterraform \
  --query '[0].value' -o tsv)

# Create blob container
az storage container create \
  --name tfstate \
  --account-name silenttalkterraform \
  --account-key $ACCOUNT_KEY
```

### Step 2: Configure Azure Terraform

```bash
cd infrastructure/azure/terraform

# Copy example configuration
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

### Step 3: Deploy Azure Infrastructure

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan -out=azureplan

# Apply configuration
terraform apply azureplan
```

**Azure Resources Created:**
- App Service Plan with auto-scaling (70% CPU threshold)
- App Services for client and server
- Azure Database for PostgreSQL (Flexible Server, Zone-redundant)
- Azure Cache for Redis (Premium tier, Zone-redundant)
- Azure Blob Storage with CDN
- Azure Front Door (CDN with WAF)
- Azure Key Vault for secrets
- Azure Monitor with alerts
- Azure Backup (6-hour schedule)

### Step 4: Configure Azure DNS

```bash
# Get App Service hostname
az webapp show \
  --name silenttalk-production-api \
  --resource-group silenttalk-production-rg \
  --query defaultHostName -o tsv

# Create DNS CNAME record
az network dns record-set cname set-record \
  --resource-group dns-rg \
  --zone-name silenttalk.com \
  --record-set-name api \
  --cname silenttalk-production-api.azurewebsites.net
```

---

## TURN Server Setup

TURN servers are required for WebRTC NAT traversal.

### AWS TURN Server Deployment

The Terraform configuration deploys TURN servers automatically. To configure manually:

```bash
# SSH to TURN server
ssh -i ~/.ssh/silenttalk-production.pem ec2-user@<turn-server-ip>

# Install coturn
sudo yum install -y coturn

# Configure coturn
sudo tee /etc/turnserver.conf <<EOF
# TURN server configuration
listening-port=3478
tls-listening-port=5349

# TLS certificates
cert=/etc/letsencrypt/live/turn.silenttalk.com/fullchain.pem
pkey=/etc/letsencrypt/live/turn.silenttalk.com/privkey.pem

# Authentication
use-auth-secret
static-auth-secret=$(openssl rand -hex 32)

# Realm
realm=turn.silenttalk.com

# Port range for media
min-port=49152
max-port=65535

# Logging
log-file=/var/log/turnserver.log
verbose

# Performance
max-bps=3000000

# Multi-threaded
proc-user=turnserver
proc-group=turnserver
EOF

# Start service
sudo systemctl enable coturn
sudo systemctl start coturn

# Verify
sudo systemctl status coturn
```

### Azure TURN Server Deployment

```bash
# Create VM for TURN server
az vm create \
  --resource-group silenttalk-production-rg \
  --name silenttalk-turn-1 \
  --image UbuntuLTS \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard

# Open TURN ports
az network nsg rule create \
  --resource-group silenttalk-production-rg \
  --nsg-name silenttalk-turn-1NSG \
  --name AllowTURN \
  --priority 1000 \
  --destination-port-ranges 3478 5349 49152-65535 \
  --protocol '*' \
  --access Allow

# SSH and install coturn (same as AWS)
```

### TURN Server Testing

```bash
# Test TURN connectivity
turnutils_uclient -v -u testuser -w testpass turn.silenttalk.com

# Expected output: successful TURN allocation
```

---

## Post-Deployment Verification

### Checklist

Run through this checklist after deployment:

#### Infrastructure Verification

- [ ] **VPC/VNet**: Verify network configuration
  ```bash
  # AWS
  aws ec2 describe-vpcs --filters "Name=tag:Name,Values=silenttalk-production-vpc"

  # Azure
  az network vnet show --name silenttalk-vnet --resource-group silenttalk-production-rg
  ```

- [ ] **Database**: Verify Multi-AZ/Zone-redundant configuration
  ```bash
  # AWS
  aws rds describe-db-instances --db-instance-identifier silenttalk-production-postgres

  # Azure
  az postgres flexible-server show --name silenttalk-postgres --resource-group silenttalk-production-rg
  ```

- [ ] **Redis**: Verify replication configuration
  ```bash
  # AWS
  aws elasticache describe-replication-groups --replication-group-id silenttalk-production-redis

  # Azure
  az redis show --name silenttalk-redis --resource-group silenttalk-production-rg
  ```

- [ ] **Auto-scaling**: Verify 70% CPU threshold
  ```bash
  # AWS
  aws application-autoscaling describe-scaling-policies --service-namespace ecs

  # Azure
  az monitor autoscale show --name silenttalk-autoscale --resource-group silenttalk-production-rg
  ```

#### Security Verification

- [ ] **TLS 1.3**: Verify minimum TLS version
  ```bash
  # Test TLS 1.3
  openssl s_client -connect api.silenttalk.com:443 -tls1_3

  # Should not connect with TLS 1.2
  openssl s_client -connect api.silenttalk.com:443 -tls1_2
  ```

- [ ] **Rate Limiting**: Test WAF rate limits
  ```bash
  # Burst test (should be rate-limited)
  for i in {1..2500}; do curl -I https://api.silenttalk.com/api/test & done

  # Expected: Some requests should return 429 Too Many Requests
  ```

- [ ] **Security Headers**: Verify headers
  ```bash
  curl -I https://api.silenttalk.com

  # Expected headers:
  # Strict-Transport-Security: max-age=31536000
  # X-Content-Type-Options: nosniff
  # X-Frame-Options: DENY
  # Content-Security-Policy: ...
  ```

- [ ] **Secrets Management**: Verify secrets rotation
  ```bash
  # AWS
  aws secretsmanager describe-secret --secret-id silenttalk-production/database

  # Azure
  az keyvault secret show --name database-connection --vault-name silenttalk-kv
  ```

#### Application Verification

- [ ] **Health Checks**: Verify all services healthy
  ```bash
  # Server health
  curl https://api.silenttalk.com/health
  # Expected: {"status":"healthy","database":"connected","redis":"connected"}

  # Client health
  curl https://silenttalk.com/health
  # Expected: healthy
  ```

- [ ] **API Endpoints**: Test core functionality
  ```bash
  # User registration
  curl -X POST https://api.silenttalk.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"TestPass123!"}'

  # Expected: 201 Created
  ```

- [ ] **WebSocket**: Test WebSocket connection
  ```bash
  # Using wscat
  wscat -c wss://api.silenttalk.com
  # Should connect successfully
  ```

- [ ] **CDN**: Verify static assets served from CDN
  ```bash
  curl -I https://cdn.silenttalk.com/static/js/main.js

  # Expected headers:
  # X-Cache: Hit from cloudfront (or Azure CDN)
  # Age: > 0 (cached)
  ```

#### Monitoring Verification

- [ ] **CloudWatch/Azure Monitor**: Verify dashboards created
  ```bash
  # AWS
  aws cloudwatch list-dashboards

  # Azure
  az monitor metrics list --resource silenttalk-production-api
  ```

- [ ] **Alarms**: Verify alert configuration
  ```bash
  # AWS
  aws cloudwatch describe-alarms

  # Azure
  az monitor metrics alert list --resource-group silenttalk-production-rg
  ```

- [ ] **Log Aggregation**: Verify logs flowing
  ```bash
  # AWS
  aws logs tail /ecs/silenttalk-production-server --follow

  # Azure
  az monitor log-analytics query \
    --workspace silenttalk-logs \
    --analytics-query "ContainerLog | limit 10"
  ```

#### Backup Verification

- [ ] **Database Backups**: Verify backup schedule (every 6 hours)
  ```bash
  # AWS
  aws backup list-recovery-points-by-backup-vault \
    --backup-vault-name silenttalk-production-backup-vault

  # Azure
  az backup protection check-vm \
    --resource-group silenttalk-production-rg \
    --vm-name silenttalk-postgres
  ```

- [ ] **Backup Restoration Test**: Perform test restore
  ```bash
  # Schedule a test restore to verify backups are working
  # This should be done in a non-production environment
  ```

---

## Monitoring and Alerts

### CloudWatch Dashboards (AWS)

Access the CloudWatch dashboard:

```bash
# Get dashboard URL
aws cloudwatch get-dashboard \
  --dashboard-name silenttalk-production-dashboard
```

**Key Metrics to Monitor:**
- ECS CPU/Memory utilization
- RDS connections, CPU, storage
- Redis hits/misses, CPU
- ALB request count, latency, 4xx/5xx errors
- NAT Gateway data transfer

### Azure Monitor Dashboards

Access Azure Monitor:

```bash
# View metrics
az monitor metrics list \
  --resource /subscriptions/<sub-id>/resourceGroups/silenttalk-production-rg/providers/Microsoft.Web/sites/silenttalk-production-api \
  --metric-names "CpuPercentage,MemoryPercentage,Http5xx"
```

### Alert Configuration

Verify alerts are configured for:

- [ ] CPU > 70% for 5 minutes (triggers auto-scale)
- [ ] Memory > 80% for 5 minutes
- [ ] Database connections > 80% of max
- [ ] Disk space > 85%
- [ ] 5xx errors > 10 in 5 minutes
- [ ] Health check failures
- [ ] Backup failures

### Test Alerts

```bash
# Trigger a test alert
aws cloudwatch set-alarm-state \
  --alarm-name "silenttalk-production-high-cpu" \
  --state-value ALARM \
  --state-reason "Testing alert system"

# Verify email/Slack notification received
```

---

## Backup and Recovery

### Backup Schedule

**AWS Backup Plan:**
- Frequency: Every 6 hours (0, 6, 12, 18 UTC)
- Retention: 30 days
- Backed up resources:
  - RDS PostgreSQL
  - S3 buckets
  - ECS task definitions

**Azure Backup:**
- Frequency: Every 6 hours
- Retention: 30 days
- Backed up resources:
  - PostgreSQL database
  - Blob storage
  - App Service configuration

### Manual Backup

```bash
# AWS - Create manual RDS snapshot
aws rds create-db-snapshot \
  --db-instance-identifier silenttalk-production-postgres \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d-%H%M%S)

# Azure - Create manual database backup
az postgres flexible-server backup create \
  --resource-group silenttalk-production-rg \
  --name silenttalk-postgres \
  --backup-name manual-backup-$(date +%Y%m%d-%H%M%S)
```

### Restore Procedures

See [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) for detailed restore procedures.

**Quick Restore Steps:**

1. Identify backup to restore
2. Create new RDS instance from snapshot
3. Update application configuration
4. Verify data integrity
5. Switch DNS to new instance
6. Monitor application

---

## Troubleshooting

### Common Issues

#### Issue: ECS tasks failing to start

**Symptoms:**
- Tasks in PENDING state for extended period
- Tasks stopping immediately after starting

**Diagnosis:**
```bash
# Check task definition
aws ecs describe-tasks \
  --cluster silenttalk-production-cluster \
  --tasks <task-arn>

# Check CloudWatch logs
aws logs tail /ecs/silenttalk-production-server --follow
```

**Resolution:**
- Verify IAM roles have correct permissions
- Check container image exists and is accessible
- Verify environment variables and secrets
- Check CPU/memory limits

#### Issue: Database connection failures

**Symptoms:**
- Application logs show connection errors
- High database CPU

**Diagnosis:**
```bash
# Check database status
aws rds describe-db-instances \
  --db-instance-identifier silenttalk-production-postgres

# Check connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=silenttalk-production-postgres \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

**Resolution:**
- Scale up RDS instance if needed
- Check connection pool configuration
- Review slow queries
- Verify security group rules

#### Issue: High latency

**Symptoms:**
- API responses slow
- CloudFront cache misses

**Diagnosis:**
```bash
# Check ALB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=<alb-arn-suffix> \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum
```

**Resolution:**
- Check database query performance
- Verify Redis cache hit rate
- Review application logs for slow operations
- Consider increasing task count

---

## Rollback Procedures

### Application Rollback

```bash
# AWS ECS - Rollback to previous task definition
# Get previous task definition
PREVIOUS_REVISION=$(aws ecs list-task-definitions \
  --family-prefix silenttalk-production-server \
  --sort DESC \
  --query 'taskDefinitionArns[1]' \
  --output text)

# Update service
aws ecs update-service \
  --cluster silenttalk-production-cluster \
  --service silenttalk-production-server \
  --task-definition $PREVIOUS_REVISION

# Azure App Service - Rollback deployment
az webapp deployment slot swap \
  --name silenttalk-production-api \
  --resource-group silenttalk-production-rg \
  --slot staging \
  --target-slot production \
  --action swap
```

### Infrastructure Rollback

```bash
# Terraform rollback
cd infrastructure/aws/terraform

# View state history
terraform state list

# If needed, restore from backup
aws s3 cp \
  s3://silenttalk-terraform-state/production/terraform.tfstate.backup \
  terraform.tfstate

# Apply previous configuration
git checkout <previous-commit>
terraform plan
terraform apply
```

### Database Rollback

**⚠️ CAUTION: Database rollbacks can result in data loss**

```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier silenttalk-production-postgres-restored \
  --db-snapshot-identifier <snapshot-id>

# Update application to point to restored instance
# Test thoroughly before switching production traffic
```

---

## Support and Escalation

### On-Call Procedures

1. **Alert received** → Check monitoring dashboard
2. **Assess severity** → P0 (critical), P1 (high), P2 (medium), P3 (low)
3. **Initial response** → Acknowledge alert within 15 minutes (P0/P1)
4. **Investigation** → Use troubleshooting guide above
5. **Resolution** → Apply fix and verify
6. **Post-mortem** → Document incident and improvements

### Escalation Contacts

- **L1 Support**: devops@silenttalk.com
- **L2 Engineering**: engineering-oncall@silenttalk.com
- **L3 Infrastructure**: infrastructure-lead@silenttalk.com

### Runbook Maintenance

This runbook should be updated:
- After each deployment
- When infrastructure changes
- When issues are resolved (add to troubleshooting)
- Quarterly review

**Last Updated**: 2025-11-13
**Version**: 1.0.0
**Maintained By**: DevOps Team
