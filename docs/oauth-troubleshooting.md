# OAuth Troubleshooting Guide

This guide provides solutions to common OAuth integration issues for Google and LinkedIn authentication.

## Quick Diagnostics

### Run Diagnostic Commands
```bash
# Check current OAuth status
node scripts/test-oauth.js

# Run comprehensive integration tests
node scripts/test-oauth-integration.js

# Check environment variables
env | grep -E "(GOOGLE|LINKEDIN|NEXTAUTH)"
```

### Check System Status
- **Supabase Status**: https://status.supabase.com/
- **Google Cloud Status**: https://status.cloud.google.com/
- **LinkedIn API Status**: https://linkedin.statuspage.io/

## Common Issues and Solutions

### 1. OAuth Buttons Not Appearing

#### **Problem**: Google/LinkedIn sign-in buttons don't show on signin page

#### **Symptoms**:
- Only demo buttons visible
- "OAuth providers niet geconfigureerd" message shown
- Environment variables seem set

#### **Diagnosis**:
```javascript
// Check in browser console on signin page
console.log('Google configured:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
console.log('LinkedIn configured:', process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID)
```

#### **Solutions**:

1. **Environment Variables Missing**
   ```bash
   # Check if public environment variables are set
   echo $NEXT_PUBLIC_GOOGLE_CLIENT_ID
   echo $NEXT_PUBLIC_LINKEDIN_CLIENT_ID
   
   # Add to .env file
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your-linkedin-client-id
   ```

2. **Restart Development Server**
   ```bash
   # Environment changes require restart
   npm run dev
   ```

3. **Build Cache Issues**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run dev
   ```

### 2. OAuth Redirect Errors

#### **Problem**: "redirect_uri_mismatch" or similar redirect errors

#### **Symptoms**:
- Error page after clicking OAuth button
- "The redirect URI in the request does not match..."
- OAuth provider error page

#### **Diagnosis**:
```bash
# Check current redirect URIs
curl -H "Authorization: Bearer sbp_c7bcad9decdfdff29906ca40a47c51cd25e1191b" \
     "https://api.supabase.com/v1/projects/kbneptalijjgtimulfsi/config/auth" | jq .
```

#### **Solutions**:

1. **Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Select your OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     - `https://kbneptalijjgtimulfsi.supabase.co/auth/v1/callback`
     - `http://localhost:3001/auth/callback` (for development)

2. **LinkedIn Developer Portal**
   - Go to [LinkedIn Developer Portal](https://developer.linkedin.com/apps)
   - Select your app → Auth tab
   - Add authorized redirect URLs:
     - `https://kbneptalijjgtimulfsi.supabase.co/auth/v1/callback`
     - `http://localhost:3001/auth/callback` (for development)

3. **Case Sensitivity**
   - Ensure URLs are exactly as specified
   - No trailing slashes
   - Correct protocol (http vs https)

### 3. Invalid Client ID/Secret

#### **Problem**: "invalid_client" or authentication errors

#### **Symptoms**:
- "Client authentication failed" error
- OAuth provider returns error
- Silent failures in OAuth flow

#### **Diagnosis**:
```bash
# Verify credentials are set
node -e "console.log('Google ID:', process.env.GOOGLE_CLIENT_ID?.substring(0,20) + '...')"
node -e "console.log('Google Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET')"
node -e "console.log('LinkedIn ID:', process.env.LINKEDIN_CLIENT_ID?.substring(0,20) + '...')"
node -e "console.log('LinkedIn Secret:', process.env.LINKEDIN_CLIENT_SECRET ? 'SET' : 'NOT SET')"
```

#### **Solutions**:

1. **Verify Credentials**
   - Copy credentials again from provider consoles
   - Check for extra spaces or newlines
   - Ensure no special characters are escaped

2. **Google Credentials**
   ```bash
   # Google Client ID should end with .apps.googleusercontent.com
   # Example: 123456789-abc123def456.apps.googleusercontent.com
   ```

3. **LinkedIn Credentials**
   ```bash
   # LinkedIn Client ID is typically a shorter alphanumeric string
   # Example: 78abc123def456
   ```

4. **Environment File Format**
   ```bash
   # .env file should not have quotes around values
   GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=ABCD-EFG_123456
   LINKEDIN_CLIENT_ID=78abc123def456
   LINKEDIN_CLIENT_SECRET=xyz789ABC
   ```

### 4. Supabase Configuration Issues

#### **Problem**: OAuth providers not enabled in Supabase

#### **Symptoms**:
- "Provider not enabled" errors
- OAuth URLs return 404 or 500 errors
- Supabase auth logs show configuration errors

#### **Diagnosis**:
```bash
# Check Supabase OAuth configuration
node scripts/test-oauth.js
```

#### **Solutions**:

1. **Enable Providers in Dashboard**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard/project/kbneptalijjgtimulfsi)
   - Navigate to Authentication → Providers
   - Enable Google and LinkedIn providers
   - Enter Client ID and Secret for each

2. **Using Supabase API**
   ```bash
   # Enable Google OAuth
   curl -X PATCH \
     -H "Authorization: Bearer sbp_c7bcad9decdfdff29906ca40a47c51cd25e1191b" \
     -H "Content-Type: application/json" \
     "https://api.supabase.com/v1/projects/kbneptalijjgtimulfsi/config/auth" \
     -d '{
       "external_google_enabled": true,
       "external_google_client_id": "your-google-client-id",
       "external_google_secret": "your-google-client-secret"
     }'

   # Enable LinkedIn OAuth
   curl -X PATCH \
     -H "Authorization: Bearer sbp_c7bcad9decdfdff29906ca40a47c51cd25e1191b" \
     -H "Content-Type: application/json" \
     "https://api.supabase.com/v1/projects/kbneptalijjgtimulfsi/config/auth" \
     -d '{
       "external_linkedin_oidc_enabled": true,
       "external_linkedin_oidc_client_id": "your-linkedin-client-id",
       "external_linkedin_oidc_secret": "your-linkedin-client-secret"
     }'
   ```

### 5. NextAuth Configuration Problems

#### **Problem**: NextAuth not properly configured for OAuth

#### **Symptoms**:
- NextAuth errors in server logs
- OAuth flow starts but fails to complete
- Session not created after OAuth

#### **Diagnosis**:
```bash
# Enable NextAuth debugging
NEXTAUTH_DEBUG=true npm run dev
# Check server logs for detailed OAuth flow information
```

#### **Solutions**:

1. **Check NextAuth Configuration**
   ```typescript
   // Verify lib/auth-supabase.ts has proper provider setup
   GoogleProvider({
     clientId: process.env.GOOGLE_CLIENT_ID!,
     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
     // ... proper configuration
   }),
   LinkedInProvider({
     clientId: process.env.LINKEDIN_CLIENT_ID!,
     clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
     // ... proper OIDC configuration
   })
   ```

2. **NextAuth Secret**
   ```bash
   # Ensure NEXTAUTH_SECRET is set
   # Generate a new secret if needed
   openssl rand -base64 32
   ```

3. **NextAuth URL**
   ```bash
   # Set NEXTAUTH_URL for production
   NEXTAUTH_URL=https://your-domain.com
   ```

### 6. User Profile Creation Issues

#### **Problem**: OAuth works but user profiles not created

#### **Symptoms**:
- OAuth flow completes successfully
- User not found in Supabase users table
- Redirect loops or "user not found" errors

#### **Diagnosis**:
```sql
-- Check Supabase users table
SELECT * FROM auth.users WHERE email = 'test@example.com';
SELECT * FROM profiles WHERE email = 'test@example.com';
```

#### **Solutions**:

1. **Check SignIn Callback**
   ```typescript
   // Ensure signIn callback creates user profile
   async signIn({ user, account, profile }) {
     if (account?.provider === "google" || account?.provider === "linkedin") {
       // Create user profile logic
       const supabase = getServiceSupabaseClient()
       await supabase.from('profiles').upsert({
         id: user.id,
         email: user.email!,
         name: user.name || profile?.name || "",
       })
     }
     return true
   }
   ```

2. **Database Permissions**
   - Check RLS policies on profiles table
   - Ensure service role can insert profiles
   - Verify table schema matches expected fields

### 7. CORS and Network Issues

#### **Problem**: Network requests failing during OAuth

#### **Symptoms**:
- CORS errors in browser console
- Network timeouts
- Intermittent OAuth failures

#### **Solutions**:

1. **Check Allowed Origins**
   - Verify origins in Google Cloud Console
   - Check CORS settings in application
   - Ensure proper HTTPS configuration

2. **Network Debugging**
   ```bash
   # Test OAuth URLs directly
   curl -v "https://kbneptalijjgtimulfsi.supabase.co/auth/v1/authorize?provider=google"
   
   # Check DNS resolution
   nslookup kbneptalijjgtimulfsi.supabase.co
   ```

### 8. Development vs Production Issues

#### **Problem**: OAuth works in development but fails in production

#### **Symptoms**:
- Development OAuth works fine
- Production OAuth fails with various errors
- Environment-specific configuration issues

#### **Solutions**:

1. **Environment Variables**
   ```bash
   # Ensure production environment has all required variables
   # Check deployment platform environment settings
   ```

2. **URL Configuration**
   - Update OAuth provider redirect URLs for production
   - Set NEXTAUTH_URL to production domain
   - Update CORS settings for production domain

3. **HTTPS Requirements**
   - Ensure production uses HTTPS
   - Check SSL certificate validity
   - Verify OAuth providers allow your production domain

## Debugging Tools and Techniques

### 1. Browser Developer Tools

#### Network Tab
- Monitor OAuth redirect chain
- Check for failed requests
- Verify request/response headers

#### Console Tab
- Look for JavaScript errors
- Check NextAuth debug messages
- Monitor state changes

#### Application Tab
- Check cookies and local storage
- Verify session data
- Monitor authentication state

### 2. Server-Side Debugging

#### NextAuth Debug Mode
```bash
# Enable detailed NextAuth logging
NEXTAUTH_DEBUG=true npm run dev
```

#### Custom Logging
```typescript
// Add to NextAuth events
events: {
  async signIn({ user, account, profile, isNewUser }) {
    console.log('SignIn Event:', { user: user.email, provider: account?.provider, isNewUser })
  },
  async signOut({ session, token }) {
    console.log('SignOut Event:', { user: session?.user?.email })
  }
}
```

### 3. Supabase Debugging

#### Auth Logs
- Go to Supabase Dashboard → Authentication → Logs
- Filter by timeframe and error level
- Look for OAuth-related errors

#### Database Queries
```sql
-- Check recent user signups
SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 10;

-- Check user profiles
SELECT u.email, u.created_at, p.name, p.user_type 
FROM auth.users u 
LEFT JOIN profiles p ON u.id = p.id 
ORDER BY u.created_at DESC LIMIT 10;
```

### 4. OAuth Provider Debugging

#### Google OAuth Playground
- Use [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- Test OAuth flow with your credentials
- Verify scopes and permissions

#### LinkedIn API Testing
- Use LinkedIn's API testing tools
- Verify app permissions and scopes
- Test token exchange manually

## Prevention Strategies

### 1. Configuration Management

#### Environment Variable Validation
```typescript
// Add to application startup
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'LINKEDIN_CLIENT_ID', 
  'LINKEDIN_CLIENT_SECRET',
  'NEXTAUTH_SECRET'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

#### Configuration Testing
```bash
# Add to CI/CD pipeline
npm run test:oauth-config
```

### 2. Monitoring and Alerting

#### Error Tracking
- Set up error monitoring (Sentry, LogRocket, etc.)
- Monitor OAuth success/failure rates
- Alert on configuration changes

#### Health Checks
```typescript
// Regular OAuth health check endpoint
export async function GET() {
  try {
    // Test OAuth provider availability
    const results = await testOAuthProviders();
    return Response.json({ status: 'healthy', providers: results });
  } catch (error) {
    return Response.json({ status: 'unhealthy', error: error.message }, { status: 500 });
  }
}
```

### 3. Documentation and Training

#### Runbooks
- Document common issues and solutions
- Maintain troubleshooting procedures
- Regular team training on OAuth debugging

#### Change Management
- Document all OAuth configuration changes
- Test changes in staging first
- Maintain rollback procedures

## Getting Help

### Internal Resources
1. Run automated diagnostics: `node scripts/test-oauth-integration.js`
2. Check application logs and error monitoring
3. Review recent configuration changes
4. Consult team documentation and runbooks

### External Resources
1. **Google OAuth Support**
   - [Google OAuth Troubleshooting](https://developers.google.com/identity/protocols/oauth2/web-server#troubleshooting)
   - [Google Cloud Support](https://cloud.google.com/support)

2. **LinkedIn OAuth Support**
   - [LinkedIn Developer Support](https://www.linkedin.com/help/linkedin/answer/94956)
   - [LinkedIn API Documentation](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)

3. **Supabase Support**
   - [Supabase Documentation](https://supabase.com/docs)
   - [Supabase Discord Community](https://discord.supabase.com/)
   - [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)

4. **NextAuth.js Support**
   - [NextAuth.js Documentation](https://next-auth.js.org/)
   - [NextAuth.js GitHub Discussions](https://github.com/nextauthjs/next-auth/discussions)

### Emergency Procedures

#### Rollback OAuth Changes
```bash
# Disable OAuth providers in Supabase
curl -X PATCH \
  -H "Authorization: Bearer sbp_c7bcad9decdfdff29906ca40a47c51cd25e1191b" \
  -H "Content-Type: application/json" \
  "https://api.supabase.com/v1/projects/kbneptalijjgtimulfsi/config/auth" \
  -d '{"external_google_enabled": false, "external_linkedin_oidc_enabled": false}'
```

#### Enable Debug Mode
```bash
# Temporary debug environment
NEXTAUTH_DEBUG=true npm start
```

#### Fallback Authentication
- Ensure email/password authentication remains available
- Provide clear user communication about OAuth issues
- Implement graceful degradation for authentication features