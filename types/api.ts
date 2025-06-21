// API Types for Farewelly Platform

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Booking Types
export interface Booking {
  id: string;
  family_id: string;
  director_id?: string;
  venue_id?: string;
  service_type: string;
  date: string;
  time: string;
  duration: number; // in minutes
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  price?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingRequest {
  service_type: string;
  date: string;
  time: string;
  duration: number;
  director_id?: string;
  venue_id?: string;
  notes?: string;
}

export interface UpdateBookingRequest {
  date?: string;
  time?: string;
  duration?: number;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

// Document Types
export interface Document {
  id: string;
  title: string;
  type: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  owner_id: string;
  owner_type: 'family' | 'director' | 'venue';
  is_encrypted: boolean;
  encryption_key?: string;
  shared_with: string[];
  created_at: string;
  updated_at: string;
}

export interface UploadDocumentRequest {
  title: string;
  type: string;
  file: File;
  encrypt?: boolean;
  share_with?: string[];
}

export interface ShareDocumentRequest {
  document_id: string;
  share_with: string[];
  message?: string;
}

// Chat Types
export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_type: 'family' | 'director' | 'venue';
  message: string;
  message_type: 'text' | 'file' | 'booking' | 'system';
  metadata?: Record<string, any>;
  read_by: string[];
  created_at: string;
}

export interface ChatRoom {
  id: string;
  type: 'family_director' | 'family_venue' | 'director_venue' | 'group';
  participants: string[];
  booking_id?: string;
  title?: string;
  last_message?: ChatMessage;
  created_at: string;
  updated_at: string;
}

export interface SendMessageRequest {
  room_id: string;
  message: string;
  message_type?: 'text' | 'file' | 'booking';
  metadata?: Record<string, any>;
}

// Calendar Types
export interface CalendarEvent {
  id: string;
  owner_id: string;
  owner_type: 'director' | 'venue';
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  booking_id?: string;
  type: 'booking' | 'blocked' | 'available';
  recurring?: {
    pattern: 'daily' | 'weekly' | 'monthly';
    end_date?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  type: 'booking' | 'blocked' | 'available';
  booking_id?: string;
  recurring?: {
    pattern: 'daily' | 'weekly' | 'monthly';
    end_date?: string;
  };
}

// Venue Types
export interface VenueAvailability {
  id: string;
  venue_id: string;
  date: string;
  time_slots: TimeSlot[];
  special_pricing?: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  price?: number;
  booking_id?: string;
}

export interface SetAvailabilityRequest {
  date: string;
  time_slots: Omit<TimeSlot, 'booking_id'>[];
  special_pricing?: Record<string, number>;
}

// Payment Types
export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partial_refunded';
  payment_method: string;
  provider_payment_id?: string;
  splits?: PaymentSplit[];
  refunds?: Refund[];
  created_at: string;
  updated_at: string;
}

export interface PaymentSplit {
  recipient_id: string;
  recipient_type: 'director' | 'venue' | 'platform';
  amount: number;
  percentage?: number;
}

export interface Refund {
  id: string;
  amount: number;
  reason?: string;
  processed_at: string;
}

export interface ProcessPaymentRequest {
  booking_id: string;
  amount: number;
  payment_method: string;
  payment_token?: string;
  splits?: Omit<PaymentSplit, 'recipient_type'>[];
}

export interface RefundRequest {
  payment_id: string;
  amount?: number; // Full refund if not specified
  reason?: string;
}

// Analytics Types
export interface AnalyticsData {
  period: string;
  metrics: Record<string, number | string>;
  comparisons?: Record<string, number>;
  charts?: ChartData[];
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
    }[];
  };
}

// Client Types (for Directors)
export interface Client {
  id: string;
  director_id: string;
  family_id: string;
  relationship_status: 'active' | 'inactive' | 'archived';
  service_history: Booking[];
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface AddClientRequest {
  family_id: string;
  notes?: string;
  tags?: string[];
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  location?: string;
  service_type?: string;
  date_range?: {
    start: string;
    end: string;
  };
  price_range?: {
    min: number;
    max: number;
  };
  availability?: boolean;
  user_type?: 'family' | 'director' | 'venue';
}

export interface SearchResults<T> {
  results: T[];
  total: number;
  filters_applied: SearchFilters;
  suggestions?: string[];
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  type: 'booking' | 'payment' | 'message' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface CreateNotificationRequest {
  user_id: string;
  type: 'booking' | 'payment' | 'message' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
}