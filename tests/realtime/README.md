# Real-Time Features Testing Suite

## Overview

This comprehensive testing suite validates all real-time features in Farewelly, ensuring reliable communication between families, funeral directors, and venues. The tests cover WebSocket connections, chat systems, notifications, presence tracking, and collaborative document editing.

## Test Suites

### 1. WebSocket Connection Tests (`websocket-connection.test.ts`)
- **Connection establishment and management**
- **Automatic reconnection logic**
- **Network failure handling**
- **Rate limiting and message queuing**
- **Heartbeat and keep-alive mechanisms**
- **Concurrent connection handling**
- **Memory management and cleanup**

**Key Test Scenarios:**
- Normal connection flow
- Connection timeouts and retries
- Intermittent connectivity
- High latency scenarios
- Malformed message handling
- Server restart recovery

### 2. Chat System Tests (`chat-system.test.ts`)
- **Family-director messaging**
- **Typing indicators**
- **File sharing and attachments**
- **Message reactions and editing**
- **Read receipts**
- **Message ordering under load**

**Key Test Scenarios:**
- Real-time message delivery
- Concurrent message sending
- File upload with size limits
- Message reactions and editing
- Offline message queuing
- Large message history handling

### 3. Notification System Tests (`notification-system.test.ts`)
- **Multi-channel delivery (in-app, push, email, SMS)**
- **Priority handling and routing**
- **User preference management**
- **Notification batching**
- **Quiet hours and DND**
- **Delivery failure recovery**

**Key Test Scenarios:**
- Priority-based delivery
- Channel failover mechanisms
- Batch notification processing
- Rate limiting enforcement
- Preference-based filtering
- High-volume notification handling

### 4. Presence Tracking Tests (`presence-tracking.test.ts`)
- **Online/offline detection**
- **Idle state monitoring**
- **Activity tracking**
- **Multi-device presence**
- **Typing indicators**
- **Channel presence**

**Key Test Scenarios:**
- Visibility state changes
- Idle timeout detection
- Multi-user presence tracking
- Device-specific presence
- Activity-based status updates
- Performance with many users

### 5. Collaborative Features Tests (`collaborative-features.test.ts`)
- **Real-time document editing**
- **Operational transformation**
- **Conflict resolution**
- **Version control**
- **Document sharing**
- **Access permissions**

**Key Test Scenarios:**
- Concurrent editing conflicts
- Document locking mechanisms
- Version history management
- Permission-based access
- Large document performance
- Many user collaboration

### 6. Integration Tests (`integration.test.ts`)
- **End-to-end workflows**
- **Network condition simulation**
- **Concurrent user load testing**
- **Message ordering consistency**
- **System limit validation**
- **Error recovery scenarios**

**Key Test Scenarios:**
- Complete funeral planning workflow
- Network partition handling
- High-latency environments
- Packet loss simulation
- Rate limiting behavior
- Memory pressure scenarios

## Running Tests

### Individual Test Suites
```bash
# WebSocket connection tests
npm run test:realtime:websocket

# Chat system tests
npm run test:realtime:chat

# Notification system tests
npm run test:realtime:notifications

# Presence tracking tests
npm run test:realtime:presence

# Collaborative features tests
npm run test:realtime:collaborative

# Integration tests
npm run test:realtime:integration
```

### Full Test Suite
```bash
# Run all real-time tests with comprehensive reporting
npm run test:realtime:all

# Run with coverage reporting
npm run test:realtime:coverage

# Run with performance profiling
npm run test:realtime:performance
```

### Test Runner
```bash
# Execute comprehensive test suite with detailed reporting
npx ts-node tests/realtime/test-runner.ts
```

## Test Configuration

### Environment Variables
```bash
# Test WebSocket URL
TEST_WEBSOCKET_URL=ws://localhost:3001

# Test timeouts
TEST_CONNECTION_TIMEOUT=10000
TEST_MESSAGE_TIMEOUT=5000

# Performance test parameters
TEST_CONCURRENT_USERS=50
TEST_MESSAGE_BURST_SIZE=100
TEST_LOAD_DURATION=60000

# Network simulation
TEST_LATENCY_MIN=0
TEST_LATENCY_MAX=2000
TEST_PACKET_LOSS=0.1
```

### Mock Configuration
Tests use comprehensive mocking for:
- WebSocket servers (jest-websocket-mock)
- HTTP APIs (fetch mock)
- Browser APIs (Notification, visibility)
- File system operations
- Time-based operations

## Test Results and Reporting

### Automatic Reporting
The test runner generates:
- **JSON Report**: Detailed test results with metrics
- **Markdown Summary**: Human-readable test overview
- **Memory Storage**: Results stored for swarm coordination
- **Performance Metrics**: Response times, throughput, error rates

### Report Location
```
/workspaces/farewelly/tests/realtime/test-report.json
/workspaces/farewelly/tests/realtime/test-summary.md
Memory Key: swarm-testing-1750494292308/realtime/tests
```

### Sample Report Structure
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "summary": {
    "totalTests": 150,
    "passedTests": 142,
    "failedTests": 8,
    "successRate": 94.7
  },
  "performanceMetrics": {
    "averageResponseTime": 245,
    "errorRate": 2.1,
    "memoryUsage": 87.3
  },
  "recommendations": [
    "Optimize WebSocket reconnection logic",
    "Review notification delivery failures"
  ]
}
```

## Performance Benchmarks

### Expected Performance Targets
- **WebSocket Connection**: < 500ms establishment time
- **Message Delivery**: < 200ms end-to-end latency
- **Presence Updates**: < 100ms processing time
- **Document Operations**: < 300ms for simple edits
- **Notification Delivery**: < 1000ms for in-app notifications

### Load Testing Scenarios
- **Concurrent Users**: Up to 100 simultaneous connections
- **Message Rate**: 1000 messages/minute per user
- **Document Collaboration**: 10 users editing simultaneously
- **Notification Volume**: 10,000 notifications/hour

## Network Simulation

### Tested Network Conditions
- **Latency**: 0ms to 2000ms
- **Bandwidth**: Various throttling scenarios
- **Packet Loss**: 0% to 30%
- **Connection Drops**: Simulated network failures
- **Jitter**: Variable network timing

### Resilience Testing
- Connection loss during active use
- Server restarts and failover
- High latency environments
- Bandwidth-constrained networks
- DNS resolution failures

## Debugging and Troubleshooting

### Debug Mode
```bash
# Run with debug logging
DEBUG=realtime:* npm run test:realtime:all

# Verbose test output
npm run test:realtime:all -- --verbose

# Single test with debugging
npm run test:realtime:websocket -- --testNamePattern="should handle reconnection"
```

### Common Issues
1. **WebSocket Connection Failures**
   - Check firewall and proxy settings
   - Verify WebSocket server availability
   - Review connection timeout settings

2. **Message Ordering Issues**
   - Examine timestamp synchronization
   - Check operational transform logic
   - Review message queuing behavior

3. **Performance Degradation**
   - Monitor memory usage patterns
   - Check for event listener leaks
   - Review connection pool management

### Log Analysis
Tests generate detailed logs for:
- Connection state changes
- Message flow tracing
- Error conditions and recovery
- Performance metrics collection

## Contributing

### Adding New Tests
1. Create test file in appropriate category
2. Follow existing naming conventions
3. Include performance and error scenarios
4. Update test runner configuration
5. Add documentation for new test cases

### Test Standards
- **Coverage**: Minimum 90% code coverage
- **Performance**: All tests complete within 30 seconds
- **Reliability**: Less than 1% flaky test rate
- **Documentation**: Clear test descriptions and expectations

### Code Quality
- Use TypeScript for all test files
- Follow existing code style and patterns
- Include proper error handling
- Add meaningful assertions and expectations

## Integration with CI/CD

### GitHub Actions
```yaml
name: Real-Time Feature Tests
on: [push, pull_request]
jobs:
  realtime-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run real-time tests
        run: npm run test:realtime:all
      - name: Upload test reports
        uses: actions/upload-artifact@v2
        with:
          name: test-reports
          path: tests/realtime/test-report.json
```

### Monitoring and Alerts
- Automated test execution on code changes
- Performance regression detection
- Slack/email notifications for test failures
- Integration with error tracking services

## Security Considerations

### Test Data Isolation
- Use isolated test databases
- Mock external API connections
- Sanitize test user data
- Avoid production credentials

### Network Security Testing
- WebSocket connection encryption
- Authentication token validation
- Rate limiting enforcement
- CORS policy verification

## Maintenance

### Regular Tasks
- Update test dependencies monthly
- Review and update performance baselines
- Clean up test data and artifacts
- Monitor test execution times

### Scheduled Reviews
- Quarterly test coverage analysis
- Annual performance benchmark updates
- Regular test reliability assessment
- Documentation updates and improvements

This comprehensive testing suite ensures that Farewelly's real-time features are robust, performant, and reliable under various conditions and user loads.