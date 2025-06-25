
OAuth Configuration Update Guide
================================

1. Google OAuth Setup:
   a. Go to https://console.cloud.google.com/
   b. Create or select a project
   c. Enable Google+ API
   d. Create OAuth 2.0 credentials
   e. Add authorized redirect URI: https://kbneptalijjgtimulfsi.supabase.co/auth/v1/callback
   f. Copy Client ID and Client Secret

2. LinkedIn OAuth Setup:
   a. Go to https://www.linkedin.com/developers/
   b. Create a new app
   c. Add OAuth 2.0 settings
   d. Add authorized redirect URL: https://kbneptalijjgtimulfsi.supabase.co/auth/v1/callback
   e. Copy Client ID and Client Secret

3. Update credentials using one of these methods:

   Method A - Using this script (recommended):
   ```bash
   node scripts/configure-oauth-automated.js --update      --google-id "YOUR_GOOGLE_CLIENT_ID"      --google-secret "YOUR_GOOGLE_CLIENT_SECRET"      --linkedin-id "YOUR_LINKEDIN_CLIENT_ID"      --linkedin-secret "YOUR_LINKEDIN_CLIENT_SECRET"
   ```

   Method B - Using cURL directly:
   ```bash
   curl -X PATCH \
     -H "Authorization: Bearer sbp_c7bcad9decdfdff29906ca40a47c51cd25e1191b" \
     -H "Content-Type: application/json" \
     -d '{
       "external_google_enabled": true,
       "external_google_client_id": "YOUR_GOOGLE_CLIENT_ID",
       "external_google_secret": "YOUR_GOOGLE_CLIENT_SECRET",
       "external_linkedin_oidc_enabled": true,
       "external_linkedin_oidc_client_id": "YOUR_LINKEDIN_CLIENT_ID",
       "external_linkedin_oidc_secret": "YOUR_LINKEDIN_CLIENT_SECRET"
     }' \
     https://api.supabase.com/v1/projects/kbneptalijjgtimulfsi/config/auth
   ```

   Method C - Using the interactive script:
   ```bash
   node scripts/configure-oauth.js
   ```

4. Test OAuth endpoints:
   - Google: https://kbneptalijjgtimulfsi.supabase.co/auth/v1/authorize?provider=google
   - LinkedIn: https://kbneptalijjgtimulfsi.supabase.co/auth/v1/authorize?provider=linkedin_oidc

5. Update your .env file with the real credentials

6. Restart your Next.js development server
