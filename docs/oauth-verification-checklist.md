# OAuth Setup Verification Checklist

This checklist ensures your OAuth integration is properly configured and ready for production use.

## Pre-Setup Requirements

### Environment Preparation
- [ ] Development environment is set up
- [ ] Node.js and npm are installed
- [ ] Project dependencies are installed (`npm install`)
- [ ] Environment variables file (.env) exists
- [ ] Supabase project is accessible

### Provider Account Setup
- [ ] Google Cloud Console account created
- [ ] LinkedIn Developer account created
- [ ] Necessary permissions for creating OAuth applications

## Google OAuth Setup Verification

### Google Cloud Console Configuration
- [ ] **Project Created/Selected**
  - [ ] Google Cloud project exists
  - [ ] Project name is descriptive (e.g., "Farewelly Production")
  - [ ] Billing is set up if required

- [ ] **API Enablement**
  - [ ] Google+ API is enabled, OR
  - [ ] Google Identity API is enabled
  - [ ] No API quota issues

- [ ] **OAuth 2.0 Credentials**
  - [ ] OAuth 2.0 Client ID created
  - [ ] Application type set to "Web application"
  - [ ] Name is descriptive: "Farewelly Supabase Auth"

- [ ] **Authorized Origins**
  - [ ] `http://localhost:3001` (development)
  - [ ] `https://your-production-domain.com` (production)
  - [ ] No trailing slashes in URLs

- [ ] **Authorized Redirect URIs**
  - [ ] `https://kbneptalijjgtimulfsi.supabase.co/auth/v1/callback`
  - [ ] `http://localhost:3001/auth/callback` (development)
  - [ ] URLs are exactly as specified (case-sensitive)

- [ ] **Credentials Retrieved**
  - [ ] Client ID copied and stored securely
  - [ ] Client Secret copied and stored securely
  - [ ] Credentials not committed to version control

### Google OAuth Testing
- [ ] **URL Accessibility**
  ```bash
  curl -I "https://kbneptalijjgtimulfsi.supabase.co/auth/v1/authorize?provider=google"
  # Should return 302 redirect
  ```

- [ ] **Frontend Integration**
  - [ ] Google sign-in button appears on `/signin` page
  - [ ] Button is properly styled and labeled
  - [ ] Button shows loading state when clicked

- [ ] **OAuth Flow**
  - [ ] Clicking button redirects to Google
  - [ ] Google authorization page loads
  - [ ] After authorization, redirects back to application
  - [ ] User is properly authenticated
  - [ ] No console errors during flow

## LinkedIn OAuth Setup Verification

### LinkedIn Developer Portal Configuration
- [ ] **App Creation**
  - [ ] LinkedIn App created
  - [ ] App name is descriptive: "Farewelly"
  - [ ] App description accurately describes purpose

- [ ] **App Details**
  - [ ] LinkedIn Page associated (if applicable)
  - [ ] Privacy policy URL provided: `https://your-domain.com/privacy`
  - [ ] App logo uploaded
  - [ ] Contact email provided

- [ ] **OAuth 2.0 Settings**
  - [ ] Auth tab accessed in LinkedIn App dashboard
  - [ ] OAuth 2.0 settings configured

- [ ] **Authorized Redirect URLs**
  - [ ] `https://kbneptalijjgtimulfsi.supabase.co/auth/v1/callback`
  - [ ] `http://localhost:3001/auth/callback` (development)
  - [ ] URLs are exactly as specified

- [ ] **Permissions/Scopes**
  - [ ] `openid` scope requested (for OpenID Connect)
  - [ ] `profile` scope requested (for user profile)
  - [ ] `email` scope requested (for email address)
  - [ ] Additional scopes if needed

- [ ] **Credentials Retrieved**
  - [ ] Client ID copied and stored securely
  - [ ] Client Secret copied and stored securely
  - [ ] Credentials not committed to version control

### LinkedIn OAuth Testing
- [ ] **URL Accessibility**
  ```bash
  curl -I "https://kbneptalijjgtimulfsi.supabase.co/auth/v1/authorize?provider=linkedin_oidc"
  # Should return 302 redirect
  ```

- [ ] **Frontend Integration**
  - [ ] LinkedIn sign-in button appears on `/signin` page
  - [ ] Button is properly styled with LinkedIn branding
  - [ ] Button shows loading state when clicked

- [ ] **OAuth Flow**
  - [ ] Clicking button redirects to LinkedIn
  - [ ] LinkedIn authorization page loads
  - [ ] After authorization, redirects back to application
  - [ ] User is properly authenticated
  - [ ] No console errors during flow

## Environment Variables Verification

### Required Variables
- [ ] **GOOGLE_CLIENT_ID**
  - [ ] Set to Google OAuth Client ID
  - [ ] Ends with `.apps.googleusercontent.com`
  - [ ] No extra spaces or characters

- [ ] **GOOGLE_CLIENT_SECRET**  
  - [ ] Set to Google OAuth Client Secret
  - [ ] Proper length and format
  - [ ] Kept secure and not exposed

- [ ] **LINKEDIN_CLIENT_ID**
  - [ ] Set to LinkedIn App Client ID
  - [ ] Alphanumeric string
  - [ ] Correct format from LinkedIn

- [ ] **LINKEDIN_CLIENT_SECRET**
  - [ ] Set to LinkedIn App Client Secret
  - [ ] Proper length and format
  - [ ] Kept secure and not exposed

- [ ] **NEXTAUTH_SECRET**
  - [ ] Random string for JWT signing
  - [ ] At least 32 characters long
  - [ ] Unique to environment

### Optional Variables
- [ ] **NEXT_PUBLIC_GOOGLE_CLIENT_ID**
  - [ ] Set for client-side OAuth (if needed)
  - [ ] Same as GOOGLE_CLIENT_ID

- [ ] **NEXT_PUBLIC_LINKEDIN_CLIENT_ID**
  - [ ] Set for client-side OAuth (if needed)
  - [ ] Same as LINKEDIN_CLIENT_ID

- [ ] **NEXTAUTH_URL**
  - [ ] Set to application URL
  - [ ] `http://localhost:3001` (development)
  - [ ] `https://your-domain.com` (production)

### Environment File Security
- [ ] `.env` file exists in project root
- [ ] `.env` file is in `.gitignore`
- [ ] Environment variables loaded correctly
- [ ] No credentials exposed in logs

## Supabase Configuration Verification

### Dashboard Settings
- [ ] **Project Access**
  - [ ] Supabase project accessible
  - [ ] Project reference: `kbneptalijjgtimulfsi`
  - [ ] Proper permissions to modify auth settings

- [ ] **Authentication Settings**
  - [ ] Auth section accessible in dashboard
  - [ ] Providers tab available
  - [ ] Settings can be modified

### Google Provider Configuration
- [ ] **Provider Enabled**
  - [ ] Google provider is enabled
  - [ ] Toggle is switched on
  - [ ] Configuration saved

- [ ] **Credentials Configured**
  - [ ] Google Client ID entered correctly
  - [ ] Google Client Secret entered correctly
  - [ ] No extra spaces or characters
  - [ ] Configuration saved successfully

### LinkedIn Provider Configuration
- [ ] **Provider Enabled**
  - [ ] LinkedIn provider is enabled
  - [ ] LinkedIn OIDC option selected
  - [ ] Toggle is switched on

- [ ] **Credentials Configured**
  - [ ] LinkedIn Client ID entered correctly
  - [ ] LinkedIn Client Secret entered correctly
  - [ ] Configuration saved successfully

### API Configuration Test
- [ ] **Using Supabase API**
  ```bash
  # Test configuration retrieval
  curl -H "Authorization: Bearer sbp_c7bcad9decdfdff29906ca40a47c51cd25e1191b" \
       "https://api.supabase.com/v1/projects/kbneptalijjgtimulfsi/config/auth"
  ```

- [ ] **Configuration Values**
  - [ ] `external_google_enabled: true`
  - [ ] `external_google_client_id` is set
  - [ ] `external_google_secret` is set (not visible)
  - [ ] `external_linkedin_oidc_enabled: true`
  - [ ] `external_linkedin_oidc_client_id` is set
  - [ ] `external_linkedin_oidc_secret` is set (not visible)

## Application Code Verification

### NextAuth Configuration
- [ ] **Auth Options**
  - [ ] `lib/auth-supabase.ts` exists
  - [ ] GoogleProvider imported and configured
  - [ ] LinkedInProvider imported and configured
  - [ ] Environment variables referenced correctly

- [ ] **Provider Configuration**
  - [ ] Google provider has proper client ID/secret
  - [ ] LinkedIn provider has OIDC configuration
  - [ ] Proper scopes configured for each provider
  - [ ] Authorization parameters set correctly

- [ ] **Callbacks**
  - [ ] JWT callback handles OAuth providers
  - [ ] Session callback passes user information
  - [ ] SignIn callback creates user profiles
  - [ ] Redirect callback handles onboarding flow

### Frontend Components
- [ ] **Sign-In Page**
  - [ ] OAuth buttons conditionally rendered
  - [ ] Environment variables checked for provider availability
  - [ ] Loading states implemented
  - [ ] Error handling in place

- [ ] **User Experience**
  - [ ] Clear visual feedback during OAuth flow
  - [ ] Proper error messages if OAuth fails
  - [ ] Consistent branding with provider guidelines
  - [ ] Accessibility considerations met

## Testing Verification

### Automated Tests
- [ ] **Test Suite Runs**
  ```bash
  node scripts/test-oauth-integration.js
  ```
  - [ ] All configuration tests pass
  - [ ] Environment variable tests pass
  - [ ] URL accessibility tests pass
  - [ ] Frontend integration tests pass

### Manual Testing
- [ ] **Google OAuth Flow**
  - [ ] Start from signin page
  - [ ] Complete full OAuth flow
  - [ ] Verify user creation/login
  - [ ] Check proper redirect behavior

- [ ] **LinkedIn OAuth Flow**
  - [ ] Start from signin page
  - [ ] Complete full OAuth flow
  - [ ] Verify user creation/login
  - [ ] Check proper redirect behavior

- [ ] **Error Scenarios**
  - [ ] Invalid credentials handled gracefully
  - [ ] Network errors don't break the app
  - [ ] User cancellation handled properly

## Security Verification

### Credential Security
- [ ] No credentials in source code
- [ ] Environment variables used correctly
- [ ] No credentials in logs
- [ ] Proper secret management in production

### OAuth Security
- [ ] CSRF protection enabled
- [ ] State parameter validation
- [ ] Proper redirect URI validation
- [ ] Secure token handling

### Application Security
- [ ] HTTPS used in production
- [ ] Secure session management
- [ ] Proper user data handling
- [ ] Privacy policy compliance

## Production Readiness

### Performance
- [ ] OAuth flows complete quickly
- [ ] No unnecessary API calls
- [ ] Efficient user session management
- [ ] Proper caching where appropriate

### Monitoring
- [ ] Error logging configured
- [ ] OAuth success/failure tracking
- [ ] Performance monitoring
- [ ] User experience analytics

### Documentation
- [ ] Setup documentation complete
- [ ] Troubleshooting guide available
- [ ] Test procedures documented
- [ ] Security considerations documented

## Final Verification

### Deployment Checklist
- [ ] All tests pass in staging environment
- [ ] Production environment variables set
- [ ] OAuth providers configured for production URLs
- [ ] Monitoring and alerting configured

### Sign-off
- [ ] **Technical Lead Review**
  - [ ] Code review completed
  - [ ] Security review passed
  - [ ] Performance review acceptable

- [ ] **QA Testing**
  - [ ] Manual testing completed
  - [ ] Edge cases tested
  - [ ] Cross-browser testing done

- [ ] **Product Owner Approval**
  - [ ] User experience approved
  - [ ] Business requirements met
  - [ ] Ready for production deployment

## Post-Deployment Verification

### Production Testing
- [ ] OAuth flows work in production
- [ ] User creation/login successful
- [ ] Performance is acceptable
- [ ] No critical errors in logs

### Monitoring Setup
- [ ] Error alerts configured
- [ ] Performance monitoring active
- [ ] User analytics tracking
- [ ] Regular health checks scheduled

---

## Quick Verification Commands

```bash
# Check environment variables
env | grep -E "(GOOGLE|LINKEDIN|NEXTAUTH)"

# Test OAuth configuration
node scripts/test-oauth.js

# Run full integration tests
node scripts/test-oauth-integration.js

# Check OAuth URLs
curl -I "https://kbneptalijjgtimulfsi.supabase.co/auth/v1/authorize?provider=google"
curl -I "https://kbneptalijjgtimulfsi.supabase.co/auth/v1/authorize?provider=linkedin_oidc"

# Start development server for manual testing
npm run dev
# Then navigate to http://localhost:3001/signin
```

## Resources

- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2/web-server)
- [LinkedIn OAuth 2.0 Setup](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth/social-login)
- [NextAuth.js Provider Documentation](https://next-auth.js.org/providers/)