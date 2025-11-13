# SilentTalk Administrator Guide

> Comprehensive operations and maintenance guide for SilentTalk platform administrators

**Version:** 1.0
**Last Updated:** 2025-11-13
**Target Audience:** System Administrators, DevOps Engineers, Site Reliability Engineers

---

## Table of Contents

1. [Introduction](#introduction)
2. [System Requirements](#system-requirements)
3. [Deployment](#deployment)
4. [Configuration Management](#configuration-management)
5. [Monitoring & Observability](#monitoring--observability)
6. [Security Operations](#security-operations)
7. [Backup & Recovery](#backup--recovery)
8. [Maintenance & Updates](#maintenance--updates)
9. [Performance Tuning](#performance-tuning)
10. [Scaling](#scaling)
11. [Troubleshooting](#troubleshooting)
12. [Disaster Recovery](#disaster-recovery)
13. [Operational Runbooks](#operational-runbooks)
14. [Compliance & Audit](#compliance--audit)
15. [Support Procedures](#support-procedures)

---

## Introduction

SilentTalk is a microservices-based platform consisting of:

- **Frontend**: React 18 application
- **Backend API**: ASP.NET Core 8 REST API with SignalR
- **ML Service**: FastAPI ML inference service
- **Databases**: PostgreSQL (relational), MongoDB (NoSQL), Redis (cache)
- **Infrastructure**: MinIO (object storage), ELK Stack (logging), Coturn (TURN/STUN)

### Architecture Overview

```
┌─────────────┐
│   CDN/      │
│   Nginx     │
└──────┬──────┘
       │
┌──────▼──────────────────────────────────┐
│        Load Balancer                     │
└──────┬─────────────────────┬────────────┘
       │                     │
┌──────▼──────┐       ┌──────▼──────┐
│  Frontend   │       │  Backend    │
│  (React)    │◄─────►│  (ASP.NET)  │
└─────────────┘       └──────┬──────┘
                             │
                      ┌──────▼──────┐
                      │ ML Service  │
                      │  (FastAPI)  │
                      └──────┬──────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       │                     │                     │
┌──────▼──────┐   ┌──────────▼──────┐   ┌─────────▼────┐
│ PostgreSQL  │   │    MongoDB      │   │    Redis     │
└─────────────┘   └─────────────────┘   └──────────────┘
```

### Service Ports

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| Frontend | 3000 | HTTP | React dev server |
| Backend API | 5000 | HTTP/WebSocket | REST API + SignalR |
| ML Service | 8000 | HTTP/WebSocket | ML inference |
| PostgreSQL | 5432 | TCP | Relational database |
| MongoDB | 27017 | TCP | Document database |
| Redis | 6379 | TCP | Cache & sessions |
| Elasticsearch | 9200 | HTTP | Log storage |
| Logstash | 5044 | TCP | Log ingestion |
| Kibana | 5601 | HTTP | Log visualization |
| MinIO | 9000 | HTTP | Object storage API |
| MinIO Console | 9001 | HTTP | Admin UI |
| Coturn | 3478 | UDP/TCP | TURN/STUN |

---

## System Requirements

### Minimum Requirements (Development/Testing)

| Resource | Specification |
|----------|---------------|
| **CPU** | 4 cores (x86_64) |
| **RAM** | 16 GB |
| **Storage** | 100 GB SSD |
| **Network** | 100 Mbps |
| **OS** | Ubuntu 22.04 LTS, CentOS 8+, or Windows Server 2019+ |

### Recommended Requirements (Production)

| Resource | Specification |
|----------|---------------|
| **CPU** | 16+ cores (x86_64) |
| **RAM** | 64+ GB |
| **Storage** | 500+ GB NVMe SSD |
| **Network** | 1 Gbps+ |
| **OS** | Ubuntu 22.04 LTS (recommended) |
| **Backup** | Separate backup storage (1+ TB) |

### Software Prerequisites

| Software | Version | Purpose |
|----------|---------|---------|
| **Docker** | 24.0+ | Container runtime |
| **Docker Compose** | 2.20+ | Orchestration (dev/staging) |
| **Kubernetes** | 1.28+ | Orchestration (production) |
| **Nginx** | 1.24+ | Reverse proxy & load balancer |
| **Certbot** | 2.0+ | SSL/TLS certificate management |

---

## Deployment

### Development Deployment (Docker Compose)

**1. Prerequisites Setup**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

**2. Clone Repository**

```bash
git clone https://github.com/your-org/SilentTalkFYP.git
cd SilentTalkFYP
```

**3. Configure Environment Variables**

```bash
# Copy example environment files
cp server/src/SilentTalk.Api/appsettings.Example.json server/src/SilentTalk.Api/appsettings.Production.json
cp client/.env.example client/.env.production
cp ml-service/.env.example ml-service/.env

# Edit configuration files
nano server/src/SilentTalk.Api/appsettings.Production.json
nano client/.env.production
nano ml-service/.env
```

**4. Start Services**

```bash
# Start all services
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

**5. Initialize Database**

```bash
# Run migrations
docker-compose exec server dotnet ef database update

# Seed data (optional)
docker-compose exec server dotnet run -- seed
```

**6. Verify Deployment**

```bash
# Health checks
curl http://localhost:5000/health
curl http://localhost:8000/health
curl http://localhost:3000

# Check all services
make health
```

### Production Deployment (Kubernetes)

**1. Prepare Kubernetes Cluster**

```bash
# Create namespace
kubectl create namespace silenttalk-prod

# Create secrets
kubectl create secret generic db-credentials \
  --from-literal=postgres-password=<secure-password> \
  --from-literal=mongodb-password=<secure-password> \
  --from-literal=redis-password=<secure-password> \
  --namespace=silenttalk-prod

kubectl create secret generic jwt-secret \
  --from-literal=secret-key=<secure-jwt-secret> \
  --namespace=silenttalk-prod

kubectl create secret generic minio-credentials \
  --from-literal=access-key=<access-key> \
  --from-literal=secret-key=<secret-key> \
  --namespace=silenttalk-prod
```

**2. Deploy Infrastructure Services**

```bash
# PostgreSQL (using Helm)
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgresql bitnami/postgresql \
  --namespace silenttalk-prod \
  --set auth.postgresPassword=<password> \
  --set auth.database=silentstalk_db \
  --set persistence.size=100Gi

# MongoDB
helm install mongodb bitnami/mongodb \
  --namespace silenttalk-prod \
  --set auth.rootPassword=<password> \
  --set persistence.size=100Gi

# Redis
helm install redis bitnami/redis \
  --namespace silenttalk-prod \
  --set auth.password=<password> \
  --set master.persistence.size=10Gi
```

**3. Deploy Application Services**

```bash
# Apply Kubernetes manifests
kubectl apply -f infrastructure/kubernetes/backend-deployment.yaml
kubectl apply -f infrastructure/kubernetes/frontend-deployment.yaml
kubectl apply -f infrastructure/kubernetes/ml-service-deployment.yaml

# Apply services
kubectl apply -f infrastructure/kubernetes/backend-service.yaml
kubectl apply -f infrastructure/kubernetes/frontend-service.yaml
kubectl apply -f infrastructure/kubernetes/ml-service-service.yaml

# Apply ingress
kubectl apply -f infrastructure/kubernetes/ingress.yaml
```

**4. Configure SSL/TLS**

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@silenttalk.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# Update ingress with TLS
kubectl apply -f infrastructure/kubernetes/ingress-tls.yaml
```

**5. Verify Production Deployment**

```bash
# Check pod status
kubectl get pods -n silenttalk-prod

# Check services
kubectl get services -n silenttalk-prod

# Check ingress
kubectl get ingress -n silenttalk-prod

# Test endpoints
curl https://api.silenttalk.com/health
curl https://ml.silenttalk.com/health
curl https://silenttalk.com
```

### Blue-Green Deployment

```bash
# Deploy new version (green)
kubectl apply -f infrastructure/kubernetes/backend-deployment-v2.yaml

# Wait for green deployment to be ready
kubectl rollout status deployment/backend-v2 -n silenttalk-prod

# Test green deployment
kubectl port-forward deployment/backend-v2 5001:5000 -n silenttalk-prod
curl http://localhost:5001/health

# Switch traffic to green
kubectl patch service backend -n silenttalk-prod \
  -p '{"spec":{"selector":{"version":"v2"}}}'

# Monitor for issues
kubectl logs -f deployment/backend-v2 -n silenttalk-prod

# Rollback if needed
kubectl patch service backend -n silenttalk-prod \
  -p '{"spec":{"selector":{"version":"v1"}}}'
```

---

## Configuration Management

### Environment Variables

**Backend (ASP.NET Core)**

```bash
# Production environment variables
export ASPNETCORE_ENVIRONMENT=Production
export ConnectionStrings__DefaultConnection="Host=prod-postgres;Port=5432;Database=silentstalk_db;Username=app_user;Password=<secure-password>"
export ConnectionStrings__MongoDB="mongodb://app_user:<password>@prod-mongodb:27017/silentstalk"
export ConnectionStrings__Redis="prod-redis:6379,password=<password>"
export Jwt__SecretKey="<secure-jwt-secret-minimum-32-characters>"
export Jwt__Issuer="SilentTalkAPI"
export Jwt__Audience="SilentTalkClient"
export Storage__MinIO__Endpoint="prod-minio:9000"
export Storage__MinIO__AccessKey="<access-key>"
export Storage__MinIO__SecretKey="<secret-key>"
export Serilog__MinimumLevel__Default="Information"
```

**Frontend (React)**

```bash
# .env.production
VITE_API_BASE_URL=https://api.silenttalk.com
VITE_ML_SERVICE_URL=wss://ml.silenttalk.com/streaming/ws/recognize
VITE_SIGNALR_HUB_URL=https://api.silenttalk.com/hubs/call
VITE_ENVIRONMENT=production
```

**ML Service (FastAPI)**

```bash
# .env
ENVIRONMENT=production
MODEL_PATH=/app/models/gesture_model.onnx
MAX_WORKERS=4
LOG_LEVEL=INFO
CORS_ORIGINS=https://silenttalk.com,https://api.silenttalk.com
```

### Configuration Files

**Backend (appsettings.Production.json)**

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "Cors": {
    "AllowedOrigins": ["https://silenttalk.com"]
  },
  "Jwt": {
    "AccessTokenExpirationMinutes": 30,
    "RefreshTokenExpirationDays": 7
  },
  "WebRTC": {
    "StunServers": ["stun:stun.l.google.com:19302"],
    "Coturn": {
      "Url": "turn:turn.silenttalk.com:3478",
      "Username": "silenttalk",
      "Credential": "<secure-credential>"
    }
  },
  "RateLimit": {
    "EnableRateLimiting": true,
    "PermitLimit": 100,
    "Window": "00:01:00"
  }
}
```

### Secrets Management

**Using Kubernetes Secrets:**

```bash
# Create secret from file
kubectl create secret generic backend-config \
  --from-file=appsettings.Production.json \
  --namespace=silenttalk-prod

# Create secret from literal values
kubectl create secret generic api-keys \
  --from-literal=openai-key=<key> \
  --from-literal=sendgrid-key=<key> \
  --namespace=silenttalk-prod

# Mount secrets in deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  template:
    spec:
      containers:
      - name: backend
        env:
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: openai-key
```

**Using Azure Key Vault (for Azure deployments):**

```bash
# Install Azure Key Vault CSI driver
helm repo add csi-secrets-store-provider-azure https://azure.github.io/secrets-store-csi-driver-provider-azure/charts
helm install csi csi-secrets-store-provider-azure/csi-secrets-store-provider-azure

# Create SecretProviderClass
cat <<EOF | kubectl apply -f -
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: azure-kvname
  namespace: silenttalk-prod
spec:
  provider: azure
  parameters:
    keyvaultName: "silenttalk-kv"
    tenantId: "<tenant-id>"
    objects: |
      array:
        - |
          objectName: db-password
          objectType: secret
EOF
```

---

## Monitoring & Observability

### Health Checks

**Backend Health Check**

```bash
# Basic health check
curl https://api.silenttalk.com/health

# Response:
{
  "status": "Healthy",
  "checks": {
    "database": "Healthy",
    "redis": "Healthy",
    "mongodb": "Healthy",
    "storage": "Healthy"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**ML Service Health Check**

```bash
# Basic health check
curl https://ml.silenttalk.com/health

# Readiness check
curl https://ml.silenttalk.com/health/ready
```

**Automated Health Monitoring**

```bash
# Using Kubernetes liveness/readiness probes
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  template:
    spec:
      containers:
      - name: backend
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5
```

### Logging

**Centralized Logging with ELK Stack**

**1. Configure Log Shipping**

```bash
# Backend: Serilog to Elasticsearch
{
  "Serilog": {
    "Using": ["Serilog.Sinks.Elasticsearch"],
    "MinimumLevel": {
      "Default": "Information"
    },
    "WriteTo": [
      {
        "Name": "Elasticsearch",
        "Args": {
          "nodeUris": "https://elasticsearch.silenttalk.com:9200",
          "indexFormat": "silenttalk-backend-{0:yyyy.MM.dd}",
          "autoRegisterTemplate": true
        }
      }
    ]
  }
}
```

**2. Kibana Dashboard**

Access Kibana at: `https://kibana.silenttalk.com`

**Pre-configured Dashboards:**
- Application Logs (errors, warnings, info)
- API Performance (response times, error rates)
- User Activity (authentication, API calls)
- ML Service Metrics (inference time, model accuracy)

**3. Log Queries**

```
# Find all errors in last hour
level: "Error" AND @timestamp:[now-1h TO now]

# Find slow API requests (>2 seconds)
duration:>2000 AND service:"backend"

# Find failed authentications
message:"Authentication failed"
```

### Metrics (Prometheus + Grafana)

**1. Install Prometheus**

```bash
# Using Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

**2. Configure Service Monitors**

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: backend-monitor
  namespace: silenttalk-prod
spec:
  selector:
    matchLabels:
      app: backend
  endpoints:
  - port: metrics
    interval: 30s
```

**3. Grafana Dashboards**

Access Grafana at: `https://grafana.silenttalk.com`

**Key Metrics to Monitor:**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **API Response Time (p95)** | <200ms | >500ms |
| **Error Rate** | <1% | >5% |
| **CPU Usage** | <70% | >90% |
| **Memory Usage** | <80% | >95% |
| **Database Connections** | <80% pool | >95% pool |
| **ML Inference Time (p95)** | <100ms | >200ms |
| **WebRTC Connection Success** | >95% | <90% |

**4. Alerting**

```yaml
# Prometheus AlertManager configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
data:
  alertmanager.yml: |
    global:
      resolve_timeout: 5m
      slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'

    route:
      group_by: ['alertname', 'cluster']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'slack-notifications'

    receivers:
    - name: 'slack-notifications'
      slack_configs:
      - channel: '#alerts'
        title: 'SilentTalk Alert'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

### Application Performance Monitoring (APM)

**Using Application Insights (Azure) or New Relic**

```csharp
// Program.cs
builder.Services.AddApplicationInsightsTelemetry(options =>
{
    options.ConnectionString = builder.Configuration["ApplicationInsights:ConnectionString"];
});

// Track custom events
telemetryClient.TrackEvent("UserSignIn", new Dictionary<string, string>
{
    { "UserId", userId },
    { "Method", "OAuth" }
});

// Track dependencies
telemetryClient.TrackDependency("PostgreSQL", "GetUser", startTime, duration, success);
```

### Distributed Tracing

**Using OpenTelemetry**

```csharp
// Configure OpenTelemetry
builder.Services.AddOpenTelemetry()
    .WithTracing(tracerProviderBuilder =>
    {
        tracerProviderBuilder
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddEntityFrameworkCoreInstrumentation()
            .AddJaegerExporter(options =>
            {
                options.AgentHost = "jaeger";
                options.AgentPort = 6831;
            });
    });
```

---

## Security Operations

### SSL/TLS Certificate Management

**Using Let's Encrypt with Certbot**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d silenttalk.com -d www.silenttalk.com -d api.silenttalk.com

# Auto-renewal (cron job)
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet

# Verify auto-renewal
sudo certbot renew --dry-run
```

**Using cert-manager in Kubernetes**

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: silenttalk-tls
  namespace: silenttalk-prod
spec:
  secretName: silenttalk-tls-secret
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - silenttalk.com
  - api.silenttalk.com
  - ml.silenttalk.com
```

### Firewall Configuration

**UFW (Ubuntu)**

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application ports (if not behind load balancer)
sudo ufw allow 5000/tcp
sudo ufw allow 8000/tcp

# Allow database ports (only from app servers)
sudo ufw allow from <app-server-ip> to any port 5432
sudo ufw allow from <app-server-ip> to any port 27017
sudo ufw allow from <app-server-ip> to any port 6379

# Check status
sudo ufw status verbose
```

### Intrusion Detection

**Using Fail2Ban**

```bash
# Install Fail2Ban
sudo apt install fail2ban

# Configure SSH protection
sudo nano /etc/fail2ban/jail.local
```

```ini
[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5
```

```bash
# Start Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

### Security Scanning

**Container Scanning with Trivy**

```bash
# Install Trivy
sudo apt install wget apt-transport-https gnupg lsb-release
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt update
sudo apt install trivy

# Scan Docker image
trivy image silenttalk/backend:latest
trivy image silenttalk/frontend:latest
trivy image silenttalk/ml-service:latest

# Scan for critical vulnerabilities only
trivy image --severity CRITICAL,HIGH silenttalk/backend:latest
```

**Dependency Scanning**

```bash
# Backend (.NET)
dotnet list package --vulnerable --include-transitive

# Frontend (npm)
npm audit
npm audit fix

# ML Service (Python)
pip-audit
```

### Secret Rotation

**Automated Secret Rotation Script**

```bash
#!/bin/bash
# rotate-secrets.sh

# Rotate PostgreSQL password
NEW_PG_PASSWORD=$(openssl rand -base64 32)
kubectl create secret generic db-credentials \
  --from-literal=postgres-password=$NEW_PG_PASSWORD \
  --namespace=silenttalk-prod \
  --dry-run=client -o yaml | kubectl apply -f -

# Update PostgreSQL user
kubectl exec -it postgresql-0 -n silenttalk-prod -- psql -U postgres -c "ALTER USER app_user WITH PASSWORD '$NEW_PG_PASSWORD';"

# Restart backend pods to pick up new secret
kubectl rollout restart deployment/backend -n silenttalk-prod

# Rotate JWT secret
NEW_JWT_SECRET=$(openssl rand -base64 64)
kubectl create secret generic jwt-secret \
  --from-literal=secret-key=$NEW_JWT_SECRET \
  --namespace=silenttalk-prod \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl rollout restart deployment/backend -n silenttalk-prod

echo "Secret rotation completed"
```

### Security Headers

**Nginx Configuration**

```nginx
# /etc/nginx/sites-available/silenttalk.conf

server {
    listen 443 ssl http2;
    server_name silenttalk.com;

    ssl_certificate /etc/letsencrypt/live/silenttalk.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/silenttalk.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Backup & Recovery

### Database Backups

**PostgreSQL Backup Strategy**

```bash
#!/bin/bash
# backup-postgres.sh

BACKUP_DIR="/backup/postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="silentstalk_db"
DB_USER="silentstalk"
DB_HOST="localhost"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Full backup
pg_dump -h $DB_HOST -U $DB_USER -Fc $DB_NAME > $BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump

# Compress backup
gzip $BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump

# Upload to cloud storage (AWS S3)
aws s3 cp $BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump.gz s3://silenttalk-backups/postgres/

# Delete old backups
find $BACKUP_DIR -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: ${DB_NAME}_${TIMESTAMP}.dump.gz"
```

**Automated Backup (Cron)**

```bash
# Add to crontab
0 2 * * * /opt/scripts/backup-postgres.sh >> /var/log/backup-postgres.log 2>&1
```

**MongoDB Backup**

```bash
#!/bin/bash
# backup-mongodb.sh

BACKUP_DIR="/backup/mongodb"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="silentstalk"
MONGO_HOST="localhost:27017"
MONGO_USER="admin"
MONGO_PASS="<password>"

mkdir -p $BACKUP_DIR

# Backup
mongodump --host=$MONGO_HOST --username=$MONGO_USER --password=$MONGO_PASS \
  --db=$DB_NAME --out=$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}

# Compress
tar -czf $BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.tar.gz -C $BACKUP_DIR ${DB_NAME}_${TIMESTAMP}

# Upload to S3
aws s3 cp $BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.tar.gz s3://silenttalk-backups/mongodb/

# Cleanup
rm -rf $BACKUP_DIR/${DB_NAME}_${TIMESTAMP}
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

**Redis Backup**

```bash
# Redis automatically creates dump.rdb
# Copy to backup location
docker exec redis redis-cli BGSAVE
docker cp redis:/data/dump.rdb /backup/redis/dump_$(date +%Y%m%d_%H%M%S).rdb
```

### Restore Procedures

**PostgreSQL Restore**

```bash
# Stop application servers
kubectl scale deployment/backend --replicas=0 -n silenttalk-prod

# Download backup from S3
aws s3 cp s3://silenttalk-backups/postgres/silentstalk_db_20240115_020000.dump.gz /tmp/

# Decompress
gunzip /tmp/silentstalk_db_20240115_020000.dump.gz

# Drop and recreate database
psql -h localhost -U postgres -c "DROP DATABASE silentstalk_db;"
psql -h localhost -U postgres -c "CREATE DATABASE silentstalk_db;"

# Restore
pg_restore -h localhost -U postgres -d silentstalk_db /tmp/silentstalk_db_20240115_020000.dump

# Start application servers
kubectl scale deployment/backend --replicas=3 -n silenttalk-prod
```

**MongoDB Restore**

```bash
# Download backup
aws s3 cp s3://silenttalk-backups/mongodb/silentstalk_20240115_020000.tar.gz /tmp/

# Extract
tar -xzf /tmp/silentstalk_20240115_020000.tar.gz -C /tmp/

# Restore
mongorestore --host=localhost:27017 --username=admin --password=<password> \
  --db=silentstalk /tmp/silentstalk_20240115_020000/silentstalk
```

### Application State Backup

**Backup MinIO Data**

```bash
# Using mc (MinIO Client)
mc alias set silenttalk-minio https://minio.silenttalk.com <access-key> <secret-key>
mc mirror silenttalk-minio/silenttalk-recordings /backup/minio/recordings/
mc mirror silenttalk-minio/silenttalk-avatars /backup/minio/avatars/
```

### Disaster Recovery Plan

**RTO (Recovery Time Objective): 4 hours**
**RPO (Recovery Point Objective): 24 hours**

**Recovery Steps:**

1. **Assess Disaster Scope** (15 minutes)
   - Identify affected services
   - Determine data loss extent
   - Notify stakeholders

2. **Infrastructure Recovery** (1 hour)
   - Provision new infrastructure (Kubernetes cluster, VMs)
   - Configure networking and DNS
   - Deploy monitoring and logging

3. **Database Recovery** (2 hours)
   - Restore PostgreSQL from latest backup
   - Restore MongoDB from latest backup
   - Restore Redis from latest backup
   - Verify data integrity

4. **Application Deployment** (30 minutes)
   - Deploy backend service
   - Deploy ML service
   - Deploy frontend
   - Verify health checks

5. **Testing & Validation** (30 minutes)
   - Run smoke tests
   - Verify critical flows
   - Check integrations

6. **Go Live** (15 minutes)
   - Update DNS records
   - Monitor for issues
   - Notify users

---

## Maintenance & Updates

### Application Updates

**Zero-Downtime Deployment Strategy**

```bash
# 1. Deploy new version alongside old version
kubectl apply -f backend-deployment-v2.yaml

# 2. Wait for new pods to be ready
kubectl wait --for=condition=ready pod -l version=v2 -n silenttalk-prod --timeout=300s

# 3. Gradually shift traffic (using Istio or Nginx Ingress)
# 10% to new version
kubectl patch virtualservice backend -n silenttalk-prod --type merge -p '
{
  "spec": {
    "http": [{
      "route": [
        {"destination": {"host": "backend", "subset": "v1"}, "weight": 90},
        {"destination": {"host": "backend", "subset": "v2"}, "weight": 10}
      ]
    }]
  }
}'

# 4. Monitor metrics and errors

# 5. Gradually increase traffic to 100%
# 50%
kubectl patch virtualservice backend -n silenttalk-prod --type merge -p '{"spec":{"http":[{"route":[{"destination":{"host":"backend","subset":"v1"},"weight":50},{"destination":{"host":"backend","subset":"v2"},"weight":50}]}]}}'

# 100%
kubectl patch virtualservice backend -n silenttalk-prod --type merge -p '{"spec":{"http":[{"route":[{"destination":{"host":"backend","subset":"v2"},"weight":100}]}]}}'

# 6. Remove old version
kubectl delete deployment backend-v1 -n silenttalk-prod
```

### Database Migrations

**Safe Migration Process**

```bash
# 1. Backup database before migration
./backup-postgres.sh

# 2. Test migration on staging
kubectl exec -it backend-pod -n silenttalk-staging -- dotnet ef database update

# 3. Verify staging functionality
./run-smoke-tests.sh staging

# 4. Schedule maintenance window (if breaking changes)
# Send notification to users

# 5. Apply migration to production
kubectl exec -it backend-pod -n silenttalk-prod -- dotnet ef database update

# 6. Verify production
./run-smoke-tests.sh production

# 7. Monitor for errors
kubectl logs -f deployment/backend -n silenttalk-prod
```

### Security Patches

**Emergency Security Patch Process**

```bash
# 1. Assess severity and impact
# 2. Build patched image
docker build -t silenttalk/backend:v1.2.3-security .

# 3. Scan for vulnerabilities
trivy image silenttalk/backend:v1.2.3-security

# 4. Push to registry
docker push silenttalk/backend:v1.2.3-security

# 5. Update deployment
kubectl set image deployment/backend backend=silenttalk/backend:v1.2.3-security -n silenttalk-prod

# 6. Monitor rollout
kubectl rollout status deployment/backend -n silenttalk-prod

# 7. Verify security fix
./security-scan.sh
```

### Dependency Updates

**Monthly Dependency Update Process**

```bash
# Backend (.NET)
cd server
dotnet list package --outdated
dotnet add package <PackageName>
dotnet test

# Frontend (npm)
cd client
npm outdated
npm update
npm audit fix
npm test

# ML Service (Python)
cd ml-service
pip list --outdated
pip install --upgrade <package>
pytest
```

### System Maintenance

**Monthly Maintenance Checklist**

- [ ] Review and rotate logs
- [ ] Clean up old Docker images and containers
- [ ] Update SSL certificates (if manual renewal)
- [ ] Review and optimize database indexes
- [ ] Clean up old backups
- [ ] Review security alerts and patches
- [ ] Update documentation
- [ ] Review and update monitoring alerts
- [ ] Capacity planning review
- [ ] Cost optimization review

**Quarterly Maintenance Checklist**

- [ ] Disaster recovery drill
- [ ] Security audit
- [ ] Performance testing
- [ ] Dependency updates
- [ ] Infrastructure upgrades
- [ ] Review SLOs and adjust if needed

---

## Performance Tuning

### Database Optimization

**PostgreSQL Tuning**

```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';

-- Add missing indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_calls_status_created ON calls(status, created_at);

-- Update statistics
ANALYZE users;
VACUUM ANALYZE;

-- Configure connection pooling (postgresql.conf)
max_connections = 200
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
```

**MongoDB Optimization**

```javascript
// Create indexes
db.messages.createIndex({ sender_id: 1, created_at: -1 });
db.messages.createIndex({ recipient_id: 1, created_at: -1 });
db.forum_threads.createIndex({ category: 1, created_at: -1 });

// Analyze query performance
db.messages.find({ sender_id: "user123" }).explain("executionStats");

// Configure connection pool
mongodb://localhost:27017/?maxPoolSize=50&minPoolSize=10
```

### Application Performance

**ASP.NET Core Optimization**

```csharp
// Enable response caching
builder.Services.AddResponseCaching();
app.UseResponseCaching();

// Enable response compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<GzipCompressionProvider>();
    options.Providers.Add<BrotliCompressionProvider>();
});

// Configure Kestrel for high performance
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxConcurrentConnections = 1000;
    options.Limits.MaxRequestBodySize = 52428800; // 50 MB
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(2);
});
```

### ML Service Optimization

**GPU Acceleration**

```python
# Use GPU for ONNX inference
import onnxruntime as ort

providers = [
    ('CUDAExecutionProvider', {
        'device_id': 0,
        'gpu_mem_limit': 2 * 1024 * 1024 * 1024,  # 2 GB
    }),
    'CPUExecutionProvider'
]

session = ort.InferenceSession(model_path, providers=providers)
```

**Batch Processing**

```python
# Process frames in batches
async def process_frames_batch(frames: List[np.ndarray]) -> List[Result]:
    batch_size = 16
    results = []

    for i in range(0, len(frames), batch_size):
        batch = frames[i:i+batch_size]
        batch_results = await model.predict_batch(batch)
        results.extend(batch_results)

    return results
```

### Load Balancing

**Nginx Load Balancer Configuration**

```nginx
upstream backend_servers {
    least_conn;
    server backend-1:5000 max_fails=3 fail_timeout=30s;
    server backend-2:5000 max_fails=3 fail_timeout=30s;
    server backend-3:5000 max_fails=3 fail_timeout=30s;

    keepalive 32;
}

upstream ml_servers {
    least_conn;
    server ml-service-1:8000 max_fails=3 fail_timeout=30s;
    server ml-service-2:8000 max_fails=3 fail_timeout=30s;

    keepalive 16;
}

server {
    listen 443 ssl http2;
    server_name api.silenttalk.com;

    location /api {
        proxy_pass http://backend_servers;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
    }
}
```

---

## Scaling

### Horizontal Scaling

**Backend Scaling**

```bash
# Manual scaling
kubectl scale deployment/backend --replicas=5 -n silenttalk-prod

# Horizontal Pod Autoscaler (HPA)
kubectl autoscale deployment backend \
  --cpu-percent=70 \
  --min=3 \
  --max=10 \
  -n silenttalk-prod

# View HPA status
kubectl get hpa -n silenttalk-prod
```

**ML Service Scaling**

```bash
# Scale ML service based on request queue
kubectl autoscale deployment ml-service \
  --cpu-percent=80 \
  --min=2 \
  --max=8 \
  -n silenttalk-prod
```

### Vertical Scaling

**Increase Resource Limits**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  template:
    spec:
      containers:
      - name: backend
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
```

### Database Scaling

**PostgreSQL Read Replicas**

```bash
# Create read replica
kubectl apply -f postgresql-read-replica.yaml

# Configure application to use read replica for queries
# appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=postgres-primary;...",
    "ReadOnlyConnection": "Host=postgres-replica;..."
  }
}
```

**Redis Clustering**

```bash
# Deploy Redis Cluster
helm install redis-cluster bitnami/redis-cluster \
  --set cluster.nodes=6 \
  --set cluster.replicas=1 \
  --namespace silenttalk-prod
```

---

## Troubleshooting

### Common Issues

**Issue: High CPU Usage**

```bash
# Identify top CPU consumers
top
htop

# Check container CPU usage
docker stats

# Kubernetes pod CPU
kubectl top pods -n silenttalk-prod

# Profile .NET application
dotnet-trace collect --process-id <PID>
```

**Issue: Memory Leak**

```bash
# Monitor memory usage
free -h
watch -n 1 free -m

# Dump .NET memory
dotnet-dump collect --process-id <PID>
dotnet-dump analyze <dump-file>

# Analyze with dotMemory
```

**Issue: Database Connection Pool Exhausted**

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND state_change < now() - interval '10 minutes';

-- Increase connection pool size
-- appsettings.json
"ConnectionStrings": {
  "DefaultConnection": "...;Maximum Pool Size=200;..."
}
```

**Issue: SignalR Connection Drops**

```csharp
// Increase timeouts
builder.Services.AddSignalR(options =>
{
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(60);
    options.HandshakeTimeout = TimeSpan.FromSeconds(30);
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
});

// Enable detailed errors (development only)
app.MapHub<CallHub>("/hubs/call", options =>
{
    options.EnableDetailedErrors = true;
});
```

### Debugging Production Issues

**Enable Verbose Logging**

```bash
# Temporarily enable debug logging
kubectl set env deployment/backend ASPNETCORE_ENVIRONMENT=Development -n silenttalk-prod

# Stream logs
kubectl logs -f deployment/backend -n silenttalk-prod

# Revert to production logging
kubectl set env deployment/backend ASPNETCORE_ENVIRONMENT=Production -n silenttalk-prod
```

**Capture Network Traffic**

```bash
# Install tcpdump
kubectl exec -it backend-pod -n silenttalk-prod -- apt update && apt install tcpdump

# Capture traffic
kubectl exec -it backend-pod -n silenttalk-prod -- tcpdump -i any -w /tmp/capture.pcap

# Copy capture file
kubectl cp silenttalk-prod/backend-pod:/tmp/capture.pcap ./capture.pcap

# Analyze with Wireshark
wireshark capture.pcap
```

---

## Disaster Recovery

See **Backup & Recovery** section for detailed procedures.

**Disaster Scenarios:**

1. **Complete Data Center Failure**
   - Activate backup data center
   - Restore from off-site backups
   - Update DNS to point to backup location

2. **Ransomware Attack**
   - Isolate affected systems
   - Restore from clean backups
   - Run security audit
   - Update all credentials

3. **Database Corruption**
   - Stop application servers
   - Restore from last known good backup
   - Replay transaction logs if available
   - Verify data integrity

---

## Operational Runbooks

### Runbook: Service Outage Response

**Severity: Critical**

1. **Detection** (0-5 minutes)
   - Monitoring alert triggered
   - Verify outage (check health endpoints)
   - Determine affected services

2. **Initial Response** (5-15 minutes)
   - Create incident ticket
   - Notify on-call team
   - Post status update to status page

3. **Diagnosis** (15-30 minutes)
   - Check logs (Kibana)
   - Review metrics (Grafana)
   - Identify root cause

4. **Remediation** (30-60 minutes)
   - Apply fix (rollback, restart, scale)
   - Verify service restoration
   - Monitor for stability

5. **Post-Incident** (within 24 hours)
   - Write post-mortem
   - Identify preventive measures
   - Update runbooks

### Runbook: Database Performance Degradation

1. **Identify slow queries**
   ```sql
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. **Analyze query plans**
   ```sql
   EXPLAIN ANALYZE <slow-query>;
   ```

3. **Add missing indexes**
   ```sql
   CREATE INDEX CONCURRENTLY idx_name ON table(column);
   ```

4. **Update statistics**
   ```sql
   ANALYZE table_name;
   ```

5. **Consider query optimization or caching**

---

## Compliance & Audit

### GDPR Compliance

**Data Subject Rights:**

- Right to Access: `/api/privacy/export`
- Right to Erasure: `/api/privacy/delete-account`
- Right to Rectification: Profile settings
- Right to Portability: Export in JSON/CSV

**Audit Logs:**

```sql
-- Track all data access
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID,
    action VARCHAR(100),
    resource VARCHAR(100),
    timestamp TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Log retention: 90 days
DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '90 days';
```

### Security Compliance (SOC 2, ISO 27001)

**Access Control Audit:**

```bash
# Review user permissions
kubectl get rolebindings -n silenttalk-prod
kubectl get clusterrolebindings | grep silenttalk

# Review database user permissions
psql -c "\du"

# Review API authentication logs
kubectl logs deployment/backend -n silenttalk-prod | grep "Authentication"
```

---

## Support Procedures

### User Support Escalation

**Level 1 (User Support):**
- Password resets
- Account questions
- General usage questions

**Level 2 (Technical Support):**
- Video call issues
- Caption synchronization problems
- Performance issues

**Level 3 (Engineering):**
- System outages
- Data corruption
- Security incidents

### Incident Communication

**Status Page:** https://status.silenttalk.com

**Communication Templates:**

```
[INVESTIGATING] We are currently investigating reports of [issue description].

[IDENTIFIED] We have identified the root cause as [cause]. Working on resolution.

[MONITORING] A fix has been applied. We are monitoring the situation.

[RESOLVED] The issue has been resolved. Services are operating normally.
```

---

## Appendix

### Useful Commands Cheat Sheet

```bash
# Docker
docker ps
docker logs <container-id>
docker exec -it <container-id> bash
docker system prune -a

# Kubernetes
kubectl get pods -n silenttalk-prod
kubectl describe pod <pod-name> -n silenttalk-prod
kubectl logs -f <pod-name> -n silenttalk-prod
kubectl exec -it <pod-name> -n silenttalk-prod -- bash
kubectl port-forward <pod-name> 5000:5000 -n silenttalk-prod

# Database
psql -h localhost -U silentstalk -d silentstalk_db
mongosh --host localhost:27017 -u admin -p
redis-cli -h localhost -p 6379 -a <password>

# Logs
tail -f /var/log/nginx/access.log
journalctl -u docker -f
kubectl logs -f deployment/backend -n silenttalk-prod --tail=100
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-13
**Next Review:** 2025-12-13
**Contact:** devops@silenttalk.com
