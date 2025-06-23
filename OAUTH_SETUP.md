# OAuth Setup Guide - Google & LinkedIn

Dit document legt uit hoe je Google en LinkedIn OAuth configureert voor je Supabase project.

## Huidige Status
- **Google OAuth**: ❌ Uitgeschakeld
- **LinkedIn OAuth**: ❌ Uitgeschakeld  
- **Supabase Project**: `kbneptalijjgtimulfsi`

## 1. Google OAuth Setup

### Stap 1: Google Cloud Console
1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Maak een nieuw project aan of selecteer een bestaand project
3. Activeer de **Google+ API** of **Google Identity API**

### Stap 2: OAuth 2.0 Credentials
1. Ga naar **APIs & Services > Credentials**
2. Klik **Create Credentials > OAuth 2.0 Client IDs**
3. Selecteer **Web application**
4. Vul in:
   - **Name**: `Farewelly Supabase Auth`
   - **Authorized JavaScript origins**: 
     - `http://localhost:3001` (development)
     - `https://your-domain.com` (production)
   - **Authorized redirect URIs**:
     - `https://kbneptalijjgtimulfsi.supabase.co/auth/v1/callback`
     - `http://localhost:3001/auth/callback` (development)

### Stap 3: Kopieer Credentials
- **Client ID**: `your-google-client-id.apps.googleusercontent.com`
- **Client Secret**: `your-google-client-secret`

## 2. LinkedIn OAuth Setup

### Stap 1: LinkedIn Developer Portal
1. Ga naar [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Klik **Create App**
3. Vul in:
   - **App name**: `Farewelly`
   - **LinkedIn Page**: Je bedrijfspagina (optioneel)
   - **Privacy policy URL**: `https://your-domain.com/privacy`
   - **App logo**: Upload je logo

### Stap 2: OAuth 2.0 Settings
1. Ga naar **Auth** tab
2. Voeg toe bij **Authorized redirect URLs**:
   - `https://kbneptalijjgtimulfsi.supabase.co/auth/v1/callback`
   - `http://localhost:3001/auth/callback` (development)

### Stap 3: Kopieer Credentials
- **Client ID**: `your-linkedin-client-id`
- **Client Secret**: `your-linkedin-client-secret`

### Stap 4: Permissions
Vraag deze permissions aan:
- `openid` (voor OpenID Connect)
- `profile` (voor gebruikersprofiel)
- `email` (voor e-mailadres)

## 3. Environment Variables

Voeg toe aan je `.env` bestand:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# LinkedIn OAuth  
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Public variables (for client-side)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your-linkedin-client-id
```

## 4. Supabase Configuration

Na het verkrijgen van de credentials, voer uit:

```bash
# Configureer Google OAuth
curl -X PATCH \
  -H "Authorization: Bearer sbp_c7bcad9decdfdff29906ca40a47c51cd25e1191b" \
  -H "Content-Type: application/json" \
  "https://api.supabase.com/v1/projects/kbneptalijjgtimulfsi/config/auth" \
  -d '{
    "external_google_enabled": true,
    "external_google_client_id": "your-google-client-id.apps.googleusercontent.com",
    "external_google_secret": "your-google-client-secret"
  }'

# Configureer LinkedIn OAuth
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

## 5. Testing

Test de OAuth providers:
- Google: `https://kbneptalijjgtimulfsi.supabase.co/auth/v1/authorize?provider=google`
- LinkedIn: `https://kbneptalijjgtimulfsi.supabase.co/auth/v1/authorize?provider=linkedin_oidc`

## 6. Troubleshooting

### Veelvoorkomende Problemen:
1. **Redirect URI mismatch**: Controleer of alle URLs exact overeenkomen
2. **Invalid client**: Controleer Client ID en Secret
3. **Scope issues**: Zorg dat de juiste permissions zijn aangevraagd

### Debug URLs:
- Supabase Auth logs: `https://supabase.com/dashboard/project/kbneptalijjgtimulfsi/auth/users`
- Google API Console: `https://console.cloud.google.com/apis/credentials`
- LinkedIn App Dashboard: `https://developer.linkedin.com/apps`

## Volgende Stappen

Na het configureren van de OAuth providers:
1. Update de frontend components om Google/LinkedIn login knoppen te tonen
2. Test de volledige authenticatieflow
3. Configureer user roles en permissions
4. Implementeer logout functionaliteit

Voor hulp, voer dit commando uit:
```bash
node scripts/test-oauth.js
```