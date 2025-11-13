# SilentTalk Deployment Runbook

> Step-by-step deployment procedures, rollback strategies, and troubleshooting guide

**Version:** 1.0
**Last Updated:** 2025-11-13
**Target:** Production Deployment

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Procedures](#deployment-procedures)
3. [Post-Deployment Verification](#post-deployment-verification)
4. [Rollback Procedures](#rollback-procedures)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [Emergency Procedures](#emergency-procedures)

---

## Pre-Deployment Checklist

###  Code & Testing

- [ ] All tests passing (unit, integration, E2E)
- [ ] Code review approved by 2+ team members
- [ ] Security scan completed (no critical vulnerabilities)
- [ ] Performance tests passing (API p95 <200ms)
- [ ] Accessibility tests passing (WCAG AA)
- [ ] Linting and formatting applied
- [ ] Database migrations tested on staging
- [ ] Feature flags configured (if applicable)

### Documentation

- [ ] CHANGELOG.md updated with version changes
- [ ] API documentation updated (if API changes)
- [ ] User-facing documentation updated
- [ ] Deployment notes prepared
- [ ] Rollback plan documented

### Infrastructure

- [ ] Infrastructure provisioned (if new resources needed)
- [ ] Secrets rotated (if scheduled)
- [ ] SSL certificates valid (>30 days remaining)
- [ ] Backup verified (< 24 hours old)
- [ ] Monitoring dashboards prepared
- [ ] Alert rules updated
- [ ] Capacity planning reviewed

### Communication

- [ ] Deployment scheduled (off-peak hours preferred)
- [ ] Team notified (on-call engineers available)
- [ ] Stakeholders informed (if user-facing changes)
- [ ] Status page updated (if maintenance window)
- [ ] Runbook reviewed by deployment lead

### Staging Validation

- [ ] Deployed to staging environment
- [ ] Smoke tests passed on staging
- [ ] Manual QA completed on staging
- [ ] Performance benchmarks met on staging
- [ ] Database migration successful on staging

---

## Deployment Procedures

### Deployment Types

**Type 1: Zero-Downtime (Blue-Green)**
- **Use For:** Standard releases, feature updates
- **Downtime:** 0 minutes
- **Risk:** Low (easy rollback)
- **Procedure:** [Blue-Green Deployment](#blue-green-deployment)

**Type 2: Rolling Update**
- **Use For:** Minor updates, bug fixes
- **Downtime:** 0 minutes
- **Risk:** Low-Medium
- **Procedure:** [Rolling Update](#rolling-update)

**Type 3: Maintenance Window**
- **Use For:** Database schema changes, breaking changes
- **Downtime:** 5-30 minutes
- **Risk:** Medium
- **Procedure:** [Maintenance Deployment](#maintenance-deployment)

---

### Blue-Green Deployment

**Estimated Time:** 30 minutes
**Downtime:** 0 minutes

#### Step 1: Pre-Deployment (5 minutes)

```bash
# 1.1 Verify current production status
kubectl get pods -n silenttalk-prod
kubectl get deployments -n silenttalk-prod

# 1.2 Check current version
CURRENT_VERSION=$(kubectl get deployment backend -n silenttalk-prod -o=jsonpath='{.spec.template.spec.containers[0].image}')
echo "Current version: $CURRENT_VERSION"

# 1.3 Backup current configuration
kubectl get deployment backend -n silenttalk-prod -o yaml > backup-backend-$(date +%Y%m%d-%H%M%S).yaml
kubectl get configmap backend-config -n silenttalk-prod -o yaml > backup-config-$(date +%Y%m%d-%H%M%S).yaml
```

#### Step 2: Deploy Green Environment (10 minutes)

```bash
# 2.1 Set new version
NEW_VERSION="1.2.0"

# 2.2 Update deployment manifest with new version
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-green
  namespace: silenttalk-prod
  labels:
    app: backend
    version: green
    release: ${NEW_VERSION}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
      version: green
  template:
    metadata:
      labels:
        app: backend
        version: green
    spec:
      containers:
      - name: backend
        image: silenttalk/backend:${NEW_VERSION}
        ports:
        - containerPort: 5000
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5
EOF

# 2.3 Wait for green deployment to be ready
kubectl rollout status deployment/backend-green -n silenttalk-prod --timeout=300s

# 2.4 Verify green pods are healthy
kubectl get pods -l version=green -n silenttalk-prod
```

#### Step 3: Test Green Environment (10 minutes)

```bash
# 3.1 Port-forward to green environment for testing
kubectl port-forward deployment/backend-green 5001:5000 -n silenttalk-prod &
PF_PID=$!

# 3.2 Run smoke tests against green environment
curl -f http://localhost:5001/health || (kill $PF_PID && exit 1)

# 3.3 Test critical endpoints
./scripts/smoke-test.sh http://localhost:5001

# 3.4 Stop port-forward
kill $PF_PID
```

#### Step 4: Switch Traffic to Green (2 minutes)

```bash
# 4.1 Update service selector to point to green
kubectl patch service backend -n silenttalk-prod -p '{"spec":{"selector":{"version":"green"}}}'

# 4.2 Verify service is pointing to green pods
kubectl get endpoints backend -n silenttalk-prod
```

#### Step 5: Monitor & Verify (5 minutes)

```bash
# 5.1 Monitor logs for errors
kubectl logs -f deployment/backend-green -n silenttalk-prod --tail=100

# 5.2 Check metrics in Grafana
# - Error rate should remain < 1%
# - Response time p95 should be < 200ms
# - CPU/Memory usage should be normal

# 5.3 Check application logs in Kibana
# - No critical errors
# - Successful requests increasing

# 5.4 Verify with end-to-end tests
./scripts/e2e-test.sh https://api.silenttalk.com
```

#### Step 6: Cleanup Blue Environment (5 minutes)

```bash
# 6.1 Wait 10 minutes for traffic to stabilize
echo "Waiting 10 minutes before cleanup..."
sleep 600

# 6.2 Scale down blue deployment
kubectl scale deployment/backend-blue --replicas=1 -n silenttalk-prod

# 6.3 Wait another 10 minutes, then delete blue
echo "Waiting 10 more minutes..."
sleep 600

# 6.4 Delete blue deployment
kubectl delete deployment backend-blue -n silenttalk-prod

# 6.5 Rename green to blue for next deployment
kubectl patch deployment backend-green -n silenttalk-prod --type='json' \
  -p='[{"op": "replace", "path": "/metadata/name", "value": "backend-blue"}]'
```

---

### Rolling Update

**Estimated Time:** 15 minutes
**Downtime:** 0 minutes

#### Step 1: Update Deployment

```bash
# 1.1 Update container image
kubectl set image deployment/backend backend=silenttalk/backend:1.2.0 -n silenttalk-prod

# 1.2 Monitor rollout
kubectl rollout status deployment/backend -n silenttalk-prod
```

#### Step 2: Verify Rollout

```bash
# 2.1 Check rollout history
kubectl rollout history deployment/backend -n silenttalk-prod

# 2.2 Verify new pods are running
kubectl get pods -l app=backend -n silenttalk-prod

# 2.3 Check pod logs
kubectl logs -f deployment/backend -n silenttalk-prod --tail=50
```

---

### Maintenance Deployment

**Estimated Time:** 45 minutes
**Downtime:** 15 minutes

#### Step 1: Pre-Maintenance (10 minutes)

```bash
# 1.1 Update status page
curl -X POST https://api.statuspage.io/v1/pages/PAGE_ID/incidents \
  -H "Authorization: OAuth YOUR_API_KEY" \
  -d '{
    "incident": {
      "name": "Scheduled Maintenance",
      "status": "scheduled",
      "scheduled_for": "2025-01-15T02:00:00Z",
      "scheduled_until": "2025-01-15T02:30:00Z",
      "message": "We will be performing scheduled maintenance."
    }
  }'

# 1.2 Enable maintenance mode
kubectl apply -f maintenance-mode.yaml

# 1.3 Backup database
./scripts/backup-database.sh
```

#### Step 2: Stop Services (2 minutes)

```bash
# 2.1 Scale down all deployments
kubectl scale deployment/backend --replicas=0 -n silenttalk-prod
kubectl scale deployment/frontend --replicas=0 -n silenttalk-prod
kubectl scale deployment/ml-service --replicas=0 -n silenttalk-prod

# 2.2 Wait for pods to terminate
kubectl wait --for=delete pod -l app=backend -n silenttalk-prod --timeout=120s
```

#### Step 3: Database Migration (10 minutes)

```bash
# 3.1 Run migration job
kubectl apply -f database-migration-job.yaml

# 3.2 Monitor migration
kubectl logs -f job/database-migration -n silenttalk-prod

# 3.3 Verify migration success
kubectl get job database-migration -n silenttalk-prod
```

#### Step 4: Deploy New Version (10 minutes)

```bash
# 4.1 Update deployments
kubectl set image deployment/backend backend=silenttalk/backend:1.2.0 -n silenttalk-prod
kubectl set image deployment/frontend frontend=silenttalk/frontend:1.2.0 -n silenttalk-prod
kubectl set image deployment/ml-service ml-service=silenttalk/ml-service:1.2.0 -n silenttalk-prod

# 4.2 Scale up
kubectl scale deployment/backend --replicas=3 -n silenttalk-prod
kubectl scale deployment/frontend --replicas=3 -n silenttalk-prod
kubectl scale deployment/ml-service --replicas=2 -n silenttalk-prod

# 4.3 Wait for readiness
kubectl wait --for=condition=available deployment/backend -n silenttalk-prod --timeout=300s
kubectl wait --for=condition=available deployment/frontend -n silenttalk-prod --timeout=300s
kubectl wait --for=condition=available deployment/ml-service -n silenttalk-prod --timeout=300s
```

#### Step 5: Post-Deployment Verification (10 minutes)

```bash
# 5.1 Run smoke tests
./scripts/smoke-test.sh https://api.silenttalk.com

# 5.2 Disable maintenance mode
kubectl delete -f maintenance-mode.yaml

# 5.3 Update status page
curl -X PATCH https://api.statuspage.io/v1/pages/PAGE_ID/incidents/INCIDENT_ID \
  -H "Authorization: OAuth YOUR_API_KEY" \
  -d '{"incident": {"status": "resolved"}}'

# 5.4 Monitor metrics
echo "Monitoring for 10 minutes..."
# Check Grafana dashboards
# Check Kibana logs
# Monitor user feedback
```

---

## Post-Deployment Verification

### Automated Verification (5 minutes)

```bash
#!/bin/bash
# scripts/verify-deployment.sh

set -e

echo "=== Deployment Verification ==="

# 1. Health checks
echo "1. Checking health endpoints..."
curl -f https://api.silenttalk.com/health || exit 1
curl -f https://ml.silenttalk.com/health || exit 1
curl -f https://silenttalk.com/health || exit 1

# 2. API tests
echo "2. Running API tests..."
./scripts/api-test.sh https://api.silenttalk.com

# 3. Database connectivity
echo "3. Checking database connectivity..."
kubectl exec -it deployment/backend -n silenttalk-prod -- \
  dotnet run --project /app -- check-db

# 4. External dependencies
echo "4. Checking external dependencies..."
curl -f https://api.silenttalk.com/health/dependencies

# 5. Metrics check
echo "5. Checking metrics..."
ERRORS=$(curl -s "http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~'5..'}[5m])" | jq -r '.data.result[0].value[1]')
if (( $(echo "$ERRORS > 0.01" | bc -l) )); then
  echo "ERROR: Error rate too high: $ERRORS"
  exit 1
fi

echo "=== Verification Passed ==="
```

### Manual Verification (10 minutes)

**Critical User Flows:**

1. **User Registration & Login**
   - [ ] Create new account
   - [ ] Verify email
   - [ ] Login with credentials
   - [ ] Enable 2FA
   - [ ] Logout

2. **Video Call**
   - [ ] Start video call
   - [ ] Connect to another user
   - [ ] Toggle audio/video
   - [ ] Enable captions
   - [ ] End call

3. **Sign Recognition**
   - [ ] Enable sign recognition
   - [ ] Verify captions appear
   - [ ] Check accuracy
   - [ ] Test TTS

4. **Forum**
   - [ ] Create thread
   - [ ] Reply to thread
   - [ ] Search threads
   - [ ] Edit post

5. **Settings & Privacy**
   - [ ] Update profile
   - [ ] Change privacy settings
   - [ ] Export data
   - [ ] Manage cookies

---

## Rollback Procedures

### Immediate Rollback (Blue-Green)

**Estimated Time:** 2 minutes

```bash
# 1. Switch traffic back to blue
kubectl patch service backend -n silenttalk-prod -p '{"spec":{"selector":{"version":"blue"}}}'

# 2. Verify rollback
kubectl get endpoints backend -n silenttalk-prod

# 3. Check metrics
# Verify error rate decreased
```

### Rollback with Rolling Update

**Estimated Time:** 10 minutes

```bash
# 1. Rollback deployment
kubectl rollout undo deployment/backend -n silenttalk-prod

# 2. Monitor rollback
kubectl rollout status deployment/backend -n silenttalk-prod

# 3. Verify rollback
kubectl rollout history deployment/backend -n silenttalk-prod
```

### Database Rollback

**Estimated Time:** 20-30 minutes

```bash
# 1. Stop application servers
kubectl scale deployment/backend --replicas=0 -n silenttalk-prod

# 2. Restore database from backup
./scripts/restore-database.sh backup-20250115-020000.sql

# 3. Verify database integrity
psql -h localhost -U silentstalk -d silentstalk_db -c "SELECT COUNT(*) FROM users;"

# 4. Rollback application
kubectl rollout undo deployment/backend -n silenttalk-prod

# 5. Scale up
kubectl scale deployment/backend --replicas=3 -n silenttalk-prod
```

---

## Troubleshooting Guide

### Issue: Pods Not Starting

**Symptoms:**
- Pods stuck in `Pending` or `CrashLoopBackOff`
- `kubectl get pods` shows errors

**Diagnosis:**

```bash
# Check pod status
kubectl describe pod <pod-name> -n silenttalk-prod

# Check pod logs
kubectl logs <pod-name> -n silenttalk-prod

# Check events
kubectl get events -n silenttalk-prod --sort-by='.lastTimestamp'
```

**Solutions:**

1. **Insufficient Resources:**
   ```bash
   # Increase resource limits
   kubectl edit deployment backend -n silenttalk-prod
   # Update resources.limits
   ```

2. **Image Pull Failure:**
   ```bash
   # Verify image exists
   docker pull silenttalk/backend:1.2.0

   # Check image pull secrets
   kubectl get secret regcred -n silenttalk-prod
   ```

3. **Configuration Error:**
   ```bash
   # Check ConfigMap
   kubectl get configmap backend-config -n silenttalk-prod -o yaml

   # Check Secrets
   kubectl get secret db-credentials -n silenttalk-prod -o yaml
   ```

### Issue: High Error Rate

**Symptoms:**
- Error rate > 5%
- Users reporting errors
- Logs showing exceptions

**Diagnosis:**

```bash
# Check error logs
kubectl logs -f deployment/backend -n silenttalk-prod | grep -i error

# Check Grafana metrics
# - http_requests_total{status="500"}
# - Error rate dashboard

# Check Kibana
# - Filter: level:error
```

**Solutions:**

1. **Database Connection Issues:**
   ```bash
   # Check database health
   kubectl exec -it postgresql-0 -n silenttalk-prod -- pg_isready

   # Check connection pool
   # Look for "connection pool exhausted" errors
   ```

2. **Memory Leak:**
   ```bash
   # Check memory usage
   kubectl top pods -n silenttalk-prod

   # Restart pods with memory issues
   kubectl delete pod <pod-name> -n silenttalk-prod
   ```

3. **Dependency Failure:**
   ```bash
   # Check dependencies
   curl https://api.silenttalk.com/health/dependencies
   ```

### Issue: Slow Response Times

**Symptoms:**
- API p95 > 500ms
- Users reporting slowness
- Timeouts

**Diagnosis:**

```bash
# Check response times in Grafana
# - http_request_duration_seconds{quantile="0.95"}

# Check database query performance
psql -h localhost -U silentstalk -c "
  SELECT query, mean_exec_time, calls
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Check pod resources
kubectl top pods -n silenttalk-prod
```

**Solutions:**

1. **Database Slow Queries:**
   ```sql
   -- Add missing indexes
   CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

   -- Update statistics
   ANALYZE users;
   ```

2. **Resource Constraints:**
   ```bash
   # Scale up
   kubectl scale deployment/backend --replicas=5 -n silenttalk-prod

   # Or increase resources
   kubectl edit deployment backend -n silenttalk-prod
   ```

3. **Cold Start Issues:**
   ```bash
   # Ensure minimum replicas
   kubectl autoscale deployment backend --min=3 --max=10 -n silenttalk-prod
   ```

---

## Emergency Procedures

### Complete Service Outage

1. **Immediate Response (0-5 minutes)**
   - Activate incident response team
   - Update status page: "Major Outage"
   - Notify stakeholders

2. **Assessment (5-15 minutes)**
   - Check all service health endpoints
   - Review logs and metrics
   - Identify root cause

3. **Mitigation (15-30 minutes)**
   - If deployment-related: Rollback immediately
   - If infrastructure: Failover to backup region
   - If database: Restore from backup

4. **Communication**
   - Update status page every 15 minutes
   - Post to social media if prolonged
   - Send email to affected users

### Data Breach

1. **Immediate Response**
   - Isolate affected systems
   - Notify security team
   - Preserve logs and evidence

2. **Investigation**
   - Determine scope of breach
   - Identify compromised data
   - Document timeline

3. **Remediation**
   - Patch vulnerabilities
   - Rotate all credentials
   - Enhanced monitoring

4. **Legal & Compliance**
   - Notify legal team
   - Prepare regulatory notifications (GDPR: 72 hours)
   - User communication plan

### Database Corruption

1. **Immediate Response**
   - Stop write operations
   - Enable read-only mode

2. **Assessment**
   - Identify corrupted tables
   - Check backup integrity

3. **Recovery**
   - Restore from last good backup
   - Replay transaction logs if possible
   - Verify data integrity

---

## Appendix

### Deployment Contacts

| Role | Name | Contact |
|------|------|---------|
| **Deployment Lead** | TBD | TBD |
| **Backend Lead** | TBD | TBD |
| **DevOps Lead** | TBD | TBD |
| **On-Call Engineer** | Rotating | Pager Duty |

### Useful Commands

```bash
# View deployment status
kubectl get deployments -n silenttalk-prod

# View pod status
kubectl get pods -n silenttalk-prod

# View logs
kubectl logs -f deployment/backend -n silenttalk-prod --tail=100

# Port forward for debugging
kubectl port-forward deployment/backend 5000:5000 -n silenttalk-prod

# Exec into pod
kubectl exec -it deployment/backend -n silenttalk-prod -- bash

# View metrics
kubectl top pods -n silenttalk-prod
kubectl top nodes

# View events
kubectl get events -n silenttalk-prod --sort-by='.lastTimestamp'
```

---

**Runbook Version:** 1.0
**Last Updated:** 2025-11-13
**Next Review:** 2025-12-13
