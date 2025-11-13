#!/bin/bash

###############################################################################
# Dependency Vulnerability Scanner
# Scans dependencies for known vulnerabilities (NFR-004)
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Dependency Vulnerability Scanner"
echo "=========================================="
echo ""

CRITICAL_FOUND=false
HIGH_FOUND=false
REPORTS_DIR="security-reports"

mkdir -p "$REPORTS_DIR"

###############################################################################
# Scan Client Dependencies
###############################################################################

echo -e "${YELLOW}Scanning client dependencies...${NC}"

if [ -d "client" ]; then
    cd client

    # npm audit
    echo "Running npm audit..."
    if npm audit --json > "../$REPORTS_DIR/client-npm-audit.json" 2>&1; then
        echo -e "${GREEN}✓ No vulnerabilities found in client${NC}"
    else
        npm audit --json > "../$REPORTS_DIR/client-npm-audit.json" 2>&1 || true

        # Check for critical/high vulnerabilities
        CRITICAL_COUNT=$(cat "../$REPORTS_DIR/client-npm-audit.json" | grep -o '"critical":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
        HIGH_COUNT=$(cat "../$REPORTS_DIR/client-npm-audit.json" | grep -o '"high":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")

        if [ "$CRITICAL_COUNT" -gt 0 ]; then
            echo -e "${RED}✗ Found $CRITICAL_COUNT critical vulnerabilities in client${NC}"
            CRITICAL_FOUND=true
        fi

        if [ "$HIGH_COUNT" -gt 0 ]; then
            echo -e "${YELLOW}⚠ Found $HIGH_COUNT high vulnerabilities in client${NC}"
            HIGH_FOUND=true
        fi

        # Generate human-readable report
        npm audit > "../$REPORTS_DIR/client-npm-audit.txt" 2>&1 || true
    fi

    cd ..
else
    echo -e "${YELLOW}⚠ Client directory not found, skipping${NC}"
fi

echo ""

###############################################################################
# Scan Server Dependencies
###############################################################################

echo -e "${YELLOW}Scanning server dependencies...${NC}"

if [ -d "server" ]; then
    cd server

    # npm audit
    echo "Running npm audit..."
    if npm audit --json > "../$REPORTS_DIR/server-npm-audit.json" 2>&1; then
        echo -e "${GREEN}✓ No vulnerabilities found in server${NC}"
    else
        npm audit --json > "../$REPORTS_DIR/server-npm-audit.json" 2>&1 || true

        # Check for critical/high vulnerabilities
        CRITICAL_COUNT=$(cat "../$REPORTS_DIR/server-npm-audit.json" | grep -o '"critical":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
        HIGH_COUNT=$(cat "../$REPORTS_DIR/server-npm-audit.json" | grep -o '"high":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")

        if [ "$CRITICAL_COUNT" -gt 0 ]; then
            echo -e "${RED}✗ Found $CRITICAL_COUNT critical vulnerabilities in server${NC}"
            CRITICAL_FOUND=true
        fi

        if [ "$HIGH_COUNT" -gt 0 ]; then
            echo -e "${YELLOW}⚠ Found $HIGH_COUNT high vulnerabilities in server${NC}"
            HIGH_FOUND=true
        fi

        # Generate human-readable report
        npm audit > "../$REPORTS_DIR/server-npm-audit.txt" 2>&1 || true
    fi

    cd ..
else
    echo -e "${YELLOW}⚠ Server directory not found, skipping${NC}"
fi

echo ""

###############################################################################
# OWASP Dependency Check (if available)
###############################################################################

if command -v dependency-check &> /dev/null; then
    echo -e "${YELLOW}Running OWASP Dependency Check...${NC}"

    dependency-check \
        --project "SilentTalk FYP" \
        --scan client server \
        --format "JSON" \
        --format "HTML" \
        --out "$REPORTS_DIR" \
        --failOnCVSS 7 \
        --suppression dependency-check-suppressions.xml \
        || echo -e "${YELLOW}⚠ OWASP Dependency Check found vulnerabilities${NC}"

    echo ""
else
    echo -e "${YELLOW}⚠ OWASP Dependency Check not installed, skipping${NC}"
    echo "Install with: brew install dependency-check (macOS)"
    echo ""
fi

###############################################################################
# Generate Summary Report
###############################################################################

echo -e "${YELLOW}Generating summary report...${NC}"

cat > "$REPORTS_DIR/SUMMARY.md" << EOF
# Dependency Vulnerability Scan Summary

**Date:** $(date)
**Project:** SilentTalk FYP

## Results

### Client Dependencies
EOF

if [ -f "$REPORTS_DIR/client-npm-audit.json" ]; then
    CRITICAL=$(cat "$REPORTS_DIR/client-npm-audit.json" | grep -o '"critical":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
    HIGH=$(cat "$REPORTS_DIR/client-npm-audit.json" | grep -o '"high":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
    MODERATE=$(cat "$REPORTS_DIR/client-npm-audit.json" | grep -o '"moderate":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
    LOW=$(cat "$REPORTS_DIR/client-npm-audit.json" | grep -o '"low":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")

    cat >> "$REPORTS_DIR/SUMMARY.md" << EOF

- Critical: $CRITICAL
- High: $HIGH
- Moderate: $MODERATE
- Low: $LOW

### Server Dependencies
EOF
fi

if [ -f "$REPORTS_DIR/server-npm-audit.json" ]; then
    CRITICAL=$(cat "$REPORTS_DIR/server-npm-audit.json" | grep -o '"critical":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
    HIGH=$(cat "$REPORTS_DIR/server-npm-audit.json" | grep -o '"high":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
    MODERATE=$(cat "$REPORTS_DIR/server-npm-audit.json" | grep -o '"moderate":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
    LOW=$(cat "$REPORTS_DIR/server-npm-audit.json" | grep -o '"low":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")

    cat >> "$REPORTS_DIR/SUMMARY.md" << EOF

- Critical: $CRITICAL
- High: $HIGH
- Moderate: $MODERATE
- Low: $LOW

## Recommended Actions

1. Review detailed reports in \`$REPORTS_DIR/\`
2. Update vulnerable dependencies: \`npm audit fix\`
3. For dependencies that cannot be automatically fixed: \`npm audit fix --force\`
4. Check for breaking changes before force updating
5. Consider alternative packages for unfixable vulnerabilities

## Reports Generated

- \`client-npm-audit.json\` - Client npm audit JSON report
- \`client-npm-audit.txt\` - Client npm audit human-readable report
- \`server-npm-audit.json\` - Server npm audit JSON report
- \`server-npm-audit.txt\` - Server npm audit human-readable report

EOF
fi

echo -e "${GREEN}✓ Summary report generated: $REPORTS_DIR/SUMMARY.md${NC}"

###############################################################################
# Exit with appropriate code
###############################################################################

echo ""
echo "=========================================="
echo "Scan Complete"
echo "=========================================="

if [ "$CRITICAL_FOUND" = true ]; then
    echo -e "${RED}✗ CRITICAL VULNERABILITIES FOUND${NC}"
    echo "Review reports in $REPORTS_DIR/"
    exit 1
elif [ "$HIGH_FOUND" = true ]; then
    echo -e "${YELLOW}⚠ HIGH VULNERABILITIES FOUND${NC}"
    echo "Review reports in $REPORTS_DIR/"
    exit 1
else
    echo -e "${GREEN}✓ No critical or high vulnerabilities found${NC}"
    exit 0
fi
