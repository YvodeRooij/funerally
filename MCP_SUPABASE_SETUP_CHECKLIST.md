# MCP-Supabase Integration Setup Checklist

## Prerequisites
- [ ] Node.js installed (v16 or higher)
- [ ] Supabase project created
- [ ] Claude-Flow CLI installed
- [ ] Access to Supabase dashboard

## 1. Environment Configuration
- [ ] Create `.env` file if not exists
- [ ] Add Supabase URL: `NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co`
- [ ] Add Supabase Anon Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]`
- [ ] Add Service Role Key: `SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]`
- [ ] Add Supabase Access Token: `SUPABASE_ACCESS_TOKEN=[your-access-token]`
- [ ] Add NextAuth URL: `NEXTAUTH_URL=http://localhost:3000`
- [ ] Add NextAuth Secret: `NEXTAUTH_SECRET=[generate-secure-secret]`

## 2. MCP Server Configuration
- [ ] Verify `.mcp.json` exists with correct structure:
  ```json
  {
    "servers": {
      "supabase": {
        "command": "npx",
        "args": ["-y", "@supabase/mcp-server-supabase@latest"],
        "env": {
          "SUPABASE_PROJECT_REF": "[your-project-ref]",
          "SUPABASE_ACCESS_TOKEN": "[your-access-token]"
        }
      }
    }
  }
  ```
- [ ] Update project reference in `.mcp.json`
- [ ] Update access token in `.mcp.json`

## 3. Database Setup
- [ ] Run database schema: `node scripts/setup-supabase.js`
- [ ] Verify tables created:
  - [ ] `user_profiles`
  - [ ] `director_profiles`
  - [ ] `venue_profiles`
  - [ ] `family_profiles`
  - [ ] `roles`
  - [ ] `permissions`
  - [ ] `role_permissions`
- [ ] Verify RLS policies are enabled
- [ ] Verify triggers are created for automatic profile creation

## 4. Authentication Setup
- [ ] Install required packages:
  ```bash
  npm install @supabase/supabase-js @supabase/ssr @next-auth/supabase-adapter
  ```
- [ ] Configure NextAuth to use Supabase adapter
- [ ] Update auth configuration to use `lib/auth-supabase.ts`

## 5. OAuth Provider Configuration (Optional)
- [ ] Google OAuth:
  - [ ] Create Google Cloud project
  - [ ] Configure OAuth consent screen
  - [ ] Create OAuth 2.0 credentials
  - [ ] Add redirect URI: `https://[project-ref].supabase.co/auth/v1/callback`
  - [ ] Update environment variables with Google credentials
- [ ] LinkedIn OAuth:
  - [ ] Create LinkedIn app
  - [ ] Configure OAuth settings
  - [ ] Add redirect URI: `https://[project-ref].supabase.co/auth/v1/callback`
  - [ ] Update environment variables with LinkedIn credentials

## 6. MCP Server Commands
- [ ] Test MCP server start: `./claude-flow mcp start`
- [ ] Check MCP server status: `./claude-flow mcp status`
- [ ] List available MCP tools: `./claude-flow mcp tools`

## 7. Integration Testing
- [ ] Test MCP server connection to Supabase
- [ ] Verify Claude can access Supabase through MCP
- [ ] Test authentication flow:
  - [ ] Email/password signup
  - [ ] Email/password signin
  - [ ] OAuth signin (if configured)
- [ ] Verify user profile creation
- [ ] Test role-based permissions

## 8. Security Verification
- [ ] Ensure service role key is not exposed in client-side code
- [ ] Verify RLS policies are properly configured
- [ ] Check that sensitive environment variables are in `.gitignore`
- [ ] Validate OAuth redirect URIs are correctly configured

## 9. Monitoring and Maintenance
- [ ] Set up error logging for MCP server
- [ ] Configure monitoring for Supabase connection
- [ ] Document any custom MCP tools created
- [ ] Create backup of database schema

## Common Issues and Solutions

### MCP Server Won't Start
- Check that all environment variables are set
- Verify `.mcp.json` syntax is correct
- Ensure Claude-Flow CLI is properly installed

### Authentication Failures
- Verify Supabase URL and keys are correct
- Check that database schema is properly applied
- Ensure NextAuth configuration is using Supabase adapter

### Database Connection Issues
- Confirm service role key has proper permissions
- Check that Supabase project is active
- Verify network connectivity to Supabase

## Next Steps
1. Complete all checklist items
2. Test the integration thoroughly
3. Document any custom configurations
4. Set up monitoring and alerting
5. Plan for production deployment