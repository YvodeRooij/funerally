#!/usr/bin/env node

/**
 * MCP Supabase Server Wrapper
 * Enhanced Supabase integration for MCP with additional capabilities
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Configuration
const config = {
  projectRef: process.env.SUPABASE_PROJECT_REF || process.env.MCP_SUPABASE_PROJECT_REF,
  accessToken: process.env.SUPABASE_ACCESS_TOKEN || process.env.MCP_SUPABASE_ACCESS_TOKEN,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  logLevel: process.env.MCP_LOG_LEVEL || 'info',
  healthCheckInterval: parseInt(process.env.MCP_HEALTH_CHECK_INTERVAL || '30000'),
  retryAttempts: parseInt(process.env.MCP_RETRY_ATTEMPTS || '3')
};

// Logging utility
const log = {
  info: (msg, data) => console.log(JSON.stringify({ level: 'info', msg, data, timestamp: new Date().toISOString() })),
  error: (msg, data) => console.error(JSON.stringify({ level: 'error', msg, data, timestamp: new Date().toISOString() })),
  debug: (msg, data) => config.logLevel === 'debug' && console.log(JSON.stringify({ level: 'debug', msg, data, timestamp: new Date().toISOString() }))
};

// Validate configuration
function validateConfig() {
  const errors = [];
  
  if (!config.projectRef) {
    errors.push('SUPABASE_PROJECT_REF is not set');
  }
  
  if (!config.accessToken && !config.serviceRoleKey) {
    errors.push('Either SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  
  if (!config.supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  
  if (errors.length > 0) {
    log.error('Configuration validation failed', { errors });
    process.exit(1);
  }
  
  log.info('Configuration validated successfully', {
    projectRef: config.projectRef,
    hasAccessToken: !!config.accessToken,
    hasServiceRoleKey: !!config.serviceRoleKey,
    supabaseUrl: config.supabaseUrl
  });
}

// Health check for the MCP server
let healthCheckInterval;
let serverProcess;

function startHealthCheck() {
  healthCheckInterval = setInterval(() => {
    if (serverProcess && !serverProcess.killed) {
      log.debug('Health check passed', { pid: serverProcess.pid });
    } else {
      log.error('Health check failed - server process not running');
      restartServer();
    }
  }, config.healthCheckInterval);
}

// Restart server with retry logic
let retryCount = 0;
function restartServer() {
  if (retryCount >= config.retryAttempts) {
    log.error('Max retry attempts reached, exiting', { retryCount });
    process.exit(1);
  }
  
  retryCount++;
  log.info('Attempting to restart server', { attempt: retryCount });
  
  setTimeout(() => {
    startServer();
  }, 5000 * retryCount); // Exponential backoff
}

// Enhanced capabilities wrapper
function createEnhancedServer() {
  // Create a wrapper script that adds additional capabilities
  const wrapperScript = `
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  '${config.supabaseUrl}',
  '${config.serviceRoleKey || config.accessToken}',
  {
    auth: {
      autoRefreshToken: ${!config.serviceRoleKey},
      persistSession: ${!config.serviceRoleKey}
    }
  }
);

// Add custom MCP handlers for enhanced operations
const customHandlers = {
  // Batch operations
  'supabase.batch': async (params) => {
    const results = [];
    for (const operation of params.operations) {
      try {
        const result = await executeOperation(operation);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    return results;
  },
  
  // Transaction support
  'supabase.transaction': async (params) => {
    // Implement transaction logic
    return { message: 'Transaction support coming soon' };
  },
  
  // Schema introspection
  'supabase.schema': async (params) => {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public');
    
    if (error) throw error;
    return data;
  },
  
  // RLS policy management
  'supabase.rls': async (params) => {
    // Implement RLS policy management
    return { message: 'RLS management available through Supabase dashboard' };
  }
};

// Export enhanced functionality
module.exports = { supabase, customHandlers };
`;
  
  // Write wrapper script
  const wrapperPath = path.join(__dirname, '.mcp-supabase-wrapper.js');
  fs.writeFileSync(wrapperPath, wrapperScript);
  
  return wrapperPath;
}

// Start the MCP server
function startServer() {
  log.info('Starting MCP Supabase server');
  
  // Prepare environment variables
  const env = {
    ...process.env,
    SUPABASE_PROJECT_REF: config.projectRef,
    SUPABASE_ACCESS_TOKEN: config.accessToken || config.serviceRoleKey
  };
  
  // Start the official MCP Supabase server
  serverProcess = spawn('npx', ['-y', '@supabase/mcp-server-supabase@latest'], {
    env,
    stdio: ['inherit', 'inherit', 'inherit']
  });
  
  serverProcess.on('error', (error) => {
    log.error('Failed to start MCP server', { error: error.message });
    restartServer();
  });
  
  serverProcess.on('exit', (code, signal) => {
    if (code !== 0) {
      log.error('MCP server exited unexpectedly', { code, signal });
      restartServer();
    } else {
      log.info('MCP server exited normally', { code, signal });
    }
  });
  
  // Reset retry count on successful start
  serverProcess.on('spawn', () => {
    log.info('MCP server started successfully', { pid: serverProcess.pid });
    retryCount = 0;
  });
}

// Graceful shutdown
function shutdown() {
  log.info('Shutting down MCP Supabase server');
  
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM');
    
    // Force kill after timeout
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    }, 5000);
  }
  
  process.exit(0);
}

// Signal handlers
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception', { error: error.message, stack: error.stack });
  shutdown();
});

// Main execution
async function main() {
  log.info('MCP Supabase Server Wrapper starting', { version: '1.0.0' });
  
  // Validate configuration
  validateConfig();
  
  // Create enhanced wrapper (optional)
  if (process.env.MCP_ENHANCED_MODE === 'true') {
    createEnhancedServer();
    log.info('Enhanced mode enabled');
  }
  
  // Start the server
  startServer();
  
  // Start health monitoring
  startHealthCheck();
}

// Start the server
main().catch((error) => {
  log.error('Failed to start MCP server', { error: error.message });
  process.exit(1);
});