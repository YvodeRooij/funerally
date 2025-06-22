# Farewelly Database Testing Suite

A comprehensive database testing framework for the Dutch funeral management system, ensuring data integrity, security, performance, and GDPR compliance.

## 📋 Overview

This testing suite provides exhaustive validation of the Farewelly database system, covering:

- **Schema Validation**: Table structures, constraints, relationships, and indexes
- **Migration Integrity**: Schema changes, rollbacks, and data preservation  
- **Performance Benchmarking**: Query optimization, index usage, and connection pooling
- **Security Testing**: Row-level security policies, access controls, and data isolation
- **GDPR Compliance**: Data protection, retention policies, and privacy requirements
- **Dutch Legal Requirements**: Specific funeral industry regulations and data handling

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Test database access
- Environment variables configured

### Installation

```bash
# Install dependencies
npm install

# Set up test environment
cp .env.example .env.test
# Configure TEST_DB_* variables in .env.test
```

### Running Tests

```bash
# Run all database tests
npm run test:database

# Run with coverage
npm run test:database:coverage

# Run specific test suite
npm run test:database -- schema-validation

# Run with detailed output
npm run test:database -- --verbose

# Run interactively
npm run test:database:ui
```

### Advanced Usage

```bash
# Run tests in parallel
node test-runner.ts --parallel

# Generate coverage report
node test-runner.ts --coverage --verbose

# Run specific suites only
node test-runner.ts "Schema Validation" "GDPR Compliance"
```

## 📁 Test Structure

```
tests/database/
├── README.md                          # This documentation
├── vitest.config.ts                   # Test configuration
├── test-runner.ts                      # Comprehensive test runner
├── setup/
│   └── setup.ts                       # Database setup and utilities
├── fixtures/
│   └── dutch-funeral-mock-data.ts     # Realistic Dutch funeral test data
├── unit/
│   └── schema-validation.test.ts      # Schema integrity tests
├── migration/
│   └── migration-integrity.test.ts    # Migration and rollback tests
├── performance/
│   └── query-performance.test.ts      # Performance benchmarks
├── security/
│   └── row-level-security.test.ts     # Access control tests
├── compliance/
│   └── gdpr-compliance.test.ts        # Data protection tests
└── reports/                           # Generated test reports
```

## 🧪 Test Categories

### 1. Schema Validation Tests

**File**: `unit/schema-validation.test.ts`

Validates database schema integrity:

- ✅ All required tables exist
- ✅ Primary keys are UUIDs
- ✅ Foreign key relationships are correct
- ✅ Check constraints enforce business rules
- ✅ Unique constraints prevent duplicates
- ✅ Default values and timestamps work
- ✅ Indexes exist on critical columns
- ✅ Data types are appropriate for fields

**Example Test**:
```typescript
it('should enforce valid Dutch BSN format', async () => {
  await expect(
    executeQuery(`
      INSERT INTO deceased_persons (bsn, ...)
      VALUES ('invalid', ...)
    `)
  ).rejects.toThrow(); // BSN must be 9 digits
});
```

### 2. Migration Integrity Tests

**File**: `migration/migration-integrity.test.ts`

Ensures safe database migrations:

- ✅ Migrations apply in correct sequence
- ✅ Rollbacks restore previous state
- ✅ Data preservation during schema changes
- ✅ Index creation doesn't block access
- ✅ Constraint addition handles existing data
- ✅ Function and trigger behavior maintained

**Example Test**:
```typescript
it('should preserve data during schema changes', async () => {
  const beforeData = await getTestData();
  await applyMigration('add_column_migration.sql');
  const afterData = await getTestData();
  
  expect(afterData.originalFields).toEqual(beforeData.originalFields);
});
```

### 3. Performance Benchmarks

**File**: `performance/query-performance.test.ts`

Benchmarks query performance:

- ✅ Common queries execute under time limits
- ✅ Indexes are used efficiently
- ✅ Complex joins perform adequately
- ✅ Bulk operations scale properly
- ✅ Connection pooling works correctly
- ✅ Concurrent operations don't deadlock

**Performance Targets**:
- Simple lookups: < 20ms
- Complex joins: < 100ms
- Bulk inserts (100 records): < 500ms
- Full-text search: < 40ms

**Example Test**:
```typescript
it('should execute funeral request lookup under 20ms', async () => {
  const startTime = Date.now();
  await executeQuery(`
    SELECT fr.*, dp.full_name 
    FROM funeral_requests fr
    JOIN deceased_persons dp ON fr.deceased_id = dp.id
    WHERE fr.primary_contact_id = $1
  `, [userId]);
  const duration = Date.now() - startTime;
  
  expect(duration).toBeLessThan(20);
});
```

### 4. Security & Access Control

**File**: `security/row-level-security.test.ts`

Tests Row-Level Security (RLS) policies:

- ✅ Users only see their own data
- ✅ Service providers access assigned cases only
- ✅ Venue owners control their venues
- ✅ Admins have appropriate elevated access
- ✅ Document sharing works securely
- ✅ Audit logs track all access

**User Types & Access**:
- **Family**: Own funeral requests, deceased persons, documents
- **Directors**: Assigned funeral cases, related documents, family contacts
- **Venue Owners**: Own venues, bookings for their venues
- **Admins**: System-wide access for management

**Example Test**:
```typescript
it('should prevent family from seeing other families data', async () => {
  await setUserContext(client, familyUserId, 'family');
  
  const result = await client.query(`
    SELECT * FROM funeral_requests 
    WHERE primary_contact_id = $1
  `, [otherFamilyUserId]);
  
  expect(result.rows.length).toBe(0); // Should see nothing
});
```

### 5. GDPR Compliance

**File**: `compliance/gdpr-compliance.test.ts`

Validates data protection compliance:

- ✅ Data retention periods enforced
- ✅ Consent tracking with evidence
- ✅ Data subject rights (access, erasure, portability)
- ✅ Data breach notification procedures
- ✅ Processing activity records (ROPA)
- ✅ Legal hold prevents deletion
- ✅ Audit trail integrity maintained

**GDPR Features**:
- Automatic retention date calculation
- Consent withdrawal tracking
- Data erasure with business exceptions
- Breach notification timelines (72 hours)
- Data portability in machine-readable format

**Example Test**:
```typescript
it('should handle data erasure request correctly', async () => {
  await executeQuery(`
    INSERT INTO gdpr_compliance_log (
      data_subject_id, activity_type, data_deleted
    ) VALUES ($1, 'data_erasure_request', true)
  `, [userId]);
  
  // Verify personal data anonymized but legal records retained
  const userData = await getUserData(userId);
  expect(userData.personalData).toBeAnonymized();
  expect(userData.legalRecords).toExist();
});
```

## 🇳🇱 Dutch Funeral Industry Compliance

### Legal Requirements Tested

1. **Wet op de Lijkbezorging (Burial Act)**
   - 6 working day funeral deadline enforced
   - Required documentation tracking
   - Municipal permit validation

2. **AVG/GDPR Implementation**
   - Dutch data protection authority requirements
   - Deceased persons data handling (not GDPR subject)
   - Living family member data protection

3. **Business Compliance**
   - KvK (Chamber of Commerce) number validation
   - BGNU membership tracking
   - Insurance coverage verification

### Cultural Considerations

- **Multi-language support**: Dutch, Turkish, Arabic, English
- **Religious requirements**: Islamic, Jewish, Hindu, Christian ceremonies
- **Cultural practices**: Specific burial/cremation customs
- **Family structures**: Extended family notification systems

## 🔧 Test Data & Fixtures

### Realistic Dutch Test Data

The test suite includes comprehensive Dutch funeral scenario data:

```typescript
// Examples of generated test data
const dutchNames = ['Jan de Jong', 'Maria van der Berg', 'Ahmed al-Mahmoud'];
const dutchCities = ['Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht'];
const services = ['Traditionele uitvaart', 'Islamitische begrafenis', 'Natuurbegraving'];
```

### Mock Data Features

- **Realistic BSN numbers**: Valid format but fake data
- **Dutch addresses**: Real cities, fake postal codes  
- **Cultural diversity**: Reflects Netherlands demographics
- **Business data**: KvK numbers, venue types, service specializations
- **Timeline accuracy**: Respects Dutch funeral timing requirements

### Creating Test Scenarios

```typescript
// Generate complete funeral scenario
const scenario = await createFullTestScenario();
// Returns: users, deceased persons, venues, requests, bookings

// Generate specific data types
const families = generateMockUserProfiles(10, 'family');
const venues = generateMockVenues(ownerIds, 8);
const deceased = generateMockDeceasedPersons(5);
```

## 📊 Test Reporting

### Report Generation

Tests generate comprehensive reports in multiple formats:

- **JSON**: Machine-readable detailed results
- **HTML**: Human-readable coverage reports  
- **JUnit XML**: CI/CD integration
- **Console**: Real-time progress and summary

### Memory Storage Integration

Results are stored in the Memory system for swarm coordination:

```typescript
// Stored at: swarm-testing-1750494292308/database/tests
{
  testType: 'database',
  success: true,
  dutchFuneralCompliance: {
    gdprCompliant: true,
    securityPolicies: true, 
    dataRetention: true,
    auditTrail: true
  },
  recommendations: [...],
  performance: { ... }
}
```

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
name: Database Tests
on: [push, pull_request]

jobs:
  database-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: farewelly_test
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run test:database:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./tests/database/coverage/lcov.info
```

## 🛡️ Security Considerations

### Test Environment Isolation

- **Separate test database**: Never run against production
- **Data anonymization**: All test data is synthetic
- **Credential management**: Environment variables only
- **Network isolation**: Local connections preferred

### Sensitive Data Handling

- **No real BSN numbers**: Generated fake but valid format
- **Synthetic personal data**: Names, addresses are fictional
- **Encrypted test content**: Document vault tests use dummy encryption
- **Audit log safety**: Test audit entries clearly marked

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failures**
   ```bash
   Error: Connection refused
   ```
   - Check TEST_DB_* environment variables
   - Ensure PostgreSQL is running
   - Verify test database exists

2. **Schema Load Failures**
   ```bash
   Error: relation does not exist
   ```
   - Run schema migrations first
   - Check file paths in setup.ts
   - Verify user has CREATE permissions

3. **Performance Test Failures**
   ```bash
   Error: Query exceeded time limit
   ```
   - Check database server resources
   - Verify indexes are created
   - Review query execution plans

4. **RLS Policy Failures**
   ```bash
   Error: RLS policy violation
   ```
   - Check JWT claims setup in tests
   - Verify policy functions exist
   - Review user context configuration

### Debug Mode

```bash
# Enable verbose logging
DEBUG=true npm run test:database

# Run single test file
npx vitest run tests/database/unit/schema-validation.test.ts --reporter=verbose

# Check database connection
node -e "require('./setup/setup.js').executeQuery('SELECT NOW()')"
```

### Log Analysis

Check test logs for patterns:
- **Connection pool exhaustion**: Increase pool size
- **Lock timeouts**: Review concurrent test design
- **Memory usage**: Monitor for test data cleanup
- **Query performance**: Use EXPLAIN ANALYZE for slow queries

## 📚 Additional Resources

### Documentation Links

- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Dutch GDPR Implementation (AVG)](https://autoriteitpersoonsgegevens.nl/)
- [Vitest Documentation](https://vitest.dev/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

### Development Team Resources

- **Database Schema**: `/db/schema/` directory
- **Migration Scripts**: `/db/migrations/` directory  
- **RLS Policies**: `/db/policies/row_level_security.sql`
- **Performance Indexes**: `/db/indexes/performance_indexes.sql`

### Support & Maintenance

For issues with the database testing suite:

1. **Check this documentation** for common solutions
2. **Review test logs** for specific error messages
3. **Validate environment setup** using the debug commands
4. **Contact the platform team** for infrastructure issues

---

## 🎯 Test Coverage Goals

- **Schema Coverage**: 100% of tables, constraints, indexes
- **RLS Coverage**: 100% of policies and user types  
- **Performance Coverage**: All critical query paths
- **GDPR Coverage**: All data subject rights and obligations
- **Security Coverage**: All access control scenarios

The goal is maintaining **>95% test coverage** across all database functionality while ensuring **<100ms average response time** for common operations and **100% GDPR compliance** for the Dutch funeral industry.

---

*This testing suite ensures the Farewelly database system meets the highest standards for security, performance, and regulatory compliance in the Dutch funeral services market.*