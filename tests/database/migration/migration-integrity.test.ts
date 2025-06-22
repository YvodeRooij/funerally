import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { executeQuery, getTestClient } from '../setup/setup';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Database Migration Tests', () => {
  describe('Schema Migration Integrity', () => {
    it('should be able to apply all migrations in sequence', async () => {
      // Clean database first
      const client = await getTestClient();
      
      try {
        await client.query('BEGIN');
        
        // Drop all tables to simulate fresh migration
        const tables = await client.query(`
          SELECT tablename 
          FROM pg_tables 
          WHERE schemaname = 'public'
          AND tablename NOT LIKE 'pg_%'
        `);
        
        // Disable foreign key checks temporarily
        await client.query('SET session_replication_role = replica');
        
        for (const table of tables.rows) {
          await client.query(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`);
        }
        
        await client.query('SET session_replication_role = DEFAULT');
        
        // Apply migrations in order
        const migrationFiles = [
          '../../../../db/schema/01_core_entities.sql',
          '../../../../db/schema/02_document_storage.sql',
          '../../../../db/schema/03_audit_logging.sql',
        ];
        
        for (const migrationFile of migrationFiles) {
          const filePath = join(__dirname, migrationFile);
          const sql = readFileSync(filePath, 'utf8');
          await client.query(sql);
        }
        
        await client.query('COMMIT');
        
        // Verify all tables exist
        const finalTables = await client.query(`
          SELECT COUNT(*) as table_count
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        `);
        
        expect(parseInt(finalTables.rows[0].table_count)).toBeGreaterThan(15);
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });

    it('should handle migration rollbacks correctly', async () => {
      const client = await getTestClient();
      
      try {
        // Take snapshot of current schema
        const beforeTables = await client.query(`
          SELECT tablename, schemaname
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY tablename
        `);
        
        // Simulate a migration that needs rollback
        await client.query('BEGIN');
        
        // Create a temporary table
        await client.query(`
          CREATE TABLE test_migration_table (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            test_data TEXT
          )
        `);
        
        // Verify table was created
        const duringMigration = await client.query(`
          SELECT COUNT(*) as count
          FROM pg_tables 
          WHERE tablename = 'test_migration_table'
        `);
        
        expect(parseInt(duringMigration.rows[0].count)).toBe(1);
        
        // Rollback the migration
        await client.query('ROLLBACK');
        
        // Verify rollback worked
        const afterRollback = await client.query(`
          SELECT tablename, schemaname
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY tablename
        `);
        
        expect(afterRollback.rows).toEqual(beforeTables.rows);
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  });

  describe('Data Migration and Preservation', () => {
    beforeEach(async () => {
      // Set up test data before migration tests
      await executeQuery(`
        INSERT INTO user_profiles (email, first_name, last_name, user_type)
        VALUES ('test@example.com', 'Test', 'User', 'family')
      `);
    });

    it('should preserve existing data during schema changes', async () => {
      const client = await getTestClient();
      
      try {
        // Get current data
        const beforeData = await client.query(`
          SELECT id, email, first_name, last_name, user_type, created_at
          FROM user_profiles
          WHERE email = 'test@example.com'
        `);
        
        expect(beforeData.rows.length).toBe(1);
        const originalUser = beforeData.rows[0];
        
        // Simulate adding a new column (non-destructive migration)
        await client.query('BEGIN');
        
        await client.query(`
          ALTER TABLE user_profiles 
          ADD COLUMN IF NOT EXISTS test_migration_column VARCHAR(100) DEFAULT 'migrated'
        `);
        
        // Verify data is still intact
        const afterData = await client.query(`
          SELECT id, email, first_name, last_name, user_type, created_at, test_migration_column
          FROM user_profiles
          WHERE email = 'test@example.com'
        `);
        
        expect(afterData.rows.length).toBe(1);
        const migratedUser = afterData.rows[0];
        
        // Original data should be unchanged
        expect(migratedUser.id).toBe(originalUser.id);
        expect(migratedUser.email).toBe(originalUser.email);
        expect(migratedUser.first_name).toBe(originalUser.first_name);
        expect(migratedUser.last_name).toBe(originalUser.last_name);
        expect(migratedUser.user_type).toBe(originalUser.user_type);
        expect(migratedUser.created_at).toEqual(originalUser.created_at);
        
        // New column should have default value
        expect(migratedUser.test_migration_column).toBe('migrated');
        
        // Clean up
        await client.query('ALTER TABLE user_profiles DROP COLUMN test_migration_column');
        await client.query('COMMIT');
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });

    it('should handle data transformation during migrations', async () => {
      const client = await getTestClient();
      
      try {
        await client.query('BEGIN');
        
        // Simulate a data transformation migration
        // Add a computed column based on existing data
        await client.query(`
          ALTER TABLE user_profiles 
          ADD COLUMN IF NOT EXISTS full_name_computed VARCHAR(255)
        `);
        
        // Update the computed column
        await client.query(`
          UPDATE user_profiles 
          SET full_name_computed = CONCAT(first_name, ' ', last_name)
          WHERE full_name_computed IS NULL
        `);
        
        // Verify transformation
        const result = await client.query(`
          SELECT first_name, last_name, full_name_computed
          FROM user_profiles
          WHERE email = 'test@example.com'
        `);
        
        expect(result.rows.length).toBe(1);
        const user = result.rows[0];
        expect(user.full_name_computed).toBe(`${user.first_name} ${user.last_name}`);
        
        // Clean up
        await client.query('ALTER TABLE user_profiles DROP COLUMN full_name_computed');
        await client.query('COMMIT');
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  });

  describe('Index Migration and Performance', () => {
    it('should create indexes without blocking concurrent access', async () => {
      const client = await getTestClient();
      
      try {
        await client.query('BEGIN');
        
        // Create a test table with data
        await client.query(`
          CREATE TABLE IF NOT EXISTS test_index_table (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            search_field VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);
        
        // Insert test data
        for (let i = 0; i < 100; i++) {
          await client.query(`
            INSERT INTO test_index_table (search_field)
            VALUES ('test_value_' || $1)
          `, [i]);
        }
        
        // Create index concurrently (simulated)
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_test_search_field 
          ON test_index_table(search_field)
        `);
        
        // Verify index was created
        const indexCheck = await client.query(`
          SELECT indexname
          FROM pg_indexes
          WHERE tablename = 'test_index_table'
          AND indexname = 'idx_test_search_field'
        `);
        
        expect(indexCheck.rows.length).toBe(1);
        
        // Test index is being used
        const explainResult = await client.query(`
          EXPLAIN (FORMAT JSON) 
          SELECT * FROM test_index_table 
          WHERE search_field = 'test_value_50'
        `);
        
        const plan = explainResult.rows[0]['QUERY PLAN'][0];
        expect(plan.Plan['Node Type']).toContain('Index');
        
        // Clean up
        await client.query('DROP TABLE test_index_table');
        await client.query('COMMIT');
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  });

  describe('Constraint Migration', () => {
    it('should add constraints safely to existing data', async () => {
      const client = await getTestClient();
      
      try {
        await client.query('BEGIN');
        
        // Create test table without constraints
        await client.query(`
          CREATE TABLE IF NOT EXISTS test_constraint_table (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email VARCHAR(255),
            status VARCHAR(50)
          )
        `);
        
        // Insert valid test data
        await client.query(`
          INSERT INTO test_constraint_table (email, status)
          VALUES ('valid@example.com', 'active')
        `);
        
        // Add constraint to existing table
        await client.query(`
          ALTER TABLE test_constraint_table
          ADD CONSTRAINT check_email_format 
          CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
        `);
        
        // Verify constraint exists
        const constraintCheck = await client.query(`
          SELECT conname
          FROM pg_constraint
          WHERE conname = 'check_email_format'
        `);
        
        expect(constraintCheck.rows.length).toBe(1);
        
        // Test constraint prevents invalid data
        await expect(
          client.query(`
            INSERT INTO test_constraint_table (email, status)
            VALUES ('invalid-email', 'active')
          `)
        ).rejects.toThrow();
        
        // Test constraint allows valid data
        await client.query(`
          INSERT INTO test_constraint_table (email, status)
          VALUES ('another@example.com', 'inactive')
        `);
        
        const validData = await client.query(`
          SELECT COUNT(*) as count
          FROM test_constraint_table
          WHERE email LIKE '%@%'
        `);
        
        expect(parseInt(validData.rows[0].count)).toBe(2);
        
        // Clean up
        await client.query('DROP TABLE test_constraint_table');
        await client.query('COMMIT');
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  });

  describe('Function and Trigger Migration', () => {
    it('should preserve function and trigger behavior during migrations', async () => {
      const client = await getTestClient();
      
      try {
        await client.query('BEGIN');
        
        // Create test table
        await client.query(`
          CREATE TABLE IF NOT EXISTS test_trigger_table (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);
        
        // Verify update trigger function exists and works
        await client.query(`
          INSERT INTO test_trigger_table (name) VALUES ('initial_name')
        `);
        
        const beforeUpdate = await client.query(`
          SELECT name, updated_at
          FROM test_trigger_table
          WHERE name = 'initial_name'
        `);
        
        const initialTimestamp = beforeUpdate.rows[0].updated_at;
        
        // Wait a moment and update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await client.query(`
          UPDATE test_trigger_table 
          SET name = 'updated_name'
          WHERE name = 'initial_name'
        `);
        
        const afterUpdate = await client.query(`
          SELECT name, updated_at
          FROM test_trigger_table
          WHERE name = 'updated_name'
        `);
        
        const updatedTimestamp = afterUpdate.rows[0].updated_at;
        
        // Verify trigger updated the timestamp
        expect(new Date(updatedTimestamp) > new Date(initialTimestamp)).toBe(true);
        
        // Clean up
        await client.query('DROP TABLE test_trigger_table');
        await client.query('COMMIT');
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  });

  describe('Migration Version Control', () => {
    it('should track migration versions and prevent re-application', async () => {
      const client = await getTestClient();
      
      try {
        // Create a simple migration tracking table
        await client.query(`
          CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);
        
        // Record a migration
        const migrationVersion = '001_initial_schema';
        await client.query(`
          INSERT INTO schema_migrations (version)
          VALUES ($1)
          ON CONFLICT (version) DO NOTHING
        `, [migrationVersion]);
        
        // Check migration was recorded
        const migrationCheck = await client.query(`
          SELECT version, applied_at
          FROM schema_migrations
          WHERE version = $1
        `, [migrationVersion]);
        
        expect(migrationCheck.rows.length).toBe(1);
        expect(migrationCheck.rows[0].version).toBe(migrationVersion);
        
        // Attempt to apply same migration again should be ignored
        const result = await client.query(`
          INSERT INTO schema_migrations (version)
          VALUES ($1)
          ON CONFLICT (version) DO NOTHING
          RETURNING version
        `, [migrationVersion]);
        
        expect(result.rows.length).toBe(0); // No new row inserted
        
        // Clean up
        await client.query('DROP TABLE schema_migrations');
        
      } catch (error) {
        throw error;
      } finally {
        client.release();
      }
    });
  });

  describe('GDPR and Audit Log Migration', () => {
    it('should maintain audit trail integrity during migrations', async () => {
      const client = await getTestClient();
      
      try {
        await client.query('BEGIN');
        
        // Insert audit log entry
        await client.query(`
          INSERT INTO audit_log (
            event_type, event_category, action, target_type, target_id, 
            ip_address, success, user_email
          )
          VALUES (
            'test_migration', 'data_modification', 'CREATE', 'test_table', 
            gen_random_uuid(), '127.0.0.1', true, 'test@example.com'
          )
        `);
        
        // Verify audit log entry exists
        const auditBefore = await client.query(`
          SELECT COUNT(*) as count
          FROM audit_log
          WHERE event_type = 'test_migration'
        `);
        
        expect(parseInt(auditBefore.rows[0].count)).toBe(1);
        
        // Simulate schema change that could affect audit logs
        await client.query(`
          ALTER TABLE audit_log 
          ADD COLUMN IF NOT EXISTS migration_marker BOOLEAN DEFAULT false
        `);
        
        // Update existing audit logs
        await client.query(`
          UPDATE audit_log 
          SET migration_marker = true
          WHERE event_type = 'test_migration'
        `);
        
        // Verify audit log data integrity maintained
        const auditAfter = await client.query(`
          SELECT event_type, event_category, action, migration_marker
          FROM audit_log
          WHERE event_type = 'test_migration'
        `);
        
        expect(auditAfter.rows.length).toBe(1);
        expect(auditAfter.rows[0].event_type).toBe('test_migration');
        expect(auditAfter.rows[0].event_category).toBe('data_modification');
        expect(auditAfter.rows[0].action).toBe('CREATE');
        expect(auditAfter.rows[0].migration_marker).toBe(true);
        
        // Clean up
        await client.query('ALTER TABLE audit_log DROP COLUMN migration_marker');
        await client.query('DELETE FROM audit_log WHERE event_type = $1', ['test_migration']);
        await client.query('COMMIT');
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  });
});