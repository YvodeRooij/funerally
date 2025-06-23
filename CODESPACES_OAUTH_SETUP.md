# 🔧 Codespaces OAuth Setup Instructions

Your Google OAuth is currently configured for localhost, but you're running in GitHub Codespaces. Here's how to fix it:

## 🌐 Your Codespaces URL
```
https://studious-fortnight-45v9j4xq766h7gww-3000.app.github.dev
```

## ✅ Step 1: Update Google OAuth Console

1. **Go to Google Cloud Console**: https://console.cloud.google.com/apis/credentials
2. **Find your OAuth Client**: Look for client ID `967956745933-pg2p9ud9n0rpj1cqd930hmfbkvqn0vd4`
3. **Click Edit** (pencil icon)
4. **Add Authorized redirect URIs**:
   ```
   https://studious-fortnight-45v9j4xq766h7gww-3000.app.github.dev/api/auth/callback/google
   ```
5. **Add Authorized JavaScript origins**:
   ```
   https://studious-fortnight-45v9j4xq766h7gww-3000.app.github.dev
   ```
6. **Click Save**

## ✅ Step 2: Environment Variables Updated ✅

I've already updated your `.env` file:
- ✅ `NEXTAUTH_URL` → Codespaces URL
- ✅ `ALLOWED_ORIGINS` → Added Codespaces URL

## ✅ Step 3: Restart Development Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## 🧪 Step 4: Test OAuth Flow

1. Go to: https://studious-fortnight-45v9j4xq766h7gww-3000.app.github.dev/en/auth
2. Click "Familie" 
3. Click "Google" signin
4. Should redirect properly now!

## 🔄 If Codespaces URL Changes

When you restart Codespaces, you might get a new URL. If that happens:
1. Update the `.env` file with the new URL
2. Update Google OAuth Console with new redirect URIs
3. Restart the dev server

## 🎯 Quick Test URLs

- **Auth page**: https://studious-fortnight-45v9j4xq766h7gww-3000.app.github.dev/en/auth
- **Family intake**: https://studious-fortnight-45v9j4xq766h7gww-3000.app.github.dev/en/start
- **API health**: https://studious-fortnight-45v9j4xq766h7gww-3000.app.github.dev/api/auth/session

---

⚠️ **Remember**: Update Google OAuth Console redirect URIs first, then test!