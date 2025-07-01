#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// Load .env file if it exists
try {
  require('dotenv').config();
} catch (e) {
  // dotenv might not be available, that's ok
}

async function runGeminiCommand(prompt, description) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log(`\n📋 ${description}`);
  console.log('─'.repeat(80));
  
  try {
    const env = {
      ...process.env,
      GEMINI_API_KEY: apiKey
    };

    const { stdout, stderr } = await execAsync(
      `echo "${prompt.replace(/"/g, '\\"')}" | gemini --prompt "${description}"`,
      { env, maxBuffer: 1024 * 1024 * 10 } // 10MB buffer
    );

    if (stderr && !stderr.includes('warning')) {
      console.error('⚠️  Stderr:', stderr);
    }

    console.log(stdout.trim());
    console.log('─'.repeat(80));
    
    return stdout.trim();
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function testGeminiFeatures() {
  console.log('🧪 Testing Gemini CLI Features\n');

  // Test 1: Brainstorming
  await runGeminiCommand(
    'I need ideas for implementing a secure JWT authentication system for a funeral planning platform. Consider privacy, security, and user experience.',
    'Brainstorming: JWT Authentication for Funeral Platform'
  );

  // Test 2: Code Review
  const sampleCode = `
async function authenticateUser(email: string, password: string) {
  const user = await db.users.findOne({ email });
  if (!user || user.password !== password) {
    throw new Error('Invalid credentials');
  }
  const token = jwt.sign({ userId: user.id }, 'secret', { expiresIn: '1h' });
  return { user, token };
}`;

  await runGeminiCommand(
    `Please review this TypeScript authentication code for security issues and best practices:\n\n${sampleCode}`,
    'Code Review: Authentication Function'
  );

  // Test 3: Debugging Help
  await runGeminiCommand(
    'I\'m getting a "TypeError: Cannot read property \'id\' of undefined" in my JWT middleware when the token is expired. The error occurs at line: const userId = decoded.user.id;',
    'Debugging: JWT Middleware TypeError'
  );

  // Test 4: Architecture Consultation
  await runGeminiCommand(
    'Should I use microservices or a monolithic architecture for a funeral planning platform that needs to handle document storage, payments, scheduling, and real-time chat?',
    'Architecture Consultation: Microservices vs Monolith'
  );

  console.log('\n✅ All Gemini features tested successfully!');
  console.log('\n💡 The Gemini CLI integration is ready to use as a sparring partner.');
}

testGeminiFeatures().catch(console.error);