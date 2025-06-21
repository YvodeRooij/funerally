# Farewelly Database Implementation

## Overview

The Farewelly database schema implements a comprehensive funeral planning system for the Netherlands, featuring:

- **Zero-knowledge encrypted document storage** for sensitive family documents
- **GDPR-compliant audit logging** with comprehensive privacy protection
- **Row Level Security (RLS)** for fine-grained access control
- **Dutch regulatory compliance** including *Wet op de Lijkbezorging* requirements
- **Three-sided marketplace** connecting families, funeral directors, and venues

## Architecture

### Core Entities

1. **deceased_persons** - Information about deceased individuals (not subject to GDPR)
2. **funeral_requests** - Central coordination entity for funeral planning
3. **venues** - Locations where funeral services can be held
4. **bookings** - Venue reservations for funeral services
5. **service_providers** - Extended information for funeral directors
6. **communications** - All communications between parties
7. **payments** - Payment processing and financial assistance tracking

### Document Storage System

- **Zero-knowledge encryption** - Documents encrypted client-side with user-controlled keys
- **Granular sharing permissions** - Time-limited, purpose-specific document access
- **Comprehensive audit trails** - Every document access logged for compliance
- **Automatic retention management** - Policy-based document lifecycle
- **Secure sharing tokens** - Temporary access for external parties

### Audit & Compliance

- **Complete audit logging** - All system actions tracked with full context
- **GDPR compliance tracking** - Dedicated tables for consent, data requests, breaches
- **Dutch regulatory compliance** - Specific tracking for funeral service regulations
- **Security monitoring** - Failed login attempts, suspicious activities
- **Data breach management** - Incident response and notification tracking

## Deployment

### Prerequisites

- PostgreSQL 13+ (Supabase compatible)
- psql client
- Required environment variables:
  - `SUPABASE_DB_HOST`
  - `SUPABASE_DB_PORT` 
  - `SUPABASE_DB_NAME`
  - `SUPABASE_DB_USER`
  - `SUPABASE_DB_PASSWORD`

### Quick Start

```bash
# Deploy the complete schema
./deploy.sh deploy

# Check migration status
./deploy.sh status

# Validate schema integrity
./deploy.sh validate

# Create backup
./deploy.sh backup
```

### Migration Commands

```bash
# Apply all pending migrations
./deploy.sh deploy

# Show current migration status
./deploy.sh status

# Rollback a specific migration
./deploy.sh rollback 001

# Validate database schema
./deploy.sh validate
```

## Security Features

### Row Level Security (RLS)

All tables implement comprehensive RLS policies:

- **Family members** can only access their own data
- **Service providers** can access assigned cases only
- **Venue owners** can manage their properties and bookings
- **Admins** have system-wide access with full audit trails

### Document Security

- **Client-side encryption** before upload
- **Zero-knowledge architecture** - server cannot decrypt content
- **Access token system** for secure external sharing
- **Automatic expiration** of sharing permissions
- **Legal hold capabilities** for regulatory requirements

### Audit & Compliance

- **Every action logged** with full context and user information
- **GDPR rights management** - automated handling of data subject requests
- **Breach detection and response** - automated notifications and tracking
- **Regulatory compliance monitoring** - scheduled reviews and assessments

## Performance Optimization

### Indexing Strategy

- **Composite indexes** for common query patterns
- **Partial indexes** for filtered queries
- **GIN indexes** for JSONB and array columns
- **Geospatial indexes** for venue location searches
- **Full-text search indexes** for content discovery

### Query Optimization

- **Connection pooling** recommended for production
- **Read replicas** for reporting and analytics
- **Materialized views** for complex aggregations
- **Background job processing** for heavy operations

## Data Protection & Privacy

### GDPR Compliance

- **Lawful basis tracking** for all processing activities
- **Consent management** with granular controls
- **Data subject rights** - automated request handling
- **Privacy by design** - minimal data collection
- **Data retention policies** - automatic deletion after retention periods

### Dutch Regulatory Compliance

- **Funeral service law compliance** - *Wet op de Lijkbezorging*
- **Municipal integration** - permit and registration tracking
- **Timeline enforcement** - 6-day funeral deadline monitoring
- **Document requirements** - mandatory certificate tracking

## Monitoring & Maintenance

### Health Checks

```sql
-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT * FROM analyze_index_usage() ORDER BY usage_ratio DESC;

-- Identify unused indexes
SELECT * FROM identify_unused_indexes();
```

### Cleanup Tasks

```sql
-- Clean up expired audit logs
SELECT cleanup_expired_audit_logs();

-- Expire old sharing tokens
SELECT expire_sharing_tokens();

-- Mark documents for deletion
SELECT mark_documents_for_deletion();
```

## Development Guidelines

### Adding New Tables

1. Create table in appropriate schema file
2. Add RLS policies in `policies/row_level_security.sql`
3. Add performance indexes in `indexes/performance_indexes.sql`
4. Update migration script
5. Add validation to deployment script

### Security Considerations

- **Never store passwords** in plaintext
- **Always use parameterized queries** to prevent SQL injection
- **Implement audit logging** for all sensitive operations
- **Follow principle of least privilege** for database access
- **Regularly review and update** RLS policies

### Testing

```bash
# Test RLS policies
SELECT * FROM test_rls_policies();

# Validate schema after changes
./deploy.sh validate

# Check migration integrity
./deploy.sh status
```

## Troubleshooting

### Common Issues

1. **RLS blocking queries** - Check user context and policy conditions
2. **Performance issues** - Review index usage and query plans
3. **Migration failures** - Check dependencies and rollback if needed
4. **Connection issues** - Verify environment variables and network access

### Emergency Procedures

```bash
# Create immediate backup
./deploy.sh backup

# Rollback problematic migration
./deploy.sh rollback [VERSION]

# Check system health
./deploy.sh validate
```

## File Structure

```
db/
├── schema/                    # Database schema definitions
│   ├── 01_core_entities.sql  # Core business entities
│   ├── 02_document_storage.sql # Document vault with encryption
│   └── 03_audit_logging.sql  # Compliance and audit tables
├── indexes/                   # Performance optimization
│   └── performance_indexes.sql
├── policies/                  # Security and access control
│   └── row_level_security.sql
├── migrations/               # Version control and deployment
│   ├── 001_initial_schema.sql
│   └── rollback_001.sql
├── functions/               # Database functions and procedures
├── deploy.sh               # Deployment automation script
└── README.md              # This documentation
```

## Support

For technical support or questions about the database implementation:

1. Review this documentation
2. Check the audit logs for error details
3. Validate schema integrity with `./deploy.sh validate`
4. Create issue with full error context and logs

---

**Note**: This database schema is designed specifically for the Dutch funeral services market and includes regulatory compliance for Dutch law. Adaptation for other jurisdictions will require review of legal requirements and compliance tables.