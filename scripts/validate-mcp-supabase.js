#!/usr/bin/env node
import { spawn } from 'child_process';
import { readFileSync } from 'fs';

console.log('🔍 Quick MCP-Supabase Validation\n');

// Quick validation checks
const checks = {
  env: false,
  mcp: false,
  server: false
};

// Check environment variables
try {
  const env = readFileSync('.env', 'utf8');
  const hasSupabaseUrl = env.includes('NEXT_PUBLIC_SUPABASE_URL=https://');
  const hasAnonKey = env.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=');
  const hasServiceKey = env.includes('SUPABASE_SERVICE_ROLE_KEY=');
  const hasAccessToken = env.includes('SUPABASE_ACCESS_TOKEN=');
  
  checks.env = hasSupabaseUrl && hasAnonKey && hasServiceKey && hasAccessToken;
  console.log(checks.env ? '✅' : '❌', 'Environment variables');
} catch (error) {
  console.log('❌ Environment variables - .env file not found');
}

// Check MCP configuration
try {
  const mcpConfig = JSON.parse(readFileSync('.mcp.json', 'utf8'));
  const hasSupabaseServer = mcpConfig.servers && mcpConfig.servers.supabase;
  const hasProjectRef = hasSupabaseServer && 
    mcpConfig.servers.supabase.env.SUPABASE_PROJECT_REF === 'kbneptalijjgtimulfsi';
  const hasToken = hasSupabaseServer && 
    mcpConfig.servers.supabase.env.SUPABASE_ACCESS_TOKEN &&
    !mcpConfig.servers.supabase.env.SUPABASE_ACCESS_TOKEN.includes('$');
  
  checks.mcp = hasSupabaseServer && hasProjectRef && hasToken;
  console.log(checks.mcp ? '✅' : '❌', 'MCP configuration');
} catch (error) {
  console.log('❌ MCP configuration - Invalid or missing .mcp.json');
}

// Test MCP server spawn
console.log('⏳ Testing MCP server spawn...');
const serverTest = spawn('npx', ['-y', '@supabase/mcp-server-supabase@latest', '--version']);

serverTest.stdout.on('data', (data) => {
  checks.server = true;
  console.log('✅ MCP server spawn - Version:', data.toString().trim());
});

serverTest.stderr.on('data', (data) => {
  if (!data.toString().includes('npm')) {
    console.log('❌ MCP server spawn error:', data.toString());
  }
});

serverTest.on('close', (code) => {
  console.log('\n📊 Validation Summary:');
  console.log('-------------------');
  
  const allPassed = Object.values(checks).every(v => v);
  
  if (allPassed) {
    console.log('✅ All checks passed! MCP-Supabase is ready to use.');
  } else {
    console.log('❌ Some checks failed. Please review the issues above.');
    console.log('\n💡 Quick fixes:');
    if (!checks.env) {
      console.log('  - Check your .env file has all required Supabase variables');
    }
    if (!checks.mcp) {
      console.log('  - Ensure .mcp.json has proper Supabase configuration');
      console.log('  - Project ref should be: kbneptalijjgtimulfsi');
    }
    if (!checks.server) {
      console.log('  - Install MCP server: npm install -g @supabase/mcp-server-supabase');
    }
  }
  
  process.exit(allPassed ? 0 : 1);
});