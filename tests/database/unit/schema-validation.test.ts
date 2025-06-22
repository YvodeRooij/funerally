import { describe, it, expect, beforeEach } from 'vitest';
import { executeQuery } from '../setup/setup';
import { createFullTestScenario } from '../fixtures/dutch-funeral-mock-data';

describe('Database Schema Validation Tests', () => {
  describe('Core Tables Existence', () => {
    it('should have all core entity tables', async () => {
      const expectedTables = [
        'deceased_persons',
        'funeral_requests', 
        'venues',
        'bookings',
        'service_providers',
        'communications',
        'payments',
        'user_profiles'
      ];

      const result = await executeQuery(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = ANY($1::text[])
        ORDER BY tablename
      `, [expectedTables]);

      const actualTables = result.rows.map(row => row.tablename);
      expect(actualTables).toEqual(expectedTables.sort());
    });

    it('should have all document storage tables', async () => {
      const expectedTables = [
        'document_categories',
        'document_vault',
        'document_access_log',
        'document_sharing_permissions',
        'document_processing_queue',
        'document_backup_metadata',
        'document_sharing_tokens'
      ];

      const result = await executeQuery(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = ANY($1::text[])
        ORDER BY tablename
      `, [expectedTables]);

      const actualTables = result.rows.map(row => row.tablename);
      expect(actualTables).toEqual(expectedTables.sort());
    });

    it('should have all audit logging tables', async () => {
      const expectedTables = [
        'audit_log',
        'gdpr_compliance_log',
        'data_breach_log',
        'consent_tracking',
        'data_processing_activities',
        'system_access_log',
        'regulatory_compliance_events'
      ];

      const result = await executeQuery(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = ANY($1::text[])
        ORDER BY tablename
      `, [expectedTables]);

      const actualTables = result.rows.map(row => row.tablename);
      expect(actualTables).toEqual(expectedTables.sort());
    });
  });

  describe('Primary Key Constraints', () => {
    it('should have UUID primary keys on all core tables', async () => {
      const result = await executeQuery(`
        SELECT 
          t.table_name,
          c.column_name,
          c.data_type
        FROM information_schema.tables t
        JOIN information_schema.table_constraints tc 
          ON t.table_name = tc.table_name
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.columns c 
          ON t.table_name = c.table_name AND kcu.column_name = c.column_name
        WHERE t.table_schema = 'public' 
        AND tc.constraint_type = 'PRIMARY KEY'
        AND t.table_name NOT LIKE 'pg_%'
        ORDER BY t.table_name
      `);

      result.rows.forEach(row => {
        expect(row.column_name).toBe('id');
        expect(row.data_type).toBe('uuid');
      });
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should have proper foreign key relationships', async () => {
      const result = await executeQuery(`
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule,
          rc.update_rule
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        WHERE constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      
      // Check specific important foreign keys
      const foreignKeys = result.rows.reduce((acc, row) => {
        acc[`${row.table_name}.${row.column_name}`] = {
          references: `${row.foreign_table_name}.${row.foreign_column_name}`,
          deleteRule: row.delete_rule,
          updateRule: row.update_rule
        };
        return acc;
      }, {} as Record<string, any>);

      // Funeral requests should reference deceased persons and users
      expect(foreignKeys['funeral_requests.deceased_id']).toBeDefined();
      expect(foreignKeys['funeral_requests.primary_contact_id']).toBeDefined();
      expect(foreignKeys['funeral_requests.assigned_director_id']).toBeDefined();

      // Bookings should reference funeral requests and venues
      expect(foreignKeys['bookings.funeral_request_id']).toBeDefined();
      expect(foreignKeys['bookings.venue_id']).toBeDefined();

      // Document vault should reference users and categories
      expect(foreignKeys['document_vault.owner_id']).toBeDefined();
      expect(foreignKeys['document_vault.category_id']).toBeDefined();
    });
  });

  describe('Check Constraints', () => {
    it('should enforce valid enum values', async () => {
      const result = await executeQuery(`
        SELECT 
          nspname as schema_name,
          relname as table_name,
          conname as constraint_name,
          pg_get_constraintdef(c.oid) as constraint_definition
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE c.contype = 'c'
        AND nspname = 'public'
        ORDER BY relname, conname
      `);

      const constraints = result.rows;
      expect(constraints.length).toBeGreaterThan(0);

      // Check for specific enum constraints
      const enumConstraints = constraints.filter(c => 
        c.constraint_definition.includes('IN (') ||
        c.constraint_definition.includes('CHECK')
      );
      
      expect(enumConstraints.length).toBeGreaterThan(10);
    });

    it('should enforce business logic constraints', async () => {
      // Test death date after birth date constraint
      await expect(
        executeQuery(`
          INSERT INTO deceased_persons (
            full_name, first_name, last_name, birth_date, death_date, 
            birth_place, nationality, preferred_service_type, preferred_ceremony_type
          ) VALUES (
            'Test Person', 'Test', 'Person', '2000-01-01', '1999-01-01',
            'Amsterdam', 'Dutch', 'burial', 'traditional'
          )
        `)
      ).rejects.toThrow();

      // Test valid BSN format constraint
      await expect(
        executeQuery(`
          INSERT INTO deceased_persons (
            full_name, first_name, last_name, birth_date, death_date, 
            birth_place, nationality, preferred_service_type, preferred_ceremony_type, bsn
          ) VALUES (
            'Test Person', 'Test', 'Person', '1950-01-01', '2024-01-01',
            'Amsterdam', 'Dutch', 'burial', 'traditional', '12345'
          )
        `)
      ).rejects.toThrow();
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique constraints where required', async () => {
      const result = await executeQuery(`
        SELECT 
          t.table_name,
          c.column_name,
          tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.columns c 
          ON kcu.table_name = c.table_name AND kcu.column_name = c.column_name
        JOIN information_schema.tables t 
          ON tc.table_name = t.table_name
        WHERE tc.constraint_type = 'UNIQUE'
        AND t.table_schema = 'public'
        ORDER BY t.table_name, c.column_name
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      
      // Check for specific unique constraints
      const uniqueConstraints = result.rows.map(row => 
        `${row.table_name}.${row.column_name}`
      );
      
      expect(uniqueConstraints).toContain('service_providers.kvk_number');
      expect(uniqueConstraints).toContain('data_breach_log.breach_reference');
    });
  });

  describe('Default Values and Timestamps', () => {
    it('should have proper default values for timestamps', async () => {
      const result = await executeQuery(`
        SELECT 
          table_name,
          column_name,
          column_default,
          data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name IN ('created_at', 'updated_at')
        AND column_default IS NOT NULL
        ORDER BY table_name, column_name
      `);

      result.rows.forEach(row => {
        expect(row.column_default).toContain('now()');
        expect(row.data_type).toBe('timestamp with time zone');
      });
    });

    it('should have proper default values for UUIDs', async () => {
      const result = await executeQuery(`
        SELECT 
          table_name,
          column_name,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name = 'id'
        AND column_default IS NOT NULL
        ORDER BY table_name
      `);

      result.rows.forEach(row => {
        expect(row.column_default).toMatch(/gen_random_uuid\(\)|uuid_generate_v4\(\)/);
      });
    });
  });

  describe('Index Coverage', () => {
    it('should have indexes on foreign key columns', async () => {
      const result = await executeQuery(`
        SELECT 
          t.relname as table_name,
          i.relname as index_name,
          a.attname as column_name,
          ix.indisunique as is_unique
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON t.oid = a.attrelid AND a.attnum = ANY(ix.indkey)
        WHERE t.relkind = 'r'
        AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND a.attname LIKE '%_id'
        ORDER BY t.relname, i.relname
      `);

      expect(result.rows.length).toBeGreaterThan(20); // Should have many FK indexes
    });

    it('should have performance indexes on common query columns', async () => {
      const expectedIndexes = [
        'idx_funeral_requests_status',
        'idx_funeral_requests_deadline',
        'idx_venues_status_approved',
        'idx_bookings_date_time',
        'idx_document_vault_retention',
        'idx_audit_log_timeline'
      ];

      const result = await executeQuery(`
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname = ANY($1::text[])
      `, [expectedIndexes]);

      const actualIndexes = result.rows.map(row => row.indexname);
      expectedIndexes.forEach(expectedIndex => {
        expect(actualIndexes).toContain(expectedIndex);
      });
    });
  });

  describe('Table Relationships and Data Integrity', () => {
    beforeEach(async () => {
      // Clean database before each test
      await executeQuery('TRUNCATE TABLE payments RESTART IDENTITY CASCADE');
      await executeQuery('TRUNCATE TABLE bookings RESTART IDENTITY CASCADE');
      await executeQuery('TRUNCATE TABLE communications RESTART IDENTITY CASCADE');
      await executeQuery('TRUNCATE TABLE funeral_requests RESTART IDENTITY CASCADE');
      await executeQuery('TRUNCATE TABLE deceased_persons RESTART IDENTITY CASCADE');
      await executeQuery('TRUNCATE TABLE venues RESTART IDENTITY CASCADE');
      await executeQuery('TRUNCATE TABLE user_profiles RESTART IDENTITY CASCADE');
    });

    it('should maintain referential integrity across related tables', async () => {
      const testData = await createFullTestScenario();
      
      // Verify data was inserted correctly
      const funeralRequestCount = await executeQuery(
        'SELECT COUNT(*) FROM funeral_requests'
      );
      expect(parseInt(funeralRequestCount.rows[0].count)).toBe(5);

      const deceasedCount = await executeQuery(
        'SELECT COUNT(*) FROM deceased_persons'
      );
      expect(parseInt(deceasedCount.rows[0].count)).toBe(5);

      const venueCount = await executeQuery(
        'SELECT COUNT(*) FROM venues'
      );
      expect(parseInt(venueCount.rows[0].count)).toBe(8);

      // Verify relationships exist
      const joinQuery = await executeQuery(`
        SELECT 
          fr.id as funeral_request_id,
          dp.full_name as deceased_name,
          up.first_name || ' ' || up.last_name as contact_name
        FROM funeral_requests fr
        JOIN deceased_persons dp ON fr.deceased_id = dp.id
        JOIN user_profiles up ON fr.primary_contact_id = up.id
      `);
      
      expect(joinQuery.rows.length).toBe(5);
    });

    it('should cascade deletions properly', async () => {
      const testData = await createFullTestScenario();
      
      // Delete a deceased person (should cascade to funeral requests)
      await executeQuery(
        'DELETE FROM deceased_persons WHERE id = $1',
        [testData.deceasedIds[0]]
      );

      // Verify funeral request was also deleted
      const remainingRequests = await executeQuery(
        'SELECT COUNT(*) FROM funeral_requests'
      );
      expect(parseInt(remainingRequests.rows[0].count)).toBe(4);
    });

    it('should set null on foreign key deletions where configured', async () => {
      const testData = await createFullTestScenario();
      
      // Delete a director (should set assigned_director_id to null in funeral_requests)
      const directorId = testData.userIds.directors[0];
      
      // First assign director to a request
      await executeQuery(
        'UPDATE funeral_requests SET assigned_director_id = $1 WHERE id = $2',
        [directorId, testData.funeralRequestIds[0]]
      );

      // Delete the director
      await executeQuery(
        'DELETE FROM user_profiles WHERE id = $1',
        [directorId]
      );

      // Verify the funeral request still exists but director is null
      const result = await executeQuery(
        'SELECT assigned_director_id FROM funeral_requests WHERE id = $1',
        [testData.funeralRequestIds[0]]
      );
      
      expect(result.rows[0].assigned_director_id).toBeNull();
    });
  });

  describe('Column Data Types and Sizes', () => {
    it('should have appropriate data types for sensitive fields', async () => {
      const result = await executeQuery(`
        SELECT 
          table_name,
          column_name,
          data_type,
          character_maximum_length,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name IN ('bsn', 'kvk_number', 'encrypted_content', 'ip_address')
        ORDER BY table_name, column_name
      `);

      const columnTypes = result.rows.reduce((acc, row) => {
        acc[`${row.table_name}.${row.column_name}`] = {
          dataType: row.data_type,
          maxLength: row.character_maximum_length,
          nullable: row.is_nullable === 'YES'
        };
        return acc;
      }, {} as Record<string, any>);

      // BSN should be varchar(9) and nullable
      expect(columnTypes['deceased_persons.bsn']).toEqual({
        dataType: 'character varying',
        maxLength: 9,
        nullable: true
      });

      // Encrypted content should be bytea
      expect(columnTypes['document_vault.encrypted_content'].dataType).toBe('bytea');

      // IP addresses should be inet type
      expect(columnTypes['audit_log.ip_address'].dataType).toBe('inet');
    });
  });
});