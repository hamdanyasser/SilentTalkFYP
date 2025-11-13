# Live Environment Checklist

**SilentTalk FYP - Production Deployment**
**Definition of Done Verification**

This checklist must be completed and verified before production go-live.

---

## Security Requirements

### TLS 1.3 Configuration

- [ ] **TLS 1.3 Enabled on Load Balancer**
  ```bash
  # AWS
  aws elbv2 describe-ssl-policies \
    --names ELBSecurityPolicy-TLS13-1-2-2021-06

  # Expected: TLS 1.3 as minimum version
  ```

- [ ] **TLS 1.2 Disabled**
  ```bash
  # Test that TLS 1.2 is rejected
  openssl s_client -connect api.silenttalk.com:443 -tls1_2

  # Expected: Connection should fail or negotiate to TLS 1.3
  ```

- [ ] **TLS 1.3 Verified**
  ```bash
  # Test successful TLS 1.3 connection
  openssl s_client -connect api.silenttalk.com:443 -tls1_3

  # Expected:
  # Protocol  : TLSv1.3
  # Cipher    : TLS_AES_256_GCM_SHA384
  ```

- [ ] **SSL Certificate Valid**
  ```bash
  # Check certificate expiration
  openssl s_client -connect api.silenttalk.com:443 -servername api.silenttalk.com \
    < /dev/null 2>&1 | openssl x509 -noout -dates

  # Expected: Expiry date > 30 days in future
  ```

- [ ] **Certificate Chain Complete**
  ```bash
  # Verify certificate chain
  openssl s_client -connect api.silenttalk.com:443 -showcerts

  # Expected: Full chain including intermediate certificates
  ```

### Rate Limiting

- [ ] **WAF Configured with Rate Limits**
  ```bash
  # AWS
  aws wafv2 get-web-acl \
    --name silenttalk-production-waf \
    --scope REGIONAL \
    --id <web-acl-id>

  # Expected: Rate-based rules configured
  ```

- [ ] **API Rate Limit: 1000 requests per 5 minutes**
  ```bash
  # Test rate limiting on API endpoints
  for i in {1..1100}; do
    curl -o /dev/null -s -w "%{http_code}\n" \
      https://api.silenttalk.com/api/test
  done | grep 429 | wc -l

  # Expected: At least 100 requests should return 429 (Too Many Requests)
  ```

- [ ] **General Rate Limit: 2000 requests per 5 minutes**
  ```bash
  # Test general rate limiting
  for i in {1..2100}; do
    curl -o /dev/null -s -w "%{http_code}\n" \
      https://api.silenttalk.com/health
  done | grep 429 | wc -l

  # Expected: At least 100 requests should return 429
  ```

- [ ] **Rate Limit Headers Present**
  ```bash
  curl -I https://api.silenttalk.com/api/test

  # Expected headers:
  # X-RateLimit-Limit: 1000
  # X-RateLimit-Remaining: 999
  # X-RateLimit-Reset: 1699876543
  ```

- [ ] **IP-based Rate Limiting Functional**
  ```bash
  # Test from different IPs (use VPN or proxies)
  # Each IP should have independent rate limit counter
  ```

### Security Headers

- [ ] **HSTS Enabled**
  ```bash
  curl -I https://api.silenttalk.com

  # Expected:
  # Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  ```

- [ ] **X-Frame-Options Set**
  ```bash
  curl -I https://api.silenttalk.com

  # Expected: X-Frame-Options: DENY
  ```

- [ ] **X-Content-Type-Options Set**
  ```bash
  curl -I https://api.silenttalk.com

  # Expected: X-Content-Type-Options: nosniff
  ```

- [ ] **Content-Security-Policy Configured**
  ```bash
  curl -I https://api.silenttalk.com

  # Expected: Content-Security-Policy header present with strict policy
  ```

- [ ] **Referrer-Policy Set**
  ```bash
  curl -I https://api.silenttalk.com

  # Expected: Referrer-Policy: strict-origin-when-cross-origin
  ```

- [ ] **X-XSS-Protection Set**
  ```bash
  curl -I https://api.silenttalk.com

  # Expected: X-XSS-Protection: 1; mode=block
  ```

### Secrets Management

- [ ] **Database Credentials in Secrets Manager**
  ```bash
  # AWS
  aws secretsmanager list-secrets \
    --filters Key=name,Values=silenttalk-production/database

  # Expected: Secret exists and is accessible
  ```

- [ ] **Secrets Rotation Enabled**
  ```bash
  # AWS
  aws secretsmanager describe-secret \
    --secret-id silenttalk-production/database \
    --query 'RotationEnabled'

  # Expected: true
  ```

- [ ] **No Hardcoded Secrets in Code**
  ```bash
  # Search codebase for potential secrets
  grep -r "password\s*=" server/src/ || echo "No hardcoded passwords found"
  grep -r "api_key\s*=" server/src/ || echo "No hardcoded API keys found"
  grep -r "secret\s*=" server/src/ || echo "No hardcoded secrets found"

  # Expected: No matches (all secrets from environment/Secrets Manager)
  ```

- [ ] **Environment Variables Not Logged**
  ```bash
  # Check CloudWatch logs for sensitive data
  aws logs filter-log-events \
    --log-group-name /ecs/silenttalk-production-server \
    --filter-pattern "password" \
    --max-items 10

  # Expected: No sensitive data in logs
  ```

---

## Health Checks

### Application Health Endpoints

- [ ] **Server Health Endpoint Responding**
  ```bash
  curl https://api.silenttalk.com/health

  # Expected:
  # {"status":"healthy","database":"connected","redis":"connected","version":"1.0.0"}
  ```

- [ ] **Client Health Endpoint Responding**
  ```bash
  curl https://silenttalk.com/health

  # Expected: HTTP 200 with "healthy" response
  ```

- [ ] **Database Health Check Passing**
  ```bash
  # Via application health endpoint
  curl https://api.silenttalk.com/health | jq '.database'

  # Expected: "connected"
  ```

- [ ] **Redis Health Check Passing**
  ```bash
  # Via application health endpoint
  curl https://api.silenttalk.com/health | jq '.redis'

  # Expected: "connected"
  ```

### Load Balancer Health Checks

- [ ] **ALB Target Health - Server**
  ```bash
  # AWS
  aws elbv2 describe-target-health \
    --target-group-arn <server-target-group-arn>

  # Expected: All targets in "healthy" state
  ```

- [ ] **ALB Target Health - Client**
  ```bash
  # AWS
  aws elbv2 describe-target-health \
    --target-group-arn <client-target-group-arn>

  # Expected: All targets in "healthy" state
  ```

- [ ] **Health Check Frequency Correct**
  ```bash
  # AWS
  aws elbv2 describe-target-groups \
    --target-group-arns <target-group-arn> \
    --query 'TargetGroups[0].HealthCheckIntervalSeconds'

  # Expected: 30 seconds
  ```

- [ ] **Health Check Thresholds Correct**
  ```bash
  # AWS
  aws elbv2 describe-target-groups \
    --target-group-arns <target-group-arn> \
    --query 'TargetGroups[0].[HealthyThresholdCount,UnhealthyThresholdCount]'

  # Expected: [2, 3] (healthy threshold: 2, unhealthy threshold: 3)
  ```

### Database Health

- [ ] **RDS Instance Status**
  ```bash
  # AWS
  aws rds describe-db-instances \
    --db-instance-identifier silenttalk-production-postgres \
    --query 'DBInstances[0].DBInstanceStatus'

  # Expected: "available"
  ```

- [ ] **Multi-AZ Enabled**
  ```bash
  # AWS
  aws rds describe-db-instances \
    --db-instance-identifier silenttalk-production-postgres \
    --query 'DBInstances[0].MultiAZ'

  # Expected: true
  ```

- [ ] **Database Connections Within Limits**
  ```bash
  # Check current connections
  psql -h <db-endpoint> -U <username> -d silenttalk_prod \
    -c "SELECT count(*) FROM pg_stat_activity;"

  # Expected: < 80% of max_connections
  ```

### Cache Health

- [ ] **Redis Cluster Status**
  ```bash
  # AWS
  aws elasticache describe-replication-groups \
    --replication-group-id silenttalk-production-redis \
    --query 'ReplicationGroups[0].Status'

  # Expected: "available"
  ```

- [ ] **Redis Multi-AZ Enabled**
  ```bash
  # AWS
  aws elasticache describe-replication-groups \
    --replication-group-id silenttalk-production-redis \
    --query 'ReplicationGroups[0].MultiAZ'

  # Expected: "enabled"
  ```

---

## Monitoring and Alerts

### CloudWatch Dashboards (AWS)

- [ ] **Main Dashboard Created**
  ```bash
  aws cloudwatch list-dashboards | grep silenttalk-production

  # Expected: Dashboard exists
  ```

- [ ] **Dashboard Contains Key Metrics**
  - ECS CPU and Memory utilization
  - RDS connections, CPU, IOPS
  - Redis CPU, memory, cache hits/misses
  - ALB request count, latency, errors
  - Lambda invocations (if applicable)

### Alert Configuration

- [ ] **High CPU Alert Configured (>70% for 5 min)**
  ```bash
  aws cloudwatch describe-alarms \
    --alarm-names "silenttalk-production-high-cpu"

  # Expected: Alarm exists with threshold 70%, evaluation periods 1, period 300
  ```

- [ ] **High Memory Alert Configured (>80% for 5 min)**
  ```bash
  aws cloudwatch describe-alarms \
    --alarm-names "silenttalk-production-high-memory"

  # Expected: Alarm exists
  ```

- [ ] **Database Connection Alert Configured**
  ```bash
  aws cloudwatch describe-alarms \
    --alarm-names "silenttalk-production-db-connections-high"

  # Expected: Alarm exists
  ```

- [ ] **5xx Error Rate Alert Configured**
  ```bash
  aws cloudwatch describe-alarms \
    --alarm-names "silenttalk-production-5xx-errors"

  # Expected: Alarm exists with threshold for >10 5xx in 5 minutes
  ```

- [ ] **Disk Space Alert Configured (>85%)**
  ```bash
  aws cloudwatch describe-alarms \
    --alarm-names "silenttalk-production-disk-space"

  # Expected: Alarm exists
  ```

- [ ] **Health Check Failure Alert Configured**
  ```bash
  aws cloudwatch describe-alarms \
    --alarm-names "silenttalk-production-health-check-failed"

  # Expected: Alarm exists
  ```

### Alert Delivery

- [ ] **SNS Topic for Alerts Created**
  ```bash
  aws sns list-topics | grep silenttalk-production-alerts

  # Expected: Topic exists
  ```

- [ ] **Email Subscriptions Confirmed**
  ```bash
  aws sns list-subscriptions-by-topic \
    --topic-arn <topic-arn>

  # Expected: All email subscriptions in "Confirmed" state
  ```

- [ ] **Slack Integration Configured** (optional)
  ```bash
  # Test Slack webhook
  curl -X POST <slack-webhook-url> \
    -H 'Content-Type: application/json' \
    -d '{"text":"Test alert from SilentTalk production"}'

  # Expected: Message appears in Slack channel
  ```

- [ ] **Test Alert Received**
  ```bash
  # Trigger test alarm
  aws cloudwatch set-alarm-state \
    --alarm-name "silenttalk-production-high-cpu" \
    --state-value ALARM \
    --state-reason "Testing alert system"

  # Expected: Alert email/Slack message received within 2 minutes
  ```

### Log Aggregation

- [ ] **Application Logs Flowing to CloudWatch**
  ```bash
  aws logs tail /ecs/silenttalk-production-server --follow

  # Expected: Recent logs visible
  ```

- [ ] **Log Retention Configured**
  ```bash
  aws logs describe-log-groups \
    --log-group-name-prefix /ecs/silenttalk-production \
    --query 'logGroups[*].retentionInDays'

  # Expected: 30 or 90 days (not unlimited)
  ```

- [ ] **Error Log Filters Created**
  ```bash
  aws logs describe-metric-filters \
    --log-group-name /ecs/silenttalk-production-server

  # Expected: Filters for ERROR, CRITICAL, Exception patterns
  ```

---

## Backup and Recovery

### Backup Configuration

- [ ] **RDS Automated Backups Enabled**
  ```bash
  aws rds describe-db-instances \
    --db-instance-identifier silenttalk-production-postgres \
    --query 'DBInstances[0].BackupRetentionPeriod'

  # Expected: >= 30 (days)
  ```

- [ ] **Backup Schedule: Every 6 Hours**
  ```bash
  aws backup list-backup-plans
  aws backup get-backup-plan --backup-plan-id <plan-id>

  # Expected: Schedule rule with "cron(0 */6 * * ? *)"
  ```

- [ ] **Recent Backups Exist**
  ```bash
  aws rds describe-db-snapshots \
    --db-instance-identifier silenttalk-production-postgres \
    --max-records 5

  # Expected: At least 4 backups from last 24 hours
  ```

- [ ] **S3 Versioning Enabled**
  ```bash
  aws s3api get-bucket-versioning \
    --bucket silenttalk-production-storage

  # Expected: {"Status": "Enabled"}
  ```

- [ ] **Cross-Region Replication Configured** (optional but recommended)
  ```bash
  aws s3api get-bucket-replication \
    --bucket silenttalk-production-storage

  # Expected: Replication rules configured to secondary region
  ```

### Backup Testing

- [ ] **Test Restore Performed Within Last 30 Days**
  - Date of last test: ___________
  - Result: ___________
  - RTO achieved: ___________
  - Issues found: ___________

- [ ] **Backup Integrity Verified**
  ```bash
  # Restore latest backup to test instance
  # Verify data integrity
  # Document results
  ```

### Disaster Recovery

- [ ] **DR Plan Documented**
  - Location: `infrastructure/DISASTER_RECOVERY.md`
  - Last Updated: ___________
  - Reviewed By: ___________

- [ ] **DR Region Infrastructure Deployed** (optional)
  ```bash
  # Check secondary region
  aws ec2 describe-regions --region us-west-2

  # Verify DR resources exist
  ```

- [ ] **RTO/RPO Documented and Approved**
  - RTO Target: 30 minutes
  - RPO Target: 6 hours
  - Business Approval: ___________

---

## Scalability

### Auto-Scaling Configuration

- [ ] **ECS Auto-Scaling Enabled**
  ```bash
  aws application-autoscaling describe-scalable-targets \
    --service-namespace ecs \
    --resource-ids service/silenttalk-production-cluster/silenttalk-production-server

  # Expected: Scalable target exists
  ```

- [ ] **CPU-Based Scaling Policy (70% threshold)**
  ```bash
  aws application-autoscaling describe-scaling-policies \
    --service-namespace ecs \
    --resource-id service/silenttalk-production-cluster/silenttalk-production-server

  # Expected: Policy with 70% CPU target
  ```

- [ ] **Min/Max Capacity Configured**
  ```bash
  # Server: Min 3, Max 10
  # Client: Min 3, Max 10

  aws application-autoscaling describe-scalable-targets \
    --service-namespace ecs \
    --query 'ScalableTargets[*].[MinCapacity,MaxCapacity]'

  # Expected: [[3,10],[3,10]]
  ```

- [ ] **Auto-Scaling Test Performed**
  ```bash
  # Run load test to trigger scaling
  # Verify new tasks launched at 70% CPU
  # Verify scale-in after load decreases
  ```

### Multi-AZ Redundancy

- [ ] **Services Deployed Across 3 AZs**
  ```bash
  aws ecs describe-tasks \
    --cluster silenttalk-production-cluster \
    --tasks $(aws ecs list-tasks --cluster silenttalk-production-cluster --query 'taskArns' --output text) \
    --query 'tasks[*].availabilityZone'

  # Expected: Tasks distributed across 3 different AZs
  ```

- [ ] **Database Multi-AZ Verified**
  ```bash
  aws rds describe-db-instances \
    --db-instance-identifier silenttalk-production-postgres \
    --query 'DBInstances[0].[AvailabilityZone,SecondaryAvailabilityZone]'

  # Expected: Two different AZs
  ```

- [ ] **Redis Multi-AZ Verified**
  ```bash
  aws elasticache describe-replication-groups \
    --replication-group-id silenttalk-production-redis \
    --query 'ReplicationGroups[0].NodeGroups[0].NodeGroupMembers[*].PreferredAvailabilityZone'

  # Expected: Multiple AZs
  ```

- [ ] **Load Balancer Subnets in Multiple AZs**
  ```bash
  aws elbv2 describe-load-balancers \
    --names silenttalk-production-alb \
    --query 'LoadBalancers[0].AvailabilityZones[*].ZoneName'

  # Expected: At least 3 AZs
  ```

### Performance Testing

- [ ] **Load Test Performed**
  - Tool Used: ___________
  - Peak RPS Achieved: ___________
  - Response Time p95: ___________
  - Error Rate: ___________

- [ ] **Stress Test Performed**
  - Maximum Concurrent Users: ___________
  - Breaking Point: ___________
  - Recovery Time: ___________

---

## Compliance and Documentation

### Documentation

- [ ] **Deployment Runbook Complete**
  - Location: `infrastructure/DEPLOYMENT_RUNBOOK.md`
  - Last Updated: ___________

- [ ] **DR Plan Complete**
  - Location: `infrastructure/DISASTER_RECOVERY.md`
  - Last Updated: ___________

- [ ] **Architecture Diagram Created**
  - Location: ___________
  - Includes: VPC, subnets, services, data flow

- [ ] **API Documentation Published**
  - URL: ___________
  - Coverage: ___________

- [ ] **Infrastructure as Code Repository**
  - Location: `infrastructure/aws/terraform/`
  - Version Controlled: Yes
  - Code Review Required: Yes

### Change Management

- [ ] **Change Request Approved**
  - CR Number: ___________
  - Approved By: ___________
  - Deployment Window: ___________

- [ ] **Rollback Plan Documented**
  - Rollback Trigger: ___________
  - Rollback Steps: See DEPLOYMENT_RUNBOOK.md
  - Rollback SLA: 15 minutes

### Post-Deployment

- [ ] **Smoke Tests Passed**
  ```bash
  # Run smoke test suite
  npm run test:smoke

  # Expected: All tests pass
  ```

- [ ] **Stakeholders Notified**
  - [ ] Product Team
  - [ ] Customer Support
  - [ ] Sales Team
  - [ ] Executive Team

- [ ] **Monitoring Dashboard Shared**
  - URL: ___________
  - Access Granted To: ___________

---

## Final Sign-Off

### Technical Sign-Off

- [ ] **DevOps Lead**
  - Name: ___________
  - Signature: ___________
  - Date: ___________

- [ ] **Infrastructure Lead**
  - Name: ___________
  - Signature: ___________
  - Date: ___________

- [ ] **Security Lead**
  - Name: ___________
  - Signature: ___________
  - Date: ___________

### Business Sign-Off

- [ ] **Product Manager**
  - Name: ___________
  - Signature: ___________
  - Date: ___________

- [ ] **CTO**
  - Name: ___________
  - Signature: ___________
  - Date: ___________

---

## Definition of Done Verification

✅ **All items must be checked before production go-live**

- [ ] TLS 1.3 configured and verified
- [ ] Rate limiting active and tested
- [ ] All health checks passing
- [ ] Alerts configured and tested
- [ ] Disaster recovery plan documented and tested
- [ ] Auto-scaling at 70% CPU threshold verified
- [ ] Multi-AZ redundancy confirmed
- [ ] Backups every 6 hours verified
- [ ] Security headers present
- [ ] Secrets properly managed
- [ ] Monitoring dashboards created
- [ ] Documentation complete

**Checklist Completed By**: ___________
**Date**: ___________
**Production Go-Live Approved**: ☐ Yes ☐ No
