#!/usr/bin/env node

/**
 * Gemini Sparring Partner CLI
 * 
 * Usage:
 *   node scripts/gemini-sparring.js brainstorm "topic"
 *   node scripts/gemini-sparring.js review "file.ts"
 *   node scripts/gemini-sparring.js debug "error message" "context"
 *   node scripts/gemini-sparring.js chat "question"
 */

const { GeminiSparring } = require('../lib/agents/gemini/claude-integration');
const fs = require('fs').promises;
const path = require('path');

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command) {
    console.log(`
Gemini Sparring Partner CLI

Usage:
  brainstorm <topic>          - Brainstorm ideas on a topic
  review <file>               - Review code in a file
  debug <error> [context]     - Get debugging help
  chat <question>             - General consultation

Examples:
  node scripts/gemini-sparring.js brainstorm "authentication system"
  node scripts/gemini-sparring.js review "lib/auth.ts"
  node scripts/gemini-sparring.js debug "TypeError: Cannot read property" "auth.ts:45"
  node scripts/gemini-sparring.js chat "What's the best way to handle JWT tokens?"
`);
    process.exit(0);
  }

  try {
    let result;

    switch (command) {
      case 'brainstorm':
        if (!args[0]) {
          console.error('Error: Please provide a topic to brainstorm');
          process.exit(1);
        }
        console.log(`🧠 Brainstorming: ${args[0]}\n`);
        result = await GeminiSparring.brainstorm(args[0]);
        break;

      case 'review':
        if (!args[0]) {
          console.error('Error: Please provide a file to review');
          process.exit(1);
        }
        const filePath = path.resolve(args[0]);
        const code = await fs.readFile(filePath, 'utf8');
        const ext = path.extname(filePath).slice(1) || 'typescript';
        console.log(`👀 Reviewing: ${filePath}\n`);
        result = await GeminiSparring.reviewCode(code, ext);
        break;

      case 'debug':
        if (!args[0]) {
          console.error('Error: Please provide an error message');
          process.exit(1);
        }
        const error = args[0];
        const context = args[1] || 'No additional context provided';
        console.log(`🐛 Debugging: ${error}\n`);
        result = await GeminiSparring.debugHelp(error, context);
        break;

      case 'chat':
      case 'consult':
        if (!args[0]) {
          console.error('Error: Please provide a question');
          process.exit(1);
        }
        console.log(`💬 Consulting Gemini: ${args[0]}\n`);
        result = await GeminiSparring.consult(args.join(' '));
        break;

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }

    console.log('Response:');
    console.log('─'.repeat(80));
    console.log(result);
    console.log('─'.repeat(80));

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();