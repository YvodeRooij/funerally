#!/bin/bash

# =============================================================================
# Farewelly Database Deployment Script
# This script manages database schema deployment and migrations
# =============================================================================

set -e  # Exit on any error

# Configuration
DB_HOST="${SUPABASE_DB_HOST:-localhost}"
DB_PORT="${SUPABASE_DB_PORT:-5432}"
DB_NAME="${SUPABASE_DB_NAME:-postgres}"
DB_USER="${SUPABASE_DB_USER:-postgres}" 
DB_PASSWORD="${SUPABASE_DB_PASSWORD}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v psql &> /dev/null; then
        log_error "psql could not be found. Please install PostgreSQL client."
        exit 1
    fi
    
    if [ -z "$DB_PASSWORD" ]; then
        log_error "DB_PASSWORD environment variable is required."
        exit 1
    fi
    
    log_success "Dependencies check passed"
}

# Test database connection
test_connection() {
    log_info "Testing database connection..."
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
        log_success "Database connection successful"
    else
        log_error "Failed to connect to database"
        exit 1
    fi
}

# Create schema migrations table if it doesn't exist
init_migrations() {
    log_info "Initializing migration tracking..."
    
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rolled_back_at TIMESTAMP WITH TIME ZONE,
    checksum VARCHAR(64)
);
EOF
    
    log_success "Migration tracking initialized"
}

# Check if migration has been applied
migration_applied() {
    local version=$1
    
    result=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM schema_migrations WHERE version = '$version' AND rolled_back_at IS NULL;" 2>/dev/null | xargs)
    
    [ "$result" -gt 0 ]
}

# Apply migration
apply_migration() {
    local migration_file=$1
    local version=$2
    
    log_info "Applying migration $version..."
    
    if migration_applied "$version"; then
        log_warning "Migration $version already applied, skipping"
        return 0
    fi
    
    # Calculate checksum
    checksum=$(sha256sum "$migration_file" | cut -d' ' -f1)
    
    # Apply migration
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"; then
        # Update migration record with checksum
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
UPDATE schema_migrations SET checksum = '$checksum' WHERE version = '$version';
EOF
        log_success "Migration $version applied successfully"
    else
        log_error "Failed to apply migration $version"
        exit 1
    fi
}

# Rollback migration
rollback_migration() {
    local rollback_file=$1
    local version=$2
    
    log_info "Rolling back migration $version..."
    
    if ! migration_applied "$version"; then
        log_warning "Migration $version not applied, nothing to rollback"
        return 0
    fi
    
    if [ -f "$rollback_file" ]; then
        if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$rollback_file"; then
            log_success "Migration $version rolled back successfully"
        else
            log_error "Failed to rollback migration $version"
            exit 1
        fi
    else
        log_error "Rollback file $rollback_file not found"
        exit 1
    fi
}

# Show migration status
show_status() {
    log_info "Migration Status:"
    echo
    
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
SELECT 
    version,
    description,
    applied_at,
    CASE 
        WHEN rolled_back_at IS NOT NULL THEN 'ROLLED BACK'
        ELSE 'APPLIED'
    END as status
FROM schema_migrations 
ORDER BY version;
EOF
}

# Validate database schema
validate_schema() {
    log_info "Validating database schema..."
    
    # Check for essential tables
    local essential_tables=(
        "user_profiles"
        "deceased_persons" 
        "funeral_requests"
        "venues"
        "bookings"
        "document_vault"
        "audit_log"
    )
    
    for table in "${essential_tables[@]}"; do
        count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table';" | xargs)
        
        if [ "$count" -eq 1 ]; then
            log_success "✓ Table $table exists"
        else
            log_error "✗ Table $table missing"
            return 1
        fi
    done
    
    # Check RLS is enabled
    rls_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM pg_tables pt JOIN pg_class pc ON pt.tablename = pc.relname WHERE pt.schemaname = 'public' AND pc.relrowsecurity = true;" | xargs)
    
    if [ "$rls_count" -gt 0 ]; then
        log_success "✓ Row Level Security enabled on $rls_count tables"
    else
        log_warning "⚠ No tables have Row Level Security enabled"
    fi
    
    log_success "Schema validation completed"
}

# Backup database
backup_database() {
    local backup_file="$SCRIPT_DIR/backups/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    log_info "Creating database backup..."
    
    mkdir -p "$SCRIPT_DIR/backups"
    
    if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --schema-only > "$backup_file"; then
        log_success "Database backed up to $backup_file"
    else
        log_error "Failed to create database backup"
        exit 1
    fi
}

# Main deployment function
deploy() {
    log_info "Starting Farewelly database deployment..."
    
    check_dependencies
    test_connection
    init_migrations
    
    # Apply migrations in order
    apply_migration "$SCRIPT_DIR/migrations/001_initial_schema.sql" "001"
    
    validate_schema
    show_status
    
    log_success "Database deployment completed successfully!"
}

# Help function
show_help() {
    echo "Farewelly Database Deployment Script"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  deploy          Deploy all pending migrations"
    echo "  status          Show migration status"
    echo "  validate        Validate database schema"
    echo "  backup          Create database backup"
    echo "  rollback [VER]  Rollback specific migration version"
    echo "  help            Show this help message"
    echo
    echo "Environment Variables:"
    echo "  SUPABASE_DB_HOST      Database host (default: localhost)"
    echo "  SUPABASE_DB_PORT      Database port (default: 5432)"
    echo "  SUPABASE_DB_NAME      Database name (default: postgres)"
    echo "  SUPABASE_DB_USER      Database user (default: postgres)"
    echo "  SUPABASE_DB_PASSWORD  Database password (required)"
    echo
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 status"
    echo "  $0 rollback 001"
    echo "  $0 backup"
}

# Main script logic
case "${1:-}" in
    "deploy")
        deploy
        ;;
    "status")
        check_dependencies
        test_connection
        init_migrations
        show_status
        ;;
    "validate")
        check_dependencies
        test_connection
        validate_schema
        ;;
    "backup")
        check_dependencies
        test_connection
        backup_database
        ;;
    "rollback")
        if [ -z "${2:-}" ]; then
            log_error "Please specify migration version to rollback"
            exit 1
        fi
        check_dependencies
        test_connection
        init_migrations
        rollback_migration "$SCRIPT_DIR/migrations/rollback_${2}.sql" "${2}"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        log_error "Unknown command: ${1:-}"
        echo
        show_help
        exit 1
        ;;
esac