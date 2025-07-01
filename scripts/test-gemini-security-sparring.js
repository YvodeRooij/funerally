#!/usr/bin/env node

/**
 * Test Gemini CLI as a Sparring Partner
 * 
 * This test demonstrates using Gemini to consult on security considerations
 * for a funeral planning platform's document storage system.
 */

const { GeminiSparring } = require('../lib/agents/gemini/claude-integration');

async function testGeminiSparring() {
  console.log('🧪 Testing Gemini CLI Sparring Partner\n');
  console.log('─'.repeat(80));
  
  const securityQuestion = "What are the top 3 security considerations for a funeral planning platform's document storage system?";
  
  console.log('📝 Question:', securityQuestion);
  console.log('─'.repeat(80));
  console.log('\n⏳ Consulting Gemini...\n');
  
  try {
    // Use Gemini as a sparring partner to get security insights
    const response = await GeminiSparring.consult(securityQuestion);
    
    console.log('🤖 Gemini Response:');
    console.log('─'.repeat(80));
    console.log(response);
    console.log('─'.repeat(80));
    
    // Validate response
    if (response && response.length > 0) {
      console.log('\n✅ Success: Gemini provided security insights');
      
      // Check if response mentions key security concepts
      const expectedConcepts = ['encryption', 'access control', 'compliance', 'GDPR', 'privacy', 'authentication'];
      const mentionedConcepts = expectedConcepts.filter(concept => 
        response.toLowerCase().includes(concept.toLowerCase())
      );
      
      if (mentionedConcepts.length > 0) {
        console.log(`\n🔒 Security concepts mentioned: ${mentionedConcepts.join(', ')}`);
      }
      
      return true;
    } else {
      console.error('\n❌ Error: Empty response from Gemini');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Error during Gemini consultation:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
(async () => {
  console.log('Starting Gemini Sparring Partner Test...\n');
  
  const success = await testGeminiSparring();
  
  if (success) {
    console.log('\n✨ Test completed successfully!');
    process.exit(0);
  } else {
    console.log('\n💥 Test failed!');
    process.exit(1);
  }
})();