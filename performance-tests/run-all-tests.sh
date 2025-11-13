#!/bin/bash

###############################################################################
# Run All Performance Tests
# Executes all k6 performance tests and generates consolidated report
###############################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
TEST_MODE=${TEST_MODE:-smoke}
API_BASE_URL=${API_BASE_URL:-http://localhost:5000}
WS_BASE_URL=${WS_BASE_URL:-ws://localhost:5000}
WEB_BASE_URL=${WEB_BASE_URL:-http://localhost:3000}
REPORTS_DIR="reports"

# Create reports directory
mkdir -p "$REPORTS_DIR"

echo "=========================================="
echo "SilentTalk Performance Test Suite"
echo "=========================================="
echo "Test Mode: $TEST_MODE"
echo "API URL: $API_BASE_URL"
echo "WebSocket URL: $WS_BASE_URL"
echo "Web URL: $WEB_BASE_URL"
echo "=========================================="
echo ""

# Track overall status
OVERALL_PASS=true

###############################################################################
# Health Checks
###############################################################################

echo -e "${YELLOW}Running health checks...${NC}"

# Check API health
if curl -f "$API_BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API is healthy${NC}"
else
    echo -e "${RED}✗ API is not responding${NC}"
    echo "Please start the API server first: cd server && npm start"
    exit 1
fi

# Check frontend health (optional)
if curl -f "$WEB_BASE_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is healthy${NC}"
    FRONTEND_AVAILABLE=true
else
    echo -e "${YELLOW}⚠ Frontend is not responding (page load tests will be skipped)${NC}"
    FRONTEND_AVAILABLE=false
fi

echo ""

###############################################################################
# Test 1: API Performance
###############################################################################

echo -e "${YELLOW}[1/4] Running API Performance Tests...${NC}"

if TEST_MODE=$TEST_MODE \
   API_BASE_URL=$API_BASE_URL \
   k6 run \
   --out json="$REPORTS_DIR/api-performance-raw.json" \
   --summary-export="$REPORTS_DIR/api-performance-summary.json" \
   api-performance.test.js; then
    echo -e "${GREEN}✓ API Performance Tests PASSED${NC}"
else
    echo -e "${RED}✗ API Performance Tests FAILED${NC}"
    OVERALL_PASS=false
fi

echo ""

###############################################################################
# Test 2: WebRTC Load
###############################################################################

echo -e "${YELLOW}[2/4] Running WebRTC Load Tests...${NC}"

if TEST_MODE=$TEST_MODE \
   API_BASE_URL=$API_BASE_URL \
   WS_BASE_URL=$WS_BASE_URL \
   k6 run \
   --out json="$REPORTS_DIR/webrtc-load-raw.json" \
   --summary-export="$REPORTS_DIR/webrtc-load-summary.json" \
   webrtc-load.test.js; then
    echo -e "${GREEN}✓ WebRTC Load Tests PASSED${NC}"
else
    echo -e "${RED}✗ WebRTC Load Tests FAILED${NC}"
    OVERALL_PASS=false
fi

echo ""

###############################################################################
# Test 3: ML Inference
###############################################################################

echo -e "${YELLOW}[3/4] Running ML Inference Tests...${NC}"

if TEST_MODE=$TEST_MODE \
   API_BASE_URL=$API_BASE_URL \
   k6 run \
   --out json="$REPORTS_DIR/ml-inference-raw.json" \
   --summary-export="$REPORTS_DIR/ml-inference-summary.json" \
   ml-inference.test.js; then
    echo -e "${GREEN}✓ ML Inference Tests PASSED${NC}"
else
    echo -e "${RED}✗ ML Inference Tests FAILED${NC}"
    OVERALL_PASS=false
fi

echo ""

###############################################################################
# Test 4: Frontend Performance (if available)
###############################################################################

if [ "$FRONTEND_AVAILABLE" = true ]; then
    echo -e "${YELLOW}[4/4] Running Frontend Performance Tests...${NC}"

    if WEB_BASE_URL=$WEB_BASE_URL \
       k6 run \
       --out json="$REPORTS_DIR/page-load-raw.json" \
       --summary-export="$REPORTS_DIR/page-load-summary.json" \
       page-load-budget.test.js; then
        echo -e "${GREEN}✓ Frontend Performance Tests PASSED${NC}"
    else
        echo -e "${RED}✗ Frontend Performance Tests FAILED${NC}"
        OVERALL_PASS=false
    fi
else
    echo -e "${YELLOW}[4/4] Skipping Frontend Performance Tests (frontend not available)${NC}"
fi

echo ""

###############################################################################
# Generate Reports
###############################################################################

echo -e "${YELLOW}Generating consolidated report...${NC}"

if node ../scripts/generate-performance-report.js; then
    echo -e "${GREEN}✓ Report generated successfully${NC}"
else
    echo -e "${RED}✗ Failed to generate report${NC}"
fi

echo ""

###############################################################################
# Check Thresholds
###############################################################################

echo -e "${YELLOW}Checking performance thresholds...${NC}"

if node ../scripts/check-all-thresholds.js "$REPORTS_DIR"; then
    echo -e "${GREEN}✓ All thresholds met${NC}"
else
    echo -e "${RED}✗ Some thresholds not met${NC}"
    OVERALL_PASS=false
fi

echo ""

###############################################################################
# Detect Regressions
###############################################################################

echo -e "${YELLOW}Detecting performance regressions...${NC}"

if node ../scripts/detect-performance-regressions.js "$REPORTS_DIR"; then
    echo -e "${GREEN}✓ No regressions detected${NC}"
else
    echo -e "${YELLOW}⚠ Performance regressions detected (check output above)${NC}"
    # Don't fail on regressions, just warn
fi

echo ""

###############################################################################
# Summary
###############################################################################

echo "=========================================="
echo "Test Suite Summary"
echo "=========================================="

if [ "$OVERALL_PASS" = true ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
    echo ""
    echo "Reports available at:"
    echo "  - $REPORTS_DIR/performance-report.md"
    echo "  - $REPORTS_DIR/performance-report.json"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo ""
    echo "Check reports for details:"
    echo "  - $REPORTS_DIR/performance-report.md"
    echo "  - $REPORTS_DIR/*-summary.json"
    exit 1
fi
