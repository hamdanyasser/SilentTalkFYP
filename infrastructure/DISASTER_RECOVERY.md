# Disaster Recovery Plan

**SilentTalk FYP - Production Infrastructure**
**NFR-003 (Reliability) - Business Continuity**

This document outlines the disaster recovery procedures for the SilentTalk production environment.

---

## Table of Contents

1. [Overview](#overview)
2. [RTO and RPO Targets](#rto-and-rpo-targets)
3. [Disaster Scenarios](#disaster-scenarios)
4. [Backup Strategy](#backup-strategy)
5. [Recovery Procedures](#recovery-procedures)
6. [Failover Procedures](#failover-procedures)
7. [DR Testing](#dr-testing)
8. [Contact Information](#contact-information)

---

## Overview

### Scope

This DR plan covers:
- Application servers (ECS/App Service)
- Databases (RDS PostgreSQL/Azure Database for PostgreSQL)
- Cache layer (ElastiCache Redis/Azure Cache for Redis)
- Storage (S3/Azure Blob)
- CDN (CloudFront/Azure Front Door)
- TURN servers

### Objectives

- **Data Protection**: Zero data loss for committed transactions
- **Service Continuity**: Minimize downtime during disasters
- **Geographic Redundancy**: Multi-region failover capability
- **Automated Recovery**: Reduce manual intervention

---

## RTO and RPO Targets

### Recovery Time Objective (RTO)

| Component | RTO Target | Maximum Acceptable Downtime |
|-----------|------------|----------------------------|
| Application (Web/API) | 15 minutes | 30 minutes |
| Database | 30 minutes | 1 hour |
| Cache | 10 minutes | 15 minutes |
| Storage | 5 minutes | 10 minutes |
| CDN | Immediate (automatic) | 5 minutes |

### Recovery Point Objective (RPO)

| Component | RPO Target | Maximum Data Loss |
|-----------|------------|-------------------|
| Database | 6 hours | 6 hours (backup interval) |
| Storage | 24 hours | 24 hours |
| Application Config | 0 (IaC) | 0 |

**Note**: For mission-critical data requiring RPO < 6 hours, implement continuous replication to secondary region.

---

## Disaster Scenarios

### Scenario 1: Availability Zone Failure

**Impact**: Single AZ unavailable
**Probability**: Low (1-2% annual)
**Mitigation**: Multi-AZ deployment

**Automatic Recovery**:
- RDS automatically fails over to standby in different AZ (1-2 minutes)
- ECS tasks redistributed to healthy AZs (2-5 minutes)
- Load balancer routes traffic away from failed AZ (immediate)
- ElastiCache promotes replica to primary (automatic)

**Manual Actions Required**: None (fully automated)

**Verification Steps**:
```bash
# Verify RDS failover
aws rds describe-db-instances \
  --db-instance-identifier silenttalk-production-postgres \
  --query 'DBInstances[0].AvailabilityZone'

# Verify ECS task distribution
aws ecs list-tasks --cluster silenttalk-production-cluster

# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>
```

---

### Scenario 2: Region Failure

**Impact**: Entire AWS/Azure region unavailable
**Probability**: Very Low (<0.1% annual)
**Mitigation**: Multi-region deployment (optional for production)

**Recovery Steps**:

#### Step 1: Activate DR Region (30 minutes)

```bash
# 1. Switch to DR region configuration
cd infrastructure/aws/terraform-dr
export AWS_REGION=us-west-2

# 2. Restore database from latest backup
LATEST_SNAPSHOT=$(aws rds describe-db-snapshots \
  --db-instance-identifier silenttalk-production-postgres \
  --query 'DBSnapshots[-1].DBSnapshotIdentifier' \
  --output text \
  --region us-east-1)

aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier silenttalk-production-postgres-dr \
  --db-snapshot-identifier $LATEST_SNAPSHOT \
  --region us-west-2

# 3. Deploy application infrastructure
terraform apply -auto-approve

# 4. Wait for RDS to be available (10-15 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier silenttalk-production-postgres-dr \
  --region us-west-2
```

#### Step 2: Update DNS (5 minutes)

```bash
# Update Route 53 to point to DR region ALB
DR_ALB_DNS=$(terraform output -raw alb_dns_name)

aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.silenttalk.com",
        "Type": "CNAME",
        "TTL": 60,
        "ResourceRecords": [{"Value": "'"$DR_ALB_DNS"'"}]
      }
    }]
  }'
```

#### Step 3: Verify DR Environment (5 minutes)

```bash
# Test health endpoints
curl https://api.silenttalk.com/health

# Verify database connectivity
psql "postgresql://user:pass@silenttalk-production-postgres-dr.region.rds.amazonaws.com:5432/silenttalk_prod"

# Check application logs
aws logs tail /ecs/silenttalk-production-server --follow --region us-west-2
```

**Total Recovery Time**: ~40 minutes

---

### Scenario 3: Data Corruption

**Impact**: Database or storage corruption
**Probability**: Low (1% annual)
**Mitigation**: Point-in-time recovery (PITR)

**Recovery Steps**:

#### Step 1: Identify Corruption Point (10 minutes)

```bash
# Review database logs
aws rds describe-db-log-files \
  --db-instance-identifier silenttalk-production-postgres

# Download logs
aws rds download-db-log-file-portion \
  --db-instance-identifier silenttalk-production-postgres \
  --log-file-name error/postgresql.log.2025-11-13-10
```

#### Step 2: Restore to Point Before Corruption (30 minutes)

```bash
# Perform point-in-time restore
RESTORE_TIME="2025-11-13T09:30:00Z"

aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier silenttalk-production-postgres \
  --target-db-instance-identifier silenttalk-production-postgres-pitr \
  --restore-time $RESTORE_TIME \
  --no-multi-az  # Single AZ for faster restore

# Wait for availability
aws rds wait db-instance-available \
  --db-instance-identifier silenttalk-production-postgres-pitr
```

#### Step 3: Validate Restored Data (15 minutes)

```bash
# Connect to restored instance
RESTORED_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier silenttalk-production-postgres-pitr \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

# Verify data integrity
psql "postgresql://user:pass@$RESTORED_ENDPOINT:5432/silenttalk_prod" \
  -c "SELECT COUNT(*) FROM users WHERE created_at < '$RESTORE_TIME';"

# Compare with production
# Ensure critical data is intact
```

#### Step 4: Promote Restored Instance (15 minutes)

```bash
# 1. Create final snapshot of current production
aws rds create-db-snapshot \
  --db-instance-identifier silenttalk-production-postgres \
  --db-snapshot-identifier pre-restore-$(date +%Y%m%d-%H%M%S)

# 2. Delete current production instance (after snapshot completes)
aws rds delete-db-instance \
  --db-instance-identifier silenttalk-production-postgres \
  --skip-final-snapshot

# 3. Rename restored instance
aws rds modify-db-instance \
  --db-instance-identifier silenttalk-production-postgres-pitr \
  --new-db-instance-identifier silenttalk-production-postgres \
  --apply-immediately

# 4. Enable Multi-AZ
aws rds modify-db-instance \
  --db-instance-identifier silenttalk-production-postgres \
  --multi-az \
  --apply-immediately
```

**Total Recovery Time**: ~70 minutes

---

### Scenario 4: Complete Infrastructure Loss

**Impact**: Total loss of AWS/Azure account or severe security breach
**Probability**: Very Low (<0.01% annual)
**Mitigation**: Infrastructure as Code + off-site backups

**Recovery Steps**:

#### Step 1: Provision New Infrastructure (60 minutes)

```bash
# 1. Set up new AWS account/subscription
export AWS_ACCOUNT_ID="new-account-id"

# 2. Deploy infrastructure from code
cd infrastructure/aws/terraform
terraform init
terraform apply -auto-approve

# 3. Restore database from off-site backup
# Backups are replicated to S3 in different account
aws s3 cp \
  s3://silenttalk-dr-backups/latest.sql.gz \
  . \
  --profile dr-account

gunzip latest.sql.gz

# 4. Import data
psql "postgresql://user:pass@new-rds-endpoint:5432/silenttalk_prod" \
  -f latest.sql
```

#### Step 2: Restore Application State (30 minutes)

```bash
# 1. Pull container images
docker pull ghcr.io/silenttalk/silenttalk-fyp/server:latest
docker pull ghcr.io/silenttalk/silenttalk-fyp/client:latest

# 2. Deploy to new ECS cluster
aws ecs update-service \
  --cluster silenttalk-production-cluster \
  --service silenttalk-production-server \
  --force-new-deployment

# 3. Restore secrets
aws secretsmanager create-secret \
  --name silenttalk-production/database \
  --secret-string file://secrets/database.json

# 4. Restore S3 data
aws s3 sync \
  s3://silenttalk-dr-backups/s3-backup/ \
  s3://silenttalk-production-storage/
```

#### Step 3: Update DNS and Verify (15 minutes)

```bash
# Update DNS to new infrastructure
# Test all critical paths
# Enable monitoring
```

**Total Recovery Time**: ~105 minutes

---

## Backup Strategy

### Automated Backups

#### Database (RDS PostgreSQL)

**Configuration**:
- Automated snapshots: Every 6 hours (0:00, 6:00, 12:00, 18:00 UTC)
- Retention period: 30 days
- Backup window: 3:00-4:00 UTC (low-traffic period)
- Point-in-time recovery: Enabled (1-second granularity)

**Verification**:
```bash
# List recent backups
aws rds describe-db-snapshots \
  --db-instance-identifier silenttalk-production-postgres \
  --max-records 10

# Verify PITR enabled
aws rds describe-db-instances \
  --db-instance-identifier silenttalk-production-postgres \
  --query 'DBInstances[0].BackupRetentionPeriod'
```

#### Storage (S3)

**Configuration**:
- Versioning: Enabled on all buckets
- Lifecycle policy:
  - Transition to Glacier after 90 days
  - Delete after 1 year
- Cross-region replication: Enabled to us-west-2

**Verification**:
```bash
# Check versioning status
aws s3api get-bucket-versioning \
  --bucket silenttalk-production-storage

# Verify replication
aws s3api get-bucket-replication \
  --bucket silenttalk-production-storage
```

#### Application Configuration

**Configuration**:
- Infrastructure: Stored in Git
- Secrets: AWS Secrets Manager with automatic rotation
- Container images: Tagged and stored in GHCR

### Off-Site Backups

**Critical data copied to separate AWS account**:

```bash
# Automated daily backup to DR account
aws s3 sync \
  s3://silenttalk-production-storage/ \
  s3://silenttalk-dr-backups/s3-backup/ \
  --profile dr-account

# Database snapshot copy
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier <snapshot-arn> \
  --target-db-snapshot-identifier dr-snapshot-$(date +%Y%m%d) \
  --source-region us-east-1 \
  --region us-west-2
```

---

## Recovery Procedures

### Database Recovery

#### From Automated Snapshot

```bash
# 1. List available snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier silenttalk-production-postgres \
  --snapshot-type automated

# 2. Select snapshot to restore
SNAPSHOT_ID="rds:silenttalk-production-postgres-2025-11-13-06-00"

# 3. Restore
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier silenttalk-production-postgres-restored \
  --db-snapshot-identifier $SNAPSHOT_ID \
  --db-instance-class db.t3.medium \
  --multi-az

# 4. Wait for availability (10-15 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier silenttalk-production-postgres-restored

# 5. Update application configuration
# 6. Test thoroughly
# 7. Switch production traffic
```

#### From Point-in-Time

```bash
# Restore to specific timestamp
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier silenttalk-production-postgres \
  --target-db-instance-identifier silenttalk-production-postgres-pitr \
  --restore-time "2025-11-13T14:30:00Z"
```

### Storage Recovery

#### S3 Object Recovery

```bash
# List object versions
aws s3api list-object-versions \
  --bucket silenttalk-production-storage \
  --prefix uploads/user-avatar.jpg

# Restore specific version
aws s3api copy-object \
  --bucket silenttalk-production-storage \
  --copy-source "silenttalk-production-storage/uploads/user-avatar.jpg?versionId=VERSION_ID" \
  --key uploads/user-avatar.jpg
```

#### Bulk S3 Recovery

```bash
# Restore from DR account
aws s3 sync \
  s3://silenttalk-dr-backups/s3-backup/ \
  s3://silenttalk-production-storage/ \
  --profile dr-account \
  --delete  # Be careful with --delete flag
```

### Application Recovery

#### Rollback Deployment

```bash
# ECS - Rollback to previous task definition
aws ecs update-service \
  --cluster silenttalk-production-cluster \
  --service silenttalk-production-server \
  --task-definition silenttalk-production-server:PREVIOUS_VERSION

# Azure - Slot swap
az webapp deployment slot swap \
  --name silenttalk-production-api \
  --resource-group silenttalk-production-rg \
  --slot staging \
  --action swap
```

---

## Failover Procedures

### Multi-Region Failover (AWS)

**Pre-requisites**:
- DR region infrastructure deployed (standby mode)
- Cross-region database replication configured
- Route 53 health checks enabled

**Automatic Failover**:
```bash
# Route 53 failover routing policy
# Automatically routes to DR region if primary region health checks fail
# No manual intervention required
```

**Manual Failover**:
```bash
# 1. Activate DR region services
aws ecs update-service \
  --cluster silenttalk-production-cluster \
  --service silenttalk-production-server \
  --desired-count 3 \
  --region us-west-2

# 2. Promote read replica to primary
aws rds promote-read-replica \
  --db-instance-identifier silenttalk-production-postgres-replica \
  --region us-west-2

# 3. Update DNS
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://dr-failover.json

# 4. Verify services
curl https://api.silenttalk.com/health
```

### Database Failover

**Multi-AZ Automatic Failover**:
- Triggered automatically on primary AZ failure
- Failover time: 60-120 seconds
- Application reconnection required (handled by connection pool)

**Manual Failover** (for testing):
```bash
aws rds reboot-db-instance \
  --db-instance-identifier silenttalk-production-postgres \
  --force-failover
```

---

## DR Testing

### Test Schedule

| Test Type | Frequency | Duration | RTO Validation |
|-----------|-----------|----------|----------------|
| Backup Verification | Weekly | 30 min | N/A |
| Single Service Restore | Monthly | 2 hours | Yes |
| Full DR Drill | Quarterly | 4 hours | Yes |
| Multi-Region Failover | Annually | 8 hours | Yes |

### Monthly DR Test Procedure

**Objective**: Validate backup restoration and RTO compliance

#### Week 1: Database Restore Test

```bash
# 1. Restore latest snapshot to test instance
# 2. Verify data integrity
# 3. Measure restoration time
# 4. Document results
# 5. Cleanup test instance
```

#### Week 2: Application Restore Test

```bash
# 1. Deploy infrastructure to test environment
# 2. Restore application configuration
# 3. Verify functionality
# 4. Measure deployment time
# 5. Cleanup
```

#### Week 3: Storage Restore Test

```bash
# 1. Restore S3 objects from backup
# 2. Verify object integrity
# 3. Test cross-region replication
# 4. Document results
```

#### Week 4: Integrated DR Test

```bash
# 1. Simulate region failure
# 2. Execute full DR procedure
# 3. Verify all services operational
# 4. Measure total recovery time
# 5. Document lessons learned
# 6. Update DR procedures if needed
```

### Test Documentation Template

```markdown
# DR Test Report

**Date**: 2025-11-13
**Test Type**: Database Restore
**Conducted By**: DevOps Team

## Objective
Validate database restoration from automated snapshot

## Steps Performed
1. Selected snapshot: rds:silenttalk-production-postgres-2025-11-13-00-00
2. Initiated restore at: 10:00 UTC
3. Instance available at: 10:14 UTC
4. Data verification completed at: 10:25 UTC

## Results
- ✅ Snapshot restored successfully
- ✅ Data integrity verified
- ✅ All tables and indexes present
- ✅ Connection successful from application

## Metrics
- RTO Target: 30 minutes
- Actual RTO: 25 minutes
- ✅ Within SLA

## Issues Encountered
None

## Actions Required
None

## Next Test
Scheduled for: 2025-12-13
```

---

## Contact Information

### Primary Contacts

| Role | Name | Phone | Email | Escalation Level |
|------|------|-------|-------|-----------------|
| DevOps Lead | [Name] | [Phone] | devops-lead@silenttalk.com | L1 |
| Infrastructure Lead | [Name] | [Phone] | infra-lead@silenttalk.com | L2 |
| CTO | [Name] | [Phone] | cto@silenttalk.com | L3 |

### Vendor Support

| Vendor | Support Level | Contact | SLA |
|--------|--------------|---------|-----|
| AWS | Enterprise Support | AWS Console | 15 min response |
| Azure | Premier Support | Azure Portal | 15 min response |
| Datadog | Premium Support | support@datadog.com | 1 hour response |

### External Resources

- AWS Status: https://status.aws.amazon.com/
- Azure Status: https://status.azure.com/
- Internal Status Page: https://status.silenttalk.com/

---

## Document Control

**Version**: 1.0.0
**Last Updated**: 2025-11-13
**Next Review**: 2026-02-13
**Owner**: DevOps Team
**Approver**: CTO

### Change History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-13 | 1.0.0 | Initial version | DevOps Team |

### Annual Review Checklist

- [ ] Verify all contact information current
- [ ] Test all recovery procedures
- [ ] Update RTO/RPO targets based on business needs
- [ ] Review and update backup retention policies
- [ ] Validate DR infrastructure still deployed and operational
- [ ] Update costs and budget for DR
- [ ] Train new team members on procedures
- [ ] Document lessons learned from incidents
- [ ] Update based on infrastructure changes
