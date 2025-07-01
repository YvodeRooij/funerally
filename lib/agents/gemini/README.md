# Gemini CLI Sparring Partner Integration

This integration allows Claude Code to use Google's Gemini CLI as a sparring partner for various development tasks including brainstorming, code review, debugging assistance, and general consultation.

## Features

- **Brainstorming**: Generate ideas and explore different perspectives on topics
- **Code Review**: Get automated code reviews with quality, security, and performance insights
- **Debugging Assistance**: Get help debugging errors with suggested solutions
- **General Consultation**: Ask questions and get AI-powered responses

## Installation

The Gemini CLI has been installed globally and integrated into the project. No additional setup is required.

## Usage

### For Claude Code (via Batch Tools)

Claude Code can use the Gemini sparring partner through the Task tool:

```javascript
// Example: Brainstorming
Task("Gemini Brainstorm", "Use Gemini to brainstorm authentication system improvements");

// Example: Code Review
Task("Gemini Code Review", "Review the authentication module for security issues");

// Example: Debugging
Task("Gemini Debug", "Help debug TypeError in auth.ts line 45");
```

### Command Line Usage

You can also use the Gemini sparring partner directly from the command line:

```bash
# Brainstorm ideas
node scripts/gemini-sparring.js brainstorm "authentication system"

# Review code
node scripts/gemini-sparring.js review "lib/auth.ts"

# Debug errors
node scripts/gemini-sparring.js debug "TypeError: Cannot read property" "auth.ts:45"

# General consultation
node scripts/gemini-sparring.js chat "What's the best way to handle JWT tokens?"
```

### Programmatic Usage

```typescript
import { GeminiSparring } from '@/lib/agents/gemini'

// Brainstorm
const ideas = await GeminiSparring.brainstorm('payment processing system', {
  perspectives: ['security', 'performance', 'user-experience'],
  depth: 'deep'
})

// Code Review
const review = await GeminiSparring.reviewCode(codeString, 'typescript')

// Debug Help
const solution = await GeminiSparring.debugHelp(
  'TypeError: Cannot read property of undefined',
  'Occurs in auth middleware when user is not logged in'
)

// General Consultation
const advice = await GeminiSparring.consult('Best practices for JWT token refresh')
```

## Integration with Claude-Flow

The Gemini sparring partner is integrated with the claude-flow system and can be used in SPARC workflows:

```bash
# Use Gemini as part of a development swarm
./claude-flow swarm "Build authentication system" --strategy development --with-gemini

# Use in SPARC modes
./claude-flow sparc run reviewer "Review auth system with Gemini assistance"
```

## Architecture

The integration consists of three main components:

1. **sparring-partner.ts**: Core implementation that interfaces with Gemini CLI
2. **batch-tool-wrapper.ts**: Wrapper for Claude Code's batch tool system
3. **claude-integration.ts**: High-level integration functions for easy use

## Configuration

The Gemini CLI uses the following environment variables:
- `GEMINI_API_KEY`: Your Google AI Studio API key
- `NEXT_PUBLIC_GEMINI_API_KEY`: Alternative API key location

## Best Practices

1. **Use for Second Opinions**: Gemini works best as a sparring partner for validating ideas and getting alternative perspectives
2. **Combine with Claude**: Use both Claude and Gemini together for comprehensive analysis
3. **Session Management**: The integration maintains session context for coherent conversations
4. **Error Handling**: All errors are gracefully handled and returned as readable messages

## Examples

### Authentication System Design
```bash
node scripts/gemini-sparring.js brainstorm "JWT vs Session-based authentication for funeral planning platform"
```

### Security Review
```bash
node scripts/gemini-sparring.js review "lib/auth/jwt-handler.ts"
```

### Performance Optimization
```bash
node scripts/gemini-sparring.js chat "How to optimize PostgreSQL queries for funeral venue searches"
```

## Troubleshooting

If you encounter issues:

1. Ensure `GEMINI_API_KEY` is set in your environment
2. Check that Gemini CLI is installed: `gemini --version`
3. Verify Node.js version is 18 or higher: `node --version`

For more help, consult the [Gemini CLI documentation](https://github.com/google-gemini/gemini-cli).