#!/bin/bash
# Smoke Tests for SpecKit Bootstrap
# Usage: ./scripts/smoke-test.sh [base-url]

# Note: Don't use 'set -e' - we want to continue testing even if some tests fail

BASE_URL="${1:-http://localhost:3000}"

echo "🧪 Running smoke tests against: $BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local url="$2"
    local expected_code="${3:-200}"
    
    echo -n "Testing: $test_name ... "
    
    HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' -m 10 "$url" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" -eq "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $HTTP_CODE)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $HTTP_CODE, expected $expected_code)"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test 1: Health Check (if your project has one)
# run_test "Health Check" "$BASE_URL/api/health" 200

# Test 2: Root endpoint
# run_test "Root Endpoint" "$BASE_URL/" 200

# Test 3: CLI Tools (local only)
if [ "$BASE_URL" = "http://localhost:3000" ]; then
    echo ""
    echo "🔧 Testing CLI Tools..."
    
    # Test orchestrator plan
    echo -n "Testing: Orchestrator Plan ... "
    if npm run speckit:plan -- "Test task" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((TESTS_FAILED++))
    fi
    
    # Test orchestrator status (may fail if no active task - that's OK)
    echo -n "Testing: Orchestrator Status ... "
    npm run speckit:status > /dev/null 2>&1
    status_exit=$?
    if [ $status_exit -eq 0 ] || [ $status_exit -eq 1 ]; then
        echo -e "${GREEN}✅ PASS${NC} (exit $status_exit is acceptable)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (unexpected exit $status_exit)"
        ((TESTS_FAILED++))
    fi
    
    # Test agent qwen (stub mode) - may fail due to missing .agent-keys.json
    echo -n "Testing: Qwen Agent (stub) ... "
    output=$(npm run agent:qwen -- implement --task "Test" 2>&1 || true)
    if echo "$output" | grep -q "status"; then
        echo -e "${GREEN}✅ PASS${NC} (agent responding)"
        ((TESTS_PASSED++))
    elif echo "$output" | grep -q "agent-keys.json not found"; then
        echo -e "${YELLOW}⚠️  SKIP${NC} (expected: .agent-keys.json not configured)"
        # Don't count as fail - this is expected in CI
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "  Output: $output"
        ((TESTS_FAILED++))
    fi
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "✅ Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "❌ Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "📈 Total:  $(($TESTS_PASSED + $TESTS_FAILED))"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
fi

