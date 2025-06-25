#!/usr/bin/env node

/**
 * OAuth Integration Test Suite
 * Comprehensive testing for Google and LinkedIn OAuth flows
 */

const https = require('https');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const SUPABASE_PROJECT_REF = 'kbneptalijjgtimulfsi';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
const SUPABASE_ACCESS_TOKEN = 'sbp_c7bcad9decdfdff29906ca40a47c51cd25e1191b';
const SUPABASE_API_URL = 'https://api.supabase.com/v1';

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function addTestResult(name, status, details = '', severity = 'info') {
  testResults.tests.push({
    name,
    status,
    details,
    severity,
    timestamp: new Date().toISOString()
  });
  
  testResults.summary.total++;
  if (status === 'passed') testResults.summary.passed++;
  else if (status === 'failed') testResults.summary.failed++;
  else if (status === 'warning') testResults.summary.warnings++;
}

// Test 1: Check OAuth Provider Configuration
async function testProviderConfiguration() {
  log('\n🔍 Test 1: OAuth Provider Configuration', 'bright');
  
  try {
    const response = await fetch(`${SUPABASE_API_URL}/projects/${SUPABASE_PROJECT_REF}/config/auth`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const config = await response.json();
    
    // Test Google OAuth
    if (config.external_google_enabled) {
      log('✅ Google OAuth is enabled', 'green');
      
      if (config.external_google_client_id && config.external_google_secret) {
        log('✅ Google credentials are configured', 'green');
        addTestResult('Google OAuth Configuration', 'passed', 'Provider enabled with credentials');
      } else {
        log('⚠️  Google OAuth enabled but credentials missing', 'yellow');
        addTestResult('Google OAuth Configuration', 'warning', 'Provider enabled but missing credentials', 'warning');
      }
    } else {
      log('❌ Google OAuth is disabled', 'red');
      addTestResult('Google OAuth Configuration', 'failed', 'Provider not enabled', 'error');
    }
    
    // Test LinkedIn OAuth
    if (config.external_linkedin_oidc_enabled) {
      log('✅ LinkedIn OAuth is enabled', 'green');
      
      if (config.external_linkedin_oidc_client_id && config.external_linkedin_oidc_secret) {
        log('✅ LinkedIn credentials are configured', 'green');
        addTestResult('LinkedIn OAuth Configuration', 'passed', 'Provider enabled with credentials');
      } else {
        log('⚠️  LinkedIn OAuth enabled but credentials missing', 'yellow');
        addTestResult('LinkedIn OAuth Configuration', 'warning', 'Provider enabled but missing credentials', 'warning');
      }
    } else {
      log('❌ LinkedIn OAuth is disabled', 'red');
      addTestResult('LinkedIn OAuth Configuration', 'failed', 'Provider not enabled', 'error');
    }
    
    // Additional auth settings
    log(`\n📊 Additional Auth Settings:`, 'cyan');
    log(`   Email Auth: ${config.external_email_enabled ? '✅' : '❌'}`);
    log(`   Site URL: ${config.site_url || 'Not configured'}`);
    log(`   Redirect URLs: ${config.uri_allow_list?.join(', ') || 'Default only'}`);
    
  } catch (error) {
    log(`❌ Failed to fetch configuration: ${error.message}`, 'red');
    addTestResult('OAuth Provider Configuration', 'failed', error.message, 'error');
  }
}

// Test 2: Environment Variables
async function testEnvironmentVariables() {
  log('\n🔍 Test 2: Environment Variables', 'bright');
  
  const requiredVars = [
    { name: 'GOOGLE_CLIENT_ID', critical: true },
    { name: 'GOOGLE_CLIENT_SECRET', critical: true },
    { name: 'LINKEDIN_CLIENT_ID', critical: true },
    { name: 'LINKEDIN_CLIENT_SECRET', critical: true },
    { name: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID', critical: false },
    { name: 'NEXT_PUBLIC_LINKEDIN_CLIENT_ID', critical: false },
    { name: 'NEXTAUTH_SECRET', critical: true },
    { name: 'NEXTAUTH_URL', critical: false }
  ];
  
  let allPassed = true;
  
  for (const varInfo of requiredVars) {
    const exists = process.env[varInfo.name];
    
    if (exists) {
      log(`✅ ${varInfo.name} is set`, 'green');
      addTestResult(`Environment: ${varInfo.name}`, 'passed', 'Variable is set');
    } else if (varInfo.critical) {
      log(`❌ ${varInfo.name} is missing (CRITICAL)`, 'red');
      addTestResult(`Environment: ${varInfo.name}`, 'failed', 'Critical variable missing', 'error');
      allPassed = false;
    } else {
      log(`⚠️  ${varInfo.name} is missing (optional)`, 'yellow');
      addTestResult(`Environment: ${varInfo.name}`, 'warning', 'Optional variable missing', 'warning');
    }
  }
  
  return allPassed;
}

// Test 3: OAuth URLs Accessibility
async function testOAuthURLs() {
  log('\n🔍 Test 3: OAuth URLs Accessibility', 'bright');
  
  const providers = ['google', 'linkedin_oidc'];
  
  for (const provider of providers) {
    const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}`;
    
    try {
      const response = await fetch(authUrl, { method: 'HEAD' });
      
      if (response.status === 302 || response.status === 303) {
        log(`✅ ${provider} OAuth URL is accessible (redirect detected)`, 'green');
        addTestResult(`OAuth URL: ${provider}`, 'passed', `Status: ${response.status}`);
      } else if (response.status === 200) {
        log(`✅ ${provider} OAuth URL is accessible`, 'green');
        addTestResult(`OAuth URL: ${provider}`, 'passed', `Status: ${response.status}`);
      } else {
        log(`⚠️  ${provider} OAuth URL returned status ${response.status}`, 'yellow');
        addTestResult(`OAuth URL: ${provider}`, 'warning', `Unexpected status: ${response.status}`, 'warning');
      }
    } catch (error) {
      log(`❌ Failed to access ${provider} OAuth URL: ${error.message}`, 'red');
      addTestResult(`OAuth URL: ${provider}`, 'failed', error.message, 'error');
    }
  }
}

// Test 4: Callback URL Configuration
async function testCallbackURLs() {
  log('\n🔍 Test 4: Callback URL Configuration', 'bright');
  
  const expectedCallbacks = [
    `${SUPABASE_URL}/auth/v1/callback`,
    'http://localhost:3001/auth/callback'
  ];
  
  log('Expected callback URLs:', 'cyan');
  expectedCallbacks.forEach(url => {
    log(`   📍 ${url}`);
  });
  
  log('\n⚠️  Manual verification needed:', 'yellow');
  log('   1. Google Console: Check Authorized redirect URIs');
  log('   2. LinkedIn Developer Portal: Check Authorized redirect URLs');
  
  addTestResult('Callback URLs', 'info', 'Manual verification required', 'info');
}

// Test 5: Frontend Integration
async function testFrontendIntegration() {
  log('\n🔍 Test 5: Frontend Integration', 'bright');
  
  const filesToCheck = [
    { path: '/workspaces/funerally/app/[locale]/(auth)/signin/page.tsx', name: 'Sign In Page' },
    { path: '/workspaces/funerally/lib/auth-supabase.ts', name: 'Auth Configuration' },
    { path: '/workspaces/funerally/components/features/auth/signup-form.tsx', name: 'Sign Up Form' }
  ];
  
  for (const file of filesToCheck) {
    try {
      const fs = require('fs');
      if (fs.existsSync(file.path)) {
        log(`✅ ${file.name} exists`, 'green');
        
        const content = fs.readFileSync(file.path, 'utf8');
        
        // Check for OAuth provider references
        const hasGoogle = content.includes('GoogleProvider') || content.includes('google');
        const hasLinkedIn = content.includes('LinkedInProvider') || content.includes('linkedin');
        
        if (hasGoogle || hasLinkedIn) {
          log(`   └─ OAuth providers referenced: ${hasGoogle ? 'Google ' : ''}${hasLinkedIn ? 'LinkedIn' : ''}`, 'cyan');
          addTestResult(`Frontend: ${file.name}`, 'passed', 'OAuth integration found');
        } else {
          log(`   └─ No OAuth providers found in file`, 'yellow');
          addTestResult(`Frontend: ${file.name}`, 'warning', 'No OAuth references found', 'warning');
        }
      } else {
        log(`❌ ${file.name} not found`, 'red');
        addTestResult(`Frontend: ${file.name}`, 'failed', 'File not found', 'error');
      }
    } catch (error) {
      log(`❌ Error checking ${file.name}: ${error.message}`, 'red');
      addTestResult(`Frontend: ${file.name}`, 'failed', error.message, 'error');
    }
  }
}

// Test 6: NextAuth Configuration
async function testNextAuthConfig() {
  log('\n🔍 Test 6: NextAuth Configuration', 'bright');
  
  try {
    const fs = require('fs');
    const authConfigPath = '/workspaces/funerally/lib/auth-supabase.ts';
    
    if (fs.existsSync(authConfigPath)) {
      const content = fs.readFileSync(authConfigPath, 'utf8');
      
      // Check for essential NextAuth configurations
      const checks = [
        { pattern: /GoogleProvider/, name: 'Google Provider' },
        { pattern: /LinkedInProvider/, name: 'LinkedIn Provider' },
        { pattern: /clientId.*GOOGLE_CLIENT_ID/, name: 'Google Client ID' },
        { pattern: /clientSecret.*GOOGLE_CLIENT_SECRET/, name: 'Google Client Secret' },
        { pattern: /clientId.*LINKEDIN_CLIENT_ID/, name: 'LinkedIn Client ID' },
        { pattern: /clientSecret.*LINKEDIN_CLIENT_SECRET/, name: 'LinkedIn Client Secret' },
        { pattern: /callbacks/, name: 'Auth Callbacks' },
        { pattern: /jwt/, name: 'JWT Configuration' },
        { pattern: /session/, name: 'Session Configuration' }
      ];
      
      checks.forEach(check => {
        if (check.pattern.test(content)) {
          log(`✅ ${check.name} configured`, 'green');
          addTestResult(`NextAuth: ${check.name}`, 'passed', 'Configuration found');
        } else {
          log(`❌ ${check.name} not found`, 'red');
          addTestResult(`NextAuth: ${check.name}`, 'failed', 'Configuration missing', 'error');
        }
      });
    }
  } catch (error) {
    log(`❌ Error checking NextAuth config: ${error.message}`, 'red');
    addTestResult('NextAuth Configuration', 'failed', error.message, 'error');
  }
}

// Test 7: OAuth Flow Simulation
async function testOAuthFlowSimulation() {
  log('\n🔍 Test 7: OAuth Flow Simulation', 'bright');
  
  log('📋 OAuth Flow Steps:', 'cyan');
  log('   1. User clicks OAuth button');
  log('   2. Redirect to provider (Google/LinkedIn)');
  log('   3. User authorizes application');
  log('   4. Redirect back to callback URL');
  log('   5. Exchange code for tokens');
  log('   6. Create/update user session');
  
  log('\n⚠️  Manual test steps:', 'yellow');
  log('   1. Start development server: npm run dev');
  log('   2. Navigate to: http://localhost:3001/signin');
  log('   3. Click Google/LinkedIn sign-in buttons');
  log('   4. Complete OAuth flow');
  log('   5. Verify redirect to dashboard/onboarding');
  
  addTestResult('OAuth Flow Simulation', 'info', 'Manual testing required', 'info');
}

// Generate Test Report
function generateTestReport() {
  log('\n' + '='.repeat(60), 'bright');
  log('📊 OAuth Integration Test Report', 'bright');
  log('='.repeat(60), 'bright');
  
  log(`\nTest Summary:`, 'cyan');
  log(`   Total Tests: ${testResults.summary.total}`);
  log(`   ✅ Passed: ${testResults.summary.passed}`, 'green');
  log(`   ❌ Failed: ${testResults.summary.failed}`, 'red');
  log(`   ⚠️  Warnings: ${testResults.summary.warnings}`, 'yellow');
  
  // Critical Issues
  const criticalIssues = testResults.tests.filter(t => t.severity === 'error');
  if (criticalIssues.length > 0) {
    log('\n🚨 Critical Issues:', 'red');
    criticalIssues.forEach(issue => {
      log(`   - ${issue.name}: ${issue.details}`, 'red');
    });
  }
  
  // Warnings
  const warnings = testResults.tests.filter(t => t.severity === 'warning');
  if (warnings.length > 0) {
    log('\n⚠️  Warnings:', 'yellow');
    warnings.forEach(warning => {
      log(`   - ${warning.name}: ${warning.details}`, 'yellow');
    });
  }
  
  // Recommendations
  log('\n💡 Recommendations:', 'cyan');
  
  if (criticalIssues.some(i => i.name.includes('Environment'))) {
    log('   1. Create .env file with required OAuth credentials');
    log('   2. Copy .env.example to .env and fill in values');
  }
  
  if (criticalIssues.some(i => i.name.includes('Configuration'))) {
    log('   1. Enable OAuth providers in Supabase dashboard');
    log('   2. Run: node scripts/configure-oauth.js');
  }
  
  log('\n📝 Next Steps:', 'cyan');
  log('   1. Fix any critical issues listed above');
  log('   2. Configure OAuth providers in Google/LinkedIn consoles');
  log('   3. Update environment variables');
  log('   4. Run manual OAuth flow tests');
  
  // Save results
  const fs = require('fs');
  const reportPath = '/workspaces/funerally/test-results/oauth-integration-test.json';
  
  try {
    if (!fs.existsSync('/workspaces/funerally/test-results')) {
      fs.mkdirSync('/workspaces/funerally/test-results', { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    log(`\n📁 Test results saved to: ${reportPath}`, 'green');
  } catch (error) {
    log(`\n❌ Failed to save test results: ${error.message}`, 'red');
  }
}

// Main test runner
async function runTests() {
  log('🚀 Starting OAuth Integration Tests', 'bright');
  log('=' .repeat(60), 'bright');
  
  await testProviderConfiguration();
  await testEnvironmentVariables();
  await testOAuthURLs();
  await testCallbackURLs();
  await testFrontendIntegration();
  await testNextAuthConfig();
  await testOAuthFlowSimulation();
  
  generateTestReport();
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});