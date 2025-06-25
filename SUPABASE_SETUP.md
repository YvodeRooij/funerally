# Supabase Authentication Setup

This document explains how to complete the Supabase authentication integration for your application.

## 1. Environment Variables

Add your Supabase service role key to your `.env` file:

```bash
# Replace the placeholder with your actual service role key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
```

You can find your service role key in your Supabase dashboard:
1. Go to Settings → API
2. Copy the "service_role" key (not the anon key)

## 2. Database Schema Setup

Run the SQL schema in your Supabase SQL editor:

```sql
-- The schema is in supabase/schema.sql
-- Copy and paste the entire contents into your Supabase SQL editor and run it
```

This will create:
- User profiles table with role-based data
- Director, venue, and family specific profile tables
- Roles and permissions system
- Row Level Security policies
- Automatic profile creation triggers

## 3. Switch to Supabase Authentication

Once you have the service role key set up, replace your auth configuration:

1. Update your NextAuth configuration to use the new Supabase-integrated version
2. The new configuration is in `lib/auth-supabase.ts`

## 4. Testing the Integration

After setup, test the following:

1. **OAuth Sign-in**: Google and Facebook login should work and create profiles in Supabase
2. **Credentials Sign-in**: Email/password authentication through Supabase
3. **Profile Creation**: New users should automatically get profiles created
4. **Role Management**: Users should be assigned appropriate roles and permissions

## 5. User Types and Permissions

The system supports four user types:

- **family**: Can view services, create bookings, manage profile, view memorials
- **director**: Can manage services, view clients, manage bookings, view analytics
- **venue**: Can manage venue, view bookings, manage availability, view analytics
- **admin**: Full access to all features

## 6. Next Steps

1. Set the service role key in your environment
2. Run the SQL schema in Supabase
3. Replace the auth configuration
4. Test the authentication flow
5. Configure your OAuth providers (Google/Facebook) in Supabase

## Files Created/Modified

- `lib/supabase.ts` - Added service role client function
- `lib/auth-supabase.ts` - New Supabase-integrated auth config
- `supabase/schema.sql` - Database schema for authentication
- Installed packages: `@supabase/supabase-js`, `@supabase/ssr`, `@next-auth/supabase-adapter`