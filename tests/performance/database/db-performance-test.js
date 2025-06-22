/**
 * DATABASE PERFORMANCE TESTING - FAREWELLY PLATFORM
 * 
 * Tests query optimization, index effectiveness, connection pooling
 * Validates database performance under various load conditions
 */

import sql from 'k6/x/sql';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { K6_CONFIG } from '../config/k6-config.js';
import { DUTCH_MARKET_CONFIG } from '../config/dutch-market-parameters.js';

// Database performance metrics
const queryDuration = new Trend('db_query_duration');
const querySuccess = new Rate('db_query_success');
const connectionPoolUtilization = new Gauge('db_connection_pool_utilization');
const indexHitRatio = new Gauge('db_index_hit_ratio');
const cacheHitRatio = new Gauge('db_cache_hit_ratio');
const slowQueries = new Counter('db_slow_queries');
const deadlocks = new Counter('db_deadlocks');
const connectionTimeouts = new Counter('db_connection_timeouts');
const tableScans = new Counter('db_table_scans');

// Database connection string (use environment variable)
const DB_CONNECTION = __ENV.DB_CONNECTION || 'postgresql://localhost:5432/farewelly_test';

// Performance testing options
export const options = {
  scenarios: {
    // Query performance under normal load
    query_performance_normal: {
      executor: 'constant-vus',
      exec: 'testQueryPerformance',
      vus: 20,
      duration: '10m',
      tags: { db_test_type: 'query_performance_normal' },
    },
    
    // Query performance under high load
    query_performance_high: {
      executor: 'ramping-vus',
      exec: 'testQueryPerformanceHigh',
      startTime: '11m',
      stages: [
        { duration: '2m', target: 50 },
        { duration: '8m', target: 100 },
        { duration: '2m', target: 0 },
      ],
      tags: { db_test_type: 'query_performance_high' },
    },
    
    // Connection pool stress test
    connection_pool_test: {
      executor: 'ramping-vus',
      exec: 'testConnectionPool',
      startTime: '22m',
      stages: [
        { duration: '1m', target: 20 },
        { duration: '3m', target: 80 },
        { duration: '3m', target: 120 }, // Exceed pool size
        { duration: '1m', target: 0 },
      ],
      tags: { db_test_type: 'connection_pool' },
    },
    
    // Index effectiveness test
    index_effectiveness_test: {
      executor: 'constant-vus',
      exec: 'testIndexEffectiveness',
      startTime: '31m',
      vus: 30,
      duration: '8m',
      tags: { db_test_type: 'index_effectiveness' },
    },
    
    // Transaction performance test
    transaction_performance_test: {
      executor: 'constant-arrival-rate',
      exec: 'testTransactionPerformance',
      startTime: '40m',
      rate: 50, // transactions per second
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 25,
      maxVUs: 100,
      tags: { db_test_type: 'transaction_performance' },
    },
    
    // Complex query optimization test
    complex_query_test: {
      executor: 'constant-vus',
      exec: 'testComplexQueries',
      startTime: '51m',
      vus: 15,
      duration: '10m',
      tags: { db_test_type: 'complex_queries' },
    },
  },
  
  thresholds: {
    'db_query_duration': [
      { threshold: 'p(95)<100', abortOnFail: false }, // 95% under 100ms
      { threshold: 'p(99)<200', abortOnFail: false }, // 99% under 200ms
      { threshold: 'avg<50', abortOnFail: false }, // Average under 50ms
    ],
    'db_query_success': [
      { threshold: 'rate>0.995', abortOnFail: true }, // 99.5% success rate
    ],
    'db_connection_pool_utilization': [
      { threshold: 'value<80', abortOnFail: false }, // Less than 80% utilization
    ],
    'db_index_hit_ratio': [
      { threshold: 'value>95', abortOnFail: false }, // More than 95% index hits
    ],
    'db_cache_hit_ratio': [
      { threshold: 'value>90', abortOnFail: false }, // More than 90% cache hits
    ],
    'db_slow_queries': [
      { threshold: 'count<100', abortOnFail: false }, // Less than 100 slow queries
    ],
    'db_deadlocks': [
      { threshold: 'count<5', abortOnFail: false }, // Less than 5 deadlocks
    ],
    'db_connection_timeouts': [
      { threshold: 'count<10', abortOnFail: false }, // Less than 10 timeouts
    ],
  },
  
  tags: {
    ...K6_CONFIG.MONITORING.tags,
    test_category: 'database',
  },
};

export function setup() {
  console.log('🗄️  Starting database performance testing...');
  console.log(`📊 Connection: ${DB_CONNECTION.split('@')[1] || 'local'}`);
  console.log('🎯 Testing: Query performance, indexes, connection pooling');
  
  // Test database connection
  try {
    const db = sql.open('postgres', DB_CONNECTION);
    const result = sql.query(db, 'SELECT NOW() as current_time');
    sql.close(db);
    
    console.log('✅ Database connection successful');
    return { connectionString: DB_CONNECTION };
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw new Error('Cannot proceed without database connection');
  }
}

// Query performance testing
export function testQueryPerformance(data) {
  const db = sql.open('postgres', DB_CONNECTION);
  
  group('Basic Query Performance', () => {
    // Test common read queries
    const queries = [
      {
        name: 'user_profile_lookup',
        query: 'SELECT * FROM user_profiles WHERE email = $1',
        params: ['test@farewelly.nl'],
      },
      {
        name: 'bookings_by_family',
        query: 'SELECT * FROM bookings WHERE family_id = $1 ORDER BY created_at DESC LIMIT 20',
        params: [generateRandomId()],
      },
      {
        name: 'venue_availability',
        query: 'SELECT * FROM venue_availability WHERE venue_id = $1 AND date >= $2 AND date <= $3',
        params: [generateRandomId(), '2024-01-01', '2024-12-31'],
      },
      {
        name: 'chat_messages_recent',
        query: 'SELECT * FROM chat_messages WHERE room_id = $1 ORDER BY created_at DESC LIMIT 50',
        params: [generateRandomId()],
      },
      {
        name: 'documents_by_family',
        query: 'SELECT * FROM documents WHERE family_id = $1 AND deleted_at IS NULL',
        params: [generateRandomId()],
      },
    ];
    
    queries.forEach(({ name, query, params }) => {
      const startTime = Date.now();
      
      try {
        const result = sql.query(db, query, ...params);
        const duration = Date.now() - startTime;
        
        queryDuration.add(duration, { query_type: name });
        querySuccess.add(1, { query_type: name });
        
        // Flag slow queries
        if (duration > 100) {
          slowQueries.add(1, { query_type: name });
        }
        
        check(result, {
          [`${name} query successful`]: (r) => r.length >= 0,
          [`${name} query fast`]: () => duration < 100,
        });
        
      } catch (error) {
        querySuccess.add(0, { query_type: name });
        console.error(`Query ${name} failed:`, error.message);
        
        // Check for specific error types
        if (error.message.includes('timeout')) {
          connectionTimeouts.add(1);
        }
        if (error.message.includes('deadlock')) {
          deadlocks.add(1);
        }
      }
      
      sleep(0.1);
    });
  });
  
  sql.close(db);
  sleep(Math.random() * 2 + 1);
}

// High load query performance
export function testQueryPerformanceHigh(data) {
  const db = sql.open('postgres', DB_CONNECTION);
  
  group('High Load Query Performance', () => {
    // More intensive queries under high load
    const intensiveQueries = [
      {
        name: 'director_clients_with_stats',
        query: `
          SELECT 
            dc.*,
            up.name as family_name,
            COUNT(b.id) as total_bookings,
            AVG(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completion_rate
          FROM director_clients dc
          JOIN user_profiles up ON dc.family_id = up.id
          LEFT JOIN bookings b ON b.family_id = dc.family_id AND b.director_id = dc.director_id
          WHERE dc.director_id = $1
          GROUP BY dc.id, up.name
          ORDER BY total_bookings DESC
        `,
        params: [generateRandomId()],
      },
      {
        name: 'venue_booking_analytics',
        query: `
          SELECT 
            v.venue_name,
            DATE_TRUNC('month', b.date) as month,
            COUNT(b.id) as booking_count,
            AVG(b.duration) as avg_duration,
            SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed_bookings
          FROM bookings b
          JOIN user_profiles v ON b.venue_id = v.id
          WHERE b.date >= $1 AND b.date <= $2
          GROUP BY v.id, v.venue_name, DATE_TRUNC('month', b.date)
          ORDER BY month DESC, booking_count DESC
        `,
        params: ['2024-01-01', '2024-12-31'],
      },
      {
        name: 'document_audit_trail',
        query: `
          SELECT 
            d.filename,
            d.type,
            d.created_at,
            up.name as family_name,
            al.action,
            al.created_at as action_time
          FROM documents d
          JOIN user_profiles up ON d.family_id = up.id
          LEFT JOIN audit_logs al ON al.resource_id = d.id::text AND al.resource_type = 'document'
          WHERE d.created_at >= $1
          ORDER BY d.created_at DESC, al.created_at DESC
          LIMIT 100
        `,
        params: ['2024-01-01'],
      },
    ];
    
    intensiveQueries.forEach(({ name, query, params }) => {
      const startTime = Date.now();
      
      try {
        const result = sql.query(db, query, ...params);
        const duration = Date.now() - startTime;
        
        queryDuration.add(duration, { query_type: name, load_type: 'high' });
        querySuccess.add(1, { query_type: name, load_type: 'high' });
        
        if (duration > 200) {
          slowQueries.add(1, { query_type: name });
        }
        
        check(result, {
          [`${name} high load query successful`]: (r) => r.length >= 0,
          [`${name} high load query acceptable`]: () => duration < 500,
        });
        
      } catch (error) {
        querySuccess.add(0, { query_type: name, load_type: 'high' });
        console.error(`High load query ${name} failed:`, error.message);
      }
      
      sleep(0.05); // Shorter sleep for high load
    });
  });
  
  sql.close(db);
  sleep(Math.random() * 1 + 0.5);
}

// Connection pool testing
export function testConnectionPool(data) {
  group('Connection Pool Testing', () => {
    let connections = [];
    
    try {
      // Try to create multiple connections
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        
        try {
          const db = sql.open('postgres', DB_CONNECTION);
          const connectionTime = Date.now() - startTime;
          
          if (connectionTime > 1000) {
            connectionTimeouts.add(1);
          }
          
          connections.push(db);
          
          // Test query on each connection
          const result = sql.query(db, 'SELECT $1 as connection_test', `connection_${i}`);
          
          check(result, {
            'connection pool query successful': (r) => r.length === 1,
          });
          
        } catch (error) {
          console.error(`Connection ${i} failed:`, error.message);
          connectionTimeouts.add(1);
        }
        
        sleep(0.1);
      }
      
      // Monitor connection pool utilization
      const utilization = (connections.length / K6_CONFIG.DB_CONFIG.poolConfig.max) * 100;
      connectionPoolUtilization.add(utilization);
      
      // Test concurrent queries on all connections
      connections.forEach((db, index) => {
        try {
          const startTime = Date.now();
          const result = sql.query(db, 'SELECT NOW() as current_time, $1 as connection_id', index);
          const duration = Date.now() - startTime;
          
          queryDuration.add(duration, { test_type: 'connection_pool' });
          
        } catch (error) {
          console.error(`Concurrent query on connection ${index} failed:`, error.message);
        }
      });
      
    } finally {
      // Clean up connections
      connections.forEach(db => {
        try {
          sql.close(db);
        } catch (error) {
          console.error('Error closing connection:', error.message);
        }
      });
    }
  });
  
  sleep(1);
}

// Index effectiveness testing
export function testIndexEffectiveness(data) {
  const db = sql.open('postgres', DB_CONNECTION);
  
  group('Index Effectiveness Testing', () => {
    // Test queries that should use indexes
    const indexTestQueries = [
      {
        name: 'email_index_test',
        query: 'EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM user_profiles WHERE email = $1',
        params: ['test@farewelly.nl'],
        expectedIndex: 'user_profiles_email_idx',
      },
      {
        name: 'booking_family_index_test',
        query: 'EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM bookings WHERE family_id = $1',
        params: [generateRandomId()],
        expectedIndex: 'bookings_family_id_idx',
      },
      {
        name: 'booking_date_index_test',
        query: 'EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM bookings WHERE date >= $1 AND date <= $2',
        params: ['2024-01-01', '2024-12-31'],
        expectedIndex: 'bookings_date_idx',
      },
      {
        name: 'chat_messages_room_index_test',
        query: 'EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM chat_messages WHERE room_id = $1 ORDER BY created_at DESC',
        params: [generateRandomId()],
        expectedIndex: 'chat_messages_room_created_idx',
      },
    ];
    
    let totalIndexHits = 0;
    let totalQueries = 0;
    
    indexTestQueries.forEach(({ name, query, params, expectedIndex }) => {
      try {
        const result = sql.query(db, query, ...params);
        const executionPlan = result[0]?.['QUERY PLAN'] || '';
        
        totalQueries++;
        
        // Check if index was used
        const indexUsed = executionPlan.includes('Index Scan') || 
                         executionPlan.includes('Index Only Scan') ||
                         executionPlan.includes(expectedIndex);
        
        if (indexUsed) {
          totalIndexHits++;
        } else {
          tableScans.add(1, { query_type: name });
          console.log(`⚠️  Table scan detected for ${name}`);
        }
        
        // Extract execution time if available
        const timeMatch = executionPlan.match(/actual time=[\d.]+\.\.[\d.]+/);
        if (timeMatch) {
          const executionTime = parseFloat(timeMatch[0].split('..')[1]);
          queryDuration.add(executionTime, { query_type: name, test_type: 'index' });
        }
        
        check(result, {
          [`${name} execution plan available`]: (r) => r.length > 0,
          [`${name} uses index`]: () => indexUsed,
        });
        
      } catch (error) {
        console.error(`Index test ${name} failed:`, error.message);
      }
      
      sleep(0.2);
    });
    
    // Calculate and record index hit ratio
    const hitRatio = totalQueries > 0 ? (totalIndexHits / totalQueries) * 100 : 0;
    indexHitRatio.add(hitRatio);
    
    // Test cache hit ratio
    try {
      const cacheStatsResult = sql.query(db, `
        SELECT 
          sum(heap_blks_read) as heap_read,
          sum(heap_blks_hit) as heap_hit,
          sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as hit_ratio
        FROM pg_statio_user_tables
      `);
      
      if (cacheStatsResult.length > 0 && cacheStatsResult[0].hit_ratio) {
        cacheHitRatio.add(cacheStatsResult[0].hit_ratio);
      }
      
    } catch (error) {
      console.error('Cache hit ratio query failed:', error.message);
    }
  });
  
  sql.close(db);
  sleep(1);
}

// Transaction performance testing
export function testTransactionPerformance(data) {
  const db = sql.open('postgres', DB_CONNECTION);
  
  group('Transaction Performance Testing', () => {
    const transactionStartTime = Date.now();
    
    try {
      // Begin transaction
      sql.query(db, 'BEGIN');
      
      // Simulate a complex business transaction
      const transactionOperations = [
        {
          name: 'create_booking',
          query: `
            INSERT INTO bookings (family_id, director_id, venue_id, service_type, date, time, duration, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            RETURNING id
          `,
          params: [
            generateRandomId(),
            generateRandomId(),
            generateRandomId(),
            'crematie',
            '2024-06-15',
            '14:00',
            120,
            'pending'
          ],
        },
        {
          name: 'update_availability',
          query: `
            UPDATE venue_availability 
            SET time_slots = jsonb_set(time_slots, '{0,is_available}', 'false')
            WHERE venue_id = $1 AND date = $2
          `,
          params: [generateRandomId(), '2024-06-15'],
        },
        {
          name: 'create_notification',
          query: `
            INSERT INTO notifications (user_id, type, title, message, data, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          `,
          params: [
            generateRandomId(),
            'booking',
            'New Booking Created',
            'A new booking has been created',
            '{"booking_id": "123"}',
          ],
        },
        {
          name: 'update_client_relationship',
          query: `
            UPDATE director_clients 
            SET updated_at = NOW(),
                last_booking_date = $2
            WHERE director_id = $1
          `,
          params: [generateRandomId(), '2024-06-15'],
        },
      ];
      
      let operationCount = 0;
      let operationSuccess = 0;
      
      for (const { name, query, params } of transactionOperations) {
        const operationStartTime = Date.now();
        
        try {
          const result = sql.query(db, query, ...params);
          const operationDuration = Date.now() - operationStartTime;
          
          queryDuration.add(operationDuration, { 
            query_type: name, 
            test_type: 'transaction' 
          });
          
          operationCount++;
          operationSuccess++;
          
          check(result, {
            [`transaction ${name} successful`]: (r) => r !== null,
            [`transaction ${name} fast`]: () => operationDuration < 100,
          });
          
        } catch (error) {
          console.error(`Transaction operation ${name} failed:`, error.message);
          operationCount++;
          
          if (error.message.includes('deadlock')) {
            deadlocks.add(1);
          }
        }
        
        sleep(0.01); // Small delay between operations
      }
      
      // Commit transaction
      sql.query(db, 'COMMIT');
      
      const totalTransactionTime = Date.now() - transactionStartTime;
      queryDuration.add(totalTransactionTime, { 
        query_type: 'full_transaction',
        test_type: 'transaction' 
      });
      
      const transactionSuccess = operationSuccess === operationCount;
      querySuccess.add(transactionSuccess ? 1 : 0, { test_type: 'transaction' });
      
      check(null, {
        'transaction completed successfully': () => transactionSuccess,
        'transaction completed quickly': () => totalTransactionTime < 500,
      });
      
    } catch (error) {
      // Rollback on error
      try {
        sql.query(db, 'ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError.message);
      }
      
      querySuccess.add(0, { test_type: 'transaction' });
      console.error('Transaction failed:', error.message);
      
      if (error.message.includes('deadlock')) {
        deadlocks.add(1);
      }
    }
  });
  
  sql.close(db);
  sleep(0.5);
}

// Complex query testing
export function testComplexQueries(data) {
  const db = sql.open('postgres', DB_CONNECTION);
  
  group('Complex Query Testing', () => {
    const complexQueries = [
      {
        name: 'revenue_analytics',
        query: `
          WITH monthly_revenue AS (
            SELECT 
              DATE_TRUNC('month', b.date) as month,
              up_venue.venue_name,
              up_director.name as director_name,
              COUNT(b.id) as booking_count,
              SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as revenue
            FROM bookings b
            LEFT JOIN payments p ON p.booking_id = b.id
            LEFT JOIN user_profiles up_venue ON b.venue_id = up_venue.id
            LEFT JOIN user_profiles up_director ON b.director_id = up_director.id
            WHERE b.date >= $1 AND b.date <= $2
            GROUP BY DATE_TRUNC('month', b.date), up_venue.venue_name, up_director.name
          )
          SELECT 
            month,
            venue_name,
            director_name,
            booking_count,
            revenue,
            LAG(revenue) OVER (PARTITION BY venue_name ORDER BY month) as prev_month_revenue,
            revenue - LAG(revenue) OVER (PARTITION BY venue_name ORDER BY month) as revenue_change
          FROM monthly_revenue
          ORDER BY month DESC, revenue DESC
          LIMIT 50
        `,
        params: ['2024-01-01', '2024-12-31'],
      },
      {
        name: 'family_engagement_analysis',
        query: `
          WITH family_metrics AS (
            SELECT 
              f.id as family_id,
              f.name as family_name,
              COUNT(DISTINCT b.id) as total_bookings,
              COUNT(DISTINCT cm.id) as total_messages,
              COUNT(DISTINCT d.id) as total_documents,
              AVG(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completion_rate,
              MAX(b.created_at) as last_booking_date,
              MAX(cm.created_at) as last_message_date
            FROM user_profiles f
            LEFT JOIN bookings b ON f.id = b.family_id
            LEFT JOIN chat_messages cm ON cm.sender_id = f.id
            LEFT JOIN documents d ON f.id = d.family_id
            WHERE f.user_type = 'family'
            GROUP BY f.id, f.name
          )
          SELECT 
            family_id,
            family_name,
            total_bookings,
            total_messages,
            total_documents,
            completion_rate,
            last_booking_date,
            last_message_date,
            CASE 
              WHEN total_bookings = 0 THEN 'inactive'
              WHEN total_bookings < 2 THEN 'low_engagement'
              WHEN total_bookings < 5 THEN 'medium_engagement'
              ELSE 'high_engagement'
            END as engagement_level
          FROM family_metrics
          WHERE total_bookings > 0 OR total_messages > 0
          ORDER BY total_bookings DESC, total_messages DESC
          LIMIT 100
        `,
        params: [],
      },
      {
        name: 'venue_utilization_report',
        query: `
          WITH venue_stats AS (
            SELECT 
              v.id as venue_id,
              v.venue_name,
              v.capacity,
              COUNT(b.id) as total_bookings,
              COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
              COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
              AVG(b.duration) as avg_duration,
              SUM(b.duration) as total_duration_minutes,
              COUNT(DISTINCT b.family_id) as unique_families,
              COUNT(DISTINCT b.director_id) as unique_directors
            FROM user_profiles v
            LEFT JOIN bookings b ON v.id = b.venue_id
            WHERE v.user_type = 'venue'
            GROUP BY v.id, v.venue_name, v.capacity
          ),
          capacity_utilization AS (
            SELECT 
              venue_id,
              venue_name,
              capacity,
              total_bookings,
              completed_bookings,
              cancelled_bookings,
              avg_duration,
              total_duration_minutes,
              unique_families,
              unique_directors,
              CASE 
                WHEN capacity > 0 THEN (completed_bookings::float / capacity) * 100
                ELSE 0
              END as utilization_percentage,
              CASE 
                WHEN total_bookings > 0 THEN (cancelled_bookings::float / total_bookings) * 100
                ELSE 0
              END as cancellation_rate
            FROM venue_stats
          )
          SELECT 
            venue_name,
            capacity,
            total_bookings,
            completed_bookings,
            cancelled_bookings,
            ROUND(avg_duration, 2) as avg_duration_minutes,
            total_duration_minutes,
            unique_families,
            unique_directors,
            ROUND(utilization_percentage, 2) as utilization_percentage,
            ROUND(cancellation_rate, 2) as cancellation_rate,
            CASE 
              WHEN utilization_percentage > 80 THEN 'high_utilization'
              WHEN utilization_percentage > 50 THEN 'medium_utilization'
              WHEN utilization_percentage > 20 THEN 'low_utilization'
              ELSE 'very_low_utilization'
            END as utilization_category
          FROM capacity_utilization
          ORDER BY utilization_percentage DESC, total_bookings DESC
        `,
        params: [],
      },
    ];
    
    complexQueries.forEach(({ name, query, params }) => {
      const startTime = Date.now();
      
      try {
        const result = sql.query(db, query, ...params);
        const duration = Date.now() - startTime;
        
        queryDuration.add(duration, { 
          query_type: name, 
          test_type: 'complex' 
        });
        querySuccess.add(1, { query_type: name, test_type: 'complex' });
        
        // Flag very slow complex queries
        if (duration > 1000) {
          slowQueries.add(1, { query_type: name });
          console.log(`⚠️  Slow complex query ${name}: ${duration}ms`);
        }
        
        check(result, {
          [`${name} complex query successful`]: (r) => r.length >= 0,
          [`${name} complex query acceptable performance`]: () => duration < 2000,
          [`${name} returns data`]: (r) => r.length > 0,
        });
        
        console.log(`Complex query ${name}: ${duration}ms, ${result.length} rows`);
        
      } catch (error) {
        querySuccess.add(0, { query_type: name, test_type: 'complex' });
        console.error(`Complex query ${name} failed:`, error.message);
        
        if (error.message.includes('timeout')) {
          connectionTimeouts.add(1);
        }
      }
      
      sleep(0.5); // Longer sleep for complex queries
    });
  });
  
  sql.close(db);
  sleep(2);
}

// Helper functions
function generateRandomId() {
  return Math.floor(Math.random() * 1000000) + 1;
}

export function teardown(data) {
  console.log('🗄️  Database performance testing completed');
  console.log('📊 Check metrics for:');
  console.log('  - Query performance (duration, success rate)');
  console.log('  - Index effectiveness (hit ratio, table scans)');
  console.log('  - Connection pool utilization');
  console.log('  - Transaction performance');
  console.log('  - Complex query optimization');
  console.log('✅ Database test teardown complete');
}