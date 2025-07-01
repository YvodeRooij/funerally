# Farewelly Performance Testing Suite

Comprehensive performance and load testing for the Farewelly platform, designed specifically for the Dutch funeral services market.

## Overview

This testing suite validates system performance under realistic Dutch market conditions with growth projections, ensuring the platform can handle current and future loads effectively.

## Test Categories

### 1. Load Tests (`/load/`)
- **Purpose**: API endpoint performance under normal and peak loads
- **File**: `api-load-test.js`
- **Focus**: 
  - Normal business hours (200 concurrent users)
  - Peak periods (600 concurrent users)
  - API endpoint response times
  - User journey simulation

### 2. Stress Tests (`/stress/`)
- **Purpose**: System breaking points, resource exhaustion, and failure recovery
- **File**: `system-stress-test.js`
- **Focus**:
  - Breaking point detection (1000-2000 users)
  - Crisis scenarios (pandemic-level surges)
  - Resource exhaustion patterns
  - Recovery time measurement

### 3. Database Performance (`/database/`)
- **Purpose**: Query optimization, index effectiveness, and connection pooling
- **Files**: 
  - `db-performance-test.js` - Performance testing
  - `performance-indexes.sql` - Essential indexes
- **Focus**:
  - Query response times (<100ms p95)
  - Index hit ratios (>95%)
  - Connection pool utilization (<80%)
  - Complex query optimization

### 4. Real-time Performance (`/realtime/`)
- **Purpose**: WebSocket message throughput and concurrent connections
- **File**: `websocket-performance-test.js`
- **Focus**:
  - WebSocket connection stability
  - Message latency (<200ms p95)
  - Concurrent connection handling
  - Real-time feature performance

### 5. Scalability Tests (`/scalability/`)
- **Purpose**: Horizontal scaling, resource utilization, and bottleneck identification
- **File**: `horizontal-scaling-test.js`
- **Focus**:
  - Auto-scaling effectiveness
  - Growth pattern simulation
  - Resource bottleneck identification
  - Multi-region performance

## Dutch Market Parameters

The tests are calibrated for the Dutch funeral services market:

- **Annual Deaths**: ~150,000
- **Funeral Directors**: 2,400+
- **Venues**: 800+
- **Growth Rate**: 4.5% annually
- **Peak Season**: November-February (40% increase)
- **Mobile Usage**: 65% of traffic
- **Languages**: Dutch (primary), English (secondary)

## Quick Start

### Prerequisites

1. **Install k6**:
   ```bash
   # macOS
   brew install k6
   
   # Ubuntu/Debian
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

2. **Optional**: Install jq for enhanced report processing
   ```bash
   sudo apt-get install jq  # Ubuntu/Debian
   brew install jq          # macOS
   ```

### Running Tests

#### Run All Tests
```bash
cd /workspaces/farewelly/tests/performance
./run-all-tests.sh
```

#### Run Individual Test Categories
```bash
# Load testing only
./run-all-tests.sh load

# Stress testing only
./run-all-tests.sh stress

# Database performance only
./run-all-tests.sh database

# WebSocket performance only
./run-all-tests.sh realtime

# Scalability testing only
./run-all-tests.sh scalability
```

#### Environment Configuration
```bash
# Set target environment
export ENVIRONMENT=development  # or staging, production

# Database connection (for database tests)
export DB_CONNECTION="postgresql://user:pass@localhost:5432/farewelly"

# WebSocket URL (for real-time tests)
export WS_URL="ws://localhost:3000"

# Run tests
./run-all-tests.sh
```

## Performance Targets

### Response Times
- **P95**: <800ms
- **P99**: <1500ms
- **Average**: <400ms

### Availability & Reliability
- **Availability**: 99.9%
- **Error Rate**: <0.1%
- **WebSocket Latency**: <200ms

### Load Capacity
- **Normal Load**: 200 concurrent users
- **Peak Load**: 600 concurrent users
- **Crisis Load**: 1200 concurrent users
- **Requests per Second**: 50-300 RPS

### Database Performance
- **Query Time P95**: <100ms
- **Index Hit Ratio**: >95%
- **Cache Hit Ratio**: >90%
- **Connection Pool**: <80% utilization

## Test Configuration

### Dutch Market Configuration (`config/dutch-market-parameters.js`)
- Market size and growth projections
- User behavior patterns
- Seasonal variations
- Performance targets

### K6 Configuration (`config/k6-config.js`)
- Test scenarios and thresholds
- Environment configurations
- Test data generation
- Monitoring setup

## Report Generation

Tests automatically generate:

1. **JSON Reports**: Detailed metrics data
2. **Summary Reports**: Human-readable analysis
3. **Comprehensive Report**: Complete test suite overview
4. **Memory Storage**: Results stored for swarm coordination

Reports are saved in `reports/` directory with timestamps.

## Database Setup

Before running database tests, ensure performance indexes are created:

```bash
psql -f database/performance-indexes.sql your_database
```

## Monitoring Integration

The suite supports integration with:
- **InfluxDB**: Time-series metrics storage
- **Grafana**: Performance dashboards
- **Prometheus**: Metrics collection
- **Custom monitoring**: Via JSON exports

## Continuous Integration

### GitHub Actions Example
```yaml
name: Performance Tests
on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday 2 AM
  workflow_dispatch:

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install k6
        run: |
          sudo apt-get update
          sudo apt-get install k6
      - name: Run Performance Tests
        run: |
          cd tests/performance
          export ENVIRONMENT=staging
          ./run-all-tests.sh
      - name: Upload Reports
        uses: actions/upload-artifact@v3
        with:
          name: performance-reports
          path: tests/performance/reports/
```

## Troubleshooting

### Common Issues

1. **Connection Timeouts**
   - Check database connectivity
   - Verify WebSocket URL
   - Ensure sufficient system resources

2. **High Error Rates**
   - Review application logs
   - Check database connection limits
   - Verify authentication tokens

3. **Slow Performance**
   - Run database index creation script
   - Check system resource utilization
   - Review query performance

### Debug Mode
```bash
# Enable verbose logging
export K6_LOG_LEVEL=debug
./run-all-tests.sh
```

## Results Analysis

### Key Metrics to Monitor
1. **Response Time Distribution**: P50, P95, P99
2. **Error Rates**: By endpoint and user type
3. **Throughput**: Requests per second
4. **Resource Utilization**: CPU, memory, database
5. **Scalability**: Breaking points and bottlenecks

### Performance Optimization Recommendations
1. **Database**: Optimize slow queries, add missing indexes
2. **API**: Implement caching, optimize endpoints
3. **Infrastructure**: Configure auto-scaling, load balancing
4. **Monitoring**: Set up alerting for key metrics

## Market-Specific Considerations

### Dutch Funeral Services Context
- **Regulatory Compliance**: GDPR, Dutch privacy laws
- **Cultural Sensitivity**: Appropriate response times during grief
- **Seasonal Patterns**: Higher demand in winter months
- **Language Support**: Dutch-first, English fallback
- **Regional Distribution**: Coverage across Netherlands

### Business Impact Metrics
- **Family Experience**: Booking completion rates
- **Director Efficiency**: Client management performance
- **Venue Utilization**: Availability response times
- **Platform Reliability**: Uptime during critical moments

## Memory Storage

Test results are automatically stored in Memory for swarm coordination:
- **Key**: `swarm-testing-1750494292308/performance/tests`
- **Content**: Complete test metadata and results
- **Usage**: Access via claude-flow memory commands

## Contact

For questions about the performance testing suite:
- **Performance Team**: performance-team@farewelly.nl
- **Documentation**: Internal wiki
- **Support**: Technical team Slack channel

## License

This testing suite is part of the Farewelly platform - proprietary and confidential.

---

**Last Updated**: June 21, 2025
**Version**: 1.0.0
**Compatibility**: k6 v0.45+, PostgreSQL 13+, Node.js 18+