# Farewelly API Architecture
## Feature-Based Backend Organization for Dutch Funeral Management Platform

**Why**: Feature-based architecture enables team scalability and domain separation  
**What**: RESTful API with domain-driven design for funeral management workflows  
**How**: Next.js App Router with modular feature organization and strict type safety  

## Core Architecture Principles

### 1. Feature-Based Folder Structure
```
app/api/
├── auth/                    # Authentication & authorization
│   ├── [...nextauth]/       # NextAuth.js routes
│   ├── onboarding/          # User onboarding workflows
│   └── roles/               # Role management
├── families/                # Family-specific operations
│   ├── profile/             # Profile management
│   ├── cases/               # Funeral case management
│   ├── documents/           # Document operations
│   └── communication/       # Family chat & messaging
├── directors/               # Director-specific operations
│   ├── profile/             # Director profile & KVK
│   ├── clients/             # Client management
│   ├── calendar/            # Availability & scheduling
│   └── commissions/         # Payment & commission tracking
├── venues/                  # Venue-specific operations
│   ├── profile/             # Venue profile & amenities
│   ├── availability/        # Calendar & booking slots
│   ├── bookings/            # Booking management
│   └── pricing/             # Dynamic pricing
├── shared/                  # Cross-feature operations
│   ├── search/              # Provider search & matching
│   ├── messaging/           # Inter-party communication
│   ├── notifications/       # Notification system
│   └── compliance/          # Dutch regulatory compliance
├── admin/                   # Platform administration
│   ├── users/               # User management
│   ├── analytics/           # Platform metrics
│   ├── compliance/          # Regulatory monitoring
│   └── support/             # Customer support tools
├── integrations/            # External service integrations
│   ├── payments/            # Stripe/Mollie integration
│   ├── kvk/                 # Dutch Chamber of Commerce
│   ├── government/          # Municipal API integration
│   └── notifications/       # WhatsApp/SMS providers
└── workflows/               # LangGraph agent workflows
    ├── funeral-planning/    # AI-driven funeral planning
    ├── document-collection/ # Automated document gathering
    ├── compliance-check/    # Regulatory compliance workflows
    └── payment-processing/  # Payment orchestration
```

### 2. API Endpoint Design Patterns

#### RESTful Resource Conventions
```typescript
// Family endpoints
GET    /api/families/profile              # Get family profile
PUT    /api/families/profile              # Update family profile
GET    /api/families/cases                # List family's funeral cases
POST   /api/families/cases                # Create new funeral case
GET    /api/families/cases/[id]           # Get specific case
PUT    /api/families/cases/[id]           # Update case details
DELETE /api/families/cases/[id]           # Cancel/delete case

// Director endpoints
GET    /api/directors/profile             # Get director profile
PUT    /api/directors/profile             # Update director profile
GET    /api/directors/clients             # List director's clients
GET    /api/directors/clients/[id]        # Get client details
POST   /api/directors/availability        # Update availability
GET    /api/directors/calendar            # Get calendar view
POST   /api/directors/quotes              # Create service quote

// Venue endpoints
GET    /api/venues/profile                # Get venue profile
PUT    /api/venues/profile                # Update venue profile
GET    /api/venues/availability           # Check availability
POST   /api/venues/bookings               # Create booking
GET    /api/venues/bookings/[id]          # Get booking details
PUT    /api/venues/bookings/[id]          # Update booking

// Cross-cutting concerns
POST   /api/shared/search                 # Search providers
GET    /api/shared/messaging/threads      # Get message threads
POST   /api/shared/messaging/send         # Send message
GET    /api/shared/notifications          # Get notifications
```

### 3. Request/Response Standards

#### Standard Response Format
```typescript
// lib/api/response-types.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

// Success response
export function createSuccessResponse<T>(data: T, metadata?: any): ApiResponse<T> {
  return {
    success: true,
    data,
    metadata
  };
}

// Error response
export function createErrorResponse(code: string, message: string, details?: any): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details
    }
  };
}
```

#### Authentication Middleware
```typescript
// lib/api/auth-middleware.ts
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function withAuth(
  handler: (req: NextRequest, context: any) => Promise<Response>,
  requiredRole?: ('family' | 'director' | 'venue' | 'admin')[]
) {
  return async (req: NextRequest, context: any) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return Response.json(
        createErrorResponse('UNAUTHORIZED', 'Authentication required'),
        { status: 401 }
      );
    }

    if (requiredRole && !requiredRole.includes(session.user.userType as any)) {
      return Response.json(
        createErrorResponse('FORBIDDEN', 'Insufficient permissions'),
        { status: 403 }
      );
    }

    // Add user context to request
    req.user = session.user;
    return handler(req, context);
  };
}
```

## Feature Implementation Details

### 1. Families Feature Module

#### Profile Management
```typescript
// app/api/families/profile/route.ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/auth-middleware';
import { getFamilyProfile, updateFamilyProfile } from '@/lib/db/families';

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const profile = await getFamilyProfile(req.user.userId);
    return Response.json(createSuccessResponse(profile));
  } catch (error) {
    return Response.json(
      createErrorResponse('PROFILE_FETCH_ERROR', error.message),
      { status: 500 }
    );
  }
}, ['family']);

export const PUT = withAuth(async (req: NextRequest) => {
  try {
    const updateData = await req.json();
    const updatedProfile = await updateFamilyProfile(req.user.userId, updateData);
    return Response.json(createSuccessResponse(updatedProfile));
  } catch (error) {
    return Response.json(
      createErrorResponse('PROFILE_UPDATE_ERROR', error.message),
      { status: 500 }
    );
  }
}, ['family']);
```

#### Case Management
```typescript
// app/api/families/cases/route.ts
export const GET = withAuth(async (req: NextRequest) => {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const status = url.searchParams.get('status');

  try {
    const cases = await getFamilyCases(req.user.userId, {
      page,
      limit,
      status: status as FuneralCaseStatus
    });
    
    return Response.json(createSuccessResponse(cases.data, {
      total: cases.total,
      page,
      limit,
      hasMore: cases.total > page * limit
    }));
  } catch (error) {
    return Response.json(
      createErrorResponse('CASES_FETCH_ERROR', error.message),
      { status: 500 }
    );
  }
}, ['family']);

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const caseData = await req.json();
    
    // Validate required fields for Dutch regulations
    const validationResult = validateFuneralCaseData(caseData);
    if (!validationResult.valid) {
      return Response.json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid case data', validationResult.errors),
        { status: 400 }
      );
    }

    const newCase = await createFuneralCase(req.user.userId, caseData);
    
    // Trigger LangGraph workflow for case processing
    await triggerWorkflow('funeral-planning', {
      caseId: newCase.id,
      familyId: req.user.userId
    });

    return Response.json(createSuccessResponse(newCase), { status: 201 });
  } catch (error) {
    return Response.json(
      createErrorResponse('CASE_CREATION_ERROR', error.message),
      { status: 500 }
    );
  }
}, ['family']);
```

### 2. Directors Feature Module

#### Client Management
```typescript
// app/api/directors/clients/route.ts
export const GET = withAuth(async (req: NextRequest) => {
  const url = new URL(req.url);
  const search = url.searchParams.get('search');
  const status = url.searchParams.get('status');
  const sortBy = url.searchParams.get('sortBy') || 'created_at';
  const sortOrder = url.searchParams.get('sortOrder') || 'desc';

  try {
    const clients = await getDirectorClients(req.user.userId, {
      search,
      status: status as FuneralCaseStatus,
      sortBy: sortBy as keyof FuneralCase,
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    return Response.json(createSuccessResponse(clients));
  } catch (error) {
    return Response.json(
      createErrorResponse('CLIENTS_FETCH_ERROR', error.message),
      { status: 500 }
    );
  }
}, ['director']);
```

#### Calendar & Availability
```typescript
// app/api/directors/calendar/route.ts
export const GET = withAuth(async (req: NextRequest) => {
  const url = new URL(req.url);
  const startDate = url.searchParams.get('start');
  const endDate = url.searchParams.get('end');
  const view = url.searchParams.get('view') || 'month';

  try {
    const calendarData = await getDirectorCalendar(req.user.userId, {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      view: view as 'day' | 'week' | 'month'
    });

    return Response.json(createSuccessResponse(calendarData));
  } catch (error) {
    return Response.json(
      createErrorResponse('CALENDAR_FETCH_ERROR', error.message),
      { status: 500 }
    );
  }
}, ['director']);

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const availabilityData = await req.json();
    const updatedAvailability = await updateDirectorAvailability(
      req.user.userId, 
      availabilityData
    );

    return Response.json(createSuccessResponse(updatedAvailability));
  } catch (error) {
    return Response.json(
      createErrorResponse('AVAILABILITY_UPDATE_ERROR', error.message),
      { status: 500 }
    );
  }
}, ['director']);
```

### 3. Venues Feature Module

#### Booking Management
```typescript
// app/api/venues/bookings/route.ts
export const GET = withAuth(async (req: NextRequest) => {
  const url = new URL(req.url);
  const startDate = url.searchParams.get('start');
  const endDate = url.searchParams.get('end');
  const status = url.searchParams.get('status');

  try {
    const bookings = await getVenueBookings(req.user.userId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status: status as BookingStatus
    });

    return Response.json(createSuccessResponse(bookings));
  } catch (error) {
    return Response.json(
      createErrorResponse('BOOKINGS_FETCH_ERROR', error.message),
      { status: 500 }
    );
  }
}, ['venue']);

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const bookingData = await req.json();
    
    // Check availability
    const isAvailable = await checkVenueAvailability(
      req.user.userId,
      bookingData.startDateTime,
      bookingData.endDateTime
    );

    if (!isAvailable) {
      return Response.json(
        createErrorResponse('UNAVAILABLE', 'Venue not available for requested time'),
        { status: 409 }
      );
    }

    const booking = await createVenueBooking(req.user.userId, bookingData);
    
    // Send confirmation notifications
    await sendBookingConfirmation(booking);

    return Response.json(createSuccessResponse(booking), { status: 201 });
  } catch (error) {
    return Response.json(
      createErrorResponse('BOOKING_CREATION_ERROR', error.message),
      { status: 500 }
    );
  }
}, ['venue']);
```

### 4. Search & Matching System

#### Provider Search
```typescript
// app/api/shared/search/route.ts
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const searchCriteria = await req.json();
    
    const results = await searchProviders({
      ...searchCriteria,
      requesterType: req.user.userType,
      requesterId: req.user.userId
    });

    // Apply Dutch regulatory filters
    const filteredResults = await applyRegulatoryFilters(results, searchCriteria);
    
    // Apply payment tier restrictions for gemeente families
    const tierFilteredResults = await applyPaymentTierFilters(
      filteredResults, 
      req.user.paymentTier
    );

    return Response.json(createSuccessResponse(tierFilteredResults));
  } catch (error) {
    return Response.json(
      createErrorResponse('SEARCH_ERROR', error.message),
      { status: 500 }
    );
  }
}, ['family', 'director']);
```

### 5. Document Management API

#### Secure Upload & Retrieval
```typescript
// app/api/shared/documents/route.ts
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('type') as string;
    const caseId = formData.get('caseId') as string;

    // Validate file type and size
    const validation = await validateDocument(file, documentType);
    if (!validation.valid) {
      return Response.json(
        createErrorResponse('INVALID_DOCUMENT', validation.message),
        { status: 400 }
      );
    }

    // Encrypt and store document
    const document = await storeSecureDocument({
      file,
      documentType,
      caseId,
      uploaderId: req.user.userId
    });

    // Auto-categorize and set retention policy
    await categorizeDocument(document.id, documentType);

    return Response.json(createSuccessResponse(document), { status: 201 });
  } catch (error) {
    return Response.json(
      createErrorResponse('DOCUMENT_UPLOAD_ERROR', error.message),
      { status: 500 }
    );
  }
});
```

### 6. Compliance & Regulatory APIs

#### Dutch Regulatory Monitoring
```typescript
// app/api/shared/compliance/check/route.ts
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { caseId } = await req.json();
    
    const complianceStatus = await checkDutchFuneralCompliance(caseId);
    
    // Update case status if compliance issues found
    if (complianceStatus.violations.length > 0) {
      await updateCaseComplianceStatus(caseId, 'deadline_risk');
      
      // Trigger urgent notifications
      await sendUrgentComplianceAlert(caseId, complianceStatus.violations);
    }

    return Response.json(createSuccessResponse(complianceStatus));
  } catch (error) {
    return Response.json(
      createErrorResponse('COMPLIANCE_CHECK_ERROR', error.message),
      { status: 500 }
    );
  }
}, ['director', 'admin']);
```

## Error Handling & Validation

### Input Validation Schema
```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const FuneralCaseSchema = z.object({
  deceasedName: z.string().min(1, 'Deceased name is required'),
  deceasedDateOfDeath: z.string().datetime('Invalid death date'),
  serviceType: z.enum(['burial', 'cremation', 'memorial_only', 'direct_cremation']),
  municipality: z.string().min(1, 'Municipality is required'),
  estimatedAttendance: z.number().min(0).max(1000).optional(),
  culturalRequirements: z.array(z.string()).default([]),
  specialRequests: z.string().optional()
});

export const DirectorProfileSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  kvkNumber: z.string().regex(/^\d{8}$/, 'Invalid KVK number format'),
  serviceAreas: z.array(z.string()).min(1, 'At least one service area required'),
  specializations: z.array(z.string()).default([]),
  priceRangeMin: z.number().min(0).optional(),
  priceRangeMax: z.number().min(0).optional()
});
```

## Security Considerations

### Rate Limiting
```typescript
// lib/api/rate-limiting.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});

export async function withRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
  
  if (!success) {
    throw new Error('Rate limit exceeded');
  }
  
  return { limit, reset, remaining };
}
```

### CORS Configuration
```typescript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGINS || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
};
```

## Monitoring & Observability

### API Metrics Collection
```typescript
// lib/api/metrics.ts
import { NextRequest } from 'next/server';

export function withMetrics(handler: Function) {
  return async (req: NextRequest, context: any) => {
    const startTime = Date.now();
    
    try {
      const response = await handler(req, context);
      
      // Log successful request
      console.log({
        method: req.method,
        url: req.url,
        duration: Date.now() - startTime,
        status: response.status,
        userType: req.user?.userType
      });
      
      return response;
    } catch (error) {
      // Log error
      console.error({
        method: req.method,
        url: req.url,
        duration: Date.now() - startTime,
        error: error.message,
        userType: req.user?.userType
      });
      
      throw error;
    }
  };
}
```

This API architecture provides a robust, scalable foundation for the Farewelly platform with proper separation of concerns, strong typing, comprehensive error handling, and Dutch regulatory compliance built-in.