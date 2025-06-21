/**
 * Secure Upload/Download Endpoints
 * API layer for document vault operations with zero-knowledge security
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { SecureDocument, ShareToken } from '../types';
import { ZeroKnowledgeEncryption, ClientSideEncryption } from '../encryption/zero-knowledge-encryption';
import { ShareTokenManager } from '../tokens/share-tokens';
import { GDPRAuditLogger } from '../audit/gdpr-audit';
import { DocumentCategorizer } from '../categorization/auto-classifier';
import { AutoRetentionManager } from '../retention/auto-retention';

// Validation schemas
const uploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().positive().max(100 * 1024 * 1024), // 100MB max
  mimeType: z.string().min(1),
  encryptedPayload: z.string().min(1),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  retentionPolicyId: z.string().optional()
});

const shareTokenSchema = z.object({
  permissions: z.enum(['read', 'download']),
  expiresInHours: z.number().min(1).max(8760), // Max 1 year
  usageLimit: z.number().positive().optional(),
  password: z.string().min(8).optional(),
  ipRestrictions: z.array(z.string()).optional()
});

const downloadSchema = z.object({
  token: z.string().optional(),
  password: z.string().optional()
});

// Rate limiting configurations
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per window
  message: 'Too many upload attempts'
});

const downloadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 downloads per window
  message: 'Too many download attempts'
});

const shareTokenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 share tokens per hour
  message: 'Too many share token requests'
});

export class SecureDocumentAPI {
  /**
   * Secure document upload endpoint
   */
  static upload = [
    uploadLimiter,
    async (req: Request, res: Response) => {
      try {
        const userId = this.getUserId(req);
        const ipAddress = this.getClientIP(req);
        const userAgent = req.get('User-Agent');

        // Validate request
        const validation = uploadSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            error: 'Invalid request data',
            details: validation.error.issues
          });
        }

        const {
          fileName,
          fileSize,
          mimeType,
          encryptedPayload,
          fingerprint,
          category,
          tags,
          metadata,
          retentionPolicyId
        } = validation.data;

        // Security checks
        if (!this.isAllowedMimeType(mimeType)) {
          return res.status(400).json({
            error: 'File type not allowed'
          });
        }

        if (!this.isValidEncryptedPayload(encryptedPayload, fingerprint)) {
          return res.status(400).json({
            error: 'Invalid encrypted payload'
          });
        }

        // Virus scan (if enabled)
        if (process.env.VIRUS_SCANNING_ENABLED === 'true') {
          const scanResult = await this.scanForViruses(encryptedPayload);
          if (!scanResult.clean) {
            await GDPRAuditLogger.logDocumentOperation(
              'document.upload.blocked',
              '',
              userId,
              { reason: 'Virus detected', threat: scanResult.threat },
              undefined,
              { ipAddress, userAgent }
            );
            
            return res.status(400).json({
              error: 'File failed security scan'
            });
          }
        }

        // Create document record
        const documentId = this.generateDocumentId();
        const document: SecureDocument = {
          id: documentId,
          name: fileName,
          encryptedContent: encryptedPayload,
          keyFingerprint: fingerprint,
          mimeType,
          size: fileSize,
          category: category ? await this.getCategoryById(category) : await this.getDefaultCategory(),
          retentionPolicy: await this.getRetentionPolicy(retentionPolicyId),
          metadata: {
            description: metadata?.description,
            tags: tags || [],
            classification: metadata?.classification || 'confidential',
            personalDataLevel: metadata?.personalDataLevel || 'medium',
            isPersonalData: metadata?.isPersonalData !== false,
            subjectIds: metadata?.subjectIds || [],
            purpose: metadata?.purpose || 'Document storage',
            legalBasis: metadata?.legalBasis || 'Consent',
            customFields: metadata?.customFields || {}
          },
          accessControl: {
            ownerId: userId,
            permissions: [],
            shareTokens: [],
            allowPublicAccess: false,
            requiresAuthentication: true
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Auto-classify if no category provided
        if (!category) {
          const classifications = await DocumentCategorizer.classifyDocument(document);
          if (classifications.length > 0) {
            const topClassification = classifications[0];
            document.category = await this.getCategoryById(topClassification.categoryId);
            document.metadata.tags.push(...topClassification.suggestedTags);
          }
        }

        // Store document
        await this.storeDocument(document);

        // Apply retention policy
        await AutoRetentionManager.applyRetentionPolicy(document, retentionPolicyId);

        // Log upload
        await GDPRAuditLogger.logDocumentOperation(
          'document.created',
          documentId,
          userId,
          {
            fileName,
            fileSize,
            mimeType,
            category: document.category?.name,
            autoClassified: !category
          },
          {
            subjectIds: document.metadata.subjectIds,
            purpose: document.metadata.purpose,
            legalBasis: document.metadata.legalBasis
          },
          { ipAddress, userAgent }
        );

        res.status(201).json({
          success: true,
          documentId,
          message: 'Document uploaded successfully',
          classification: !category ? {
            category: document.category?.name,
            suggestedTags: document.metadata.tags
          } : null
        });

      } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
          error: 'Upload failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  ];

  /**
   * Secure document download endpoint
   */
  static download = [
    downloadLimiter,
    async (req: Request, res: Response) => {
      try {
        const documentId = req.params.id;
        const userId = this.getUserId(req);
        const ipAddress = this.getClientIP(req);
        const userAgent = req.get('User-Agent');

        const validation = downloadSchema.safeParse(req.query);
        if (!validation.success) {
          return res.status(400).json({
            error: 'Invalid request parameters'
          });
        }

        const { token, password } = validation.data;

        // Get document
        const document = await this.getDocument(documentId);
        if (!document) {
          return res.status(404).json({
            error: 'Document not found'
          });
        }

        // Check access permissions
        let hasAccess = false;
        let accessMethod = '';

        if (token) {
          // Validate share token
          const tokenValidation = await ShareTokenManager.validateShareToken(
            token,
            documentId,
            ipAddress,
            password
          );

          if (tokenValidation.isValid && tokenValidation.canDownload) {
            hasAccess = true;
            accessMethod = 'share_token';
            
            // Record token usage
            await ShareTokenManager.recordTokenUsage(
              token,
              'download',
              ipAddress,
              userAgent,
              userId
            );
          }
        } else if (userId) {
          // Check document ownership or permissions
          hasAccess = this.checkDocumentAccess(document, userId, 'download');
          accessMethod = 'authenticated';
        }

        if (!hasAccess) {
          await GDPRAuditLogger.logDocumentOperation(
            'document.access.denied',
            documentId,
            userId || 'anonymous',
            { reason: 'Insufficient permissions', method: accessMethod },
            undefined,
            { ipAddress, userAgent }
          );

          return res.status(403).json({
            error: 'Access denied'
          });
        }

        // Check if document is archived or under legal hold
        if (document.metadata.archived && !this.hasArchiveAccess(userId)) {
          return res.status(403).json({
            error: 'Document is archived'
          });
        }

        // Log download
        await GDPRAuditLogger.logDocumentOperation(
          'document.downloaded',
          documentId,
          userId || 'anonymous',
          {
            accessMethod,
            fileName: document.name,
            fileSize: document.size
          },
          {
            subjectIds: document.metadata.subjectIds,
            purpose: 'Document access',
            legalBasis: document.metadata.legalBasis
          },
          { ipAddress, userAgent }
        );

        // Set download headers
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
        res.setHeader('Content-Length', document.encryptedContent.length);
        res.setHeader('X-Document-Id', documentId);
        res.setHeader('X-Key-Fingerprint', document.keyFingerprint);

        // Send encrypted content (client will decrypt)
        res.send(Buffer.from(document.encryptedContent, 'base64'));

      } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
          error: 'Download failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  ];

  /**
   * Create share token endpoint
   */
  static createShareToken = [
    shareTokenLimiter,
    async (req: Request, res: Response) => {
      try {
        const documentId = req.params.id;
        const userId = this.getUserId(req);
        const ipAddress = this.getClientIP(req);
        const userAgent = req.get('User-Agent');

        const validation = shareTokenSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            error: 'Invalid request data',
            details: validation.error.issues
          });
        }

        const {
          permissions,
          expiresInHours,
          usageLimit,
          password,
          ipRestrictions
        } = validation.data;

        // Get document and check ownership
        const document = await this.getDocument(documentId);
        if (!document) {
          return res.status(404).json({
            error: 'Document not found'
          });
        }

        if (!this.checkDocumentAccess(document, userId, 'admin')) {
          return res.status(403).json({
            error: 'Insufficient permissions to create share token'
          });
        }

        // Create share token
        const shareToken = await ShareTokenManager.createShareToken({
          documentId,
          permissions,
          expiresIn: expiresInHours,
          usageLimit,
          password,
          ipRestrictions,
          createdBy: userId
        });

        // Generate share URL
        const shareUrl = ShareTokenManager.generateShareUrl(
          process.env.BASE_URL || 'https://farewelly.com',
          documentId,
          shareToken.token,
          { download: permissions === 'download' }
        );

        // Log share token creation
        await GDPRAuditLogger.logDocumentOperation(
          'share.token.created',
          documentId,
          userId,
          {
            permissions,
            expiresAt: shareToken.expiresAt,
            usageLimit,
            passwordProtected: !!password,
            ipRestricted: !!ipRestrictions?.length
          },
          {
            subjectIds: document.metadata.subjectIds,
            purpose: 'Document sharing',
            legalBasis: document.metadata.legalBasis
          },
          { ipAddress, userAgent }
        );

        res.status(201).json({
          success: true,
          token: shareToken.token,
          shareUrl,
          expiresAt: shareToken.expiresAt,
          permissions: shareToken.permissions,
          usageLimit: shareToken.usageLimit
        });

      } catch (error) {
        console.error('Share token creation error:', error);
        res.status(500).json({
          error: 'Failed to create share token',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  ];

  /**
   * Get document metadata endpoint
   */
  static getMetadata = async (req: Request, res: Response) => {
    try {
      const documentId = req.params.id;
      const userId = this.getUserId(req);

      const document = await this.getDocument(documentId);
      if (!document) {
        return res.status(404).json({
          error: 'Document not found'
        });
      }

      if (!this.checkDocumentAccess(document, userId, 'read')) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      // Remove sensitive information
      const metadata = {
        id: document.id,
        name: document.name,
        mimeType: document.mimeType,
        size: document.size,
        category: document.category,
        metadata: {
          ...document.metadata,
          subjectIds: undefined // Remove PII
        },
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        expiresAt: document.expiresAt
      };

      res.json(metadata);

    } catch (error) {
      console.error('Metadata fetch error:', error);
      res.status(500).json({
        error: 'Failed to fetch metadata'
      });
    }
  };

  /**
   * Delete document endpoint
   */
  static deleteDocument = async (req: Request, res: Response) => {
    try {
      const documentId = req.params.id;
      const userId = this.getUserId(req);
      const ipAddress = this.getClientIP(req);
      const userAgent = req.get('User-Agent');

      const document = await this.getDocument(documentId);
      if (!document) {
        return res.status(404).json({
          error: 'Document not found'
        });
      }

      if (!this.checkDocumentAccess(document, userId, 'admin')) {
        return res.status(403).json({
          error: 'Insufficient permissions to delete document'
        });
      }

      // Check for legal hold
      const schedule = await this.getRetentionSchedule(documentId);
      if (schedule?.legalHoldActive) {
        return res.status(409).json({
          error: 'Cannot delete document under legal hold'
        });
      }

      // Revoke all share tokens
      const shareTokens = await ShareTokenManager.getDocumentTokens(documentId);
      for (const token of shareTokens) {
        await ShareTokenManager.revokeShareToken(token.token, userId, 'Document deleted');
      }

      // Create backup before deletion
      await this.createDeletionBackup(document);

      // Securely delete document
      await this.secureDeleteDocument(documentId);

      // Log deletion
      await GDPRAuditLogger.logDocumentOperation(
        'document.deleted',
        documentId,
        userId,
        {
          reason: 'Manual deletion',
          fileName: document.name,
          backupCreated: true
        },
        {
          subjectIds: document.metadata.subjectIds,
          purpose: 'Document management',
          legalBasis: document.metadata.legalBasis
        },
        { ipAddress, userAgent }
      );

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });

    } catch (error) {
      console.error('Document deletion error:', error);
      res.status(500).json({
        error: 'Failed to delete document'
      });
    }
  };

  // Helper methods

  private static getUserId(req: Request): string {
    // Extract user ID from JWT token or session
    return req.user?.id || '';
  }

  private static getClientIP(req: Request): string {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  private static isAllowedMimeType(mimeType: string): boolean {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    return allowedTypes.includes(mimeType);
  }

  private static isValidEncryptedPayload(payload: string, fingerprint: string): boolean {
    try {
      // Basic validation - in production, implement more thorough checks
      const buffer = Buffer.from(payload, 'base64');
      return buffer.length > 0 && /^[a-f0-9]{64}$/.test(fingerprint);
    } catch {
      return false;
    }
  }

  private static generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static checkDocumentAccess(
    document: SecureDocument,
    userId: string,
    permission: 'read' | 'write' | 'download' | 'admin'
  ): boolean {
    // Check ownership
    if (document.accessControl.ownerId === userId) {
      return true;
    }

    // Check explicit permissions
    const userPermission = document.accessControl.permissions.find(p => p.userId === userId);
    if (!userPermission) {
      return false;
    }

    // Check permission level
    const permissionLevels = { read: 1, write: 2, download: 2, admin: 3 };
    const userLevel = permissionLevels[userPermission.role as keyof typeof permissionLevels] || 0;
    const requiredLevel = permissionLevels[permission];

    return userLevel >= requiredLevel;
  }

  private static hasArchiveAccess(userId: string): boolean {
    // Check if user has archive access permissions
    return false; // Implement based on user roles
  }

  // Database interface methods (to be implemented)
  private static async storeDocument(document: SecureDocument): Promise<void> {}
  private static async getDocument(documentId: string): Promise<SecureDocument | null> { return null; }
  private static async getCategoryById(categoryId: string): Promise<any> { return null; }
  private static async getDefaultCategory(): Promise<any> { return null; }
  private static async getRetentionPolicy(policyId?: string): Promise<any> { return null; }
  private static async getRetentionSchedule(documentId: string): Promise<any> { return null; }
  private static async scanForViruses(payload: string): Promise<{ clean: boolean; threat?: string }> {
    return { clean: true };
  }
  private static async createDeletionBackup(document: SecureDocument): Promise<void> {}
  private static async secureDeleteDocument(documentId: string): Promise<void> {}
}

/**
 * Middleware for authentication and authorization
 */
export const authMiddleware = (req: Request, res: Response, next: Function) => {
  // Implement JWT token validation
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Verify JWT token and set user info
    // req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: Function) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
};