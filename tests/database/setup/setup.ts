import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { Pool, Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: join(__dirname, '../../../.env.test') });

// Test database configuration
const TEST_DB_CONFIG = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  database: process.env.TEST_DB_NAME || 'farewelly_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
  ssl: process.env.TEST_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Global database connection pool
let testPool: Pool;
let adminClient: Client;

// Schema files paths
const SCHEMA_FILES = [
  '../../../db/schema/01_core_entities.sql',
  '../../../db/schema/02_document_storage.sql',
  '../../../db/schema/03_audit_logging.sql',
  '../../../db/policies/row_level_security.sql',
  '../../../db/indexes/performance_indexes.sql',
];

/**
 * Create test database if it doesn't exist
 */
async function createTestDatabase() {
  const adminConfig = {
    ...TEST_DB_CONFIG,
    database: 'postgres', // Connect to default database to create test DB
  };

  adminClient = new Client(adminConfig);
  
  try {
    await adminClient.connect();
    
    // Check if test database exists
    const result = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [TEST_DB_CONFIG.database]
    );
    
    if (result.rows.length === 0) {
      console.log(`Creating test database: ${TEST_DB_CONFIG.database}`);
      await adminClient.query(`CREATE DATABASE "${TEST_DB_CONFIG.database}"`);
    }
  } catch (error) {
    console.error('Error creating test database:', error);
    throw error;
  }
}

/**
 * Load and execute SQL schema files
 */
async function loadSchema() {
  const client = await testPool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Enable extensions
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    
    // Execute schema files in order
    for (const schemaFile of SCHEMA_FILES) {
      const filePath = join(__dirname, schemaFile);
      try {
        const sql = readFileSync(filePath, 'utf8');
        await client.query(sql);
        console.log(`Executed schema: ${schemaFile}`);
      } catch (error) {
        console.warn(`Warning: Could not load ${schemaFile}:`, error);
        // Continue with other files
      }
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error loading schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Clean all test data from the database
 */
async function cleanDatabase() {
  const client = await testPool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get all table names from public schema
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
      ORDER BY tablename
    `);
    
    // Disable all triggers temporarily for faster cleanup
    await client.query('SET session_replication_role = replica');
    
    // Truncate all tables in reverse dependency order
    const tables = tablesResult.rows.map(row => row.tablename);
    for (const table of tables.reverse()) {
      await client.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
    }
    
    // Re-enable triggers
    await client.query('SET session_replication_role = DEFAULT');
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    await client.query('SET session_replication_role = DEFAULT');
    console.error('Error cleaning database:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Setup database connection and schema before all tests
 */
beforeAll(async () => {
  console.log('Setting up database test environment...');
  
  try {
    // Create test database
    await createTestDatabase();
    
    // Create connection pool
    testPool = new Pool(TEST_DB_CONFIG);
    
    // Test connection
    const client = await testPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    // Load database schema
    await loadSchema();
    
    console.log('Database test environment ready');
  } catch (error) {
    console.error('Failed to setup database test environment:', error);
    throw error;
  }
}, 60000);

/**
 * Clean database before each test
 */
beforeEach(async () => {
  await cleanDatabase();
});

/**
 * Cleanup after each test
 */
afterEach(async () => {
  // Close any open transactions
  const client = await testPool.connect();
  try {
    await client.query('ROLLBACK');
  } catch {
    // Ignore if no transaction is active
  } finally {
    client.release();
  }
});

/**
 * Cleanup after all tests
 */
afterAll(async () => {
  console.log('Cleaning up database test environment...');
  
  try {
    // Close connection pool
    if (testPool) {
      await testPool.end();
    }
    
    // Close admin connection
    if (adminClient) {
      await adminClient.end();
    }
    
    console.log('Database test environment cleaned up');
  } catch (error) {
    console.error('Error cleaning up database test environment:', error);
  }
});

// Export test utilities for use in tests
export { testPool, TEST_DB_CONFIG };

/**
 * Get a database client for testing
 */
export async function getTestClient() {
  return testPool.connect();
}

/**
 * Execute SQL query with test pool
 */
export async function executeQuery(sql: string, params?: any[]) {
  const client = await testPool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

/**
 * Get test database connection info
 */
export function getTestDbConfig() {
  return { ...TEST_DB_CONFIG };
}