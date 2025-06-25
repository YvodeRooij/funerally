#!/usr/bin/env node

/**
 * MCP Server Initialization Script
 * Sets up and configures MCP servers for the Funerally platform
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const readline = require('readline');

// Load environment variables
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const MCP_CONFIG_PATH = path.join(process.cwd(), '.mcp.json');
const ENV_PATH = path.join(process.cwd(), '.env');
const ENV_EXAMPLE_PATH = path.join(process.cwd(), '.env.example');

// Required environment variables
const requiredEnvVars = {
  SUPABASE_PROJECT_REF: {
    description: 'Supabase Project Reference ID',
    example: 'kbneptalijjgtimulfsi',
    source: 'Supabase Dashboard > Settings > General'
  },
  SUPABASE_ACCESS_TOKEN: {
    description: 'Supabase Access Token (for MCP)',
    example: 'sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    source: 'Supabase Dashboard > Account > Access Tokens'
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    description: 'Supabase Service Role Key',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    source: 'Supabase Dashboard > Settings > API > service_role key'
  },
  NEXT_PUBLIC_SUPABASE_URL: {
    description: 'Supabase Project URL',
    example: 'https://kbneptalijjgtimulfsi.supabase.co',
    source: 'Supabase Dashboard > Settings > API > Project URL'
  },
  MCP_ALLOWED_DIRECTORIES: {
    description: 'Allowed directories for filesystem MCP server',
    example: './app,./components,./lib,./scripts,./supabase',
    default: './app,./components,./lib,./scripts,./supabase'
  },
  MCP_MEMORY_STORE_PATH: {
    description: 'Path for MCP memory storage',
    example: './memory',
    default: './memory'
  }
};

// Utility functions
function log(message, type = 'info') {
  const prefix = {
    info: '✅',
    warn: '⚠️',
    error: '❌',
    success: '🎉'
  };
  console.log(`${prefix[type] || '📝'} ${message}`);
}

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Check current environment
function checkEnvironment() {
  log('Checking environment configuration...');
  
  const missingVars = [];
  const existingVars = {};
  
  // Read existing .env file
  let envContent = '';
  if (fs.existsSync(ENV_PATH)) {
    envContent = fs.readFileSync(ENV_PATH, 'utf8');
  }
  
  // Parse environment variables
  const envLines = envContent.split('\n');
  const envMap = {};
  
  envLines.forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envMap[match[1]] = match[2];
    }
  });
  
  // Check required variables
  Object.entries(requiredEnvVars).forEach(([key, config]) => {
    const value = process.env[key] || envMap[key];
    if (!value || value === `\${${key}}`) {
      if (!config.default) {
        missingVars.push(key);
      }
    } else {
      existingVars[key] = value;
    }
  });
  
  return { missingVars, existingVars, envMap };
}

// Install required dependencies
async function installDependencies() {
  log('Checking and installing required dependencies...');
  
  const dependencies = [
    '@supabase/supabase-js',
    '@supabase/mcp-server-supabase',
    '@modelcontextprotocol/server-filesystem',
    '@modelcontextprotocol/server-memory',
    'dotenv'
  ];
  
  try {
    // Check if dependencies are installed
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const installedDeps = Object.keys(packageJson.dependencies || {});
    const missingDeps = dependencies.filter(dep => !installedDeps.includes(dep));
    
    if (missingDeps.length > 0) {
      log(`Installing missing dependencies: ${missingDeps.join(', ')}`);
      execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
      log('Dependencies installed successfully', 'success');
    } else {
      log('All required dependencies are already installed', 'success');
    }
  } catch (error) {
    log(`Failed to install dependencies: ${error.message}`, 'error');
    throw error;
  }
}

// Configure environment variables
async function configureEnvironment(missingVars, existingVars, envMap) {
  if (missingVars.length === 0) {
    log('All required environment variables are configured', 'success');
    return;
  }
  
  log(`Missing environment variables: ${missingVars.join(', ')}`, 'warn');
  
  const configure = await question('\nWould you like to configure them now? (y/n): ');
  if (configure.toLowerCase() !== 'y') {
    log('Skipping environment configuration', 'warn');
    return;
  }
  
  const newEnvMap = { ...envMap };
  
  for (const varName of missingVars) {
    const config = requiredEnvVars[varName];
    console.log(`\n${config.description}`);
    console.log(`Source: ${config.source}`);
    if (config.example) {
      console.log(`Example: ${config.example}`);
    }
    
    let value;
    if (config.default) {
      value = await question(`Enter ${varName} (default: ${config.default}): `);
      value = value || config.default;
    } else {
      do {
        value = await question(`Enter ${varName}: `);
        if (!value) {
          log('This value is required', 'error');
        }
      } while (!value);
    }
    
    newEnvMap[varName] = value;
    process.env[varName] = value; // Set for current process
  }
  
  // Write updated .env file
  const envContent = Object.entries(newEnvMap)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(ENV_PATH, envContent);
  log('Environment configuration saved to .env', 'success');
  
  // Create .env.example if it doesn't exist
  if (!fs.existsSync(ENV_EXAMPLE_PATH)) {
    const exampleContent = Object.entries(requiredEnvVars)
      .map(([key, config]) => `${key}=\${${key}}`)
      .join('\n');
    fs.writeFileSync(ENV_EXAMPLE_PATH, exampleContent);
    log('Created .env.example file', 'success');
  }
}

// Test MCP server connections
async function testConnections() {
  log('\nTesting MCP server connections...');
  
  // Test Supabase connection
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ACCESS_TOKEN
    );
    
    const { data, error } = await supabase.from('_prisma_migrations').select('id').limit(1);
    if (error && !error.message.includes('does not exist')) {
      throw error;
    }
    log('Supabase connection successful', 'success');
  } catch (error) {
    log(`Supabase connection failed: ${error.message}`, 'error');
  }
  
  // Test filesystem access
  try {
    const testDirs = (process.env.MCP_ALLOWED_DIRECTORIES || requiredEnvVars.MCP_ALLOWED_DIRECTORIES.default)
      .split(',')
      .map(dir => dir.trim());
    
    for (const dir of testDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        log(`Created directory: ${dir}`, 'success');
      }
    }
    log('Filesystem access configured', 'success');
  } catch (error) {
    log(`Filesystem configuration failed: ${error.message}`, 'error');
  }
  
  // Create memory storage directory
  try {
    const memoryPath = process.env.MCP_MEMORY_STORE_PATH || requiredEnvVars.MCP_MEMORY_STORE_PATH.default;
    if (!fs.existsSync(memoryPath)) {
      fs.mkdirSync(memoryPath, { recursive: true });
      log(`Created memory storage directory: ${memoryPath}`, 'success');
    }
    log('Memory storage configured', 'success');
  } catch (error) {
    log(`Memory storage configuration failed: ${error.message}`, 'error');
  }
}

// Make scripts executable
function makeScriptsExecutable() {
  const scripts = [
    './scripts/mcp-supabase-server.js',
    './scripts/setup-supabase.js',
    './scripts/configure-oauth.js',
    './scripts/test-oauth.js'
  ];
  
  scripts.forEach(script => {
    if (fs.existsSync(script)) {
      try {
        fs.chmodSync(script, '755');
        log(`Made ${script} executable`, 'success');
      } catch (error) {
        log(`Failed to make ${script} executable: ${error.message}`, 'warn');
      }
    }
  });
}

// Main initialization process
async function main() {
  console.log('🚀 MCP Server Initialization for Funerally Platform\n');
  
  try {
    // Check environment
    const { missingVars, existingVars, envMap } = checkEnvironment();
    
    // Configure missing variables
    await configureEnvironment(missingVars, existingVars, envMap);
    
    // Install dependencies
    await installDependencies();
    
    // Test connections
    await testConnections();
    
    // Make scripts executable
    makeScriptsExecutable();
    
    // Display next steps
    console.log('\n📋 Next Steps:');
    console.log('1. Review the .mcp.json configuration file');
    console.log('2. Start the MCP servers using: npm run mcp:start');
    console.log('3. Run the Supabase setup: node scripts/setup-supabase.js');
    console.log('4. Configure OAuth providers: node scripts/configure-oauth.js');
    console.log('5. Test the integration: npm run test:mcp');
    
    console.log('\n📚 Available MCP Commands:');
    console.log('- npm run mcp:start    - Start all MCP servers');
    console.log('- npm run mcp:stop     - Stop all MCP servers');
    console.log('- npm run mcp:status   - Check MCP server status');
    console.log('- npm run mcp:logs     - View MCP server logs');
    
    log('\nMCP server initialization completed!', 'success');
    
  } catch (error) {
    log(`Initialization failed: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run initialization
if (require.main === module) {
  main();
}