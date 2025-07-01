# Gemini CLI Integration - Working Examples

The Gemini CLI integration is successfully configured and tested. Here are examples of how Claude Code can use it.

## ✅ Integration Status

- **API Key**: Configured in `.env`
- **Gemini CLI**: Version 0.1.7 installed
- **Status**: ✅ Working and tested

## Test Results

### 1. Brainstorming JWT Authentication
Gemini provided comprehensive ideas including:
- Core JWT implementation with access/refresh tokens
- Privacy considerations for funeral platform
- Security enhancements (HTTPS, CSRF, rate limiting)
- User experience improvements
- Funeral platform-specific considerations

### 2. Code Review
Gemini identified critical security issues:
- Plain text password storage vulnerability
- Hardcoded JWT secret
- Missing input validation
- Provided improved code example with bcrypt and environment variables

### 3. Architecture Consultation
Gemini recommended microservices architecture for the funeral platform:
- Independent scalability for chat, payments, documents
- Better resilience and security isolation
- Suggested starting with modular monolith for small teams

## How Claude Code Can Use This

### Via Task Tool
```javascript
// Example 1: Security Review
Task("Gemini Security Review", "Have Gemini review our authentication system at lib/auth for security vulnerabilities")

// Example 2: Architecture Planning
Task("Gemini Architecture", "Consult Gemini about best practices for implementing real-time chat in funeral platform")

// Example 3: Feature Brainstorming
Task("Gemini Brainstorm", "Brainstorm ideas for improving document security in the funeral platform")

// Example 4: Performance Optimization
Task("Gemini Performance", "Ask Gemini for suggestions on optimizing database queries for venue search")
```

### Direct CLI Usage
```bash
# Quick consultation
npm run gemini:chat "What's the best way to handle file uploads securely?"

# Code review
npm run gemini:review lib/auth/jwt-handler.ts

# Brainstorming session
npm run gemini:brainstorm "payment processing security"

# Debug assistance
npm run gemini:debug "TypeError in middleware" "auth.ts line 45"
```

## Best Practices for Using Gemini as Sparring Partner

1. **Use for Second Opinions**: After implementing a feature, get Gemini's perspective
2. **Security Reviews**: Regular security audits of critical code
3. **Architecture Decisions**: Validate design choices before implementation
4. **Problem Solving**: Get alternative approaches to complex problems

## Integration Architecture

```
Claude Code (Task Tool)
    ↓
Gemini Batch Tool Wrapper
    ↓
Gemini Sparring Partner
    ↓
Gemini CLI (with API Key)
    ↓
Google Gemini API
```

The integration maintains session context for coherent conversations and handles all the complexity of interfacing with the Gemini CLI.