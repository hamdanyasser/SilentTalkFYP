# SilentTalk Observability Stack

Comprehensive monitoring, logging, and tracing infrastructure for SilentTalk FYP.

## Components

### Metrics Collection & Visualization
- **Prometheus** (Port 9090): Time-series metrics database
- **Grafana** (Port 3001): Visualization and dashboards
- **Node Exporter** (Port 9100): Host/system metrics
- **cAdvisor** (Port 8080): Container metrics

### Logging
- **Loki** (Port 3100): Log aggregation system
- **Promtail**: Log collection and shipping to Loki

### Distributed Tracing
- **Jaeger** (Port 16686): Distributed tracing system

### Alerting
- **AlertManager** (Port 9093): Alert routing and management

## Quick Start

### Start Monitoring Stack

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### Access Dashboards

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686
- **AlertManager**: http://localhost:9093

## Default Credentials

**Grafana:**
- Username: `admin`
- Password: `admin` (change on first login)

## Monitored Metrics

### Application Metrics
- API response times (p50, p95, p99)
- Request rates and error rates
- Active connections
- Database query performance
- ML inference latency
- WebRTC connection quality

### System Metrics
- CPU, memory, disk usage
- Network I/O
- Container resource utilization
- Database connections
- Cache hit rates

### Business Metrics
- Active users
- Video call duration
- Sign recognition accuracy
- Forum activity
- Tutorial completion rates

## Alert Rules

Alerts are configured for:
- High error rates (>5% for 5 minutes)
- Slow API responses (p95 >200ms)
- High CPU/memory usage (>80% for 10 minutes)
- Database connection pool exhaustion
- ML service downtime
- Low disk space (<10%)

## Grafana Dashboards

Pre-configured dashboards:
1. **Application Overview**: High-level metrics and health
2. **API Performance**: Request rates, latency, errors
3. **ML Service**: Inference times, accuracy, queue depth
4. **Infrastructure**: System resources, containers
5. **User Activity**: Active users, feature usage
6. **Video Calls**: Call quality, duration, participants

## Log Queries

### View Application Logs

```logql
{job="backend-api"} |= "error"
```

### ML Service Errors

```logql
{job="ml-service"} |= "exception"
```

### API Slow Requests

```logql
{job="backend-api"} | json | duration > 200ms
```

## Tracing

Jaeger provides distributed tracing for:
- API request flows
- Database queries
- ML inference pipelines
- Inter-service communication

## Prometheus Queries

### API Request Rate

```promql
rate(http_requests_total[5m])
```

### API Latency p95

```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### ML Inference Time

```promql
histogram_quantile(0.95, rate(ml_inference_duration_seconds_bucket[5m]))
```

### Error Rate

```promql
rate(http_requests_total{status=~"5.."}[5m])
```

## Configuration Files

```
monitoring/
├── prometheus/
│   ├── prometheus.yml      # Main Prometheus config
│   └── alerts.yml          # Alert rules
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/    # Auto-configured data sources
│   │   └── dashboards/     # Dashboard provisioning
│   └── dashboards/         # JSON dashboard files
├── loki/
│   └── loki-config.yml     # Loki configuration
├── promtail/
│   └── promtail-config.yml # Promtail log shipping config
└── alertmanager/
    └── alertmanager.yml    # Alert routing config
```

## Data Retention

- **Prometheus**: 30 days of metrics data
- **Loki**: 7 days of log data
- **Jaeger**: 7 days of trace data

## Scaling

For production deployment:
1. Use remote storage for Prometheus (Thanos/Cortex)
2. Deploy Loki in microservices mode
3. Use Jaeger with Elasticsearch backend
4. Configure AlertManager with PagerDuty/Slack

## Troubleshooting

### Prometheus not scraping targets

Check target health at: http://localhost:9090/targets

### Grafana not showing data

1. Verify data source connection
2. Check Prometheus is collecting metrics
3. Verify time range in dashboard

### Logs not appearing in Loki

1. Check Promtail is running
2. Verify log file paths in promtail-config.yml
3. Check Loki endpoint in Promtail config

## Health Checks

All services expose health endpoints:

```bash
# Prometheus
curl http://localhost:9090/-/healthy

# Grafana
curl http://localhost:3001/api/health

# Loki
curl http://localhost:3100/ready

# Jaeger
curl http://localhost:16686
```

## Backup and Restore

### Backup Prometheus Data

```bash
docker-compose -f docker-compose.monitoring.yml stop prometheus
tar czf prometheus-backup.tar.gz prometheus-data/
docker-compose -f docker-compose.monitoring.yml start prometheus
```

### Backup Grafana Dashboards

```bash
docker exec silenttalk-grafana \
  grafana-cli admin export-dashboard > dashboards-backup.json
```

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)

---

**Last Updated**: 2025-01-13
**Maintainer**: SilentTalk DevOps Team
