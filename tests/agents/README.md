# Farewelly Agent Testing Suite

Comprehensive test suite for LangGraph agent workflows in the Farewelly funeral planning system.

## Overview

This test suite provides comprehensive testing for all agent components including:

- **Workflow Tests**: Complete funeral planning workflow state machine testing
- **Cultural Sensitivity Tests**: Islamic, Jewish, Hindu, Dutch cultural requirements
- **Human-in-Loop Tests**: Interrupt functionality, approval workflows, escalation
- **State Management Tests**: Persistence, checkpointing, recovery, rollback
- **Integration Tests**: Multi-agent coordination, document collection, timeline compliance

## Test Structure

```
tests/agents/
├── workflow/                 # Workflow state machine tests
│   └── funeral-orchestrator.test.ts
├── cultural/                 # Cultural sensitivity tests
│   └── cultural-requirements.test.ts
├── human-loop/              # Human-in-loop functionality tests
│   └── human-in-loop.test.ts
├── state-management/        # Checkpointing and state persistence tests
│   └── checkpointing-system.test.ts
├── integration/             # Multi-agent coordination tests
│   └── multi-agent-coordination.test.ts
├── mocks/                   # Mock utilities and test helpers
│   └── test-helpers.ts
├── utils/                   # Test configuration and setup
│   └── test-setup.ts
├── jest.config.js          # Jest configuration
└── README.md               # This file
```

## Running Tests

### Prerequisites

Ensure you have the required dependencies installed:

```bash
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev jest-html-reporters jest-junit
```

### Run All Tests

```bash
# Run all agent tests
npm run test:agents

# Run with coverage
npm run test:agents -- --coverage

# Run in watch mode
npm run test:agents -- --watch
```

### Run Specific Test Suites

```bash
# Workflow tests only
npm test -- tests/agents/workflow/

# Cultural sensitivity tests only
npm test -- tests/agents/cultural/

# Human-in-loop tests only
npm test -- tests/agents/human-loop/

# State management tests only
npm test -- tests/agents/state-management/

# Integration tests only
npm test -- tests/agents/integration/
```

### Run Specific Test Files

```bash
# Run specific test file
npm test -- tests/agents/workflow/funeral-orchestrator.test.ts

# Run specific test pattern
npm test -- --testNamePattern="Christian funeral"

# Run tests with specific tag
npm test -- --testNamePattern="Islamic"
```

## Test Categories

### 1. Workflow Tests (`workflow/`)

Tests the complete funeral planning workflow state machine:

- **9 Planning Stages**: Initial → Requirements → Cultural → Documents → Venue → Service → Approval → Coordination → Completion
- **State Transitions**: Validates logical progression between stages
- **Error Handling**: Tests error states and recovery mechanisms
- **Performance**: Load testing with large datasets
- **Data Integrity**: Ensures state consistency across transitions

Key test scenarios:
- Complete workflow progression for different cultural backgrounds
- Document collection workflow with verification
- Approval process with multiple stakeholders
- Error scenarios and recovery paths
- Performance under load

### 2. Cultural Sensitivity Tests (`cultural/`)

Tests cultural and religious requirement handling:

- **Islamic Requirements**: Janazah prayers, Qibla direction, burial timing, halal considerations
- **Jewish Requirements**: Orthodox/Conservative traditions, Tahara, Kaddish, kosher requirements
- **Hindu Requirements**: Cremation preferences, Pandit ceremonies, vegetarian requirements
- **Dutch Requirements**: Protestant traditions, simplicity preferences, community customs
- **Interfaith Scenarios**: Conflict resolution, accommodation planning, advisor consultation

Key test scenarios:
- Single culture/religion assessment
- Multi-cultural family requirements
- Conflicting religious requirements
- Advisor consultation triggers
- Sensitivity level determination

### 3. Human-in-Loop Tests (`human-loop/`)

Tests interrupt functionality and approval workflows:

- **Decision Types**: Service details, cost approval, cultural sensitivity, venue selection
- **Priority Assessment**: Immediate, high, medium, low priority handling
- **Interrupt Mechanism**: Workflow interruption for human input
- **Approval Workflows**: Single and multi-approver scenarios
- **Escalation Process**: Progressive escalation levels and executive decisions

Key test scenarios:
- Service detail approval workflows
- Cost approval with financial considerations
- Cultural sensitivity decisions
- Family conflict resolution
- Emergency decision handling
- Escalation through multiple levels

### 4. State Management Tests (`state-management/`)

Tests persistence, checkpointing, and recovery:

- **Checkpoint Storage**: Redis caching + PostgreSQL persistence
- **Data Compression**: Optional compression for large states
- **Recovery Mechanisms**: Graceful recovery from failures
- **Performance**: High-volume checkpoint operations
- **Data Integrity**: Consistency across storage systems

Key test scenarios:
- Checkpoint save/retrieve operations
- Cache vs database fallback
- Concurrent checkpoint operations
- Error recovery and data consistency
- Performance under load
- Cleanup and maintenance operations

### 5. Integration Tests (`integration/`)

Tests multi-agent coordination and end-to-end scenarios:

- **Complete Workflows**: End-to-end funeral planning scenarios
- **Agent Coordination**: Orchestrator, cultural, human-loop, document collection
- **Document Collection**: Multi-stage document verification and approval
- **Timeline Management**: Cultural timing requirements and deadline compliance
- **Error Coordination**: Cross-agent error handling and recovery

Key test scenarios:
- Complete Christian funeral planning
- Islamic funeral with urgent requirements
- Interfaith ceremony coordination
- Document collection workflows
- Timeline compliance monitoring
- Multi-agent error recovery

## Test Utilities

### Mock Helpers (`mocks/test-helpers.ts`)

Comprehensive utilities for test data generation and validation:

```typescript
// Family data generators
const christianFamily = MockFamilyDataGenerator.generateChristianFamily();
const islamicFamily = MockFamilyDataGenerator.generateIslamicFamily();
const jewishFamily = MockFamilyDataGenerator.generateJewishFamily();

// State generators
const initialState = MockStateGenerator.generateInitialWorkflowState(familyData);
const docState = MockStateGenerator.generateDocumentCollectionState(familyId);

// Performance testing
const { result, executionTime } = await PerformanceTestUtils.measureExecutionTime(operation);

// Error simulation
await ErrorSimulationUtils.simulateIntermittentFailure(operation, 0.3, 3);
```

### Configuration Utilities

```typescript
// Basic test configuration
const config = MockConfigGenerator.generateBasicConfig();

// Cultural-specific configuration
const culturalConfig = MockConfigGenerator.generateCulturalConfig('dutch', 'christian');

// Checkpoint configuration
const checkpointConfig = MockConfigGenerator.generateCheckpointConfig({
  threadId: 'test_thread',
  namespace: 'test_namespace'
});
```

### Validation Utilities

```typescript
// Validate workflow state
TestValidationUtils.validateWorkflowState(state, 'requirements_gathering');

// Validate cultural assessment
TestValidationUtils.validateCulturalAssessment(assessment);

// Validate decision structure
TestValidationUtils.validateDecision(decision);
```

## Test Data

### Family Data Templates

The test suite includes predefined family data templates for different cultural backgrounds:

- **Christian Family**: Dutch Protestant with traditional preferences
- **Islamic Family**: Sunni with urgent burial requirements and Qibla direction
- **Jewish Family**: Orthodox with kosher requirements and traditional customs
- **Hindu Family**: Traditional with cremation preferences and vegetarian requirements
- **Dutch Family**: Reformed Protestant with simplicity preferences
- **Interfaith Family**: Mixed Christian/Jewish with accommodation needs

### Cultural Scenarios

Each cultural template includes:
- Primary and secondary cultural backgrounds
- Religious denominations and specific requirements
- Timeline constraints and urgency levels
- Special accommodations and restrictions
- Family contact information and preferences

## Performance Expectations

### Execution Time Targets

- **Individual workflow stage**: < 1 second
- **Complete cultural assessment**: < 2 seconds
- **Human decision processing**: < 500ms
- **Checkpoint operations**: < 200ms
- **End-to-end workflow**: < 10 seconds

### Load Testing Scenarios

- **Concurrent workflows**: 10+ families simultaneously
- **Document processing**: 50+ documents per workflow
- **Checkpoint volume**: 1000+ checkpoints per test
- **Cultural assessment**: 100+ traditions and rites

### Memory Usage

- **Base memory usage**: Monitor for memory leaks
- **Large dataset handling**: Up to 50MB state data
- **Concurrent operations**: Memory efficiency under load

## Coverage Requirements

### Minimum Coverage Thresholds

- **Workflow Tests**: 90% line/branch coverage
- **Cultural Tests**: 85% line/branch coverage
- **Human-Loop Tests**: 85% line/branch coverage
- **State Management**: 80% line/branch coverage
- **Integration Tests**: 75% line/branch coverage

### Coverage Areas

- All 9 workflow stages and transitions
- All cultural traditions and religious rites
- All decision types and priorities
- All checkpoint operations
- All error scenarios and recovery paths

## Continuous Integration

### GitHub Actions Integration

```yaml
name: Agent Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:agents -- --coverage
      - uses: codecov/codecov-action@v1
```

### Pre-commit Hooks

```bash
# Run tests before commit
npm run test:agents

# Run only affected tests
npm run test:agents -- --changedSince=HEAD~1
```

## Debugging Tests

### Enable Verbose Logging

```bash
# Run with detailed output
npm test -- --verbose

# Run with console output
npm test -- --silent=false
```

### Debug Specific Scenarios

```bash
# Debug workflow progression
DEBUG=workflow npm test -- workflow/

# Debug cultural assessment
DEBUG=cultural npm test -- cultural/

# Debug human decisions
DEBUG=human-loop npm test -- human-loop/
```

### Common Issues

1. **Timeout Errors**: Increase timeout in jest.config.js
2. **Memory Issues**: Run with --detectOpenHandles
3. **Async Issues**: Ensure proper await/Promise handling
4. **Mock Issues**: Clear mocks between tests

## Contributing

### Adding New Tests

1. Follow the existing test structure and naming conventions
2. Use the provided mock utilities and test helpers
3. Include performance and error scenario testing
4. Maintain minimum coverage requirements
5. Add comprehensive documentation

### Test Naming Conventions

```typescript
describe('AgentName', () => {
  describe('Feature Category', () => {
    test('should handle specific scenario with expected outcome', async () => {
      // Test implementation
    });
  });
});
```

### Mock Guidelines

- Use provided mock utilities when possible
- Create realistic test data that matches production scenarios
- Mock external dependencies and network calls
- Simulate both success and failure scenarios

## Reports

Test execution generates several report formats:

- **HTML Report**: `tests/agents/reports/agent-test-report.html`
- **Coverage Report**: `tests/agents/coverage/lcov-report/index.html`
- **JUnit XML**: `tests/agents/reports/agent-test-results.xml`
- **JSON Results**: `tests/agents/reports/test-results.json`

## Support

For questions or issues with the test suite:

1. Check this README for common scenarios
2. Review existing test implementations for examples
3. Check the agent implementation documentation
4. Contact the development team for agent-specific questions

---

**Last Updated**: June 2024  
**Test Suite Version**: 1.0.0  
**Compatible with**: LangGraph 0.1.x, Jest 29.x