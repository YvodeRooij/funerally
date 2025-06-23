#!/usr/bin/env node

/**
 * OAuth Readiness Test
 * 
 * This script verifies that Google and LinkedIn OAuth is properly configured
 * and ready for use once client IDs are added.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 OAuth Readiness Test');
console.log('========================\n');

// Check environment variables
console.log('📋 Checking Environment Variables...');
const envPath = path.join(path.dirname(__dirname), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const checkEnvVar = (name, description) => {
  const regex = new RegExp(`^${name}=(.+)$`, 'm');
  const match = envContent.match(regex);
  
  if (match) {
    const value = match[1];
    const isPlaceholder = value.includes('your-') || value.includes('PLACEHOLDER');
    console.log(`   ${isPlaceholder ? '⚠️ ' : '✅'} ${name}: ${isPlaceholder ? 'Placeholder ready' : 'Configured'}`);
    return { exists: true, configured: !isPlaceholder };
  } else {
    console.log(`   ❌ ${name}: Missing`);
    return { exists: false, configured: false };
  }
};

const googleClientId = checkEnvVar('GOOGLE_CLIENT_ID', 'Google OAuth Client ID');
const googleClientSecret = checkEnvVar('GOOGLE_CLIENT_SECRET', 'Google OAuth Client Secret');
const linkedinClientId = checkEnvVar('LINKEDIN_CLIENT_ID', 'LinkedIn OAuth Client ID');
const linkedinClientSecret = checkEnvVar('LINKEDIN_CLIENT_SECRET', 'LinkedIn OAuth Client Secret');

console.log('\n🔍 Checking File Structure...');

const checkFile = (filePath, description) => {
  const fullPath = path.join(path.dirname(__dirname), filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`   ❌ ${description}: ${filePath} (missing)`);
    return false;
  }
};

const signupForm = checkFile('components/features/auth/signup-form.tsx', 'Signup Form with OAuth');
const signinPage = checkFile('app/[locale]/(auth)/signin/page.tsx', 'Signin Page with OAuth');
const authCallback = checkFile('app/[locale]/auth/callback/page.tsx', 'OAuth Callback Handler');
const authConfig = checkFile('lib/auth-supabase.ts', 'NextAuth Configuration');

console.log('\n🌐 Checking Supabase OAuth Configuration...');

const testSupabaseConfig = async () => {
  try {
    const response = await fetch('https://api.supabase.com/v1/projects/kbneptalijjgtimulfsi/config/auth', {
      headers: {
        'Authorization': 'Bearer sbp_c7bcad9decdfdff29906ca40a47c51cd25e1191b',
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const config = await response.json();
      console.log(`   ✅ Google OAuth: ${config.external_google_enabled ? 'Enabled' : 'Disabled'}`);
      console.log(`   ✅ LinkedIn OAuth: ${config.external_linkedin_oidc_enabled ? 'Enabled' : 'Disabled'}`);
      return { google: config.external_google_enabled, linkedin: config.external_linkedin_oidc_enabled };
    } else {
      console.log(`   ❌ Failed to check Supabase config: ${response.status}`);
      return { google: false, linkedin: false };
    }
  } catch (error) {
    console.log(`   ❌ Error checking Supabase config: ${error.message}`);
    return { google: false, linkedin: false };
  }
};

const supabaseConfig = await testSupabaseConfig();

console.log('\n📊 Summary Report');
console.log('==================');

const envReady = googleClientId.exists && googleClientSecret.exists && linkedinClientId.exists && linkedinClientSecret.exists;
const filesReady = signupForm && signinPage && authCallback && authConfig;
const supabaseReady = supabaseConfig.google && supabaseConfig.linkedin;

console.log(`   Environment Variables: ${envReady ? '✅ Ready' : '❌ Missing'}`);
console.log(`   Frontend Components: ${filesReady ? '✅ Ready' : '❌ Missing'}`);
console.log(`   Supabase Configuration: ${supabaseReady ? '✅ Ready' : '❌ Not configured'}`);

const overallReady = envReady && filesReady && supabaseReady;

console.log(`\n🎯 Overall Status: ${overallReady ? '✅ READY' : '⚠️  NEEDS CONFIGURATION'}`);

if (overallReady) {
  console.log('\n🚀 Next Steps:');
  console.log('   1. Replace placeholder OAuth client IDs in .env file');
  console.log('   2. Get Google Client ID from: https://console.cloud.google.com/');
  console.log('   3. Get LinkedIn Client ID from: https://developer.linkedin.com/');
  console.log('   4. Test OAuth flows at: http://localhost:3000/signin');
  console.log('\n📋 Required Redirect URLs:');
  console.log('   - Google: https://kbneptalijjgtimulfsi.supabase.co/auth/v1/callback');
  console.log('   - LinkedIn: https://kbneptalijjgtimulfsi.supabase.co/auth/v1/callback');
  console.log('   - Development: http://localhost:3000/auth/callback');
} else {
  console.log('\n🔧 Issues to Fix:');
  if (!envReady) console.log('   - Add OAuth environment variables to .env file');
  if (!filesReady) console.log('   - Ensure all OAuth components are present');
  if (!supabaseReady) console.log('   - Configure OAuth providers in Supabase');
}

console.log('\n👋 Test Complete!');