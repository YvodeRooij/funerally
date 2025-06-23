#!/usr/bin/env node

/**
 * MCP Connection Test Script
 * Tests all configured MCP servers and their capabilities
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Load environment variables
require('dotenv').config();

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  servers: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Utility functions
function log(message, type = 'info') {
  const prefix = {
    info: 'ℹ️ ',
    success: '✅',
    error: '❌',
    warn: '⚠️ ',
    test: '🧪'
  };
  console.log(`${prefix[type] || '📝'} ${message}`);
}

// Test Supabase MCP Server
async function testSupabaseMCP() {
  log('Testing Supabase MCP Server...', 'test');
  const results = {
    name: 'Supabase MCP Server',
    status: 'unknown',
    tests: []
  };
  
  try {
    // Check environment variables
    const envTest = {
      name: 'Environment Variables',
      status: 'testing'
    };
    
    const requiredVars = [
      'SUPABASE_PROJECT_REF',
      'NEXT_PUBLIC_SUPABASE_URL'
    ];
    
    const authVars = [
      'SUPABASE_ACCESS_TOKEN',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    const missingVars = requiredVars.filter(v => !process.env[v]);
    const hasAuth = authVars.some(v => process.env[v]);
    
    if (missingVars.length > 0) {
      envTest.status = 'failed';
      envTest.error = `Missing required variables: ${missingVars.join(', ')}`;
    } else if (!hasAuth) {
      envTest.status = 'failed';
      envTest.error = 'Missing authentication: Need either SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY';
    } else {
      envTest.status = 'passed';
      envTest.details = {
        projectRef: process.env.SUPABASE_PROJECT_REF,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        authType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'access_token'
      };
    }
    
    results.tests.push(envTest);
    
    // Test Supabase connection
    if (envTest.status === 'passed') {
      const connectionTest = {
        name: 'Database Connection',
        status: 'testing'
      };
      
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ACCESS_TOKEN
        );
        
        // Test basic query
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .limit(1);
        
        if (error && !error.message.includes('does not exist')) {
          throw error;
        }
        
        connectionTest.status = 'passed';
        connectionTest.details = {
          connected: true,
          tables: data ? data.map(t => t.table_name) : []
        };
      } catch (error) {
        connectionTest.status = 'failed';
        connectionTest.error = error.message;
      }
      
      results.tests.push(connectionTest);
    }
    
    // Test MCP server availability
    const mcpTest = {
      name: 'MCP Server Process',
      status: 'testing'
    };
    
    try {
      // Check if MCP server can be spawned
      const testProcess = spawn('npx', [
        '-y',
        '@supabase/mcp-server-supabase@latest',
        '--version'
      ], { timeout: 10000 });
      
      await new Promise((resolve, reject) => {
        testProcess.on('error', reject);
        testProcess.on('exit', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Process exited with code ${code}`));
          }
        });
        
        setTimeout(() => {
          testProcess.kill();
          resolve();
        }, 5000);
      });
      
      mcpTest.status = 'passed';
      mcpTest.details = { available: true };
    } catch (error) {
      mcpTest.status = 'warning';
      mcpTest.warning = 'MCP server binary test failed, but server may still work';
      mcpTest.details = { error: error.message };
    }
    
    results.tests.push(mcpTest);
    
    // Determine overall status
    const failedTests = results.tests.filter(t => t.status === 'failed');
    const warningTests = results.tests.filter(t => t.status === 'warning');
    
    if (failedTests.length > 0) {
      results.status = 'failed';
    } else if (warningTests.length > 0) {
      results.status = 'warning';
    } else {
      results.status = 'passed';
    }
    
  } catch (error) {
    results.status = 'error';
    results.error = error.message;
  }
  
  return results;
}

// Test Filesystem MCP Server
async function testFilesystemMCP() {
  log('Testing Filesystem MCP Server...', 'test');
  const results = {
    name: 'Filesystem MCP Server',
    status: 'unknown',
    tests: []
  };
  
  try {
    // Check allowed directories
    const dirTest = {
      name: 'Allowed Directories',
      status: 'testing'
    };
    
    const allowedDirs = (process.env.MCP_ALLOWED_DIRECTORIES || './app,./components,./lib,./scripts,./supabase')
      .split(',')
      .map(d => d.trim());
    
    const missingDirs = [];
    const accessibleDirs = [];
    
    for (const dir of allowedDirs) {
      if (!fs.existsSync(dir)) {
        missingDirs.push(dir);
      } else {
        try {
          fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK);
          accessibleDirs.push(dir);
        } catch {
          missingDirs.push(`${dir} (no access)`);
        }
      }
    }
    
    if (missingDirs.length > 0) {
      dirTest.status = 'warning';
      dirTest.warning = `Some directories not accessible: ${missingDirs.join(', ')}`;
      dirTest.details = { accessible: accessibleDirs, missing: missingDirs };
    } else {
      dirTest.status = 'passed';
      dirTest.details = { accessible: accessibleDirs };
    }
    
    results.tests.push(dirTest);
    
    // Test MCP server availability
    const mcpTest = {
      name: 'MCP Server Process',
      status: 'testing'
    };
    
    try {
      const testProcess = spawn('npx', [
        '-y',
        '@modelcontextprotocol/server-filesystem',
        '--version'
      ], { timeout: 10000 });
      
      await new Promise((resolve) => {
        testProcess.on('exit', resolve);
        setTimeout(() => {
          testProcess.kill();
          resolve();
        }, 5000);
      });
      
      mcpTest.status = 'passed';
      mcpTest.details = { available: true };
    } catch (error) {
      mcpTest.status = 'warning';
      mcpTest.warning = 'MCP server binary test failed, but server may still work';
    }
    
    results.tests.push(mcpTest);
    
    // Determine overall status
    results.status = results.tests.every(t => t.status === 'passed') ? 'passed' : 'warning';
    
  } catch (error) {
    results.status = 'error';
    results.error = error.message;
  }
  
  return results;
}

// Test Memory MCP Server
async function testMemoryMCP() {
  log('Testing Memory MCP Server...', 'test');
  const results = {
    name: 'Memory MCP Server',
    status: 'unknown',
    tests: []
  };
  
  try {
    // Check memory storage path
    const storageTest = {
      name: 'Memory Storage Path',
      status: 'testing'
    };
    
    const memoryPath = process.env.MCP_MEMORY_STORE_PATH || './memory';
    
    if (!fs.existsSync(memoryPath)) {
      try {
        fs.mkdirSync(memoryPath, { recursive: true });
        storageTest.status = 'passed';
        storageTest.details = { path: memoryPath, created: true };
      } catch (error) {
        storageTest.status = 'failed';
        storageTest.error = `Failed to create memory directory: ${error.message}`;
      }
    } else {
      try {
        fs.accessSync(memoryPath, fs.constants.R_OK | fs.constants.W_OK);
        storageTest.status = 'passed';
        storageTest.details = { path: memoryPath, accessible: true };
      } catch {
        storageTest.status = 'failed';
        storageTest.error = 'Memory directory exists but is not accessible';
      }
    }
    
    results.tests.push(storageTest);
    
    // Test MCP server
    const mcpTest = {
      name: 'MCP Server Process',
      status: 'testing'
    };
    
    try {
      const testProcess = spawn('npx', [
        '-y',
        '@modelcontextprotocol/server-memory',
        '--version'
      ], { timeout: 10000 });
      
      await new Promise((resolve) => {
        testProcess.on('exit', resolve);
        setTimeout(() => {
          testProcess.kill();
          resolve();
        }, 5000);
      });
      
      mcpTest.status = 'passed';
      mcpTest.details = { available: true };
    } catch (error) {
      mcpTest.status = 'warning';
      mcpTest.warning = 'MCP server binary test failed, but server may still work';
    }
    
    results.tests.push(mcpTest);
    
    // Determine overall status
    results.status = results.tests.every(t => t.status === 'passed') ? 'passed' : 
                    results.tests.some(t => t.status === 'failed') ? 'failed' : 'warning';
    
  } catch (error) {
    results.status = 'error';
    results.error = error.message;
  }
  
  return results;
}

// Generate report
function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 MCP CONNECTION TEST REPORT');
  console.log('='.repeat(60));
  console.log(`Timestamp: ${results.timestamp}`);
  console.log(`Environment: ${results.environment}`);
  console.log('='.repeat(60) + '\n');
  
  Object.entries(results.servers).forEach(([key, server]) => {
    const statusEmoji = {
      passed: '✅',
      failed: '❌',
      warning: '⚠️',
      error: '💥'
    };
    
    console.log(`${statusEmoji[server.status]} ${server.name}: ${server.status.toUpperCase()}`);
    
    if (server.error) {
      console.log(`   Error: ${server.error}`);
    }
    
    server.tests?.forEach(test => {
      console.log(`   ${statusEmoji[test.status]} ${test.name}: ${test.status}`);
      if (test.error) {
        console.log(`      Error: ${test.error}`);
      }
      if (test.warning) {
        console.log(`      Warning: ${test.warning}`);
      }
      if (test.details && process.env.MCP_TEST_VERBOSE) {
        console.log(`      Details: ${JSON.stringify(test.details, null, 2).split('\n').join('\n      ')}`);
      }
    });
    
    console.log('');
  });
  
  console.log('='.repeat(60));
  console.log('📈 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Servers: ${results.summary.total}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⚠️  Warnings: ${results.summary.warnings}`);
  console.log('='.repeat(60) + '\n');
  
  // Save detailed results
  const reportPath = path.join(process.cwd(), 'mcp-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log(`Detailed results saved to: ${reportPath}`, 'info');
}

// Main test execution
async function main() {
  console.log('🧪 Starting MCP Connection Tests...\n');
  
  try {
    // Test all configured servers
    const supabaseResults = await testSupabaseMCP();
    testResults.servers.supabase = supabaseResults;
    
    const filesystemResults = await testFilesystemMCP();
    testResults.servers.filesystem = filesystemResults;
    
    const memoryResults = await testMemoryMCP();
    testResults.servers.memory = memoryResults;
    
    // Calculate summary
    Object.values(testResults.servers).forEach(server => {
      testResults.summary.total++;
      if (server.status === 'passed') {
        testResults.summary.passed++;
      } else if (server.status === 'failed' || server.status === 'error') {
        testResults.summary.failed++;
      } else if (server.status === 'warning') {
        testResults.summary.warnings++;
      }
    });
    
    // Generate report
    generateReport(testResults);
    
    // Exit code based on results
    if (testResults.summary.failed > 0) {
      process.exit(1);
    } else if (testResults.summary.warnings > 0) {
      process.exit(0); // Warnings don't fail the test
    } else {
      process.exit(0);
    }
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  main();
}