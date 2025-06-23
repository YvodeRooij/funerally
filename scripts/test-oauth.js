#!/usr/bin/env node

/**
 * OAuth Test Script for Supabase
 * Tests Google and LinkedIn OAuth providers
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  SUPABASE_PROJECT_ID: 'kbneptalijjgtimulfsi',
  SUPABASE_ACCESS_TOKEN: 'sbp_c7bcad9decdfdff29906ca40a47c51cd25e1191b'
};

// Test OAuth provider availability
function testOAuthProvider(provider, url) {
  return new Promise((resolve) => {
    const options = {
      hostname: `${CONFIG.SUPABASE_PROJECT_ID}.supabase.co`,
      port: 443,
      path: `/auth/v1/authorize?provider=${provider}`,
      method: 'HEAD',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      resolve({
        provider,
        status: res.statusCode,
        available: res.statusCode === 302 || res.statusCode === 200,  // Redirect or OK means configured
        url
      });
    });

    req.on('error', () => {
      resolve({
        provider,
        status: 'ERROR',
        available: false,
        url
      });
    });

    req.on('timeout', () => {
      resolve({
        provider,
        status: 'TIMEOUT',
        available: false,
        url
      });
    });

    req.end();
  });
}

// Get Supabase auth configuration
function getAuthConfig() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${CONFIG.SUPABASE_PROJECT_ID}/config/auth`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CONFIG.SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const config = JSON.parse(body);
          resolve({ success: true, config });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.end();
  });
}

// Main test function
async function main() {
  console.log('🧪 OAuth Configuration Test');
  console.log('============================\n');

  // Test OAuth providers
  const testUrls = {
    google: `https://${CONFIG.SUPABASE_PROJECT_ID}.supabase.co/auth/v1/authorize?provider=google`,
    linkedin_oidc: `https://${CONFIG.SUPABASE_PROJECT_ID}.supabase.co/auth/v1/authorize?provider=linkedin_oidc`
  };

  console.log('🔍 Testing OAuth Provider Availability...\n');

  const tests = await Promise.all([
    testOAuthProvider('google', testUrls.google),
    testOAuthProvider('linkedin_oidc', testUrls.linkedin_oidc)
  ]);

  // Display test results
  tests.forEach(test => {
    const status = test.available ? '✅ Available' : '❌ Not configured';
    const statusCode = typeof test.status === 'number' ? `(${test.status})` : `(${test.status})`;
    
    console.log(`📊 ${test.provider.toUpperCase().replace('_', ' ')}: ${status} ${statusCode}`);
    console.log(`   Test URL: ${test.url}`);
    
    if (test.available) {
      console.log('   💡 You can test this URL in your browser');
    } else {
      console.log('   ⚠️  Provider not configured or not responding');
    }
    console.log('');
  });

  // Get current auth configuration
  console.log('🔧 Checking Supabase Auth Configuration...\n');
  
  const authConfig = await getAuthConfig();
  
  if (authConfig.success) {
    const config = authConfig.config;
    
    console.log('📋 Current Auth Settings:');
    console.log(`   Site URL: ${config.site_url || 'Not set'}`);
    console.log(`   JWT Expiry: ${config.jwt_exp || 'Default'} seconds`);
    console.log(`   Google OAuth: ${config.external_google_enabled ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   LinkedIn OAuth: ${config.external_linkedin_oidc_enabled ? '✅ Enabled' : '❌ Disabled'}`);
    
    if (config.external_google_enabled) {
      console.log(`   Google Client ID: ${config.external_google_client_id ? 'Set' : 'Not set'}`);
    }
    
    if (config.external_linkedin_oidc_enabled) {
      console.log(`   LinkedIn Client ID: ${config.external_linkedin_oidc_client_id ? 'Set' : 'Not set'}`);
    }
  } else {
    console.log('❌ Failed to retrieve auth configuration:', authConfig.error);
  }

  // Environment variables check
  console.log('\n🔍 Environment Variables Check:');
  const envFile = path.join(__dirname, '..', '.env');
  
  try {
    const envContent = fs.readFileSync(envFile, 'utf8');
    const hasGoogleId = envContent.includes('GOOGLE_CLIENT_ID=') && !envContent.includes('GOOGLE_CLIENT_ID=your-google-client-id');
    const hasGoogleSecret = envContent.includes('GOOGLE_CLIENT_SECRET=') && !envContent.includes('GOOGLE_CLIENT_SECRET=your-google-client-secret');
    const hasLinkedInId = envContent.includes('LINKEDIN_CLIENT_ID=') && !envContent.includes('LINKEDIN_CLIENT_ID=your-linkedin-client-id');
    const hasLinkedInSecret = envContent.includes('LINKEDIN_CLIENT_SECRET=') && !envContent.includes('LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret');
    
    console.log(`   Google Client ID: ${hasGoogleId ? '✅ Set' : '❌ Not set'}`);
    console.log(`   Google Client Secret: ${hasGoogleSecret ? '✅ Set' : '❌ Not set'}`);
    console.log(`   LinkedIn Client ID: ${hasLinkedInId ? '✅ Set' : '❌ Not set'}`);
    console.log(`   LinkedIn Client Secret: ${hasLinkedInSecret ? '✅ Set' : '❌ Not set'}`);
  } catch (error) {
    console.log('   ❌ Could not read .env file');
  }

  // Summary and next steps
  console.log('\n📝 Next Steps:');
  
  const availableProviders = tests.filter(t => t.available).length;
  
  if (availableProviders === 0) {
    console.log('1. Complete the OAuth setup by following OAUTH_CONFIGURATION_CHECKLIST.md');
    console.log('2. Update your .env file with the OAuth credentials');
    console.log('3. Run: node scripts/configure-oauth.js');
    console.log('4. Run this test script again to verify');
  } else if (availableProviders < 2) {
    console.log('1. Complete setup for the remaining OAuth provider(s)');
    console.log('2. Test the working provider(s) in your browser');
    console.log('3. Update your application to include OAuth login buttons');
  } else {
    console.log('1. ✅ All OAuth providers are configured!');
    console.log('2. Test both providers in your browser using the URLs above');
    console.log('3. Update your application to include OAuth login buttons');
    console.log('4. Test the complete authentication flow');
  }

  console.log('\n✨ Test complete!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testOAuthProvider, getAuthConfig };