#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testGeminiDirect() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    process.exit(1);
  }

  console.log('🧪 Testing Gemini CLI with API key...\n');

  try {
    // Test with a simple prompt
    const prompt = "Hello! Please respond with a brief greeting to confirm the integration is working.";
    
    console.log('📝 Sending prompt:', prompt);
    console.log('⏳ Waiting for Gemini response...\n');

    const env = {
      ...process.env,
      GEMINI_API_KEY: apiKey
    };

    const { stdout, stderr } = await execAsync(
      `echo "${prompt}" | gemini --prompt "Respond briefly"`,
      { env }
    );

    if (stderr && !stderr.includes('warning')) {
      console.error('⚠️  Stderr:', stderr);
    }

    if (stdout) {
      console.log('✅ Gemini Response:');
      console.log('─'.repeat(80));
      console.log(stdout.trim());
      console.log('─'.repeat(80));
      console.log('\n🎉 Gemini CLI integration is working successfully!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('credentials') || error.message.includes('API')) {
      console.error('\n💡 Tips:');
      console.error('- Check that your API key is valid');
      console.error('- Ensure you have proper access to Gemini API');
      console.error('- Visit https://aistudio.google.com/app/apikey to manage your API keys');
    }
    process.exit(1);
  }
}

// Load .env file if it exists
try {
  require('dotenv').config();
} catch (e) {
  // dotenv might not be available, that's ok
}

testGeminiDirect();