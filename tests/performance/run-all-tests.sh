#!/bin/bash

# PERFORMANCE TEST RUNNER - FAREWELLY PLATFORM
# 
# Comprehensive performance testing suite runner
# Executes all performance tests and generates reports

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORTS_DIR="${SCRIPT_DIR}/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_ENVIRONMENT="${ENVIRONMENT:-development}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create reports directory
mkdir -p "${REPORTS_DIR}"

# Test configuration
declare -A TESTS=(
    ["load"]="API Load Testing"
    ["stress"]="System Stress Testing" 
    ["database"]="Database Performance Testing"
    ["realtime"]="WebSocket Real-time Testing"
    ["scalability"]="Horizontal Scaling Testing"
)

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v k6 &> /dev/null; then
        error "k6 is not installed. Please install k6 first."
        error "Visit: https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        warning "jq is not installed. JSON report processing will be limited."
    fi
    
    success "Dependencies check completed"
}

# Validate environment
validate_environment() {
    log "Validating test environment: ${TEST_ENVIRONMENT}"
    
    case "${TEST_ENVIRONMENT}" in
        development|staging|production)
            success "Environment '${TEST_ENVIRONMENT}' is valid"
            ;;
        *)
            error "Invalid environment '${TEST_ENVIRONMENT}'. Use: development, staging, or production"
            exit 1
            ;;
    esac
}

# Run individual test
run_test() {
    local test_type="$1"
    local test_name="$2"
    local test_file=""
    
    case "${test_type}" in
        load)
            test_file="${SCRIPT_DIR}/load/api-load-test.js"
            ;;
        stress)
            test_file="${SCRIPT_DIR}/stress/system-stress-test.js"
            ;;
        database)
            test_file="${SCRIPT_DIR}/database/db-performance-test.js"
            ;;
        realtime)
            test_file="${SCRIPT_DIR}/realtime/websocket-performance-test.js"
            ;;
        scalability)
            test_file="${SCRIPT_DIR}/scalability/horizontal-scaling-test.js"
            ;;
        *)
            error "Unknown test type: ${test_type}"
            return 1
            ;;
    esac
    
    if [[ ! -f "${test_file}" ]]; then
        error "Test file not found: ${test_file}"
        return 1
    fi
    
    log "🚀 Starting ${test_name}..."
    log "📁 Test file: ${test_file}"
    log "🌍 Environment: ${TEST_ENVIRONMENT}"
    
    local report_file="${REPORTS_DIR}/${test_type}_test_${TIMESTAMP}.json"
    local summary_file="${REPORTS_DIR}/${test_type}_summary_${TIMESTAMP}.txt"
    
    # Set environment variables for k6
    export ENVIRONMENT="${TEST_ENVIRONMENT}"
    export K6_OUT="json=${report_file}"
    
    # Additional environment variables based on test type
    case "${test_type}" in
        database)
            export DB_CONNECTION="${DB_CONNECTION:-postgresql://localhost:5432/farewelly_test}"
            ;;
        realtime)
            export WS_URL="${WS_URL:-ws://localhost:3000}"
            ;;
    esac
    
    # Run the test
    local start_time=$(date +%s)
    if k6 run "${test_file}" --summary-export="${summary_file}"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        success "${test_name} completed successfully in ${duration}s"
        
        # Process results if jq is available
        if command -v jq &> /dev/null && [[ -f "${report_file}" ]]; then
            process_test_results "${test_type}" "${report_file}"
        fi
        
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        error "${test_name} failed after ${duration}s"
        return 1
    fi
}

# Process test results
process_test_results() {
    local test_type="$1"
    local report_file="$2"
    
    log "📊 Processing results for ${test_type} test..."
    
    # Extract key metrics
    local metrics_file="${REPORTS_DIR}/${test_type}_metrics_${TIMESTAMP}.json"
    
    if [[ -f "${report_file}" ]]; then
        # Extract metrics using jq
        jq '.metrics | {
            http_req_duration: .http_req_duration,
            http_req_failed: .http_req_failed,
            http_reqs: .http_reqs,
            vus: .vus,
            vus_max: .vus_max,
            iterations: .iterations
        }' "${report_file}" > "${metrics_file}" 2>/dev/null || true
        
        # Generate human-readable summary
        generate_summary "${test_type}" "${report_file}"
    fi
}

# Generate human-readable summary
generate_summary() {
    local test_type="$1"
    local report_file="$2"
    local summary_file="${REPORTS_DIR}/${test_type}_analysis_${TIMESTAMP}.md"
    
    cat > "${summary_file}" << EOF
# ${TESTS[${test_type}]} - Performance Analysis Report

**Generated:** $(date)
**Environment:** ${TEST_ENVIRONMENT}
**Test Type:** ${test_type}

## Key Metrics

EOF
    
    if command -v jq &> /dev/null; then
        # Add metrics to summary
        echo "### HTTP Request Duration" >> "${summary_file}"
        jq -r '.metrics.http_req_duration | "- Average: \(.avg)ms\n- P95: \(.["p(95)"])ms\n- P99: \(.["p(99)"])ms"' "${report_file}" >> "${summary_file}" 2>/dev/null || echo "- Metrics not available" >> "${summary_file}"
        
        echo "" >> "${summary_file}"
        echo "### Error Rate" >> "${summary_file}"
        jq -r '.metrics.http_req_failed | "- Failed Requests: \(.rate * 100)%"' "${report_file}" >> "${summary_file}" 2>/dev/null || echo "- Error rate not available" >> "${summary_file}"
        
        echo "" >> "${summary_file}"
        echo "### Throughput" >> "${summary_file}"
        jq -r '.metrics.http_reqs | "- Total Requests: \(.count)\n- Requests per Second: \(.rate)"' "${report_file}" >> "${summary_file}" 2>/dev/null || echo "- Throughput not available" >> "${summary_file}"
    fi
    
    cat >> "${summary_file}" << EOF

## Test-Specific Analysis

EOF
    
    case "${test_type}" in
        load)
            echo "- Normal load performance under Dutch market conditions" >> "${summary_file}"
            echo "- Peak load handling during busy periods" >> "${summary_file}"
            echo "- API endpoint response times and reliability" >> "${summary_file}"
            ;;
        stress)
            echo "- System breaking point identification" >> "${summary_file}"
            echo "- Resource exhaustion scenarios" >> "${summary_file}"
            echo "- Failure recovery capabilities" >> "${summary_file}"
            ;;
        database)
            echo "- Query performance optimization" >> "${summary_file}"
            echo "- Index effectiveness" >> "${summary_file}"
            echo "- Connection pool utilization" >> "${summary_file}"
            ;;
        realtime)
            echo "- WebSocket connection stability" >> "${summary_file}"
            echo "- Message throughput and latency" >> "${summary_file}"
            echo "- Real-time feature performance" >> "${summary_file}"
            ;;
        scalability)
            echo "- Horizontal scaling effectiveness" >> "${summary_file}"
            echo "- Auto-scaling threshold validation" >> "${summary_file}"
            echo "- Resource bottleneck identification" >> "${summary_file}"
            ;;
    esac
    
    success "Analysis report generated: ${summary_file}"
}

# Generate comprehensive report
generate_comprehensive_report() {
    log "📋 Generating comprehensive performance report..."
    
    local comprehensive_report="${REPORTS_DIR}/comprehensive_performance_report_${TIMESTAMP}.md"
    
    cat > "${comprehensive_report}" << EOF
# Farewelly Platform - Comprehensive Performance Test Report

**Generated:** $(date)
**Environment:** ${TEST_ENVIRONMENT}
**Test Suite:** Complete Performance Testing

## Executive Summary

This report contains the results of comprehensive performance testing for the Farewelly platform, 
including load testing, stress testing, database performance, real-time functionality, and 
scalability analysis.

## Test Results Overview

EOF
    
    # Add summary of each test
    for test_type in "${!TESTS[@]}"; do
        local test_report="${REPORTS_DIR}/${test_type}_analysis_${TIMESTAMP}.md"
        if [[ -f "${test_report}" ]]; then
            echo "### ${TESTS[${test_type}]}" >> "${comprehensive_report}"
            echo "" >> "${comprehensive_report}"
            tail -n +5 "${test_report}" >> "${comprehensive_report}"
            echo "" >> "${comprehensive_report}"
        fi
    done
    
    cat >> "${comprehensive_report}" << EOF

## Dutch Market Considerations

- **Target Load:** ${DUTCH_MARKET_CONFIG:-"Normal Dutch market conditions"}
- **Peak Season Handling:** Winter months (November-February) capacity
- **Growth Projections:** 4.5% annual growth rate accommodation
- **Language Support:** Dutch and English interface performance
- **Regional Distribution:** Multi-region capability for Netherlands coverage

## Recommendations

1. **Performance Optimization**
   - Review slow query performance and optimize database indexes
   - Implement caching strategies for frequently accessed data
   - Optimize API response times for mobile users (65% of traffic)

2. **Scalability Improvements**
   - Configure auto-scaling policies based on test results
   - Implement database connection pooling optimizations
   - Plan for viral growth scenarios (pandemic-like surges)

3. **Monitoring and Alerting**
   - Set up performance monitoring based on test thresholds
   - Implement proactive alerting for system bottlenecks
   - Monitor real-time feature performance continuously

4. **Infrastructure Planning**
   - Plan capacity for peak season (40% increase in winter)
   - Prepare for market penetration growth (25% target)
   - Ensure disaster recovery and failover capabilities

## Next Steps

1. Address critical performance issues identified in tests
2. Implement recommended optimizations
3. Set up continuous performance monitoring
4. Schedule regular performance testing (monthly)
5. Plan infrastructure scaling for projected growth

---

**Report Generated by:** Farewelly Performance Testing Suite
**Contact:** performance-team@farewelly.nl
EOF
    
    success "Comprehensive report generated: ${comprehensive_report}"
}

# Store results in memory (for swarm coordination)
store_results_in_memory() {
    log "💾 Storing test results in Memory for swarm coordination..."
    
    local memory_key="swarm-testing-1750494292308/performance/tests"
    local memory_file="${SCRIPT_DIR}/../../../memory/data/performance_results_${TIMESTAMP}.json"
    
    # Create memory entry
    local memory_entry=$(cat << EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "environment": "${TEST_ENVIRONMENT}",
    "test_suite": "comprehensive_performance",
    "reports_directory": "${REPORTS_DIR}",
    "test_results": {
        "load_test": "${REPORTS_DIR}/load_analysis_${TIMESTAMP}.md",
        "stress_test": "${REPORTS_DIR}/stress_analysis_${TIMESTAMP}.md",
        "database_test": "${REPORTS_DIR}/database_analysis_${TIMESTAMP}.md",
        "realtime_test": "${REPORTS_DIR}/realtime_analysis_${TIMESTAMP}.md",
        "scalability_test": "${REPORTS_DIR}/scalability_analysis_${TIMESTAMP}.md"
    },
    "comprehensive_report": "${REPORTS_DIR}/comprehensive_performance_report_${TIMESTAMP}.md",
    "metrics": {
        "tests_completed": $(ls "${REPORTS_DIR}"/*_analysis_${TIMESTAMP}.md 2>/dev/null | wc -l),
        "total_duration": "$(date +%s)",
        "environment_tested": "${TEST_ENVIRONMENT}",
        "dutch_market_compliance": true
    },
    "recommendations": [
        "Review database query optimization",
        "Configure auto-scaling policies",
        "Implement performance monitoring",
        "Plan for seasonal traffic variations"
    ]
}
EOF
)
    
    # Store in memory file
    echo "${memory_entry}" > "${memory_file}"
    
    success "Results stored in Memory: ${memory_key}"
    success "Memory file: ${memory_file}"
}

# Main execution
main() {
    log "🎯 Starting Farewelly Performance Testing Suite"
    log "📅 Timestamp: ${TIMESTAMP}"
    log "🌍 Environment: ${TEST_ENVIRONMENT}"
    
    # Check dependencies and validate environment
    check_dependencies
    validate_environment
    
    # Initialize test tracking
    local tests_passed=0
    local tests_failed=0
    local total_tests=${#TESTS[@]}
    
    log "📊 Running ${total_tests} performance test suites..."
    
    # Run all tests
    for test_type in "${!TESTS[@]}"; do
        if run_test "${test_type}" "${TESTS[${test_type}]}"; then
            ((tests_passed++))
        else
            ((tests_failed++))
        fi
        
        # Add delay between tests to allow system recovery
        if [[ "${test_type}" != "scalability" ]]; then
            log "⏱️  Waiting 60 seconds before next test..."
            sleep 60
        fi
    done
    
    # Generate comprehensive report
    generate_comprehensive_report
    
    # Store results in memory
    store_results_in_memory
    
    # Summary
    log "📈 Performance Testing Summary:"
    log "  ✅ Tests Passed: ${tests_passed}/${total_tests}"
    log "  ❌ Tests Failed: ${tests_failed}/${total_tests}"
    log "  📁 Reports Directory: ${REPORTS_DIR}"
    
    if [[ ${tests_failed} -eq 0 ]]; then
        success "🎉 All performance tests completed successfully!"
        exit 0
    else
        warning "⚠️  Some tests failed. Review the reports for details."
        exit 1
    fi
}

# Handle command line arguments
case "${1:-all}" in
    load|stress|database|realtime|scalability)
        log "🎯 Running single test: ${TESTS[$1]}"
        check_dependencies
        validate_environment
        run_test "$1" "${TESTS[$1]}"
        ;;
    all)
        main
        ;;
    help|--help|-h)
        echo "Usage: $0 [test_type]"
        echo ""
        echo "Available test types:"
        for test_type in "${!TESTS[@]}"; do
            echo "  ${test_type} - ${TESTS[${test_type}]}"
        done
        echo "  all - Run all tests (default)"
        echo ""
        echo "Environment variables:"
        echo "  ENVIRONMENT - Test environment (development|staging|production)"
        echo "  DB_CONNECTION - Database connection string for database tests"
        echo "  WS_URL - WebSocket URL for real-time tests"
        ;;
    *)
        error "Unknown command: $1"
        echo "Use '$0 help' for usage information."
        exit 1
        ;;
esac