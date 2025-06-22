import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { executeQuery, getTestClient } from '../setup/setup';
import { createFullTestScenario } from '../fixtures/dutch-funeral-mock-data';

describe('Database Query Performance Tests', () => {
  let testData: any;

  beforeAll(async () => {
    // Create comprehensive test dataset
    testData = await createFullTestScenario();
    
    // Create additional test data for performance testing
    await createLargeDataset();
  });

  async function createLargeDataset() {
    const client = await getTestClient();
    
    try {
      // Create many funeral requests for load testing
      const batchSize = 100;
      for (let batch = 0; batch < 5; batch++) {
        const values = [];
        const params = [];
        let paramIndex = 1;

        for (let i = 0; i < batchSize; i++) {
          const deceasedId = testData.deceasedIds[i % testData.deceasedIds.length];
          const contactId = testData.userIds.family[i % testData.userIds.family.length];
          const deadline = new Date();
          deadline.setDate(deadline.getDate() + Math.floor(Math.random() * 30));

          values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
          params.push(
            deceasedId,
            contactId,
            ['urgent', 'normal', 'flexible'][Math.floor(Math.random() * 3)],
            ['burial', 'cremation', 'mixed'][Math.floor(Math.random() * 3)],
            deadline,
            ['initiated', 'planning', 'confirmed'][Math.floor(Math.random() * 3)]
          );
        }

        await client.query(`
          INSERT INTO funeral_requests (
            deceased_id, primary_contact_id, urgency_level, 
            service_type, funeral_deadline, status
          ) VALUES ${values.join(', ')}
        `, params);
      }

      // Create many audit log entries
      for (let batch = 0; batch < 10; batch++) {
        const values = [];
        const params = [];
        let paramIndex = 1;

        for (let i = 0; i < batchSize; i++) {
          const userId = testData.userIds.all[i % testData.userIds.all.length];
          const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

          values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
          params.push(
            'performance_test',
            'data_access',
            userId,
            'SELECT',
            '127.0.0.1',
            true,
            timestamp
          );
        }

        await client.query(`
          INSERT INTO audit_log (
            event_type, event_category, user_id, action, ip_address, success, occurred_at
          ) VALUES ${values.join(', ')}
        `, params);
      }

    } finally {
      client.release();
    }
  }

  describe('Index Performance Tests', () => {
    it('should use indexes efficiently for common queries', async () => {
      const testCases = [
        {
          name: 'Funeral requests by status',
          query: `
            EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
            SELECT * FROM funeral_requests 
            WHERE status = 'planning'
          `,
          expectedIndex: 'idx_funeral_requests_status'
        },
        {
          name: 'Funeral requests by deadline',
          query: `
            EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
            SELECT * FROM funeral_requests 
            WHERE funeral_deadline < NOW() + INTERVAL '7 days'
            ORDER BY funeral_deadline
          `,
          expectedIndex: 'idx_funeral_requests_deadline'
        },
        {
          name: 'Venues by location',
          query: `
            EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
            SELECT * FROM venues 
            WHERE city = 'Amsterdam' AND status = 'approved'
          `,
          expectedIndex: 'idx_venues_location'
        },
        {
          name: 'Audit logs by user and date',
          query: `
            EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
            SELECT * FROM audit_log 
            WHERE user_id = $1
            AND occurred_at > NOW() - INTERVAL '30 days'
            ORDER BY occurred_at DESC
          `,
          expectedIndex: 'idx_audit_log_user'
        }
      ];

      for (const testCase of testCases) {
        const params = testCase.query.includes('$1') ? [testData.userIds.all[0]] : [];
        const result = await executeQuery(testCase.query, params);
        const plan = result.rows[0]['QUERY PLAN'][0];

        // Check that execution time is reasonable (< 50ms for these simple queries)
        expect(plan['Execution Time']).toBeLessThan(50);

        // Check that an index scan is being used (not seq scan for indexed columns)
        const usesIndex = JSON.stringify(plan).includes('Index');
        if (testCase.expectedIndex && !usesIndex) {
          console.warn(`Warning: Query "${testCase.name}" may not be using expected index: ${testCase.expectedIndex}`);
        }
      }
    });

    it('should efficiently handle complex joins', async () => {
      const complexJoinQuery = `
        EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT 
          fr.id,
          dp.full_name,
          up.first_name || ' ' || up.last_name as contact_name,
          v.name as venue_name
        FROM funeral_requests fr
        JOIN deceased_persons dp ON fr.deceased_id = dp.id
        JOIN user_profiles up ON fr.primary_contact_id = up.id
        LEFT JOIN bookings b ON b.funeral_request_id = fr.id
        LEFT JOIN venues v ON b.venue_id = v.id
        WHERE fr.status IN ('planning', 'confirmed')
        AND fr.funeral_deadline > NOW()
        ORDER BY fr.funeral_deadline
        LIMIT 50
      `;

      const result = await executeQuery(complexJoinQuery);
      const plan = result.rows[0]['QUERY PLAN'][0];

      // Complex join should complete in reasonable time
      expect(plan['Execution Time']).toBeLessThan(100);

      // Should use index scans for the joins
      const planStr = JSON.stringify(plan);
      expect(planStr).toContain('Index');
    });
  });

  describe('Query Execution Time Benchmarks', () => {
    it('should execute common read queries within performance targets', async () => {
      const queryBenchmarks = [
        {
          name: 'List funeral requests for family user',
          query: `
            SELECT fr.*, dp.full_name as deceased_name
            FROM funeral_requests fr
            JOIN deceased_persons dp ON fr.deceased_id = dp.id
            WHERE fr.primary_contact_id = $1
            ORDER BY fr.created_at DESC
          `,
          params: [testData.userIds.family[0]],
          maxTimeMs: 20
        },
        {
          name: 'Find available venues by city',
          query: `
            SELECT v.* FROM venues v
            WHERE v.city = $1 
            AND v.status = 'approved'
            AND NOT EXISTS (
              SELECT 1 FROM bookings b 
              WHERE b.venue_id = v.id 
              AND b.booking_date = $2
              AND b.status IN ('confirmed', 'paid')
            )
          `,
          params: ['Amsterdam', new Date().toISOString().split('T')[0]],
          maxTimeMs: 30
        },
        {
          name: 'Get user audit trail',
          query: `
            SELECT * FROM audit_log
            WHERE user_id = $1
            AND occurred_at > $2
            ORDER BY occurred_at DESC
            LIMIT 100
          `,
          params: [testData.userIds.all[0], new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)],
          maxTimeMs: 25
        },
        {
          name: 'Search deceased persons by name',
          query: `
            SELECT * FROM deceased_persons
            WHERE to_tsvector('dutch', first_name || ' ' || last_name) @@ plainto_tsquery('dutch', $1)
            LIMIT 20
          `,
          params: ['Jan de Jong'],
          maxTimeMs: 40
        }
      ];

      for (const benchmark of queryBenchmarks) {
        const startTime = Date.now();
        const result = await executeQuery(benchmark.query, benchmark.params);
        const executionTime = Date.now() - startTime;

        expect(executionTime).toBeLessThan(benchmark.maxTimeMs);
        expect(result.rows).toBeDefined();
        
        console.log(`✓ ${benchmark.name}: ${executionTime}ms (target: <${benchmark.maxTimeMs}ms)`);
      }
    });

    it('should handle concurrent read operations efficiently', async () => {
      const concurrentQueries = 10;
      const query = `
        SELECT fr.*, dp.full_name 
        FROM funeral_requests fr
        JOIN deceased_persons dp ON fr.deceased_id = dp.id
        WHERE fr.status = $1
        LIMIT 10
      `;

      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentQueries }, (_, i) => 
        executeQuery(query, [['planning', 'confirmed', 'initiated'][i % 3]])
      );

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All queries should complete
      expect(results.length).toBe(concurrentQueries);
      results.forEach(result => {
        expect(result.rows).toBeDefined();
      });

      // Total time should be much less than sequential execution
      // (should benefit from connection pooling and parallel execution)
      expect(totalTime).toBeLessThan(200);
      
      console.log(`✓ ${concurrentQueries} concurrent queries: ${totalTime}ms`);
    });
  });

  describe('Write Performance Tests', () => {
    it('should handle bulk inserts efficiently', async () => {
      const client = await getTestClient();
      
      try {
        await client.query('BEGIN');

        // Test bulk insert performance
        const batchSize = 100;
        const startTime = Date.now();

        // Bulk insert audit log entries
        const values = [];
        const params = [];
        let paramIndex = 1;

        for (let i = 0; i < batchSize; i++) {
          values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
          params.push(
            'bulk_test',
            'performance',
            'CREATE',
            '127.0.0.1',
            true
          );
        }

        await client.query(`
          INSERT INTO audit_log (event_type, event_category, action, ip_address, success)
          VALUES ${values.join(', ')}
        `, params);

        const bulkInsertTime = Date.now() - startTime;

        // Should complete in reasonable time
        expect(bulkInsertTime).toBeLessThan(500);

        // Verify all records were inserted
        const countResult = await client.query(`
          SELECT COUNT(*) as count 
          FROM audit_log 
          WHERE event_type = 'bulk_test'
        `);
        
        expect(parseInt(countResult.rows[0].count)).toBe(batchSize);

        console.log(`✓ Bulk insert of ${batchSize} records: ${bulkInsertTime}ms`);

        await client.query('ROLLBACK');
        
      } finally {
        client.release();
      }
    });

    it('should handle concurrent writes without deadlocks', async () => {
      const concurrentWrites = 5;
      const recordsPerWrite = 10;

      const writeOperations = Array.from({ length: concurrentWrites }, async (_, batchIndex) => {
        const client = await getTestClient();
        
        try {
          for (let i = 0; i < recordsPerWrite; i++) {
            await client.query(`
              INSERT INTO audit_log (
                event_type, event_category, action, ip_address, success
              ) VALUES ($1, $2, $3, $4, $5)
            `, [
              `concurrent_test_${batchIndex}`,
              'performance',
              'CREATE',
              '127.0.0.1',
              true
            ]);
          }
        } finally {
          client.release();
        }
      });

      const startTime = Date.now();
      await Promise.all(writeOperations);
      const totalTime = Date.now() - startTime;

      // Verify all records were inserted
      const countResult = await executeQuery(`
        SELECT COUNT(*) as count 
        FROM audit_log 
        WHERE event_type LIKE 'concurrent_test_%'
      `);
      
      expect(parseInt(countResult.rows[0].count)).toBe(concurrentWrites * recordsPerWrite);
      expect(totalTime).toBeLessThan(1000);

      console.log(`✓ ${concurrentWrites} concurrent write operations: ${totalTime}ms`);

      // Cleanup
      await executeQuery(`
        DELETE FROM audit_log 
        WHERE event_type LIKE 'concurrent_test_%'
      `);
    });
  });

  describe('Connection Pool Performance', () => {
    it('should handle connection acquisition efficiently', async () => {
      const connectionTests = 20;
      const startTime = Date.now();

      const connectionPromises = Array.from({ length: connectionTests }, async () => {
        const client = await getTestClient();
        try {
          const result = await client.query('SELECT NOW() as current_time');
          return result.rows[0].current_time;
        } finally {
          client.release();
        }
      });

      const results = await Promise.all(connectionPromises);
      const totalTime = Date.now() - startTime;

      expect(results.length).toBe(connectionTests);
      expect(totalTime).toBeLessThan(1000);

      console.log(`✓ ${connectionTests} connection acquisitions: ${totalTime}ms`);
    });

    it('should properly release connections back to pool', async () => {
      // Test that connections are properly released and reused
      const testConnections = 10;
      
      for (let i = 0; i < testConnections; i++) {
        const client = await getTestClient();
        
        try {
          await client.query('SELECT 1');
        } finally {
          client.release();
        }
      }

      // Should be able to get connections again without issues
      const client = await getTestClient();
      try {
        const result = await client.query('SELECT 1 as test');
        expect(result.rows[0].test).toBe(1);
      } finally {
        client.release();
      }
    });
  });

  describe('Large Dataset Queries', () => {
    it('should handle pagination efficiently', async () => {
      const pageSize = 20;
      const totalPages = 5;

      for (let page = 0; page < totalPages; page++) {
        const offset = page * pageSize;
        
        const startTime = Date.now();
        const result = await executeQuery(`
          SELECT fr.*, dp.full_name
          FROM funeral_requests fr
          JOIN deceased_persons dp ON fr.deceased_id = dp.id
          ORDER BY fr.created_at DESC
          LIMIT $1 OFFSET $2
        `, [pageSize, offset]);
        
        const queryTime = Date.now() - startTime;
        
        expect(queryTime).toBeLessThan(50);
        expect(result.rows.length).toBeLessThanOrEqual(pageSize);
        
        console.log(`✓ Page ${page + 1} (offset ${offset}): ${queryTime}ms`);
      }
    });

    it('should handle aggregation queries efficiently', async () => {
      const aggregationQueries = [
        {
          name: 'Count funeral requests by status',
          query: `
            SELECT status, COUNT(*) as count
            FROM funeral_requests
            GROUP BY status
            ORDER BY count DESC
          `
        },
        {
          name: 'Count venues by city',
          query: `
            SELECT city, COUNT(*) as venue_count
            FROM venues
            WHERE status = 'approved'
            GROUP BY city
            ORDER BY venue_count DESC
            LIMIT 10
          `
        },
        {
          name: 'Monthly audit log activity',
          query: `
            SELECT 
              DATE_TRUNC('month', occurred_at) as month,
              COUNT(*) as activity_count
            FROM audit_log
            WHERE occurred_at > NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', occurred_at)
            ORDER BY month DESC
          `
        }
      ];

      for (const aggregationQuery of aggregationQueries) {
        const startTime = Date.now();
        const result = await executeQuery(aggregationQuery.query);
        const queryTime = Date.now() - startTime;

        expect(queryTime).toBeLessThan(100);
        expect(result.rows.length).toBeGreaterThan(0);
        
        console.log(`✓ ${aggregationQuery.name}: ${queryTime}ms`);
      }
    });
  });

  afterAll(async () => {
    // Clean up performance test data
    await executeQuery(`DELETE FROM audit_log WHERE event_type IN ('performance_test', 'bulk_test')`);
    console.log('✓ Performance test cleanup completed');
  });
});