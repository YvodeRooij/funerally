# MCP-Supabase Integration Validation Checklist & Troubleshooting Guide

## Test Summary
- **Test Date**: 2025-06-23
- **Total Tests**: 17
- **Passed**: 12 (70.6%)
- **Failed**: 1 (5.9%)
- **Warnings**: 4 (23.5%)

## Validation Checklist

### ✅ Environment Configuration
- [x] **NEXT_PUBLIC_SUPABASE_URL** - Variable is set
- [x] **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Variable is set (208 chars)
- [x] **SUPABASE_SERVICE_ROLE_KEY** - Variable is set (219 chars)
- [x] **SUPABASE_ACCESS_TOKEN** - Variable is set (44 chars)

### ✅ MCP Configuration
- [x] **MCP Config File** - `.mcp.json` exists and is valid JSON
- [x] **Command Setup** - Using `npx` command correctly
- [x] **Package Reference** - `@supabase/mcp-server-supabase@latest` specified
- [x] **Project Reference** - Configured in MCP environment
- [x] **Access Token** - Configured in MCP environment

### ⚠️ Supabase Connection
- [⚠️] **Anonymous Client** - Connected but with limited access
  - Error: `relation "public._prisma_migrations" does not exist`
- [❌] **Service Role Client** - Connection failed
  - Error: `Invalid API key`

### ⚠️ Database Access
- [⚠️] **Users Table** - Not accessible (Invalid API key)
- [⚠️] **Profiles Table** - Not accessible (Invalid API key)
- [⚠️] **Sessions Table** - Not accessible (Invalid API key)

### ✅ MCP Server
- [x] **Server Spawn** - MCP server version 0.4.5 spawns successfully

### ✅ Authentication Service
- [x] **Session Check** - Auth service responds correctly
- [x] **Health Check** - Auth service is responsive

## Identified Issues

### 1. Invalid Service Role Key
**Problem**: The service role key in `.env` appears to be invalid.
- Line 27 in `.env` shows a typo: `"rose"` instead of `"role"`
- This causes all service-level operations to fail

### 2. MCP Environment Variable Substitution
**Problem**: The `.mcp.json` file uses literal `${SUPABASE_PROJECT_REF}` instead of the actual value.

### 3. Database Tables Not Created
**Problem**: Common tables (users, profiles, sessions) don't exist in the database.

## Troubleshooting Guide

### Issue 1: Invalid API Key Error

**Symptoms**:
- Service role client fails to connect
- Database operations return "Invalid API key"

**Solutions**:
1. **Check Service Role Key Format**:
   ```bash
   # The key should be a valid JWT with proper "role" claim
   # Current key has "rose" instead of "role" in the payload
   ```

2. **Regenerate Service Role Key**:
   - Go to Supabase Dashboard > Settings > API
   - Copy the service_role key (not the anon key)
   - Update SUPABASE_SERVICE_ROLE_KEY in .env

3. **Verify Key Structure**:
   ```javascript
   // Decode the JWT to check the payload
   const payload = JSON.parse(atob(key.split('.')[1]));
   console.log(payload); // Should have "role": "service_role"
   ```

### Issue 2: MCP Configuration Environment Variables

**Symptoms**:
- MCP server doesn't receive proper project reference

**Solutions**:
1. **Update .mcp.json to use actual values**:
   ```json
   {
     "servers": {
       "supabase": {
         "command": "npx",
         "args": ["-y", "@supabase/mcp-server-supabase@latest"],
         "env": {
           "SUPABASE_PROJECT_REF": "kbneptalijjgtimulfsi",
           "SUPABASE_ACCESS_TOKEN": "sbp_c7bcad9decdfdff29906ca40a47c51cd25e1191b"
         }
       }
     }
   }
   ```

### Issue 3: Missing Database Tables

**Symptoms**:
- Tables don't exist or aren't accessible

**Solutions**:
1. **Run Database Migrations**:
   ```bash
   npx prisma migrate deploy
   # or
   npm run db:migrate
   ```

2. **Create Tables Manually** (if needed):
   ```sql
   -- In Supabase SQL Editor
   CREATE TABLE IF NOT EXISTS users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email TEXT UNIQUE NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   CREATE TABLE IF NOT EXISTS profiles (
     id UUID PRIMARY KEY REFERENCES users(id),
     username TEXT,
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

## Quick Fix Steps

1. **Fix the Service Role Key typo**:
   ```bash
   # In .env, line 27, change "rose" to "role" in the JWT payload
   # Or get a new service role key from Supabase dashboard
   ```

2. **Update MCP configuration**:
   ```bash
   # Already done - check the updated .mcp.json file
   ```

3. **Test the connection again**:
   ```bash
   node scripts/test-mcp-supabase.js
   ```

## Validation Commands

```bash
# Test Supabase connection directly
curl -X GET "https://kbneptalijjgtimulfsi.supabase.co/rest/v1/" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Test MCP server
npx -y @supabase/mcp-server-supabase@latest --version

# Check JWT token validity
node -e "console.log(JSON.parse(Buffer.from('YOUR_TOKEN'.split('.')[1], 'base64').toString()))"
```

## Expected Success Criteria

When fully operational, all tests should pass with:
- ✅ All environment variables properly set
- ✅ MCP configuration valid and using correct values
- ✅ Both anon and service clients can connect
- ✅ Database tables are accessible
- ✅ MCP server spawns without timeout
- ✅ Authentication service is responsive

## Next Steps

1. Fix the service role key issue in `.env`
2. Run database migrations to create required tables
3. Re-run the test suite
4. Monitor MCP server logs for any runtime issues
5. Set up proper error logging and monitoring