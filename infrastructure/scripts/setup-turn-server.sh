#!/bin/bash
#
# TURN Server Setup Script for SilentTalk FYP
# Configures coturn for WebRTC NAT traversal
#
# Usage: sudo ./setup-turn-server.sh <domain> <realm> <external-ip>
# Example: sudo ./setup-turn-server.sh turn.silenttalk.com silenttalk.com 54.123.45.67

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   exit 1
fi

# Check arguments
if [ "$#" -lt 3 ]; then
    echo "Usage: $0 <domain> <realm> <external-ip>"
    echo "Example: $0 turn.silenttalk.com silenttalk.com 54.123.45.67"
    exit 1
fi

TURN_DOMAIN=$1
REALM=$2
EXTERNAL_IP=$3

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}TURN Server Setup for SilentTalk FYP${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "Domain: $TURN_DOMAIN"
echo "Realm: $REALM"
echo "External IP: $EXTERNAL_IP"
echo ""

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo -e "${RED}Cannot detect OS${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing coturn...${NC}"

if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get update
    apt-get install -y coturn certbot python3-certbot-nginx
elif [ "$OS" = "amzn" ] || [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    yum install -y epel-release
    yum install -y coturn certbot python3-certbot-nginx
else
    echo -e "${RED}Unsupported OS: $OS${NC}"
    exit 1
fi

echo -e "${GREEN}✓ coturn installed${NC}"

echo -e "${YELLOW}Step 2: Generating SSL certificates...${NC}"

# Stop nginx if running (for certbot standalone)
systemctl stop nginx 2>/dev/null || true

# Get Let's Encrypt certificate
certbot certonly --standalone \
    --preferred-challenges http \
    --agree-tos \
    --non-interactive \
    --register-unsafely-without-email \
    -d $TURN_DOMAIN || {
    echo -e "${YELLOW}Warning: Failed to get Let's Encrypt certificate.${NC}"
    echo -e "${YELLOW}You may need to manually configure SSL certificates.${NC}"
}

echo -e "${GREEN}✓ SSL certificates configured${NC}"

echo -e "${YELLOW}Step 3: Generating TURN credentials...${NC}"

# Generate random static auth secret
STATIC_AUTH_SECRET=$(openssl rand -hex 32)

# Generate username and password for testing
TURN_USERNAME="silenttalk"
TURN_PASSWORD=$(openssl rand -hex 16)

echo ""
echo "Generated TURN Credentials:"
echo "  Static Auth Secret: $STATIC_AUTH_SECRET"
echo "  Username (for testing): $TURN_USERNAME"
echo "  Password (for testing): $TURN_PASSWORD"
echo ""
echo -e "${YELLOW}Save these credentials securely!${NC}"
echo ""

# Save credentials to file
cat > /etc/turnserver-credentials.txt <<EOF
# TURN Server Credentials
# Generated: $(date)

Static Auth Secret: $STATIC_AUTH_SECRET
Test Username: $TURN_USERNAME
Test Password: $TURN_PASSWORD

# Use these in your application's ICE configuration:
{
  "urls": ["turn:${TURN_DOMAIN}:3478", "turns:${TURN_DOMAIN}:5349"],
  "username": "${TURN_USERNAME}",
  "credential": "${TURN_PASSWORD}"
}
EOF

chmod 600 /etc/turnserver-credentials.txt

echo -e "${GREEN}✓ Credentials saved to /etc/turnserver-credentials.txt${NC}"

echo -e "${YELLOW}Step 4: Configuring coturn...${NC}"

# Backup original config
if [ -f /etc/turnserver.conf ]; then
    cp /etc/turnserver.conf /etc/turnserver.conf.backup
fi

# Create turnserver configuration
cat > /etc/turnserver.conf <<EOF
# TURN server configuration for SilentTalk FYP
# Generated: $(date)

# Listening ports
listening-port=3478
tls-listening-port=5349

# Alternative ports for Docker/NAT environments
alt-listening-port=3479
alt-tls-listening-port=5350

# External IP address
external-ip=${EXTERNAL_IP}

# Relay IP address (usually same as listening address)
relay-ip=${EXTERNAL_IP}

# Realm (domain)
realm=${REALM}

# Server name
server-name=${TURN_DOMAIN}

# SSL/TLS certificates
cert=/etc/letsencrypt/live/${TURN_DOMAIN}/fullchain.pem
pkey=/etc/letsencrypt/live/${TURN_DOMAIN}/privkey.pem

# Cipher list for TLS 1.3
cipher-list="ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384"

# DH parameters (2066 bits)
dh2066

# Authentication
use-auth-secret
static-auth-secret=${STATIC_AUTH_SECRET}

# For testing, also allow long-term credentials
lt-cred-mech

# User credentials (for testing)
user=${TURN_USERNAME}:${TURN_PASSWORD}

# Total quota (in megabytes)
user-quota=100

# Per-user quota
total-quota=1200

# Maximum number of relay addresses per session
max-allocate-lifetime=3600

# Channel lifetime
channel-lifetime=600

# Permission lifetime
permission-lifetime=300

# Port range for relay endpoints
min-port=49152
max-port=65535

# Verbose logging (disable in production)
verbose

# Moderate logging
# simple-log

# Logging
log-file=/var/log/turnserver.log
# syslog

# Fingerprint
fingerprint

# Long-term mechanism
lt-cred-mech

# No multicast
no-multicast-peers

# No loopback
no-loopback-peers

# Mobility
mobility

# Disable UDP
# no-udp

# Disable TCP
# no-tcp

# Disable TLS
# no-tls

# Disable DTLS
# no-dtls

# No CLI
no-cli

# Disable software attributes
no-software-attribute

# Process limits
proc-user=turnserver
proc-group=turnserver

# Enable Prometheus metrics (optional)
# prometheus

# Disable RFC5780 (NAT behavior discovery)
# stale-nonce

# WebRTC-specific settings
no-stun-backward-compatibility
response-origin-only-with-rfc5780

# Rate limiting
max-bps=3000000

# Denial of service attack prevention
# Check origin
check-origin-consistency

# Alternate server (optional)
# alternate-server=turn2.silenttalk.com:3478
EOF

echo -e "${GREEN}✓ turnserver.conf created${NC}"

echo -e "${YELLOW}Step 5: Configuring firewall...${NC}"

# Configure firewall rules
if command -v ufw &> /dev/null; then
    # Ubuntu/Debian with UFW
    ufw allow 3478/tcp
    ufw allow 3478/udp
    ufw allow 5349/tcp
    ufw allow 49152:65535/udp
    echo -e "${GREEN}✓ UFW rules added${NC}"
elif command -v firewall-cmd &> /dev/null; then
    # CentOS/RHEL with firewalld
    firewall-cmd --permanent --add-port=3478/tcp
    firewall-cmd --permanent --add-port=3478/udp
    firewall-cmd --permanent --add-port=5349/tcp
    firewall-cmd --permanent --add-port=49152-65535/udp
    firewall-cmd --reload
    echo -e "${GREEN}✓ Firewalld rules added${NC}"
else
    echo -e "${YELLOW}Warning: No firewall detected. Please configure manually:${NC}"
    echo "  - Allow TCP 3478, 5349"
    echo "  - Allow UDP 3478, 49152-65535"
fi

echo -e "${YELLOW}Step 6: Setting up systemd service...${NC}"

# Enable coturn in default config
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sed -i 's/#TURNSERVER_ENABLED/TURNSERVER_ENABLED/' /etc/default/coturn 2>/dev/null || true
    echo "TURNSERVER_ENABLED=1" > /etc/default/coturn
fi

# Create systemd service file
cat > /etc/systemd/system/coturn.service <<EOF
[Unit]
Description=coturn TURN/STUN server
After=network.target

[Service]
Type=simple
User=turnserver
Group=turnserver
ExecStart=/usr/bin/turnserver -c /etc/turnserver.conf
Restart=on-failure
RestartSec=10
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

# Create turnserver user if it doesn't exist
if ! id -u turnserver &>/dev/null; then
    useradd -r -s /bin/false turnserver
fi

# Set permissions
chown turnserver:turnserver /var/log/turnserver.log 2>/dev/null || touch /var/log/turnserver.log && chown turnserver:turnserver /var/log/turnserver.log

# Reload systemd
systemctl daemon-reload
systemctl enable coturn

echo -e "${GREEN}✓ Systemd service configured${NC}"

echo -e "${YELLOW}Step 7: Starting coturn service...${NC}"

systemctl restart coturn

# Wait for service to start
sleep 3

# Check status
if systemctl is-active --quiet coturn; then
    echo -e "${GREEN}✓ coturn service started successfully${NC}"
else
    echo -e "${RED}✗ Failed to start coturn service${NC}"
    echo "Check logs: journalctl -u coturn -n 50"
    exit 1
fi

echo -e "${YELLOW}Step 8: Testing TURN server...${NC}"

# Test TURN connectivity
if command -v turnutils_uclient &> /dev/null; then
    echo "Testing TURN server connectivity..."
    timeout 10 turnutils_uclient -v -u ${TURN_USERNAME} -w ${TURN_PASSWORD} ${TURN_DOMAIN} || {
        echo -e "${YELLOW}Warning: TURN test failed or timed out${NC}"
        echo "This may be normal if external connectivity is not yet configured."
    }
else
    echo -e "${YELLOW}turnutils_uclient not found. Skipping connectivity test.${NC}"
fi

echo -e "${YELLOW}Step 9: Setting up certificate renewal...${NC}"

# Create renewal hook for coturn
mkdir -p /etc/letsencrypt/renewal-hooks/post

cat > /etc/letsencrypt/renewal-hooks/post/coturn-restart.sh <<'EOF'
#!/bin/bash
systemctl restart coturn
EOF

chmod +x /etc/letsencrypt/renewal-hooks/post/coturn-restart.sh

# Add cron job for certificate renewal
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet") | crontab -

echo -e "${GREEN}✓ Certificate auto-renewal configured${NC}"

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}TURN Server Setup Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "TURN Server Information:"
echo "  Domain: $TURN_DOMAIN"
echo "  Realm: $REALM"
echo "  External IP: $EXTERNAL_IP"
echo "  TURN Port: 3478 (UDP/TCP)"
echo "  TURNS Port: 5349 (TCP/TLS)"
echo "  Media Ports: 49152-65535 (UDP)"
echo ""
echo "Credentials saved to: /etc/turnserver-credentials.txt"
echo ""
echo "Service commands:"
echo "  Status: systemctl status coturn"
echo "  Logs: journalctl -u coturn -f"
echo "  Restart: systemctl restart coturn"
echo ""
echo "Test your TURN server at: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/"
echo ""
echo "Configuration for your application (JavaScript):"
echo ""
cat /etc/turnserver-credentials.txt | grep -A 5 "Use these"
echo ""
echo -e "${YELLOW}Security Note:${NC}"
echo "  - Store credentials securely in AWS Secrets Manager or Azure Key Vault"
echo "  - Rotate credentials regularly"
echo "  - Monitor TURN server usage and costs"
echo "  - Consider implementing authentication via REST API for production"
echo ""
echo -e "${GREEN}Setup complete!${NC}"
