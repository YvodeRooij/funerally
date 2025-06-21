/**
 * Document Security Types and Interfaces
 * Zero-knowledge document vault for Farewelly
 */

export interface SecureDocument {
  id: string;
  name: string;
  encryptedContent: string;
  keyFingerprint: string; // Hash of encryption key for verification
  mimeType: string;
  size: number;
  category: DocumentCategory;
  retentionPolicy: RetentionPolicy;
  metadata: DocumentMetadata;
  accessControl: AccessControl;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface DocumentMetadata {
  description?: string;
  tags: string[];
  classification: 'public' | 'confidential' | 'restricted' | 'secret';
  personalDataLevel: 'none' | 'low' | 'medium' | 'high';
  isPersonalData: boolean;
  subjectIds?: string[]; // For GDPR data subject identification
  purpose: string; // GDPR processing purpose
  legalBasis: string; // GDPR legal basis
  customFields: Record<string, any>;
}

export interface AccessControl {
  ownerId: string;
  permissions: Permission[];
  shareTokens: ShareToken[];
  allowPublicAccess: boolean;
  requiresAuthentication: boolean;
  ipRestrictions?: string[];
  timeRestrictions?: TimeRestriction;
}

export interface Permission {
  userId: string;
  role: 'read' | 'write' | 'admin';
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

export interface ShareToken {
  token: string;
  permissions: 'read' | 'download';
  expiresAt: Date;
  usageLimit?: number;
  usageCount: number;
  ipRestrictions?: string[];
  passwordProtected: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface TimeRestriction {
  allowedHours: number[]; // 0-23
  allowedDays: number[]; // 0-6 (Sunday-Saturday)
  timezone: string;
}

export interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  icon?: string;
  color?: string;
  autoClassificationRules: ClassificationRule[];
  defaultRetentionPolicy: string;
}

export interface ClassificationRule {
  field: 'name' | 'content' | 'metadata';
  operator: 'contains' | 'matches' | 'startsWith' | 'endsWith' | 'regex';
  value: string;
  confidence: number; // 0-1
}

export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  retentionPeriod: number; // in days
  deleteAfterExpiration: boolean;
  moveToArchive: boolean;
  notificationBeforeExpiration: number; // days before expiration to notify
  legalHold: boolean;
  gdprCompliant: boolean;
  categories: string[]; // applicable category IDs
}

export interface EncryptionKey {
  id: string;
  fingerprint: string;
  keyData: string; // Encrypted with master key
  algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  createdAt: Date;
  rotatedAt?: Date;
  isActive: boolean;
}

export interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  documentId?: string;
  userId: string;
  userAgent?: string;
  ipAddress: string;
  timestamp: Date;
  details: Record<string, any>;
  gdprRelevant: boolean;
  legalBasisUsed?: string;
}

export type AuditEventType = 
  | 'document.created'
  | 'document.viewed'
  | 'document.downloaded'
  | 'document.updated'
  | 'document.deleted'
  | 'document.shared'
  | 'document.unshared'
  | 'share.token.created'
  | 'share.token.used'
  | 'share.token.expired'
  | 'encryption.key.created'
  | 'encryption.key.rotated'
  | 'retention.policy.applied'
  | 'gdpr.request.received'
  | 'gdpr.data.exported'
  | 'gdpr.data.deleted';

export interface DocumentSearchQuery {
  query?: string;
  categories?: string[];
  tags?: string[];
  classification?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  sizeRange?: {
    min: number;
    max: number;
  };
  ownerId?: string;
  hasPersonalData?: boolean;
  retentionStatus?: 'active' | 'expiring' | 'expired';
  limit?: number;
  offset?: number;
}

export interface DocumentSearchResult {
  documents: SecureDocument[];
  totalCount: number;
  aggregations: {
    categories: Record<string, number>;
    tags: Record<string, number>;
    classifications: Record<string, number>;
  };
}

export interface GDPRRequest {
  id: string;
  type: 'export' | 'delete' | 'rectify' | 'restrict';
  subjectId: string;
  requesterId: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: Date;
  processedAt?: Date;
  details: string;
  affectedDocuments: string[];
  notes?: string;
}

export interface SecurityConfiguration {
  encryptionAlgorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  keyRotationPeriod: number; // days
  defaultRetentionPeriod: number; // days
  maxShareTokenLifetime: number; // hours
  auditLogRetention: number; // days
  maxFileSize: number; // bytes
  allowedMimeTypes: string[];
  virusScanningEnabled: boolean;
  contentIndexingEnabled: boolean;
  ocrEnabled: boolean;
}