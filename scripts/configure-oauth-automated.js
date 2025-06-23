#!/usr/bin/env node

/**
 * Automated OAuth Configuration Script for Supabase
 * 
 * This script automatically configures Google and LinkedIn OAuth providers
 * with placeholder credentials that can be updated later.
 */

const SUPABASE_PROJECT_REF = 'kbneptalijjgtimulfsi';
const SUPABASE_ACCESS_TOKEN = 'sbp_c7bcad9decdfdff29906ca40a47c51cd25e1191b';
const SUPABASE_API_URL = 'https://api.supabase.com/v1';

// Placeholder OAuth credentials - REPLACE THESE WITH REAL CREDENTIALS
const OAUTH_CONFIG = {
  google: {
    enabled: true,
    clientId: 'GOOGLE_CLIENT_ID_PLACEHOLDER',
    clientSecret: 'GOOGLE_CLIENT_SECRET_PLACEHOLDER'
  },
  linkedin: {
    enabled: true,
    clientId: 'LINKEDIN_CLIENT_ID_PLACEHOLDER',
    clientSecret: 'LINKEDIN_CLIENT_SECRET_PLACEHOLDER'
  }
};

async function getCurrentConfig() {
  console.log('🔍 Fetching current OAuth configuration...\n');
  
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
    
    console.log('📊 Current Status:');
    console.log(`   Google OAuth: ${config.external_google_enabled ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   LinkedIn OAuth: ${config.external_linkedin_oidc_enabled ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   Email Auth: ${config.external_email_enabled ? '✅ Enabled' : '❌ Disabled'}\n`);
    
    return config;
  } catch (error) {
    console.error('❌ Error fetching configuration:', error.message);
    process.exit(1);
  }
}

async function updateSupabaseConfig(updates) {
  console.log('\n🚀 Updating configuration...');
  console.log('Updates:', JSON.stringify(updates, null, 2));

  try {
    const response = await fetch(`${SUPABASE_API_URL}/projects/${SUPABASE_PROJECT_REF}/config/auth`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    console.log('✅ Configuration successfully updated!');
    return true;
  } catch (error) {
    console.error('❌ Error updating configuration:', error.message);
    return false;
  }
}

async function generateEnvFile() {
  console.log('\n📝 Environment Variables for .env file:');
  console.log('========================================');
  
  const envContent = `# OAuth Configuration
# IMPORTANT: Replace these placeholder values with real credentials from:
# - Google: https://console.cloud.google.com/
# - LinkedIn: https://www.linkedin.com/developers/

# Google OAuth
GOOGLE_CLIENT_ID=${OAUTH_CONFIG.google.clientId}
GOOGLE_CLIENT_SECRET=${OAUTH_CONFIG.google.clientSecret}
NEXT_PUBLIC_GOOGLE_CLIENT_ID=${OAUTH_CONFIG.google.clientId}

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=${OAUTH_CONFIG.linkedin.clientId}
LINKEDIN_CLIENT_SECRET=${OAUTH_CONFIG.linkedin.clientSecret}
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=${OAUTH_CONFIG.linkedin.clientId}

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://${SUPABASE_PROJECT_REF}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibmVwdGFsaWpqZ3RpbXVsZnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MjEzMTEsImV4cCI6MjA1MDE5NzMxMX0.b1c-L8F_8bD2IaOCJvjb68v1WsPOJCyRSaQE_3zxdUU`;

  console.log(envContent);
  console.log('\n📋 Copy the above variables to your .env file');
  
  // Also save to a file for reference
  const fs = require('fs').promises;
  await fs.writeFile('.env.oauth-template', envContent);
  console.log('\n📄 Template saved to: .env.oauth-template');
}

async function generateUpdateInstructions() {
  console.log('\n📌 Instructions for updating OAuth credentials:');
  console.log('================================================');
  
  const instructions = `
OAuth Configuration Update Guide
================================

1. Google OAuth Setup:
   a. Go to https://console.cloud.google.com/
   b. Create or select a project
   c. Enable Google+ API
   d. Create OAuth 2.0 credentials
   e. Add authorized redirect URI: https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/callback
   f. Copy Client ID and Client Secret

2. LinkedIn OAuth Setup:
   a. Go to https://www.linkedin.com/developers/
   b. Create a new app
   c. Add OAuth 2.0 settings
   d. Add authorized redirect URL: https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/callback
   e. Copy Client ID and Client Secret

3. Update credentials using one of these methods:

   Method A - Using this script (recommended):
   \`\`\`bash
   node scripts/configure-oauth-automated.js --update \
     --google-id "YOUR_GOOGLE_CLIENT_ID" \
     --google-secret "YOUR_GOOGLE_CLIENT_SECRET" \
     --linkedin-id "YOUR_LINKEDIN_CLIENT_ID" \
     --linkedin-secret "YOUR_LINKEDIN_CLIENT_SECRET"
   \`\`\`

   Method B - Using cURL directly:
   \`\`\`bash
   curl -X PATCH \\
     -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \\
     -H "Content-Type: application/json" \\
     -d '{
       "external_google_enabled": true,
       "external_google_client_id": "YOUR_GOOGLE_CLIENT_ID",
       "external_google_secret": "YOUR_GOOGLE_CLIENT_SECRET",
       "external_linkedin_oidc_enabled": true,
       "external_linkedin_oidc_client_id": "YOUR_LINKEDIN_CLIENT_ID",
       "external_linkedin_oidc_secret": "YOUR_LINKEDIN_CLIENT_SECRET"
     }' \\
     ${SUPABASE_API_URL}/projects/${SUPABASE_PROJECT_REF}/config/auth
   \`\`\`

   Method C - Using the interactive script:
   \`\`\`bash
   node scripts/configure-oauth.js
   \`\`\`

4. Test OAuth endpoints:
   - Google: https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/authorize?provider=google
   - LinkedIn: https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/authorize?provider=linkedin_oidc

5. Update your .env file with the real credentials

6. Restart your Next.js development server
`;

  console.log(instructions);
  
  // Save instructions to file
  const fs = require('fs').promises;
  await fs.writeFile('OAUTH_UPDATE_INSTRUCTIONS.md', instructions);
  console.log('\n📄 Instructions saved to: OAUTH_UPDATE_INSTRUCTIONS.md');
}

async function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('--update')) {
    // Parse update arguments
    const googleIdIndex = args.indexOf('--google-id');
    const googleSecretIndex = args.indexOf('--google-secret');
    const linkedinIdIndex = args.indexOf('--linkedin-id');
    const linkedinSecretIndex = args.indexOf('--linkedin-secret');
    
    if (googleIdIndex > -1 && args[googleIdIndex + 1]) {
      OAUTH_CONFIG.google.clientId = args[googleIdIndex + 1];
    }
    if (googleSecretIndex > -1 && args[googleSecretIndex + 1]) {
      OAUTH_CONFIG.google.clientSecret = args[googleSecretIndex + 1];
    }
    if (linkedinIdIndex > -1 && args[linkedinIdIndex + 1]) {
      OAUTH_CONFIG.linkedin.clientId = args[linkedinIdIndex + 1];
    }
    if (linkedinSecretIndex > -1 && args[linkedinSecretIndex + 1]) {
      OAUTH_CONFIG.linkedin.clientSecret = args[linkedinSecretIndex + 1];
    }
    
    console.log('🔄 Using provided credentials for update...');
  }
  
  return args.includes('--dry-run');
}

async function main() {
  console.log('🤖 Automated Supabase OAuth Configuration');
  console.log('=========================================\n');

  const isDryRun = await parseCommandLineArgs();
  
  // Get current configuration
  const currentConfig = await getCurrentConfig();

  // Prepare updates
  const updates = {};
  
  if (OAUTH_CONFIG.google.enabled) {
    updates.external_google_enabled = true;
    updates.external_google_client_id = OAUTH_CONFIG.google.clientId;
    updates.external_google_secret = OAUTH_CONFIG.google.clientSecret;
  }
  
  if (OAUTH_CONFIG.linkedin.enabled) {
    updates.external_linkedin_oidc_enabled = true;
    updates.external_linkedin_oidc_client_id = OAUTH_CONFIG.linkedin.clientId;
    updates.external_linkedin_oidc_secret = OAUTH_CONFIG.linkedin.clientSecret;
  }

  if (isDryRun) {
    console.log('\n🏃 DRY RUN MODE - No changes will be made');
    console.log('\nConfiguration that would be applied:');
    console.log(JSON.stringify(updates, null, 2));
  } else {
    // Apply updates
    const success = await updateSupabaseConfig(updates);
    
    if (success) {
      await generateEnvFile();
      await generateUpdateInstructions();
      
      console.log('\n🎉 OAuth configuration completed!');
      console.log('\n⚠️  IMPORTANT: The placeholder credentials will NOT work for actual authentication.');
      console.log('   Follow the instructions in OAUTH_UPDATE_INSTRUCTIONS.md to set up real credentials.');
    }
  }

  console.log('\n✅ Done!');
}

// Add command-line help
if (process.argv.includes('--help')) {
  console.log(`
Automated OAuth Configuration Script

Usage:
  node scripts/configure-oauth-automated.js [options]

Options:
  --dry-run              Show what would be configured without making changes
  --update               Update with specific credentials
  --google-id <id>       Google OAuth Client ID
  --google-secret <sec>  Google OAuth Client Secret
  --linkedin-id <id>     LinkedIn OAuth Client ID
  --linkedin-secret <sec> LinkedIn OAuth Client Secret
  --help                 Show this help message

Examples:
  # Configure with placeholders
  node scripts/configure-oauth-automated.js

  # Dry run to see what would be configured
  node scripts/configure-oauth-automated.js --dry-run

  # Update with real credentials
  node scripts/configure-oauth-automated.js --update \\
    --google-id "YOUR_GOOGLE_CLIENT_ID" \\
    --google-secret "YOUR_GOOGLE_CLIENT_SECRET" \\
    --linkedin-id "YOUR_LINKEDIN_CLIENT_ID" \\
    --linkedin-secret "YOUR_LINKEDIN_CLIENT_SECRET"
`);
  process.exit(0);
}

// Start the script
main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});