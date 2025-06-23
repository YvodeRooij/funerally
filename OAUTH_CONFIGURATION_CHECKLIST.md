# OAuth Configuration Checklist for Google & LinkedIn

## Prerequisites
- [ ] Supabase Project ID confirmed: `kbneptalijjgtimulfsi`
- [ ] Supabase Access Token available: `sbp_c7bcad9decdfdff29906ca40a47c51cd25e1191b`
- [ ] Production domain decided (for redirect URLs)
- [ ] Privacy Policy URL available
- [ ] Terms of Service URL available

## Redirect URLs Configuration

### For Google OAuth
```
Production: https://kbneptalijjgtimulfsi.supabase.co/auth/v1/callback
Development: http://localhost:3000/auth/callback
```

### For LinkedIn OAuth
```
Production: https://kbneptalijjgtimulfsi.supabase.co/auth/v1/callback
Development: http://localhost:3000/auth/callback
```

## Google OAuth Setup Checklist

### Step 1: Google Cloud Console Access
- [ ] Go to https://console.cloud.google.com/
- [ ] Sign in with your Google account
- [ ] Create new project or select existing one
- [ ] Project name: `Funerally Production` (suggested)

### Step 2: Enable Required APIs
- [ ] Navigate to "APIs & Services" > "Library"
- [ ] Search for "Google+ API" or "Google Identity API"
- [ ] Click "Enable" on the API

### Step 3: Create OAuth 2.0 Credentials
- [ ] Go to "APIs & Services" > "Credentials"
- [ ] Click "Create Credentials" > "OAuth 2.0 Client ID"
- [ ] Configure OAuth consent screen first if prompted:
  - [ ] User Type: External
  - [ ] App name: `Funerally`
  - [ ] User support email: Your email
  - [ ] Developer contact email: Your email
  - [ ] Add your domain to "Authorized domains"

### Step 4: Configure OAuth Client
- [ ] Application type: "Web application"
- [ ] Name: `Funerally Supabase Auth`
- [ ] Authorized JavaScript origins:
  - [ ] Add `https://kbneptalijjgtimulfsi.supabase.co`
  - [ ] Add `http://localhost:3000` (for development)
  - [ ] Add your production domain
- [ ] Authorized redirect URIs:
  - [ ] Add `https://kbneptalijjgtimulfsi.supabase.co/auth/v1/callback`
  - [ ] Add `http://localhost:3000/auth/callback` (for development)

### Step 5: Save Credentials
- [ ] Copy Client ID (format: `xxxxx.apps.googleusercontent.com`)
- [ ] Copy Client Secret
- [ ] Save both securely

## LinkedIn OAuth Setup Checklist

### Step 1: LinkedIn Developer Portal Access
- [ ] Go to https://developer.linkedin.com/
- [ ] Sign in with your LinkedIn account
- [ ] Click "Create app"

### Step 2: Create LinkedIn App
- [ ] App name: `Funerally`
- [ ] LinkedIn Page: Select your company page (or create one)
- [ ] Privacy policy URL: Your privacy policy URL
- [ ] App logo: Upload logo (300x300px recommended)
- [ ] Legal agreement: Check the box
- [ ] Click "Create app"

### Step 3: Configure OAuth 2.0 Settings
- [ ] Navigate to "Auth" tab
- [ ] OAuth 2.0 scopes required:
  - [ ] `openid` (OpenID Connect)
  - [ ] `profile` (Basic profile data)
  - [ ] `email` (Email address)
- [ ] Add Authorized redirect URLs:
  - [ ] Add `https://kbneptalijjgtimulfsi.supabase.co/auth/v1/callback`
  - [ ] Add `http://localhost:3000/auth/callback` (for development)

### Step 4: Product Selection
- [ ] Go to "Products" tab
- [ ] Request access to "Sign In with LinkedIn using OpenID Connect"
- [ ] Wait for approval (usually instant for basic sign-in)

### Step 5: Save Credentials
- [ ] Copy Client ID
- [ ] Copy Client Secret
- [ ] Save both securely

## Environment Variables Update

### Step 1: Update .env file
- [ ] Open `.env` file
- [ ] Replace Google placeholders:
  ```
  GOOGLE_CLIENT_ID=<your-actual-google-client-id>
  GOOGLE_CLIENT_SECRET=<your-actual-google-secret>
  ```
- [ ] Replace LinkedIn placeholders:
  ```
  LINKEDIN_CLIENT_ID=<your-actual-linkedin-client-id>
  LINKEDIN_CLIENT_SECRET=<your-actual-linkedin-secret>
  ```

### Step 2: Add Public Environment Variables (if needed)
- [ ] Add to `.env`:
  ```
  NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>
  NEXT_PUBLIC_LINKEDIN_CLIENT_ID=<your-linkedin-client-id>
  ```

## Supabase Configuration

### Step 1: Configure Google OAuth in Supabase
- [ ] Run the configuration script or use the API:
  ```bash
  curl -X PATCH \
    -H "Authorization: Bearer sbp_c7bcad9decdfdff29906ca40a47c51cd25e1191b" \
    -H "Content-Type: application/json" \
    "https://api.supabase.com/v1/projects/kbneptalijjgtimulfsi/config/auth" \
    -d '{
      "external_google_enabled": true,
      "external_google_client_id": "<your-google-client-id>",
      "external_google_secret": "<your-google-secret>"
    }'
  ```

### Step 2: Configure LinkedIn OAuth in Supabase
- [ ] Run the configuration script or use the API:
  ```bash
  curl -X PATCH \
    -H "Authorization: Bearer sbp_c7bcad9decdfdff29906ca40a47c51cd25e1191b" \
    -H "Content-Type: application/json" \
    "https://api.supabase.com/v1/projects/kbneptalijjgtimulfsi/config/auth" \
    -d '{
      "external_linkedin_oidc_enabled": true,
      "external_linkedin_oidc_client_id": "<your-linkedin-client-id>",
      "external_linkedin_oidc_secret": "<your-linkedin-secret>"
    }'
  ```

## Testing & Verification

### Step 1: Test OAuth URLs
- [ ] Test Google OAuth: `https://kbneptalijjgtimulfsi.supabase.co/auth/v1/authorize?provider=google`
- [ ] Test LinkedIn OAuth: `https://kbneptalijjgtimulfsi.supabase.co/auth/v1/authorize?provider=linkedin_oidc`

### Step 2: Verify Redirect Flow
- [ ] Click the test URL
- [ ] Verify redirect to provider login page
- [ ] Complete login
- [ ] Verify redirect back to callback URL
- [ ] Check for error messages

### Step 3: Application Integration
- [ ] Update frontend to show Google/LinkedIn login buttons
- [ ] Test login flow from application
- [ ] Verify user data is properly stored in Supabase
- [ ] Test logout functionality

## Common Issues & Solutions

### Google OAuth Issues
- [ ] **Error: redirect_uri_mismatch**
  - Solution: Ensure redirect URI exactly matches (including trailing slashes)
- [ ] **Error: invalid_client**
  - Solution: Verify Client ID and Secret are correctly copied
- [ ] **Error: access_denied**
  - Solution: Check OAuth consent screen configuration

### LinkedIn OAuth Issues
- [ ] **Error: invalid_request**
  - Solution: Ensure "Sign In with LinkedIn using OpenID Connect" product is approved
- [ ] **Error: unauthorized_scope_error**
  - Solution: Verify requested scopes match approved scopes
- [ ] **Error: invalid_redirect_uri**
  - Solution: Check redirect URI is exactly as registered

## Final Verification
- [ ] Both OAuth providers enabled in Supabase dashboard
- [ ] Test accounts can successfully login with both providers
- [ ] User data (email, name) properly populated in database
- [ ] Error handling implemented for failed logins
- [ ] Documentation updated with final configuration

## Notes
- Keep credentials secure and never commit them to version control
- Use environment variables for all sensitive information
- Consider implementing rate limiting for OAuth endpoints
- Monitor OAuth usage in provider dashboards
- Set up alerts for unusual authentication patterns