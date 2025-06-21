/**
 * Time-Limited Share Tokens System
 * Secure document sharing with granular permissions and time constraints
 */

import { randomBytes, createHash, createHmac, timingSafeEqual } from 'crypto';
import { ShareToken, AuditEventType } from '../types';

export interface ShareTokenOptions {
  documentId: string;
  permissions: 'read' | 'download';
  expiresIn: number; // hours
  usageLimit?: number;
  ipRestrictions?: string[];
  password?: string;
  createdBy: string;
  allowedDownloads?: number;
  watermark?: boolean;
  requireAuth?: boolean;
}

export interface ShareTokenValidationResult {
  isValid: boolean;
  token?: ShareToken;
  error?: string;
  canDownload: boolean;
  canView: boolean;
  remainingUses?: number;
}

export interface ShareTokenUsage {
  tokenId: string;
  usedAt: Date;
  ipAddress: string;
  userAgent?: string;
  action: 'view' | 'download';
  userId?: string;
}

export class ShareTokenManager {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly SECRET_KEY = process.env.SHARE_TOKEN_SECRET || 'default-secret-key';

  /**
   * Create a new time-limited share token
   */
  static async createShareToken(
    options: ShareTokenOptions
  ): Promise<ShareToken> {
    const tokenData = randomBytes(this.TOKEN_LENGTH).toString('hex');
    const signature = this.signToken(tokenData, options.documentId);
    const token = `${tokenData}.${signature}`;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + options.expiresIn);

    const shareToken: ShareToken = {
      token,
      permissions: options.permissions,
      expiresAt,
      usageLimit: options.usageLimit,
      usageCount: 0,
      ipRestrictions: options.ipRestrictions,
      passwordProtected: !!options.password,
      createdBy: options.createdBy,
      createdAt: new Date()
    };

    // Store password hash if provided
    if (options.password) {
      (shareToken as any).passwordHash = this.hashPassword(options.password);
    }

    return shareToken;
  }

  /**
   * Validate and verify a share token
   */
  static async validateShareToken(
    token: string,
    documentId: string,
    ipAddress: string,
    password?: string
  ): Promise<ShareTokenValidationResult> {
    try {
      // Parse token
      const [tokenData, signature] = token.split('.');
      if (!tokenData || !signature) {
        return {
          isValid: false,
          error: 'Invalid token format',
          canDownload: false,
          canView: false
        };
      }

      // Verify signature
      const expectedSignature = this.signToken(tokenData, documentId);
      if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return {
          isValid: false,
          error: 'Invalid token signature',
          canDownload: false,
          canView: false
        };
      }

      // Retrieve token from database (pseudo-code)
      const shareToken = await this.getTokenFromDatabase(token);
      if (!shareToken) {
        return {
          isValid: false,
          error: 'Token not found',
          canDownload: false,
          canView: false
        };
      }

      // Check expiration
      if (new Date() > shareToken.expiresAt) {
        return {
          isValid: false,
          error: 'Token expired',
          canDownload: false,
          canView: false
        };
      }

      // Check usage limit
      if (shareToken.usageLimit && shareToken.usageCount >= shareToken.usageLimit) {
        return {
          isValid: false,
          error: 'Usage limit exceeded',
          canDownload: false,
          canView: false
        };
      }

      // Check IP restrictions
      if (shareToken.ipRestrictions && shareToken.ipRestrictions.length > 0) {
        if (!this.isIpAllowed(ipAddress, shareToken.ipRestrictions)) {
          return {
            isValid: false,
            error: 'IP address not allowed',
            canDownload: false,
            canView: false
          };
        }
      }

      // Check password if required
      if (shareToken.passwordProtected) {
        if (!password) {
          return {
            isValid: false,
            error: 'Password required',
            canDownload: false,
            canView: false
          };
        }

        const passwordHash = (shareToken as any).passwordHash;
        if (!this.verifyPassword(password, passwordHash)) {
          return {
            isValid: false,
            error: 'Invalid password',
            canDownload: false,
            canView: false
          };
        }
      }

      // Determine permissions
      const canView = true; // All valid tokens can view
      const canDownload = shareToken.permissions === 'download';
      const remainingUses = shareToken.usageLimit 
        ? shareToken.usageLimit - shareToken.usageCount 
        : undefined;

      return {
        isValid: true,
        token: shareToken,
        canDownload,
        canView,
        remainingUses
      };

    } catch (error) {
      return {
        isValid: false,
        error: 'Token validation failed',
        canDownload: false,
        canView: false
      };
    }
  }

  /**
   * Record token usage
   */
  static async recordTokenUsage(
    token: string,
    action: 'view' | 'download',
    ipAddress: string,
    userAgent?: string,
    userId?: string
  ): Promise<void> {
    const usage: ShareTokenUsage = {
      tokenId: token,
      usedAt: new Date(),
      ipAddress,
      userAgent,
      action,
      userId
    };

    // Update usage count in database
    await this.incrementTokenUsage(token);
    
    // Record usage in audit log
    await this.recordAuditEvent({
      eventType: 'share.token.used' as AuditEventType,
      tokenId: token,
      action,
      ipAddress,
      userAgent,
      userId
    });
  }

  /**
   * Revoke a share token
   */
  static async revokeShareToken(
    token: string,
    revokedBy: string,
    reason?: string
  ): Promise<void> {
    await this.deleteTokenFromDatabase(token);
    
    await this.recordAuditEvent({
      eventType: 'share.token.expired' as AuditEventType,
      tokenId: token,
      revokedBy,
      reason
    });
  }

  /**
   * List active tokens for a document
   */
  static async getDocumentTokens(
    documentId: string,
    includeExpired: boolean = false
  ): Promise<ShareToken[]> {
    const tokens = await this.getTokensFromDatabase(documentId);
    
    if (!includeExpired) {
      return tokens.filter(token => new Date() <= token.expiresAt);
    }
    
    return tokens;
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<number> {
    const expiredTokens = await this.getExpiredTokensFromDatabase();
    let cleanedCount = 0;

    for (const token of expiredTokens) {
      await this.deleteTokenFromDatabase(token.token);
      cleanedCount++;
    }

    return cleanedCount;
  }

  /**
   * Generate secure sharing URL
   */
  static generateShareUrl(
    baseUrl: string,
    documentId: string,
    token: string,
    options: {
      download?: boolean;
      preview?: boolean;
      embed?: boolean;
    } = {}
  ): string {
    const url = new URL(`${baseUrl}/share/${documentId}`);
    url.searchParams.set('token', token);
    
    if (options.download) url.searchParams.set('action', 'download');
    if (options.preview) url.searchParams.set('preview', 'true');
    if (options.embed) url.searchParams.set('embed', 'true');
    
    return url.toString();
  }

  /**
   * Create time-limited download link
   */
  static async createDownloadLink(
    documentId: string,
    expiresInMinutes: number = 15,
    createdBy: string
  ): Promise<{
    token: string;
    url: string;
    expiresAt: Date;
  }> {
    const token = await this.createShareToken({
      documentId,
      permissions: 'download',
      expiresIn: expiresInMinutes / 60, // Convert to hours
      usageLimit: 1, // Single use
      createdBy
    });

    const url = this.generateShareUrl(
      process.env.BASE_URL || 'https://farewelly.com',
      documentId,
      token.token,
      { download: true }
    );

    return {
      token: token.token,
      url,
      expiresAt: token.expiresAt
    };
  }

  /**
   * Create password-protected share link
   */
  static async createPasswordProtectedShare(
    documentId: string,
    password: string,
    expiresInHours: number,
    permissions: 'read' | 'download',
    createdBy: string
  ): Promise<{
    token: string;
    url: string;
    expiresAt: Date;
  }> {
    const token = await this.createShareToken({
      documentId,
      permissions,
      expiresIn: expiresInHours,
      password,
      createdBy
    });

    const url = this.generateShareUrl(
      process.env.BASE_URL || 'https://farewelly.com',
      documentId,
      token.token
    );

    return {
      token: token.token,
      url,
      expiresAt: token.expiresAt
    };
  }

  // Private helper methods

  private static signToken(tokenData: string, documentId: string): string {
    return createHmac('sha256', this.SECRET_KEY)
      .update(`${tokenData}:${documentId}`)
      .digest('hex');
  }

  private static hashPassword(password: string): string {
    return createHash('sha256').update(password + this.SECRET_KEY).digest('hex');
  }

  private static verifyPassword(password: string, hash: string): boolean {
    const computedHash = this.hashPassword(password);
    return timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash));
  }

  private static isIpAllowed(ipAddress: string, allowedIps: string[]): boolean {
    // Simple IP matching - in production, use proper CIDR matching
    return allowedIps.some(allowed => {
      if (allowed.includes('/')) {
        // CIDR notation - implement proper CIDR matching
        return this.isIpInCidr(ipAddress, allowed);
      }
      return ipAddress === allowed;
    });
  }

  private static isIpInCidr(ip: string, cidr: string): boolean {
    // Simplified CIDR matching - implement proper CIDR logic
    const [network, prefixLength] = cidr.split('/');
    // Implementation would check if IP is in the network range
    return ip.startsWith(network.split('.').slice(0, Math.floor(parseInt(prefixLength) / 8)).join('.'));
  }

  // Database interface methods (to be implemented with actual database)
  private static async getTokenFromDatabase(token: string): Promise<ShareToken | null> {
    // Implementation would query database
    return null;
  }

  private static async getTokensFromDatabase(documentId: string): Promise<ShareToken[]> {
    // Implementation would query database
    return [];
  }

  private static async getExpiredTokensFromDatabase(): Promise<ShareToken[]> {
    // Implementation would query database
    return [];
  }

  private static async incrementTokenUsage(token: string): Promise<void> {
    // Implementation would update database
  }

  private static async deleteTokenFromDatabase(token: string): Promise<void> {
    // Implementation would delete from database
  }

  private static async recordAuditEvent(event: any): Promise<void> {
    // Implementation would record audit event
  }
}

/**
 * Token analytics and monitoring
 */
export class ShareTokenAnalytics {
  /**
   * Get token usage statistics
   */
  static async getTokenStats(documentId?: string): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    totalUsage: number;
    averageUsagePerToken: number;
    mostUsedTokens: Array<{
      token: string;
      usageCount: number;
      createdAt: Date;
    }>;
  }> {
    // Implementation would query database and calculate statistics
    return {
      totalTokens: 0,
      activeTokens: 0,
      expiredTokens: 0,
      totalUsage: 0,
      averageUsagePerToken: 0,
      mostUsedTokens: []
    };
  }

  /**
   * Get security alerts for suspicious token usage
   */
  static async getSecurityAlerts(): Promise<Array<{
    type: 'multiple_ips' | 'brute_force' | 'unusual_usage';
    token: string;
    details: string;
    severity: 'low' | 'medium' | 'high';
    detectedAt: Date;
  }>> {
    // Implementation would analyze usage patterns
    return [];
  }
}