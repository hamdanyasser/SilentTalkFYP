# SilentTalk FYP - Production Infrastructure

**NFR-002 (Scalability) | NFR-003 (Reliability)**

This directory contains Infrastructure as Code (IaC) and deployment documentation for the SilentTalk production environment.

---

## Overview

The infrastructure supports deployment to both AWS and Azure cloud platforms with the following features:

### Core Requirements

✅ **Auto-scaling at 70% CPU threshold**
✅ **Multi-AZ/Zone redundancy**
✅ **Managed databases (PostgreSQL)**
✅ **Managed cache (Redis)**
✅ **Object storage (S3/Blob)**
✅ **CDN (CloudFront/Azure Front Door)**
✅ **TURN servers for WebRTC**
✅ **Secrets management (AWS Secrets Manager/Azure Key Vault)**
✅ **Backups every 6 hours**
✅ **TLS 1.3 enforcement**
✅ **Rate limiting (WAF)**
✅ **Health checks**
✅ **Monitoring and alerts**
✅ **Disaster recovery plan**

---

## Directory Structure

```
infrastructure/
├── aws/
│   └── terraform/
│       ├── main.tf              # Main AWS configuration
│       ├── variables.tf         # Input variables
│       ├── outputs.tf           # Output values
│       ├── terraform.tfvars.example
│       └── modules/             # Terraform modules
│           ├── vpc/
│           ├── rds/
│           ├── redis/
│           ├── ecs/
│           ├── alb/
│           ├── cloudfront/
│           ├── s3/
│           ├── secrets/
│           ├── waf/
│           ├── monitoring/
│           ├── alerts/
│           ├── backup/
│           └── turn/
├── azure/
│   └── terraform/
│       ├── main.tf              # Main Azure configuration
│       ├── variables.tf         # Input variables
│       └── outputs.tf           # Output values
├── kubernetes/                  # (Optional) K8s manifests
├── scripts/
│   ├── setup-turn-server.sh    # TURN server setup
│   └── backup-validation.sh     # Backup testing
├── DEPLOYMENT_RUNBOOK.md        # Deployment procedures
├── DISASTER_RECOVERY.md         # DR procedures and plans
├── LIVE_ENVIRONMENT_CHECKLIST.md # Go-live checklist
└── README.md                    # This file
```

---

## Quick Start

### Prerequisites

- Terraform >= 1.5.0
- AWS CLI or Azure CLI
- kubectl (for Kubernetes)
- Valid cloud account with appropriate permissions

### AWS Deployment

```bash
# 1. Configure AWS credentials
aws configure --profile silenttalk-production

# 2. Navigate to AWS terraform directory
cd infrastructure/aws/terraform

# 3. Create terraform.tfvars from example
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars  # Edit with your values

# 4. Initialize Terraform
terraform init

# 5. Plan deployment
terraform plan -out=tfplan

# 6. Apply infrastructure
terraform apply tfplan

# 7. Configure DNS (see DEPLOYMENT_RUNBOOK.md)
```

### Azure Deployment

```bash
# 1. Login to Azure
az login

# 2. Navigate to Azure terraform directory
cd infrastructure/azure/terraform

# 3. Create terraform.tfvars
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars

# 4. Initialize Terraform
terraform init

# 5. Plan deployment
terraform plan -out=azureplan

# 6. Apply infrastructure
terraform apply azureplan
```

---

## Architecture

### AWS Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CloudFront CDN                       │
│                        (TLS 1.3 + WAF)                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  Application Load Balancer                   │
│                    (Multi-AZ, TLS 1.3)                       │
└─────────┬───────────────────────────────────┬───────────────┘
          │                                   │
┌─────────▼─────────┐              ┌──────────▼──────────┐
│   ECS Fargate     │              │   ECS Fargate       │
│   (Server)        │              │   (Client)          │
│   Min: 3, Max: 10 │              │   Min: 3, Max: 10   │
│   Auto-scale: 70% │              │   Auto-scale: 70%   │
└─────────┬─────────┘              └─────────────────────┘
          │
┌─────────▼──────────────────────┐
│  RDS PostgreSQL (Multi-AZ)     │
│  Auto-backups every 6h         │
└────────────────────────────────┘
          │
┌─────────▼──────────────────────┐
│  ElastiCache Redis (Multi-AZ)  │
│  Cluster mode enabled          │
└────────────────────────────────┘
```

### Azure Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Azure Front Door                          │
│                   (CDN + WAF + TLS 1.3)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                   App Service Plan                           │
│                (Zone-redundant, Auto-scale)                  │
├─────────────────────┬───────────────────┬───────────────────┤
│   App Service       │                   │  App Service      │
│   (Server)          │                   │  (Client)         │
│   Min: 3, Max: 10   │                   │  Min: 3, Max: 10  │
└─────────────────────┴───────────────────┴───────────────────┘
          │
┌─────────▼──────────────────────┐
│  Azure Database for PostgreSQL │
│  (Zone-redundant HA)           │
│  Auto-backups every 6h         │
└────────────────────────────────┘
          │
┌─────────▼──────────────────────┐
│  Azure Cache for Redis         │
│  (Premium, Zone-redundant)     │
└────────────────────────────────┘
```

---

## Key Features

### Scalability (NFR-002)

#### Auto-Scaling Configuration

**AWS (ECS Fargate)**:
- Target tracking scaling policy
- CPU utilization target: 70%
- Scale-out: Add 1 task when CPU > 70% for 5 minutes
- Scale-in: Remove 1 task when CPU < 30% for 5 minutes
- Min capacity: 3 tasks
- Max capacity: 10 tasks

**Azure (App Service)**:
- CPU-based autoscale rules
- Scale-out threshold: 70% CPU for 5 minutes
- Scale-in threshold: 30% CPU for 5 minutes
- Min instances: 3
- Max instances: 10

#### Load Distribution

- **Multi-AZ**: Resources distributed across 3 availability zones
- **Load Balancing**: Application Load Balancer (AWS) / Azure Front Door
- **Database Read Replicas**: Can be added for read-heavy workloads

### Reliability (NFR-003)

#### High Availability

- **Database**: Multi-AZ deployment with automatic failover
- **Cache**: Multi-AZ with automatic failover
- **Compute**: Tasks/instances distributed across 3 AZs
- **Storage**: Zone-redundant storage (ZRS) / S3 standard

#### Backup Strategy

- **Database**: Automated snapshots every 6 hours
- **Retention**: 30 days for all backups
- **Point-in-Time Recovery**: Enabled for databases
- **Storage**: Versioning enabled on S3/Blob
- **DR**: Geo-redundant backups to secondary region

#### Disaster Recovery

- **RTO**: 30 minutes for database, 15 minutes for application
- **RPO**: 6 hours (backup interval)
- **Multi-Region**: Optional cross-region replication
- **Automated Failover**: Database and cache support automatic failover
- **Testing**: Monthly DR drills (see [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md))

### Security

#### TLS 1.3

- **Load Balancers**: TLS 1.3 enforced
- **App Services**: Minimum TLS 1.3
- **Database**: SSL/TLS required
- **Redis**: SSL/TLS only (non-SSL disabled)

#### Rate Limiting

**AWS WAF**:
- General rate limit: 2000 requests per 5 minutes per IP
- API rate limit: 1000 requests per 5 minutes per IP
- Custom rules for specific endpoints

**Azure WAF**:
- General rate limit: 2000 requests per 5 minutes
- API rate limit: 1000 requests per 5 minutes
- Managed rule sets: OWASP Core Rule Set, Bot Protection

#### Secrets Management

**AWS**:
- AWS Secrets Manager for database credentials, API keys
- Automatic rotation enabled
- IAM roles for ECS tasks
- No secrets in code or environment variables

**Azure**:
- Azure Key Vault for all secrets
- Managed identities for App Services
- Soft delete and purge protection enabled
- Network access restrictions

### Monitoring

#### Metrics Collection

**AWS CloudWatch**:
- ECS CPU, memory, network
- RDS connections, CPU, IOPS, storage
- ElastiCache CPU, memory, cache hits/misses
- ALB request count, latency, error rates
- Custom application metrics

**Azure Monitor**:
- App Service CPU, memory, requests
- PostgreSQL connections, CPU, storage
- Redis memory, operations, cache hits
- Front Door request count, latency
- Application Insights for APM

#### Alerting

Alerts configured for:
- CPU > 70% (triggers auto-scale)
- Memory > 80%
- Database connections > 80%
- Disk space > 85%
- 5xx errors > 10 in 5 minutes
- Health check failures
- Backup failures

#### Log Aggregation

- **AWS**: CloudWatch Logs with 30-day retention
- **Azure**: Log Analytics workspace with 30-day retention
- **Application**: Structured JSON logging
- **Error Tracking**: Dedicated error log streams

---

## TURN Servers for WebRTC

TURN servers are deployed for WebRTC NAT traversal. See `scripts/setup-turn-server.sh` for configuration.

### Configuration

- **TURN Port**: 3478 (UDP/TCP)
- **TURN over TLS**: 5349 (TCP)
- **Media Port Range**: 49152-65535 (UDP)
- **Authentication**: Long-term credentials with secrets
- **TLS Certificates**: Let's Encrypt

### Deployment

**AWS**: Auto-scaling group with 2-6 instances (t3.medium)
**Azure**: VM scale set with 2-6 instances (Standard_B2s)

### Usage in Application

```javascript
const iceServers = [
  {
    urls: ['stun:turn.silenttalk.com:3478'],
  },
  {
    urls: ['turn:turn.silenttalk.com:3478?transport=udp'],
    username: 'user',
    credential: 'pass',
  },
  {
    urls: ['turns:turn.silenttalk.com:5349?transport=tcp'],
    username: 'user',
    credential: 'pass',
  },
];
```

---

## Cost Optimization

### Estimated Monthly Costs

**AWS** (us-east-1, moderate traffic):
- ECS Fargate (6 tasks): ~$150
- RDS PostgreSQL (db.t3.medium, Multi-AZ): ~$150
- ElastiCache Redis (cache.t3.medium): ~$100
- ALB: ~$25
- CloudFront: ~$50 (1TB transfer)
- S3: ~$25 (100GB storage)
- Data Transfer: ~$100
- **Total**: ~$600/month

**Azure** (East US, moderate traffic):
- App Service Plan (P1v3): ~$150
- PostgreSQL (GP_Standard_D2s_v3, Zone-redundant): ~$200
- Redis Premium P1: ~$150
- Front Door: ~$75
- Blob Storage: ~$25
- Data Transfer: ~$100
- **Total**: ~$700/month

### Cost Optimization Tips

1. **Use Reserved Instances**: Save up to 40% on compute
2. **Right-size Resources**: Monitor and adjust instance sizes
3. **Implement Lifecycle Policies**: Move old data to cheaper storage tiers
4. **Use Spot Instances**: For non-critical workloads (e.g., batch processing)
5. **Enable Auto-scaling**: Scale down during low-traffic periods
6. **Review CDN Caching**: Increase cache hit ratio to reduce origin requests
7. **Database Query Optimization**: Reduce database compute and IOPS

---

## Maintenance

### Regular Tasks

**Daily**:
- Review CloudWatch/Azure Monitor dashboards
- Check alert notifications
- Verify backup completion

**Weekly**:
- Review cost reports
- Analyze performance metrics
- Update security patches

**Monthly**:
- DR drill (see [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md))
- Review and update documentation
- Capacity planning review
- Security audit

**Quarterly**:
- Infrastructure cost optimization review
- Disaster recovery full test
- Update runbooks based on incidents

### Updates and Patching

**Managed Services** (automatic):
- RDS/PostgreSQL: Automatic minor version updates during maintenance window
- ElastiCache/Redis: Automatic patching
- Container base images: Rebuild and deploy weekly

**Application Updates**:
- Follow blue-green or canary deployment patterns
- Use ECS task definition revisions for rollback
- Test in staging environment first

---

## Troubleshooting

See [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md) for comprehensive troubleshooting guide.

### Quick Diagnostics

**Check service health**:
```bash
# AWS
aws ecs describe-services \
  --cluster silenttalk-production-cluster \
  --services silenttalk-production-server

# Azure
az webapp show \
  --name silenttalk-production-api \
  --resource-group silenttalk-production-rg
```

**View application logs**:
```bash
# AWS
aws logs tail /ecs/silenttalk-production-server --follow

# Azure
az webapp log tail \
  --name silenttalk-production-api \
  --resource-group silenttalk-production-rg
```

**Check database connectivity**:
```bash
# Test from local machine
psql "postgresql://user:pass@endpoint:5432/dbname"
```

---

## Documentation

- [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md) - Complete deployment procedures
- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) - DR plan and recovery procedures
- [LIVE_ENVIRONMENT_CHECKLIST.md](./LIVE_ENVIRONMENT_CHECKLIST.md) - Go-live verification checklist

---

## Support

### Internal Contacts

- **DevOps Team**: devops@silenttalk.com
- **Infrastructure Lead**: infra-lead@silenttalk.com
- **On-Call**: oncall@silenttalk.com

### External Support

- **AWS Enterprise Support**: Available 24/7 via AWS Console
- **Azure Premier Support**: Available 24/7 via Azure Portal
- **Terraform**: Community support via GitHub

---

## Contributing

### Infrastructure Changes

1. Create feature branch from `main`
2. Make changes to Terraform files
3. Run `terraform plan` and review changes
4. Create pull request with detailed description
5. Require approval from Infrastructure Lead
6. Apply changes during maintenance window
7. Update documentation

### Testing Changes

- Use separate staging environment for testing
- Run `terraform plan` to preview changes
- Test in staging before applying to production
- Document all changes in pull request

---

## License

MIT License - See LICENSE file for details

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-13 | Initial production infrastructure |

---

**Last Updated**: 2025-11-13
**Maintained By**: DevOps Team
**Review Frequency**: Quarterly
