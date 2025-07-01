#!/usr/bin/env node

/**
 * MCP-Supabase Configuration Setup Script
 * This script helps configure the MCP servers for the farewelly platform
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function checkPrerequisites() {
  log('\n🔍 Checking prerequisites...', 'blue');
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  
  if (majorVersion < 18) {
    log(`❌ Node.js version ${nodeVersion} detected. Version 18.0.0 or higher is required.`, 'red');
    process.exit(1);
  }
  
  log(`✅ Node.js ${nodeVersion} detected`, 'green');
  
  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    log('📝 Creating .env.local from .env.example...', 'yellow');
    const examplePath = path.join(process.cwd(), '.env.example');
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      log('✅ .env.local created', 'green');
    } else {
      log('❌ .env.example not found', 'red');
      process.exit(1);
    }
  }
  
  // Create MCP directories
  const mcpDir = path.join(process.cwd(), '.mcp');
  const memoryDir = path.join(mcpDir, 'memory');
  const logsDir = path.join(mcpDir, 'logs');
  
  [mcpDir, memoryDir, logsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`✅ Created directory: ${dir}`, 'green');
    }
  });
}

async function configureSupabase() {
  log('\n🔐 Configuring Supabase Integration', 'bright');
  log('Please provide your Supabase credentials:', 'blue');
  
  const supabaseUrl = await question('Supabase Project URL (e.g., https://xxx.supabase.co): ');
  const supabaseAnonKey = await question('Supabase Anon Key: ');
  const supabaseServiceKey = await question('Supabase Service Role Key: ');
  const supabaseAccessToken = await question('Supabase Access Token (from account settings): ');
  
  // Extract project ref from URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  if (!projectRef) {
    log('❌ Invalid Supabase URL format', 'red');
    process.exit(1);
  }
  
  return {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey,
    SUPABASE_PROJECT_REF: projectRef,
    SUPABASE_ACCESS_TOKEN: supabaseAccessToken
  };
}

async function updateEnvFile(config) {
  log('\n📝 Updating .env.local file...', 'blue');
  
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update or add each configuration value
  Object.entries(config).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  });
  
  // Add MCP configuration if not present
  const mcpConfig = {
    MCP_ALLOWED_DIRECTORIES: '/workspaces/farewelly,/tmp',
    MCP_MEMORY_STORE_PATH: '/workspaces/farewelly/.mcp/memory',
    MCP_PUPPETEER_HEADLESS: 'true',
    MCP_FETCH_USER_AGENT: 'MCP-Fetch/1.0',
    MCP_FETCH_TIMEOUT: '30000',
    MCP_LOG_LEVEL: 'info',
    MCP_LOG_FORMAT: 'json',
    MCP_ALLOWED_HOSTS: 'localhost,*.supabase.co,*.anthropic.com',
    MCP_MAX_REQUEST_SIZE: '10485760'
  };
  
  Object.entries(mcpConfig).forEach(([key, value]) => {
    if (!envContent.includes(key)) {
      envContent += `\n${key}=${value}`;
    }
  });
  
  fs.writeFileSync(envPath, envContent);
  log('✅ Environment file updated', 'green');
}

async function testMCPServers() {
  log('\n🧪 Testing MCP Server Connections...', 'blue');
  
  const servers = [
    { name: 'Supabase', package: '@supabase/mcp-server-supabase' },
    { name: 'Filesystem', package: '@modelcontextprotocol/server-filesystem' },
    { name: 'Memory', package: '@modelcontextprotocol/server-memory' }
  ];
  
  for (const server of servers) {
    try {
      log(`Testing ${server.name} server...`, 'yellow');
      await execPromise(`npx -y ${server.package}@latest --version`, { timeout: 30000 });
      log(`✅ ${server.name} server is accessible`, 'green');
    } catch (error) {
      log(`⚠️  ${server.name} server test failed: ${error.message}`, 'yellow');
    }
  }
}

async function displayNextSteps() {
  log('\n✨ MCP Configuration Complete!', 'bright');
  log('\n📋 Next Steps:', 'blue');
  log('1. Run the Supabase database schema:', 'yellow');
  log('   - Go to your Supabase dashboard SQL editor', 'reset');
  log('   - Run the contents of supabase/schema.sql', 'reset');
  log('\n2. Configure OAuth providers in Supabase:', 'yellow');
  log('   - Go to Authentication → Providers', 'reset');
  log('   - Enable Google and Facebook OAuth', 'reset');
  log('\n3. Start your development server:', 'yellow');
  log('   npm run dev', 'reset');
  log('\n4. Test the MCP integration:', 'yellow');
  log('   ./claude-flow mcp status', 'reset');
  log('\n5. Start using MCP servers in your code!', 'yellow');
  
  log('\n📚 Documentation:', 'blue');
  log('- MCP Configuration: MCP_CONFIGURATION.md', 'reset');
  log('- Supabase Setup: SUPABASE_SETUP.md', 'reset');
  log('- OAuth Setup: OAUTH_SETUP.md', 'reset');
}

async function main() {
  log('🚀 MCP-Supabase Configuration Setup', 'bright');
  log('====================================\n', 'bright');
  
  try {
    await checkPrerequisites();
    
    const configure = await question('\nDo you want to configure Supabase credentials now? (y/n): ');
    
    if (configure.toLowerCase() === 'y') {
      const config = await configureSupabase();
      await updateEnvFile(config);
      await testMCPServers();
    }
    
    await displayNextSteps();
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the setup
main().catch(console.error);