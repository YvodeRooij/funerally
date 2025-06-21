# NextAuth Configuration for Multi-Role Authentication
## Secure Authentication System for Dutch Funeral Management Platform

**Why**: Multi-stakeholder platform requires role-based authentication with smooth onboarding  
**What**: NextAuth.js configuration supporting families, directors, venues, and admins  
**How**: Database-backed sessions with role management and Dutch market integration  

## Core Authentication Architecture

### 1. Enhanced NextAuth Configuration

#### Main Auth Configuration
```typescript
// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import { supabase } from "@/lib/supabase";
import type { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }) as Adapter,
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        }
      }
    }),
    
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      // Custom email templates for Dutch market
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        await sendDutchVerificationEmail(identifier, url);
      },
    }),
    
    // Add DigiD integration for Dutch users (future enhancement)
    // DigiDProvider({
    //   clientId: process.env.DIGID_CLIENT_ID!,
    //   clientSecret: process.env.DIGID_CLIENT_SECRET!,
    //   issuer: "https://authenticatie.digid.nl",
    // }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Custom sign-in logic
      try {
        // Check if user exists in our system
        const existingUser = await getUserByEmail(user.email!);
        
        if (!existingUser) {
          // New user - create profile
          await createUserProfile({
            email: user.email!,
            name: user.name || "Unnamed User",
            image: user.image,
            authProviderId: user.id,
            provider: account?.provider || "email"
          });
        } else {
          // Update last login
          await updateUserLastLogin(existingUser.id);
        }
        
        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        return false;
      }
    },
    
    async jwt({ token, user, account, profile, trigger, session }) {
      // Enhance JWT token with user data
      if (trigger === "signIn" || trigger === "signUp") {
        const userData = await getUserByEmail(token.email!);
        if (userData) {
          token.userId = userData.id;
          token.userType = userData.user_type;
          token.profileCompleted = userData.profile_completed_at !== null;
          token.gdprConsent = userData.gdpr_consent_date !== null;
          token.paymentTier = userData.payment_tier || "standard";
        }
      }
      
      // Handle profile updates
      if (trigger === "update" && session?.userType) {
        token.userType = session.userType;
        token.profileCompleted = true;
      }
      
      return token;
    },
    
    async session({ session, token, user }) {
      // Populate session with user data
      if (token) {
        session.user.id = token.userId as string;
        session.user.userType = token.userType as UserType;
        session.user.profileCompleted = token.profileCompleted as boolean;
        session.user.gdprConsent = token.gdprConsent as boolean;
        session.user.paymentTier = token.paymentTier as PaymentTier;
        
        // Add role-specific data
        if (session.user.userType) {
          const roleData = await getUserRoleData(session.user.id, session.user.userType);
          session.user.roleData = roleData;
        }
      }
      
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      // Custom redirect logic for onboarding flow
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  
  pages: {
    signIn: "/auth/signin",
    newUser: "/auth/onboarding",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  cookies: {
    sessionToken: {
      name: "farewelly-session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (isNewUser) {
        console.log(`New user registered: ${user.email}`);
        
        // Send welcome email
        await sendWelcomeEmail(user.email!, user.name!);
        
        // Track user registration
        await trackUserEvent("user_registered", {
          userId: user.id,
          provider: account?.provider,
          timestamp: new Date().toISOString()
        });
      }
    },
    
    async signOut({ session, token }) {
      // Clean up session data
      if (session?.user?.id) {
        await cleanupUserSession(session.user.id);
      }
    },
  },
  
  debug: process.env.NODE_ENV === "development",
};
```

### 2. Database Integration Functions

#### User Management
```typescript
// lib/auth/user-management.ts
import { supabase } from "@/lib/supabase";
import type { UserProfile, FamilyProfile, DirectorProfile, VenueProfile } from "@/lib/supabase";

export type UserType = "family" | "director" | "venue" | "admin";
export type PaymentTier = "standard" | "gemeente" | "premium";

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("email", email)
    .single();
    
  if (error) {
    console.error("Error fetching user:", error);
    return null;
  }
  
  return data;
}

export async function createUserProfile(userData: {
  email: string;
  name: string;
  image?: string;
  authProviderId: string;
  provider: string;
}): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("user_profiles")
    .insert({
      auth_provider_id: userData.authProviderId,
      email: userData.email,
      name: userData.name,
      user_type: null, // Will be set during onboarding
      gdpr_consent_date: null,
      gdpr_consent_version: null,
    })
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to create user profile: ${error.message}`);
  }
  
  return data;
}

export async function updateUserRole(
  userId: string, 
  userType: UserType,
  roleData: Partial<FamilyProfile | DirectorProfile | VenueProfile>
): Promise<void> {
  // Update main profile
  await supabase
    .from("user_profiles")
    .update({ 
      user_type: userType,
      profile_completed_at: new Date().toISOString()
    })
    .eq("id", userId);
    
  // Create role-specific profile
  switch (userType) {
    case "family":
      await supabase
        .from("family_profiles")
        .insert({
          user_id: userId,
          ...roleData as Partial<FamilyProfile>
        });
      break;
      
    case "director":
      await supabase
        .from("director_profiles")
        .insert({
          user_id: userId,
          ...roleData as Partial<DirectorProfile>
        });
      break;
      
    case "venue":
      await supabase
        .from("venue_profiles")
        .insert({
          user_id: userId,
          ...roleData as Partial<VenueProfile>
        });
      break;
  }
}

export async function getUserRoleData(userId: string, userType: UserType) {
  let table: string;
  
  switch (userType) {
    case "family":
      table = "family_profiles";
      break;
    case "director":
      table = "director_profiles";
      break;
    case "venue":
      table = "venue_profiles";
      break;
    default:
      return null;
  }
  
  const { data } = await supabase
    .from(table)
    .select("*")
    .eq("user_id", userId)
    .single();
    
  return data;
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  await supabase
    .from("user_profiles")
    .update({ last_active: new Date().toISOString() })
    .eq("id", userId);
}
```

### 3. Role-Based Access Control

#### Auth Middleware
```typescript
// lib/auth/rbac.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type RequiredRole = UserType | UserType[];
export type Permission = string;

interface AuthorizedUser {
  id: string;
  email: string;
  userType: UserType;
  profileCompleted: boolean;
  roleData?: any;
}

export async function requireAuth(
  req: NextRequest,
  requiredRoles?: RequiredRole,
  requiredPermissions?: Permission[]
): Promise<AuthorizedUser | NextResponse> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  
  const user = session.user as AuthorizedUser;
  
  // Check if user has completed profile
  if (!user.profileCompleted && !req.url.includes("/onboarding")) {
    return NextResponse.redirect(new URL("/auth/onboarding", req.url));
  }
  
  // Check role requirements
  if (requiredRoles) {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    if (!roles.includes(user.userType)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
  }
  
  // Check permission requirements
  if (requiredPermissions) {
    const hasPermissions = await checkUserPermissions(user.id, requiredPermissions);
    if (!hasPermissions) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
  }
  
  return user;
}

export async function checkUserPermissions(
  userId: string, 
  permissions: Permission[]
): Promise<boolean> {
  // Implement permission checking logic
  // This would check against a permissions table or role-based permissions
  return true; // Placeholder
}

// Decorator for API routes
export function withAuth(
  handler: (req: NextRequest, user: AuthorizedUser) => Promise<Response>,
  requiredRoles?: RequiredRole,
  requiredPermissions?: Permission[]
) {
  return async (req: NextRequest) => {
    const authResult = await requireAuth(req, requiredRoles, requiredPermissions);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    return handler(req, authResult);
  };
}
```

### 4. Onboarding Flow

#### Multi-Step Onboarding
```typescript
// lib/auth/onboarding.ts
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  required: boolean;
  userTypes: UserType[];
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: "user_type_selection",
    title: "Kies uw rol",
    description: "Selecteer uw rol op het platform",
    component: "UserTypeSelection",
    required: true,
    userTypes: ["family", "director", "venue"]
  },
  {
    id: "gdpr_consent",
    title: "Privacy Toestemming",
    description: "Geef toestemming voor gegevensverwerking",
    component: "GdprConsent",
    required: true,
    userTypes: ["family", "director", "venue"]
  },
  {
    id: "basic_profile",
    title: "Basis Profiel",
    description: "Vul uw basisgegevens in",
    component: "BasicProfile",
    required: true,
    userTypes: ["family", "director", "venue"]
  },
  {
    id: "family_details",
    title: "Familie Details",
    description: "Aanvullende familie informatie",
    component: "FamilyDetails",
    required: false,
    userTypes: ["family"]
  },
  {
    id: "director_verification",
    title: "Directeur Verificatie",
    description: "KVK verificatie en professionele gegevens",
    component: "DirectorVerification",
    required: true,
    userTypes: ["director"]
  },
  {
    id: "venue_setup",
    title: "Locatie Setup",
    description: "Locatie details en beschikbaarheid",
    component: "VenueSetup",
    required: true,
    userTypes: ["venue"]
  },
  {
    id: "payment_setup",
    title: "Betaal Setup",
    description: "Betalingsmethoden configureren",
    component: "PaymentSetup",
    required: false,
    userTypes: ["director", "venue"]
  }
];

export function getOnboardingStepsForUser(userType: UserType): OnboardingStep[] {
  return onboardingSteps.filter(step => 
    step.userTypes.includes(userType) || step.userTypes.length === 0
  );
}

export async function completeOnboardingStep(
  userId: string, 
  stepId: string, 
  stepData: any
): Promise<void> {
  // Store step completion data
  await supabase
    .from("onboarding_progress")
    .upsert({
      user_id: userId,
      step_id: stepId,
      completed_at: new Date().toISOString(),
      step_data: stepData
    });
    
  // Check if all required steps are complete
  const isComplete = await checkOnboardingComplete(userId);
  if (isComplete) {
    await supabase
      .from("user_profiles")
      .update({ profile_completed_at: new Date().toISOString() })
      .eq("id", userId);
  }
}

export async function checkOnboardingComplete(userId: string): Promise<boolean> {
  const { data: user } = await supabase
    .from("user_profiles")
    .select("user_type")
    .eq("id", userId)
    .single();
    
  if (!user?.user_type) return false;
  
  const requiredSteps = getOnboardingStepsForUser(user.user_type)
    .filter(step => step.required)
    .map(step => step.id);
    
  const { data: completed } = await supabase
    .from("onboarding_progress")
    .select("step_id")
    .eq("user_id", userId);
    
  const completedSteps = completed?.map(c => c.step_id) || [];
  
  return requiredSteps.every(step => completedSteps.includes(step));
}
```

### 5. Authentication Middleware for API Routes

#### Protecting API Endpoints
```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;
    
    // Public routes that don't require auth
    if (pathname.startsWith("/api/public")) {
      return NextResponse.next();
    }
    
    // API routes requiring specific roles
    if (pathname.startsWith("/api/families")) {
      if (token?.userType !== "family") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    
    if (pathname.startsWith("/api/directors")) {
      if (token?.userType !== "director") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    
    if (pathname.startsWith("/api/venues")) {
      if (token?.userType !== "venue") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    
    if (pathname.startsWith("/api/admin")) {
      if (token?.userType !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    
    // Redirect incomplete profiles to onboarding
    if (!token?.profileCompleted && !pathname.startsWith("/auth/onboarding")) {
      return NextResponse.redirect(new URL("/auth/onboarding", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to auth pages
        if (pathname.startsWith("/auth")) return true;
        
        // Allow access to public pages
        if (["/", "/contact", "/how-it-works"].includes(pathname)) return true;
        
        // Require authentication for all other pages
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/api/families/:path*",
    "/api/directors/:path*",
    "/api/venues/:path*",
    "/api/admin/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/onboarding/:path*"
  ]
};
```

### 6. Custom Hooks for Authentication

#### React Hooks
```typescript
// hooks/use-auth.ts
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuth(requiredRole?: UserType) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    
    if (!session.user.profileCompleted) {
      router.push("/auth/onboarding");
      return;
    }
    
    if (requiredRole && session.user.userType !== requiredRole) {
      router.push("/dashboard");
      return;
    }
  }, [session, status, requiredRole, router]);
  
  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: !!session,
    hasRole: (role: UserType) => session?.user.userType === role,
  };
}

export function useRoleAccess() {
  const { data: session } = useSession();
  
  return {
    isFamily: session?.user.userType === "family",
    isDirector: session?.user.userType === "director",
    isVenue: session?.user.userType === "venue",
    isAdmin: session?.user.userType === "admin",
    userType: session?.user.userType,
    canAccess: (roles: UserType[]) => 
      session?.user.userType ? roles.includes(session.user.userType) : false,
  };
}
```

This NextAuth configuration provides a comprehensive, secure, and role-based authentication system tailored for the Dutch funeral management platform with proper onboarding flows and multi-stakeholder access control.