#!/bin/bash
# ============================================
# Database Persistence Test Script
# ============================================
# This script tests that PostgreSQL data persists across container restarts
# Usage: ./test-persistence.sh

set -e

echo "============================================"
echo "Database Persistence Test"
echo "============================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test configuration
API_URL="http://localhost:5000"
TEST_USER_EMAIL="persistence-test-$(date +%s)@test.com"
TEST_USER_PASSWORD="TestPass123!"

echo ""
echo "Step 1: Register a test user"
echo "-------------------------------------------"
REGISTER_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"${TEST_USER_EMAIL}\",
        \"password\": \"${TEST_USER_PASSWORD}\",
        \"confirmPassword\": \"${TEST_USER_PASSWORD}\",
        \"displayName\": \"Persistence Test\"
    }")

echo "Response: ${REGISTER_RESPONSE}"

if echo "${REGISTER_RESPONSE}" | grep -q "token"; then
    echo -e "${GREEN}✓ User registered successfully${NC}"
else
    echo -e "${RED}✗ User registration failed${NC}"
    exit 1
fi

# Extract token
TOKEN=$(echo "${REGISTER_RESPONSE}" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: ${TOKEN}"

echo ""
echo "Step 2: Verify user can login"
echo "-------------------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"${TEST_USER_EMAIL}\",
        \"password\": \"${TEST_USER_PASSWORD}\"
    }")

echo "Response: ${LOGIN_RESPONSE}"

if echo "${LOGIN_RESPONSE}" | grep -q "token"; then
    echo -e "${GREEN}✓ User login successful${NC}"
else
    echo -e "${RED}✗ User login failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 3: Restart Docker containers${NC}"
echo "-------------------------------------------"
echo "Please run the following commands in a separate terminal:"
echo ""
echo "  cd infrastructure/docker"
echo "  docker-compose restart server"
echo ""
echo "After the server container has restarted, press Enter to continue..."
read -p ""

echo ""
echo "Step 4: Wait for server to be ready"
echo "-------------------------------------------"
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -f "${API_URL}/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Server is ready${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for server... (${RETRY_COUNT}/${MAX_RETRIES})"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}✗ Server failed to start${NC}"
    exit 1
fi

echo ""
echo "Step 5: Verify user still exists after restart"
echo "-------------------------------------------"
LOGIN_AFTER_RESTART=$(curl -s -X POST "${API_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"${TEST_USER_EMAIL}\",
        \"password\": \"${TEST_USER_PASSWORD}\"
    }")

echo "Response: ${LOGIN_AFTER_RESTART}"

if echo "${LOGIN_AFTER_RESTART}" | grep -q "token"; then
    echo -e "${GREEN}✓ User data persisted after restart!${NC}"
    echo ""
    echo "============================================"
    echo -e "${GREEN}✓ DATABASE PERSISTENCE TEST PASSED${NC}"
    echo "============================================"
else
    echo -e "${RED}✗ User data lost after restart${NC}"
    echo ""
    echo "============================================"
    echo -e "${RED}✗ DATABASE PERSISTENCE TEST FAILED${NC}"
    echo "============================================"
    exit 1
fi

echo ""
echo "Test completed successfully!"
echo "User ${TEST_USER_EMAIL} persisted across container restart."
