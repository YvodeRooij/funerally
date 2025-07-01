#!/usr/bin/env node

/**
 * OAuth Configuration Script for Supabase
 * Configures Google and LinkedIn OAuth providers
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  SUPABASE_PROJECT_ID: 'kbneptalijjgtimulfsi',
  SUPABASE_ACCESS_TOKEN: 'sbp_c7bcad9decdfdff29906ca40a47c51cd25e1191b',
  SUPABASE_API_BASE: 'https://api.supabase.com/v1',
  ENV_FILE: path.join(__dirname, '..', '.env')
};

// Utility function to make HTTPS requests
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Read environment variables from .env file
function readEnvFile() {
  try {
    const envContent = fs.readFileSync(CONFIG.ENV_FILE, 'utf8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    console.error('❌ Error reading .env file:', error.message);
    return {};
  }
}

// Configure Google OAuth
async function configureGoogleOAuth(clientId, clientSecret) {
  console.log('🔄 Configuring Google OAuth...');
  
  const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${CONFIG.SUPABASE_PROJECT_ID}/config/auth`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${CONFIG.SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  const data = {
    external_google_enabled: true,
    external_google_client_id: clientId,
    external_google_secret: clientSecret
  };

  try {
    const response = await makeRequest(options, data);
    
    if (response.status === 200) {
      console.log('✅ Google OAuth configured successfully');
      return true;
    } else {
      console.error('❌ Failed to configure Google OAuth:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error configuring Google OAuth:', error.message);
    return false;
  }
}

// Configure LinkedIn OAuth
async function configureLinkedInOAuth(clientId, clientSecret) {
  console.log('🔄 Configuring LinkedIn OAuth...');
  
  const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${CONFIG.SUPABASE_PROJECT_ID}/config/auth`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${CONFIG.SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  const data = {
    external_linkedin_oidc_enabled: true,
    external_linkedin_oidc_client_id: clientId,
    external_linkedin_oidc_secret: clientSecret
  };

  try {
    const response = await makeRequest(options, data);
    
    if (response.status === 200) {
      console.log('✅ LinkedIn OAuth configured successfully');
      return true;
    } else {
      console.error('❌ Failed to configure LinkedIn OAuth:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error configuring LinkedIn OAuth:', error.message);
    return false;
  }
}

// Test OAuth configuration
async function testOAuthConfiguration() {
  console.log('\n🧪 Testing OAuth Configuration...');
  
  const testUrls = {
    google: `https://${CONFIG.SUPABASE_PROJECT_ID}.supabase.co/auth/v1/authorize?provider=google`,
    linkedin: `https://${CONFIG.SUPABASE_PROJECT_ID}.supabase.co/auth/v1/authorize?provider=linkedin_oidc`
  };

  console.log('\n📋 Test URLs:');
  console.log(`   Google: ${testUrls.google}`);
  console.log(`   LinkedIn: ${testUrls.linkedin}`);
  console.log('\n💡 Open these URLs in your browser to test the OAuth flow');
}

// Display configuration status
function displayStatus(env) {
  console.log('📊 Current OAuth Configuration Status:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const googleConfigured = env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_ID !== 'your-google-client-id';
  const linkedinConfigured = env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_ID !== 'your-linkedin-client-id';
  
  console.log(`   Google OAuth:   ${googleConfigured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   LinkedIn OAuth: ${linkedinConfigured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Supabase Project: ${CONFIG.SUPABASE_PROJECT_ID}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return { googleConfigured, linkedinConfigured };
}

// Main function
async function main() {
  console.log('🔧 OAuth Configuration Tool for farewelly');
  console.log('==========================================\n');

  // Read environment variables
  const env = readEnvFile();
  const status = displayStatus(env);

  // Check if credentials are available
  const googleCredentials = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET
  };

  const linkedinCredentials = {
    clientId: env.LINKEDIN_CLIENT_ID,
    clientSecret: env.LINKEDIN_CLIENT_SECRET
  };

  let configurationsMade = false;

  // Configure Google OAuth if credentials are available
  if (status.googleConfigured && googleCredentials.clientId && googleCredentials.clientSecret) {
    const success = await configureGoogleOAuth(googleCredentials.clientId, googleCredentials.clientSecret);
    if (success) configurationsMade = true;
  } else {
    console.log('⚡ Google OAuth credentials not found in .env file');
    console.log('   Please update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
  }

  // Configure LinkedIn OAuth if credentials are available
  if (status.linkedinConfigured && linkedinCredentials.clientId && linkedinCredentials.clientSecret) {
    const success = await configureLinkedInOAuth(linkedinCredentials.clientId, linkedinCredentials.clientSecret);
    if (success) configurationsMade = true;
  } else {
    console.log('⚡ LinkedIn OAuth credentials not found in .env file');
    console.log('   Please update LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET');
  }

  // Show next steps
  if (configurationsMade) {
    await testOAuthConfiguration();
  } else {
    console.log('\n📝 Next Steps:');
    console.log('1. Follow the OAuth setup guide in OAUTH_CONFIGURATION_CHECKLIST.md');
    console.log('2. Update the .env file with your OAuth credentials');
    console.log('3. Run this script again to configure Supabase');
  }

  console.log('\n✨ Configuration complete!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  configureGoogleOAuth,
  configureLinkedInOAuth,
  testOAuthConfiguration
};