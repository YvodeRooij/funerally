# Using Gemini CLI as a Sparring Partner with Claude Code

This document explains how Claude Code can use the integrated Gemini CLI as a sparring partner through batch tools.

## How Claude Code Can Use Gemini

### Via Task Tool

Claude Code can leverage Gemini through the Task tool for various development tasks:

```javascript
// Example 1: Brainstorming
Task("Gemini Sparring", "Use Gemini to brainstorm improvements for the authentication system")

// Example 2: Code Review
Task("Code Review", "Have Gemini review the new auth module at lib/auth.ts for security issues")

// Example 3: Debugging Help
Task("Debug Assistant", "Ask Gemini to help debug the TypeError in payment processing")

// Example 4: Architecture Consultation
Task("Architecture Consult", "Consult Gemini about microservices vs monolith for funeral platform")
```

### Integration with Claude-Flow

When using claude-flow commands, you can integrate Gemini assistance:

```bash
# Development with Gemini consultation
./claude-flow sparc run coder "Implement user authentication with Gemini code review"

# Swarm operation with Gemini
./claude-flow swarm "Build payment system" --strategy development --consult-gemini

# Architecture planning
./claude-flow sparc run architect "Design system architecture with Gemini brainstorming"
```

## Example Workflow

Here's how Claude Code might use Gemini in a typical development workflow:

1. **Initial Planning**
   ```
   Task("Gemini Brainstorm", "Brainstorm best practices for JWT token management in funeral platform")
   ```

2. **Implementation**
   - Claude writes the code
   - Uses Gemini for specific questions:
   ```
   Task("Gemini Consult", "Best way to handle JWT refresh tokens securely")
   ```

3. **Code Review**
   ```
   Task("Gemini Review", "Review the JWT implementation in lib/auth/jwt-handler.ts")
   ```

4. **Debugging**
   If issues arise:
   ```
   Task("Gemini Debug", "Help debug 'Token expired' error in auth middleware")
   ```

## Benefits of Using Gemini as Sparring Partner

1. **Second Opinion**: Get alternative perspectives on implementation approaches
2. **Specialized Knowledge**: Gemini may have different training data and insights
3. **Code Quality**: Additional code review layer
4. **Problem Solving**: Different debugging approaches and solutions
5. **Best Practices**: Cross-reference best practices and patterns

## Example Use Cases

### Security Review
```bash
# Claude Code can use:
Task("Security Audit", "Have Gemini perform security review of authentication system")
```

### Performance Optimization
```bash
# Claude Code can use:
Task("Performance Analysis", "Ask Gemini to analyze database query performance in venue search")
```

### Architecture Decisions
```bash
# Claude Code can use:
Task("Architecture Review", "Consult Gemini on event-driven vs REST API design for funeral platform")
```

## Implementation Details

The integration works by:
1. Claude Code invokes Task tool with Gemini-related description
2. The batch-tool-wrapper processes the request
3. Gemini CLI is executed with appropriate prompts
4. Results are returned to Claude Code for further action

## Best Practices

1. **Use Gemini for validation**: After implementing a feature, use Gemini to validate the approach
2. **Combine insights**: Use both Claude and Gemini insights for comprehensive solutions
3. **Iterative consultation**: Use Gemini throughout the development process, not just at the end
4. **Context preservation**: The integration maintains session context for coherent conversations

## Limitations

- Requires GEMINI_API_KEY to be set
- Gemini CLI must be installed globally
- Response times depend on API availability
- Some complex code structures may need simplification for review

## Troubleshooting

If Gemini integration fails:
1. Check API key: `echo $GEMINI_API_KEY`
2. Verify installation: `gemini --version`
3. Test manually: `echo "test" | gemini --prompt "respond"`
4. Check logs in `/tmp/gemini-*.txt`

For more details, see the [Gemini CLI documentation](https://github.com/google-gemini/gemini-cli).