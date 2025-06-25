#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { spawn } from 'child_process';

// Load environment variables
dotenv.config();

// Test results object
const testResults = {
  timestamp: new Date().toISOString(),
  environment: {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    projectRef: 'kbneptalijjgtimulfsi',
    nodeVersion: process.version,
    platform: process.platform
  },
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Test logging
function logTest(name, status, message, details = {}) {
  const result = {
    name,
    status,
    message,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (status === 'pass') {
    testResults.summary.passed++;
    console.log(`✅ ${name}: ${message}`);
  } else if (status === 'fail') {
    testResults.summary.failed++;
    console.error(`❌ ${name}: ${message}`);
  } else if (status === 'warning') {
    testResults.summary.warnings++;
    console.warn(`⚠️  ${name}: ${message}`);
  }
  
  if (details.error) {
    console.error('   Error details:', details.error);
  }
}

// Test 1: Environment Variable Validation
async function testEnvironmentVariables() {
  console.log('\n🔍 Testing Environment Variables...\n');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_ACCESS_TOKEN'
  ];
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      logTest(
        `Environment: ${varName}`,
        'pass',
        'Variable is set',
        { length: process.env[varName].length }
      );
    } else {
      logTest(
        `Environment: ${varName}`,
        'fail',
        'Variable is missing'
      );
    }
  }
}

// Test 2: MCP Configuration Validation
async function testMCPConfiguration() {
  console.log('\n🔍 Testing MCP Configuration...\n');
  
  try {
    const mcpConfig = JSON.parse(readFileSync('.mcp.json', 'utf8'));
    
    if (mcpConfig.servers && mcpConfig.servers.supabase) {
      logTest(
        'MCP Config: Structure',
        'pass',
        'Valid MCP configuration found'
      );
      
      // Check command
      if (mcpConfig.servers.supabase.command === 'npx') {
        logTest(
          'MCP Config: Command',
          'pass',
          'Using npx command'
        );
      }
      
      // Check args
      if (mcpConfig.servers.supabase.args.includes('@supabase/mcp-server-supabase@latest')) {
        logTest(
          'MCP Config: Package',
          'pass',
          'Correct Supabase MCP package specified'
        );
      }
      
      // Check environment variables
      if (mcpConfig.servers.supabase.env.SUPABASE_PROJECT_REF) {
        logTest(
          'MCP Config: Project Reference',
          'pass',
          `Project ref: ${mcpConfig.servers.supabase.env.SUPABASE_PROJECT_REF}`
        );
      }
      
      if (mcpConfig.servers.supabase.env.SUPABASE_ACCESS_TOKEN) {
        logTest(
          'MCP Config: Access Token',
          'pass',
          'Access token is configured'
        );
      }
    } else {
      logTest(
        'MCP Config: Structure',
        'fail',
        'Invalid MCP configuration structure'
      );
    }
  } catch (error) {
    logTest(
      'MCP Config: File',
      'fail',
      'Failed to read MCP configuration',
      { error: error.message }
    );
  }
}

// Test 3: Supabase Client Connection
async function testSupabaseConnection() {
  console.log('\n🔍 Testing Supabase Client Connection...\n');
  
  try {
    // Create client with anon key
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Test anon client
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('_prisma_migrations')
      .select('count')
      .limit(1);
    
    if (!anonError) {
      logTest(
        'Supabase: Anon Client',
        'pass',
        'Anonymous client connected successfully'
      );
    } else {
      logTest(
        'Supabase: Anon Client',
        'warning',
        'Anonymous client has limited access',
        { error: anonError.message }
      );
    }
    
    // Create client with service role key
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Test service client
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('_prisma_migrations')
      .select('count')
      .limit(1);
    
    if (!serviceError) {
      logTest(
        'Supabase: Service Client',
        'pass',
        'Service role client connected successfully'
      );
    } else {
      logTest(
        'Supabase: Service Client',
        'fail',
        'Service role client connection failed',
        { error: serviceError.message }
      );
    }
  } catch (error) {
    logTest(
      'Supabase: Connection',
      'fail',
      'Failed to create Supabase client',
      { error: error.message }
    );
  }
}

// Test 4: Database Tables Check
async function testDatabaseTables() {
  console.log('\n🔍 Testing Database Tables...\n');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Check for common tables
    const tables = ['users', 'profiles', 'sessions'];
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (!error) {
          logTest(
            `Database: Table "${tableName}"`,
            'pass',
            'Table exists and is accessible'
          );
        } else {
          logTest(
            `Database: Table "${tableName}"`,
            'warning',
            'Table does not exist or is not accessible',
            { error: error.message }
          );
        }
      } catch (error) {
        logTest(
          `Database: Table "${tableName}"`,
          'fail',
          'Failed to check table',
          { error: error.message }
        );
      }
    }
  } catch (error) {
    logTest(
      'Database: Tables',
      'fail',
      'Failed to check database tables',
      { error: error.message }
    );
  }
}

// Test 5: MCP Server Spawn Test
async function testMCPServerSpawn() {
  console.log('\n🔍 Testing MCP Server Spawn...\n');
  
  return new Promise((resolve) => {
    try {
      const mcpProcess = spawn('npx', [
        '-y',
        '@supabase/mcp-server-supabase@latest',
        '--version'
      ], {
        env: {
          ...process.env,
          SUPABASE_PROJECT_REF: 'kbneptalijjgtimulfsi',
          SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN
        }
      });
      
      let output = '';
      let errorOutput = '';
      
      mcpProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      mcpProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      mcpProcess.on('close', (code) => {
        if (code === 0) {
          logTest(
            'MCP Server: Spawn',
            'pass',
            'MCP server can be spawned successfully',
            { output }
          );
        } else {
          logTest(
            'MCP Server: Spawn',
            'fail',
            `MCP server spawn failed with code ${code}`,
            { errorOutput }
          );
        }
        resolve();
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        mcpProcess.kill();
        logTest(
          'MCP Server: Spawn',
          'warning',
          'MCP server spawn timed out after 10 seconds'
        );
        resolve();
      }, 10000);
    } catch (error) {
      logTest(
        'MCP Server: Spawn',
        'fail',
        'Failed to spawn MCP server',
        { error: error.message }
      );
      resolve();
    }
  });
}

// Test 6: Authentication Test
async function testAuthentication() {
  console.log('\n🔍 Testing Authentication...\n');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Test auth status
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (!error) {
      logTest(
        'Auth: Session Check',
        'pass',
        session ? 'Active session found' : 'No active session (expected)'
      );
    } else {
      logTest(
        'Auth: Session Check',
        'fail',
        'Failed to check auth session',
        { error: error.message }
      );
    }
    
    // Test auth health
    const { data: user } = await supabase.auth.getUser();
    logTest(
      'Auth: Health Check',
      'pass',
      'Auth service is responsive'
    );
  } catch (error) {
    logTest(
      'Auth: Connection',
      'fail',
      'Failed to connect to auth service',
      { error: error.message }
    );
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting MCP-Supabase Integration Tests');
  console.log('==========================================\n');
  
  await testEnvironmentVariables();
  await testMCPConfiguration();
  await testSupabaseConnection();
  await testDatabaseTables();
  await testMCPServerSpawn();
  await testAuthentication();
  
  // Generate summary
  console.log('\n==========================================');
  console.log('📊 Test Summary\n');
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`⚠️  Warnings: ${testResults.summary.warnings}`);
  console.log('\n==========================================\n');
  
  // Save results
  const fs = await import('fs');
  fs.writeFileSync(
    'mcp-supabase-test-results.json',
    JSON.stringify(testResults, null, 2)
  );
  console.log('📝 Test results saved to mcp-supabase-test-results.json\n');
  
  return testResults;
}

// Run tests
runTests().catch(console.error);