# MCP (Model Context Protocol) Server Setup Guide

This guide provides comprehensive instructions for setting up and configuring MCP servers for the Funerally platform with Supabase integration.

## 📋 Overview

The MCP servers provide enhanced capabilities for:
- **Supabase**: Database operations, authentication, real-time subscriptions, and storage management
- **Filesystem**: Controlled file system access within allowed directories
- **Memory**: Persistent data storage across sessions for coordination

## 🚀 Quick Start

Run the automated setup:

```bash
npm run setup:all
```

This command will:
1. Initialize MCP server configuration
2. Set up Supabase database schema
3. Configure OAuth providers

## 📦 Prerequisites

1. **Node.js** (v18 or higher)
2. **Supabase Account** with a project created
3. **Environment Variables** properly configured

## 🔧 Manual Setup

### Step 1: Environment Configuration

Create or update your `.env` file with the following variables:

```bash
# Supabase Configuration (Required)
SUPABASE_PROJECT_REF=your-project-ref-here
SUPABASE_ACCESS_TOKEN=your-access-token-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# MCP Configuration (Optional - defaults provided)
MCP_ALLOWED_DIRECTORIES=./app,./components,./lib,./scripts,./supabase
MCP_MEMORY_STORE_PATH=./memory
MCP_LOG_LEVEL=info
```

#### Where to find these values:

1. **SUPABASE_PROJECT_REF**: 
   - Supabase Dashboard → Settings → General → Reference ID

2. **SUPABASE_ACCESS_TOKEN**:
   - Supabase Dashboard → Account → Access Tokens → Generate New Token
   - Required scopes: `projects:read`, `projects:write`

3. **SUPABASE_SERVICE_ROLE_KEY**:
   - Supabase Dashboard → Settings → API → service_role key
   - ⚠️ Keep this secret! It has full database access

4. **NEXT_PUBLIC_SUPABASE_URL**:
   - Supabase Dashboard → Settings → API → Project URL

### Step 2: Initialize MCP Servers

Run the initialization script:

```bash
npm run mcp:init
```

This will:
- Validate your environment configuration
- Install required dependencies
- Create necessary directories
- Test connections to all services

### Step 3: Database Setup

Set up the Supabase database schema:

```bash
npm run setup:supabase
```

This creates:
- User profiles with role-based access
- Authentication tables and triggers
- Row Level Security (RLS) policies
- Required indexes and constraints

### Step 4: OAuth Configuration (Optional)

If using OAuth providers:

```bash
npm run setup:oauth
```

Then configure providers in Supabase Dashboard:
1. Authentication → Providers
2. Enable Google/Facebook/etc.
3. Add OAuth credentials

### Step 5: Test Configuration

Verify all MCP servers are properly configured:

```bash
npm run mcp:test
```

This runs comprehensive tests on:
- Supabase connection and authentication
- Filesystem access permissions
- Memory storage capabilities

## 📂 MCP Configuration File

The `.mcp.json` file defines all MCP servers:

```json
{
  "servers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest"],
      "env": {
        "SUPABASE_PROJECT_REF": "${SUPABASE_PROJECT_REF}",
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "env": {
        "ALLOWED_DIRECTORIES": "${MCP_ALLOWED_DIRECTORIES}"
      }
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_STORE_PATH": "${MCP_MEMORY_STORE_PATH}"
      }
    }
  }
}
```

## 🛠️ Available Commands

### MCP Server Management

```bash
# Start all MCP servers
npm run mcp:start

# Stop all MCP servers
npm run mcp:stop

# Check server status
npm run mcp:status

# View server logs
npm run mcp:logs

# Restart servers
npm run mcp:restart
```

### Setup and Testing

```bash
# Run full setup
npm run setup:all

# Initialize MCP configuration
npm run mcp:init

# Set up Supabase
npm run setup:supabase

# Configure OAuth
npm run setup:oauth

# Test connections
npm run mcp:test
```

## 🔒 Security Considerations

1. **Service Role Key**: 
   - Never commit to version control
   - Use only in server-side code
   - Rotate regularly

2. **Access Tokens**:
   - Generate with minimal required scopes
   - Set expiration dates
   - Monitor usage in Supabase dashboard

3. **Filesystem Access**:
   - Limit to necessary directories only
   - Use read-only mode when possible
   - Monitor file operations

4. **Memory Storage**:
   - Encrypt sensitive data
   - Set size limits
   - Regular cleanup of old data

## 📊 Monitoring and Debugging

### View MCP Server Logs

```bash
# Follow all logs
npm run mcp:logs

# Check specific server
mcp logs supabase --follow

# Export logs
mcp logs --export ./mcp-logs.json
```

### Debug Connection Issues

1. **Check Environment Variables**:
   ```bash
   node -e "console.log(process.env.SUPABASE_PROJECT_REF)"
   ```

2. **Test Supabase Connection**:
   ```bash
   node scripts/test-mcp-connection.js
   ```

3. **Verbose Testing**:
   ```bash
   MCP_TEST_VERBOSE=true npm run mcp:test
   ```

## 🚨 Troubleshooting

### Common Issues

1. **"SUPABASE_PROJECT_REF is not set"**
   - Ensure `.env` file exists and contains the variable
   - Run `source .env` or restart your terminal

2. **"Connection refused" errors**
   - Check if Supabase project is active
   - Verify network connectivity
   - Ensure correct project URL

3. **"Permission denied" for filesystem**
   - Check directory permissions
   - Ensure directories exist
   - Verify `MCP_ALLOWED_DIRECTORIES` paths

4. **Memory storage failures**
   - Check disk space
   - Verify write permissions
   - Clear old memory data: `rm -rf ./memory/*`

### Reset and Reinstall

If experiencing persistent issues:

```bash
# Clean installation
rm -rf node_modules package-lock.json
npm install

# Reset MCP configuration
rm .mcp.json
npm run mcp:init

# Clear all data
rm -rf ./memory/*
```

## 📚 Advanced Configuration

### Custom MCP Server Wrapper

For enhanced capabilities, use the custom wrapper:

```bash
# Enable enhanced mode
MCP_ENHANCED_MODE=true npm run mcp:start
```

This provides:
- Batch operations support
- Transaction capabilities
- Schema introspection
- Advanced error handling

### Rate Limiting

Configure in `.mcp.json`:

```json
{
  "servers": {
    "supabase": {
      "settings": {
        "rateLimits": {
          "requests_per_minute": 60,
          "batch_size": 10
        }
      }
    }
  }
}
```

### Health Checks

Enable automatic health monitoring:

```bash
# Set health check interval (milliseconds)
MCP_HEALTH_CHECK_INTERVAL=30000 npm run mcp:start
```

## 🔗 Integration with Application

### Using MCP in Your Code

```javascript
// Example: Using Supabase through MCP
import { createMCPClient } from '@modelcontextprotocol/sdk';

const mcp = createMCPClient({
  servers: ['supabase', 'filesystem', 'memory']
});

// Database query
const users = await mcp.supabase.from('profiles').select('*');

// File operations
const content = await mcp.filesystem.read('./app/config.json');

// Memory storage
await mcp.memory.set('lastSync', new Date().toISOString());
```

### NextAuth Integration

The Supabase adapter is automatically configured when using:

```javascript
import { authOptions } from '@/lib/auth-supabase';
```

## 📝 Next Steps

1. **Production Deployment**:
   - Use environment-specific `.env` files
   - Enable SSL/TLS for all connections
   - Set up monitoring and alerts

2. **Performance Optimization**:
   - Enable connection pooling
   - Configure caching strategies
   - Optimize query patterns

3. **Scaling Considerations**:
   - Use read replicas for queries
   - Implement rate limiting
   - Monitor resource usage

## 🆘 Support

- **Documentation**: [MCP Protocol Docs](https://modelcontextprotocol.org)
- **Supabase Support**: [support.supabase.com](https://support.supabase.com)
- **GitHub Issues**: Report bugs in the project repository

---

Last Updated: December 2024
Version: 1.0.0