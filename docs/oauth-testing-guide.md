# OAuth Integration Testing Guide

This guide provides comprehensive testing procedures for Google and LinkedIn OAuth integration in the Farewelly application.

## Quick Start

```bash
# Run automated tests
node scripts/test-oauth-integration.js

# Check current OAuth status
node scripts/test-oauth.js

# Configure OAuth providers
node scripts/configure-oauth.js
```

## Test Categories

### 1. Configuration Tests

These tests verify that OAuth providers are properly configured.

#### Automated Tests
- **Provider Configuration**: Checks if OAuth providers are enabled in Supabase
- **Environment Variables**: Verifies all required environment variables are set
- **Credentials Validation**: Ensures OAuth credentials are properly configured

#### Manual Verification
1. Check Supabase Dashboard
   - Go to Authentication > Providers
   - Verify Google and LinkedIn are enabled
   - Check callback URLs are correct

2. Verify Environment Variables
   ```bash
   # Check .env file contains:
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   LINKEDIN_CLIENT_ID=your-linkedin-client-id
   LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
   NEXTAUTH_SECRET=your-nextauth-secret
   ```

### 2. Provider Setup Tests

#### Google OAuth Setup
1. **Google Cloud Console Configuration**
   - Verify project is created
   - Check OAuth 2.0 credentials are configured
   - Confirm authorized redirect URIs:
     - `https://kbneptalijjgtimulfsi.supabase.co/auth/v1/callback`
     - `http://localhost:3001/auth/callback` (development)

2. **Testing Google OAuth URLs**
   ```bash
   curl -I "https://kbneptalijjgtimulfsi.supabase.co/auth/v1/authorize?provider=google"
   # Should return 302 redirect
   ```

#### LinkedIn OAuth Setup
1. **LinkedIn Developer Portal Configuration**
   - Verify app is created
   - Check OAuth 2.0 settings
   - Confirm authorized redirect URLs:
     - `https://kbneptalijjgtimulfsi.supabase.co/auth/v1/callback`
     - `http://localhost:3001/auth/callback` (development)

2. **Testing LinkedIn OAuth URLs**
   ```bash
   curl -I "https://kbneptalijjgtimulfsi.supabase.co/auth/v1/authorize?provider=linkedin_oidc"
   # Should return 302 redirect
   ```

### 3. Frontend Integration Tests

#### Sign-In Page Tests
1. **Visual Inspection**
   - OAuth buttons appear when providers are configured
   - Buttons are hidden when providers are not configured
   - Loading states work correctly

2. **Button Functionality**
   ```javascript
   // Test Google sign-in button
   await signIn("google", { callbackUrl: "/onboarding" })
   
   // Test LinkedIn sign-in button
   await signIn("linkedin", { callbackUrl: "/onboarding" })
   ```

#### NextAuth Configuration Tests
1. **Provider Configuration**
   - Google Provider with correct client ID/secret
   - LinkedIn Provider with OIDC configuration
   - Proper scope configuration

2. **Callback Configuration**
   - JWT callback handles OAuth providers
   - Session callback passes user information
   - SignIn callback creates user profiles

### 4. End-to-End Flow Tests

#### Manual OAuth Flow Testing

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Google OAuth Flow**
   - Navigate to `http://localhost:3001/signin`
   - Click "Inloggen met Google" button
   - Complete Google OAuth flow
   - Verify redirect to onboarding/dashboard
   - Check user session is created

3. **Test LinkedIn OAuth Flow**
   - Navigate to `http://localhost:3001/signin`
   - Click "Inloggen met LinkedIn" button
   - Complete LinkedIn OAuth flow
   - Verify redirect to onboarding/dashboard
   - Check user session is created

#### User Profile Creation Tests
1. **New User Flow**
   - First-time OAuth user should create profile
   - User should be redirected to onboarding
   - Profile should be stored in Supabase

2. **Existing User Flow**
   - Returning OAuth user should sign in directly
   - User should be redirected to dashboard
   - Session should contain user role/permissions

### 5. Error Handling Tests

#### Common Error Scenarios

1. **Invalid Client ID/Secret**
   - Test with incorrect credentials
   - Verify error messages are displayed
   - Check error logging

2. **Callback URL Mismatch**
   - Test with unregistered callback URL
   - Verify appropriate error handling

3. **Network Connectivity Issues**
   - Test with network interruptions
   - Verify timeout handling
   - Check retry mechanisms

#### Error Response Testing
```bash
# Test invalid provider
curl "https://kbneptalijjgtimulfsi.supabase.co/auth/v1/authorize?provider=invalid"

# Test malformed request
curl "https://kbneptalijjgtimulfsi.supabase.co/auth/v1/authorize"
```

## Testing Checklist

### Pre-Test Setup
- [ ] Environment variables configured
- [ ] Supabase OAuth providers enabled
- [ ] Google Cloud Console configured
- [ ] LinkedIn Developer Portal configured
- [ ] Development server can start

### Automated Tests
- [ ] Run OAuth integration test suite
- [ ] All configuration tests pass
- [ ] Environment variable tests pass
- [ ] URL accessibility tests pass
- [ ] Frontend integration tests pass

### Manual Tests
- [ ] Google OAuth button appears on signin page
- [ ] LinkedIn OAuth button appears on signin page
- [ ] Google OAuth flow completes successfully
- [ ] LinkedIn OAuth flow completes successfully
- [ ] New users are redirected to onboarding
- [ ] Existing users are redirected to dashboard
- [ ] User profiles are created/updated correctly
- [ ] Sessions contain proper user information

### Error Scenarios
- [ ] Invalid credentials handled gracefully
- [ ] Network errors handled appropriately
- [ ] Callback URL mismatches handled
- [ ] Provider-specific errors handled

### Performance Tests
- [ ] OAuth redirects happen quickly
- [ ] Token exchange is efficient
- [ ] User profile creation is fast
- [ ] Session management is responsive

## Test Data and Scenarios

### Test User Personas
1. **New Family User**
   - First-time OAuth sign-in
   - No existing profile
   - Should go through onboarding

2. **Returning Director User**
   - Existing OAuth user
   - Has completed onboarding
   - Should go directly to dashboard

3. **Venue Owner with Role**
   - Existing user with specific role
   - Should have proper permissions
   - Should see role-specific dashboard

### Test Environments
1. **Development (localhost:3001)**
   - Local OAuth callbacks
   - Development OAuth apps
   - Debug logging enabled

2. **Staging (if available)**
   - Production-like OAuth setup
   - Real OAuth provider integration
   - Performance testing

3. **Production**
   - Live OAuth providers
   - Real user scenarios
   - Monitoring and analytics

## Monitoring and Debugging

### Logging
```javascript
// Enable NextAuth debug logging
NEXTAUTH_DEBUG=true npm run dev

// Check Supabase auth logs
// Go to Supabase Dashboard > Authentication > Logs
```

### Debug URLs
- Supabase Auth Dashboard: `https://supabase.com/dashboard/project/kbneptalijjgtimulfsi/auth/users`
- Google API Console: `https://console.cloud.google.com/apis/credentials`
- LinkedIn App Dashboard: `https://developer.linkedin.com/apps`

### Common Debug Steps
1. Check browser network tab for OAuth requests
2. Verify redirect URLs in provider consoles
3. Check environment variables in server logs
4. Validate JWT tokens in NextAuth debug output
5. Monitor Supabase auth logs for errors

## Test Reporting

### Automated Test Reports
- Test results saved to `test-results/oauth-integration-test.json`
- Summary includes pass/fail counts and details
- Critical issues highlighted with recommendations

### Manual Test Documentation
- Record test steps and results
- Document any issues or unexpected behavior
- Note performance characteristics
- Track user experience feedback

## Continuous Testing

### CI/CD Integration
```yaml
# Add to GitHub Actions workflow
- name: Run OAuth Integration Tests
  run: node scripts/test-oauth-integration.js
  env:
    GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
    GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}
    LINKEDIN_CLIENT_ID: ${{ secrets.LINKEDIN_CLIENT_ID }}
    LINKEDIN_CLIENT_SECRET: ${{ secrets.LINKEDIN_CLIENT_SECRET }}
```

### Regular Testing Schedule
- **Daily**: Automated configuration tests
- **Weekly**: Full OAuth flow tests
- **Monthly**: Provider setup verification
- **Release**: Complete test suite execution

## Troubleshooting Common Issues

See [OAuth Troubleshooting Guide](oauth-troubleshooting.md) for detailed solutions to common problems.

## Security Considerations

- Never commit OAuth credentials to version control
- Use secure environment variable management
- Regularly rotate OAuth secrets
- Monitor OAuth provider security advisories
- Implement proper CSRF protection
- Validate all OAuth callback parameters

## Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [LinkedIn OAuth 2.0 Documentation](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)