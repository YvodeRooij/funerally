#!/usr/bin/env node

// Load environment variables from .env file
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🧪 Environment Variables Test');
console.log('==============================\n');

console.log('Google OAuth:');
console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('  GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('  NEXT_PUBLIC_GOOGLE_CLIENT_ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');

console.log('\nLinkedIn OAuth:');
console.log('  LINKEDIN_CLIENT_ID:', process.env.LINKEDIN_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('  LINKEDIN_CLIENT_SECRET:', process.env.LINKEDIN_CLIENT_SECRET ? '✅ Set' : '❌ Missing');

console.log('\nNextAuth:');
console.log('  NEXTAUTH_URL:', process.env.NEXTAUTH_URL ? '✅ Set' : '❌ Missing');
console.log('  NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing');

console.log('\n🔍 Actual Values (first 10 chars):');
console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 15) + '...' : 'undefined');
console.log('  GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.substring(0, 15) + '...' : 'undefined');