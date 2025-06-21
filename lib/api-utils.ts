import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ApiResponse, PaginationInfo } from "@/types/api";
import crypto from "crypto";

// Authentication utilities
export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new ApiError("Unauthorized", 401);
  }
  
  return session;
}

export async function requireUserType(request: NextRequest, allowedTypes: string[]) {
  const session = await requireAuth(request);
  
  if (!session.user.userType || !allowedTypes.includes(session.user.userType)) {
    throw new ApiError("Forbidden - Invalid user type", 403);
  }
  
  return session;
}

// Custom error class
export class ApiError extends Error {
  constructor(
    message: string, 
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Response utilities
export function createSuccessResponse<T>(
  data?: T, 
  message?: string,
  pagination?: PaginationInfo
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
    pagination
  });
}

export function createErrorResponse(
  error: string | Error, 
  statusCode: number = 500
): NextResponse<ApiResponse> {
  const message = error instanceof Error ? error.message : error;
  
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status: statusCode }
  );
}

// Database utilities
export async function getUserProfile(email: string) {
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("email", email)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new ApiError("Database error", 500);
  }

  return profile;
}

export async function getUserById(userId: string) {
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw new ApiError("User not found", 404);
  }

  return profile;
}

// Pagination utilities
export function parsePaginationParams(request: NextRequest): { page: number; limit: number } {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
  
  return { page, limit };
}

export function createPaginationInfo(
  page: number,
  limit: number,
  total: number
): PaginationInfo {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
}

// Validation utilities
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): void {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new ApiError(
      `Missing required fields: ${missingFields.join(", ")}`,
      400
    );
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// Encryption utilities for documents
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function encryptData(data: string, key: string): string {
  const cipher = crypto.createCipher("aes-256-cbc", key);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

export function decryptData(encryptedData: string, key: string): string {
  const decipher = crypto.createDecipher("aes-256-cbc", key);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// File upload utilities
export function validateFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType);
}

export function validateFileSize(size: number, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
}

// Search utilities
export function buildSearchQuery(
  baseQuery: any,
  searchTerm?: string,
  searchFields: string[] = []
) {
  if (!searchTerm || searchFields.length === 0) {
    return baseQuery;
  }

  // Build OR condition for multiple fields
  const searchConditions = searchFields.map(field => 
    `${field}.ilike.%${searchTerm}%`
  ).join(",");

  return baseQuery.or(searchConditions);
}

// Error handling wrapper
export function withErrorHandling(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error("API Error:", error);
      
      if (error instanceof ApiError) {
        return createErrorResponse(error.message, error.statusCode);
      }
      
      return createErrorResponse("Internal server error", 500);
    }
  };
}

// Rate limiting utilities
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

// Webhook signature verification
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
    
  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}

// Notification utilities
export async function sendNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: Record<string, any>
) {
  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type,
      title,
      message,
      data,
      is_read: false,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error("Failed to send notification:", error);
  }
}

// Analytics utilities
export function aggregateMetrics(data: any[], groupBy: string): Record<string, number> {
  return data.reduce((acc, item) => {
    const key = item[groupBy];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}