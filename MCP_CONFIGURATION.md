# MCP-Supabase Integration Configuration

This document provides comprehensive documentation for the Model Context Protocol (MCP) server configuration with Supabase integration.

## Overview

The MCP configuration enables seamless integration between your application and various services including:
- Supabase for database operations and authentication
- Filesystem access for file operations
- Memory storage for persistent data
- Browser automation via Puppeteer
- HTTP fetch capabilities for API interactions

## Configuration Structure

### 1. Main Configuration File: `.mcp.json`

The `.mcp.json` file contains the complete MCP server configuration with the following structure:

```json
{
  "servers": {
    // Core MCP servers
  },
  "mcpServers": {
    // Additional MCP servers
  },
  "configuration": {
    // Global configuration options
  }
}
```

### 2. Environment Variables

All sensitive configuration values are stored in environment variables. Never commit actual credentials to version control.

## Required Environment Variables

### Supabase Configuration

```bash
# Supabase Project Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# MCP Supabase Server Configuration
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_ACCESS_TOKEN=your-supabase-access-token
```

#### Where to find these values:
1. **NEXT_PUBLIC_SUPABASE_URL**: Supabase Dashboard → Settings → API → Project URL
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Supabase Dashboard → Settings → API → Project anon key
3. **SUPABASE_SERVICE_ROLE_KEY**: Supabase Dashboard → Settings → API → Project service_role key
4. **SUPABASE_PROJECT_REF**: The subdomain from your Supabase URL (e.g., "kbneptalijjgtimulfsi" from "https://kbneptalijjgtimulfsi.supabase.co")
5. **SUPABASE_ACCESS_TOKEN**: Supabase Dashboard → Account → Access Tokens → Generate new token

### MCP Server Configuration

```bash
# Filesystem Server
MCP_ALLOWED_DIRECTORIES=/workspaces/funerally,/tmp

# Memory Server
MCP_MEMORY_STORE_PATH=/workspaces/funerally/.mcp/memory

# Puppeteer Server
MCP_PUPPETEER_HEADLESS=true

# Fetch Server
MCP_FETCH_USER_AGENT=MCP-Fetch/1.0
MCP_FETCH_TIMEOUT=30000

# Logging Configuration
MCP_LOG_LEVEL=info
MCP_LOG_FORMAT=json

# Security Configuration
MCP_ALLOWED_HOSTS=localhost,*.supabase.co,*.anthropic.com
MCP_MAX_REQUEST_SIZE=10485760
```

## MCP Servers

### 1. Supabase Server
- **Purpose**: Database operations, authentication, real-time subscriptions
- **Command**: `npx -y @supabase/mcp-server-supabase@latest`
- **Capabilities**:
  - Database queries and mutations
  - User authentication and management
  - Real-time data subscriptions
  - Storage operations

### 2. Filesystem Server
- **Purpose**: Secure file system operations
- **Command**: `npx -y @modelcontextprotocol/server-filesystem`
- **Capabilities**:
  - Read/write files within allowed directories
  - Directory operations
  - File metadata access

### 3. Memory Server
- **Purpose**: Persistent data storage across sessions
- **Command**: `npx -y @modelcontextprotocol/server-memory`
- **Capabilities**:
  - Key-value storage
  - Session persistence
  - Cross-agent data sharing

### 4. Puppeteer Server
- **Purpose**: Browser automation and web scraping
- **Command**: `npx -y @modelcontextprotocol/server-puppeteer`
- **Capabilities**:
  - Web page navigation
  - Screenshot capture
  - Form automation
  - JavaScript execution

### 5. Fetch Server
- **Purpose**: HTTP requests and API interactions
- **Command**: `npx -y @modelcontextprotocol/server-fetch`
- **Capabilities**:
  - RESTful API calls
  - Custom headers and authentication
  - Request/response handling

## Setup Instructions

### 1. Initial Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`

3. Create the MCP memory directory:
   ```bash
   mkdir -p .mcp/memory
   ```

### 2. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Run the database schema (located in `supabase/schema.sql`)
3. Configure authentication providers (Google, Facebook) in Supabase Dashboard
4. Generate an access token from your Supabase account settings

### 3. Testing the Configuration

Test each MCP server:

```bash
# Test Supabase connection
npx @supabase/mcp-server-supabase@latest test

# Test filesystem access
npx @modelcontextprotocol/server-filesystem test

# Test memory storage
npx @modelcontextprotocol/server-memory test
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files containing real credentials
2. **Access Tokens**: Rotate Supabase access tokens regularly
3. **Service Role Key**: Only use in server-side code, never expose to client
4. **Allowed Directories**: Restrict filesystem access to necessary directories only
5. **Allowed Hosts**: Whitelist only trusted domains for fetch operations

## Directory Structure

```
/workspaces/funerally/
├── .mcp.json                 # MCP server configuration
├── .mcp/                     # MCP runtime directory
│   ├── memory/              # Persistent memory storage
│   └── logs/                # Server logs (if enabled)
├── .env.local               # Local environment variables
├── .env.example             # Example environment template
└── supabase/                # Supabase specific files
    └── schema.sql           # Database schema
```

## Troubleshooting

### Common Issues

1. **MCP server fails to start**
   - Check environment variables are set correctly
   - Ensure Node.js version is compatible (>=18.0.0)
   - Verify network connectivity to Supabase

2. **Authentication errors**
   - Verify Supabase access token is valid
   - Check project reference matches your Supabase URL
   - Ensure service role key has correct permissions

3. **Filesystem access denied**
   - Verify MCP_ALLOWED_DIRECTORIES includes target paths
   - Check file permissions on the host system

### Debug Mode

Enable debug logging by setting:
```bash
MCP_LOG_LEVEL=debug
```

## Integration with Application

The MCP servers integrate with your Next.js application through:

1. **lib/supabase.ts**: Supabase client initialization
2. **lib/auth-supabase.ts**: Authentication configuration
3. **API Routes**: Server-side MCP server invocations
4. **Client Components**: Real-time subscriptions and data fetching

## Maintenance

### Regular Tasks

1. **Monitor logs** for errors or security issues
2. **Update MCP servers** to latest versions periodically
3. **Rotate access tokens** according to security policy
4. **Clean memory storage** to prevent unbounded growth
5. **Review allowed directories** and hosts for security

### Upgrading MCP Servers

Update to latest versions:
```bash
npm update @supabase/mcp-server-supabase
npm update @modelcontextprotocol/server-filesystem
npm update @modelcontextprotocol/server-memory
npm update @modelcontextprotocol/server-puppeteer
npm update @modelcontextprotocol/server-fetch
```

## Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [Supabase MCP Server](https://github.com/supabase/mcp-server-supabase)
- [Supabase Documentation](https://supabase.com/docs)
- [Environment Variables Best Practices](https://12factor.net/config)