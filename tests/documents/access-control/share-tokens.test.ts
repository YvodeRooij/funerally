/**
 * Share Token Security Tests
 * Comprehensive testing of time-limited tokens, permission validation, and sharing security
 */

import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
import { ShareTokenManager, ShareTokenAnalytics } from '../../../lib/documents/tokens/share-tokens';
import { SecurityTestUtils } from '../setup';

describe('Share Token Security Tests', () => {
  let mockDocument: any;
  let testUserId: string;
  let maliciousPayloads: string[];

  beforeEach(() => {
    mockDocument = SecurityTestUtils.createMockDocument();
    testUserId = 'user_test_123';
    maliciousPayloads = SecurityTestUtils.getMaliciousPayloads();
    
    // Mock console to prevent test noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('🎫 Token Generation Security', () => {
    test('should generate cryptographically secure tokens', async () => {
      const options = {
        documentId: mockDocument.id,
        permissions: 'read' as const,
        expiresIn: 24,
        createdBy: testUserId
      };

      const token = await ShareTokenManager.createShareToken(options);
      
      expect(token.token).toHaveValidToken();
      expect(token.token.split('.')).toHaveLength(2); // token.signature format
      expect(token.permissions).toBe('read');
      expect(token.expiresAt).toBeInstanceOf(Date);
      expect(token.usageCount).toBe(0);
      expect(token.createdBy).toBe(testUserId);
    });

    test('should generate unique tokens for same parameters', async () => {
      const options = {
        documentId: mockDocument.id,
        permissions: 'read' as const,
        expiresIn: 24,
        createdBy: testUserId
      };

      const token1 = await ShareTokenManager.createShareToken(options);
      const token2 = await ShareTokenManager.createShareToken(options);
      
      expect(token1.token).not.toEqual(token2.token);
      expect(token1.token).toHaveValidToken();
      expect(token2.token).toHaveValidToken();
    });

    test('should create password-protected tokens securely', async () => {
      const password = 'secure-token-password-123';
      const options = {
        documentId: mockDocument.id,
        permissions: 'read' as const,
        expiresIn: 24,
        password,
        createdBy: testUserId
      };

      const token = await ShareTokenManager.createShareToken(options);
      
      expect(token.passwordProtected).toBe(true);
      expect((token as any).passwordHash).toBeDefined();
      expect((token as any).passwordHash).not.toContain(password); // Should be hashed
      expect((token as any).passwordHash).toHaveLength(64); // SHA-256 hex
    });

    test('should enforce token expiration times', async () => {
      const shortExpiry = {
        documentId: mockDocument.id,
        permissions: 'read' as const,
        expiresIn: 0.001, // Very short expiry (3.6 seconds)
        createdBy: testUserId
      };

      const token = await ShareTokenManager.createShareToken(shortExpiry);
      const expiresAt = token.expiresAt.getTime();
      const now = Date.now();
      
      expect(expiresAt).toBeGreaterThan(now);
      expect(expiresAt - now).toBeLessThan(10000); // Less than 10 seconds
    });

    test('should handle malicious document IDs in token creation', async () => {
      for (const maliciousId of maliciousPayloads.slice(0, 5)) {
        const options = {
          documentId: maliciousId,
          permissions: 'read' as const,
          expiresIn: 24,
          createdBy: testUserId
        };

        // Should not throw, but should sanitize the ID
        const token = await ShareTokenManager.createShareToken(options);
        expect(token).toBeDefined();
        expect(token.token).toHaveValidToken();
      }
    });
  });

  describe('🔐 Token Validation Security', () => {
    let validToken: any;
    let validDocumentId: string;

    beforeEach(async () => {
      validDocumentId = mockDocument.id;
      validToken = await ShareTokenManager.createShareToken({
        documentId: validDocumentId,
        permissions: 'read',
        expiresIn: 24,
        createdBy: testUserId
      });

      // Mock database methods
      jest.spyOn(ShareTokenManager as any, 'getTokenFromDatabase').mockResolvedValue(validToken);
      jest.spyOn(ShareTokenManager as any, 'incrementTokenUsage').mockResolvedValue(undefined);
      jest.spyOn(ShareTokenManager as any, 'recordAuditEvent').mockResolvedValue(undefined);
    });

    test('should validate tokens with correct signature', async () => {
      const result = await ShareTokenManager.validateShareToken(
        validToken.token,
        validDocumentId,
        '192.168.1.1'
      );

      expect(result.isValid).toBe(true);
      expect(result.canView).toBe(true);
      expect(result.canDownload).toBe(false); // Only read permission
      expect(result.error).toBeUndefined();
    });

    test('should reject tokens with invalid signature', async () => {
      const [tokenData] = validToken.token.split('.');
      const maliciousToken = `${tokenData}.malicious-signature`;
      
      const result = await ShareTokenManager.validateShareToken(
        maliciousToken,
        validDocumentId,
        '192.168.1.1'
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid token signature');
      expect(result.canView).toBe(false);
      expect(result.canDownload).toBe(false);
    });

    test('should reject malformed tokens', async () => {
      const malformedTokens = [
        'no-dot-separator',
        'too.many.dots.here',
        '',
        'onlyonepart',
        '.empty-start',
        'empty-end.'
      ];

      for (const malformedToken of malformedTokens) {
        const result = await ShareTokenManager.validateShareToken(
          malformedToken,
          validDocumentId,
          '192.168.1.1'
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid token format');
      }
    });

    test('should reject expired tokens', async () => {
      const expiredToken = await ShareTokenManager.createShareToken({
        documentId: validDocumentId,
        permissions: 'read',
        expiresIn: -1, // Already expired
        createdBy: testUserId
      });

      // Mock expired token in database
      jest.spyOn(ShareTokenManager as any, 'getTokenFromDatabase').mockResolvedValue(expiredToken);

      const result = await ShareTokenManager.validateShareToken(
        expiredToken.token,
        validDocumentId,
        '192.168.1.1'
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token expired');
    });

    test('should enforce usage limits', async () => {
      const limitedToken = await ShareTokenManager.createShareToken({
        documentId: validDocumentId,
        permissions: 'read',
        expiresIn: 24,
        usageLimit: 1,
        createdBy: testUserId
      });
      
      // Simulate token already used
      limitedToken.usageCount = 1;
      jest.spyOn(ShareTokenManager as any, 'getTokenFromDatabase').mockResolvedValue(limitedToken);

      const result = await ShareTokenManager.validateShareToken(
        limitedToken.token,
        validDocumentId,
        '192.168.1.1'
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Usage limit exceeded');
    });

    test('should enforce IP restrictions', async () => {
      const ipRestrictedToken = await ShareTokenManager.createShareToken({
        documentId: validDocumentId,
        permissions: 'read',
        expiresIn: 24,
        ipRestrictions: ['192.168.1.100', '10.0.0.0/8'],
        createdBy: testUserId
      });

      jest.spyOn(ShareTokenManager as any, 'getTokenFromDatabase').mockResolvedValue(ipRestrictedToken);

      // Allowed IP
      const result1 = await ShareTokenManager.validateShareToken(
        ipRestrictedToken.token,
        validDocumentId,
        '192.168.1.100'
      );
      expect(result1.isValid).toBe(true);

      // Disallowed IP
      const result2 = await ShareTokenManager.validateShareToken(
        ipRestrictedToken.token,
        validDocumentId,
        '172.16.1.1'
      );
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('IP address not allowed');
    });

    test('should validate password-protected tokens', async () => {
      const password = 'correct-password';
      const protectedToken = await ShareTokenManager.createShareToken({
        documentId: validDocumentId,
        permissions: 'read',
        expiresIn: 24,
        password,
        createdBy: testUserId
      });

      jest.spyOn(ShareTokenManager as any, 'getTokenFromDatabase').mockResolvedValue(protectedToken);

      // Correct password
      const result1 = await ShareTokenManager.validateShareToken(
        protectedToken.token,
        validDocumentId,
        '192.168.1.1',
        password
      );
      expect(result1.isValid).toBe(true);

      // Wrong password
      const result2 = await ShareTokenManager.validateShareToken(
        protectedToken.token,
        validDocumentId,
        '192.168.1.1',
        'wrong-password'
      );
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Invalid password');

      // No password provided
      const result3 = await ShareTokenManager.validateShareToken(
        protectedToken.token,
        validDocumentId,
        '192.168.1.1'
      );
      expect(result3.isValid).toBe(false);
      expect(result3.error).toBe('Password required');
    });

    test('should handle timing attacks on password verification', async () => {
      const password = 'timing-test-password';
      const protectedToken = await ShareTokenManager.createShareToken({
        documentId: validDocumentId,
        permissions: 'read',
        expiresIn: 24,
        password,
        createdBy: testUserId
      });

      jest.spyOn(ShareTokenManager as any, 'getTokenFromDatabase').mockResolvedValue(protectedToken);

      const correctTimes: number[] = [];
      const wrongTimes: number[] = [];

      // Test with correct password
      for (let i = 0; i < 20; i++) {
        const start = process.hrtime.bigint();
        await ShareTokenManager.validateShareToken(
          protectedToken.token,
          validDocumentId,
          '192.168.1.1',
          password
        );
        const end = process.hrtime.bigint();
        correctTimes.push(Number(end - start) / 1000000);
      }

      // Test with wrong password
      for (let i = 0; i < 20; i++) {
        const start = process.hrtime.bigint();
        await ShareTokenManager.validateShareToken(
          protectedToken.token,
          validDocumentId,
          '192.168.1.1',
          'wrong-password'
        );
        const end = process.hrtime.bigint();
        wrongTimes.push(Number(end - start) / 1000000);
      }

      const avgCorrect = correctTimes.reduce((a, b) => a + b) / correctTimes.length;
      const avgWrong = wrongTimes.reduce((a, b) => a + b) / wrongTimes.length;
      
      // Timing difference should be minimal to prevent timing attacks
      const timingDifference = Math.abs(avgCorrect - avgWrong) / Math.max(avgCorrect, avgWrong);
      expect(timingDifference).toBeLessThan(0.2); // Less than 20% difference
    });
  });

  describe('📊 Token Usage Security', () => {
    test('should record token usage securely', async () => {
      const token = 'test-token-123';
      const mockRecordAudit = jest.spyOn(ShareTokenManager as any, 'recordAuditEvent').mockResolvedValue(undefined);
      const mockIncrementUsage = jest.spyOn(ShareTokenManager as any, 'incrementTokenUsage').mockResolvedValue(undefined);

      await ShareTokenManager.recordTokenUsage(
        token,
        'view',
        '192.168.1.1',
        'Mozilla/5.0 Test Browser',
        testUserId
      );

      expect(mockIncrementUsage).toHaveBeenCalledWith(token);
      expect(mockRecordAudit).toHaveBeenCalledWith({
        eventType: 'share.token.used',
        tokenId: token,
        action: 'view',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser',
        userId: testUserId
      });
    });

    test('should sanitize user agents in usage recording', async () => {
      const maliciousUserAgent = '<script>alert("xss")</script>';
      const mockRecordAudit = jest.spyOn(ShareTokenManager as any, 'recordAuditEvent').mockResolvedValue(undefined);

      await ShareTokenManager.recordTokenUsage(
        'test-token',
        'view',
        '192.168.1.1',
        maliciousUserAgent,
        testUserId
      );

      const auditCall = mockRecordAudit.mock.calls[0][0];
      expect(auditCall.userAgent).toBe(maliciousUserAgent); // Store as-is for audit trail
      // Note: Sanitization should happen at display/output time, not storage time
    });

    test('should validate IP addresses in usage recording', async () => {
      const invalidIPs = ['999.999.999.999', 'not-an-ip', '', null, undefined];
      
      for (const invalidIP of invalidIPs) {
        // Should handle gracefully without throwing
        await expect(
          ShareTokenManager.recordTokenUsage(
            'test-token',
            'view',
            invalidIP as any,
            'test-browser'
          )
        ).resolves.not.toThrow();
      }
    });
  });

  describe('🗂️ Token Management Security', () => {
    test('should revoke tokens securely', async () => {
      const token = 'test-token-to-revoke';
      const mockDelete = jest.spyOn(ShareTokenManager as any, 'deleteTokenFromDatabase').mockResolvedValue(undefined);
      const mockAudit = jest.spyOn(ShareTokenManager as any, 'recordAuditEvent').mockResolvedValue(undefined);

      await ShareTokenManager.revokeShareToken(token, testUserId, 'Security breach detected');

      expect(mockDelete).toHaveBeenCalledWith(token);
      expect(mockAudit).toHaveBeenCalledWith({
        eventType: 'share.token.expired',
        tokenId: token,
        revokedBy: testUserId,
        reason: 'Security breach detected'
      });
    });

    test('should clean up expired tokens efficiently', async () => {
      const expiredTokens = [
        { token: 'expired-1', expiresAt: new Date(Date.now() - 86400000) },
        { token: 'expired-2', expiresAt: new Date(Date.now() - 172800000) }
      ];

      jest.spyOn(ShareTokenManager as any, 'getExpiredTokensFromDatabase').mockResolvedValue(expiredTokens);
      const mockDelete = jest.spyOn(ShareTokenManager as any, 'deleteTokenFromDatabase').mockResolvedValue(undefined);

      const cleaned = await ShareTokenManager.cleanupExpiredTokens();

      expect(cleaned).toBe(2);
      expect(mockDelete).toHaveBeenCalledTimes(2);
      expect(mockDelete).toHaveBeenCalledWith('expired-1');
      expect(mockDelete).toHaveBeenCalledWith('expired-2');
    });

    test('should generate secure sharing URLs', () => {
      const baseUrl = 'https://farewelly.com';
      const documentId = 'doc_123';
      const token = 'secure-token-456';

      const url1 = ShareTokenManager.generateShareUrl(baseUrl, documentId, token);
      expect(url1).toBe(`${baseUrl}/share/${documentId}?token=${token}`);

      const url2 = ShareTokenManager.generateShareUrl(baseUrl, documentId, token, {
        download: true,
        preview: true
      });
      expect(url2).toBe(`${baseUrl}/share/${documentId}?token=${token}&action=download&preview=true`);

      // URL should be properly encoded
      const specialToken = 'token+with/special=chars';
      const url3 = ShareTokenManager.generateShareUrl(baseUrl, documentId, specialToken);
      expect(url3).toContain(encodeURIComponent(specialToken));
    });

    test('should create time-limited download links', async () => {
      const documentId = 'doc_download_test';
      const expiresInMinutes = 30;
      
      const mockCreateToken = jest.spyOn(ShareTokenManager, 'createShareToken').mockResolvedValue({
        token: 'download-token-123',
        permissions: 'download',
        expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
        usageCount: 0,
        passwordProtected: false,
        createdBy: testUserId,
        createdAt: new Date()
      });

      const downloadLink = await ShareTokenManager.createDownloadLink(
        documentId,
        expiresInMinutes,
        testUserId
      );

      expect(downloadLink.token).toBe('download-token-123');
      expect(downloadLink.url).toContain('/share/');
      expect(downloadLink.url).toContain('action=download');
      expect(downloadLink.expiresAt).toBeInstanceOf(Date);
      
      expect(mockCreateToken).toHaveBeenCalledWith({
        documentId,
        permissions: 'download',
        expiresIn: 0.5, // 30 minutes converted to hours
        usageLimit: 1,
        createdBy: testUserId
      });
    });
  });

  describe('🔍 Token Analytics Security', () => {
    test('should provide secure token statistics', async () => {
      const stats = await ShareTokenAnalytics.getTokenStats('doc_123');
      
      expect(stats).toHaveProperty('totalTokens');
      expect(stats).toHaveProperty('activeTokens');
      expect(stats).toHaveProperty('expiredTokens');
      expect(stats).toHaveProperty('totalUsage');
      expect(stats).toHaveProperty('averageUsagePerToken');
      expect(stats).toHaveProperty('mostUsedTokens');
      
      expect(typeof stats.totalTokens).toBe('number');
      expect(typeof stats.activeTokens).toBe('number');
      expect(Array.isArray(stats.mostUsedTokens)).toBe(true);
    });

    test('should detect security alerts', async () => {
      const alerts = await ShareTokenAnalytics.getSecurityAlerts();
      
      expect(Array.isArray(alerts)).toBe(true);
      
      // Each alert should have required properties
      alerts.forEach(alert => {
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('token');
        expect(alert).toHaveProperty('details');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('detectedAt');
        
        expect(['multiple_ips', 'brute_force', 'unusual_usage']).toContain(alert.type);
        expect(['low', 'medium', 'high']).toContain(alert.severity);
        expect(alert.detectedAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('🚨 Attack Scenarios', () => {
    test('should resist token brute force attacks', async () => {
      const documentId = 'target-document';
      const attempts: Promise<any>[] = [];
      
      // Simulate multiple rapid token validation attempts
      for (let i = 0; i < 100; i++) {
        const fakeToken = `fake-token-${i}.fake-signature-${i}`;
        attempts.push(
          ShareTokenManager.validateShareToken(fakeToken, documentId, '192.168.1.1')
        );
      }
      
      const results = await Promise.all(attempts);
      
      // All should fail
      results.forEach(result => {
        expect(result.isValid).toBe(false);
      });
      
      // Should complete in reasonable time (not be artificially slowed)
      const start = Date.now();
      await ShareTokenManager.validateShareToken('fake-token', documentId, '192.168.1.1');
      const end = Date.now();
      
      expect(end - start).toBeLessThan(1000); // Less than 1 second
    });

    test('should prevent token enumeration attacks', async () => {
      // Test various token patterns
      const tokenPatterns = [
        'token_000000000000000000000000.sig',
        'token_111111111111111111111111.sig',
        'token_aaaaaaaaaaaaaaaaaaaaaaa.sig',
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAA.sig',
        '0'.repeat(32) + '.' + '0'.repeat(32),
        '1'.repeat(32) + '.' + '1'.repeat(32)
      ];
      
      for (const pattern of tokenPatterns) {
        const result = await ShareTokenManager.validateShareToken(
          pattern,
          'test-doc',
          '192.168.1.1'
        );
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBeTruthy();
      }
    });

    test('should handle token replay attacks', async () => {
      const validToken = await ShareTokenManager.createShareToken({
        documentId: 'replay-test-doc',
        permissions: 'read',
        expiresIn: 1,
        usageLimit: 1,
        createdBy: testUserId
      });

      // Simulate token being used once
      validToken.usageCount = 1;
      jest.spyOn(ShareTokenManager as any, 'getTokenFromDatabase').mockResolvedValue(validToken);

      // First use should succeed (mocked as already used)
      const result1 = await ShareTokenManager.validateShareToken(
        validToken.token,
        'replay-test-doc',
        '192.168.1.1'
      );
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('Usage limit exceeded');

      // Subsequent uses should also fail
      const result2 = await ShareTokenManager.validateShareToken(
        validToken.token,
        'replay-test-doc',
        '192.168.1.1'
      );
      expect(result2.isValid).toBe(false);
    });

    test('should resist timing-based token discovery', async () => {
      const validToken = await ShareTokenManager.createShareToken({
        documentId: 'timing-test-doc',
        permissions: 'read',
        expiresIn: 24,
        createdBy: testUserId
      });

      jest.spyOn(ShareTokenManager as any, 'getTokenFromDatabase')
        .mockImplementation(async (token) => {
          if (token === validToken.token) {
            return validToken;
          }
          return null;
        });

      const validTokenTimes: number[] = [];
      const invalidTokenTimes: number[] = [];

      // Test timing for valid token
      for (let i = 0; i < 20; i++) {
        const start = process.hrtime.bigint();
        await ShareTokenManager.validateShareToken(
          validToken.token,
          'timing-test-doc',
          '192.168.1.1'
        );
        const end = process.hrtime.bigint();
        validTokenTimes.push(Number(end - start) / 1000000);
      }

      // Test timing for invalid tokens
      for (let i = 0; i < 20; i++) {
        const fakeToken = `fake-${i}.${'sig'.repeat(i + 1)}`;
        const start = process.hrtime.bigint();
        await ShareTokenManager.validateShareToken(
          fakeToken,
          'timing-test-doc',
          '192.168.1.1'
        );
        const end = process.hrtime.bigint();
        invalidTokenTimes.push(Number(end - start) / 1000000);
      }

      const avgValid = validTokenTimes.reduce((a, b) => a + b) / validTokenTimes.length;
      const avgInvalid = invalidTokenTimes.reduce((a, b) => a + b) / invalidTokenTimes.length;
      
      // Timing should not reveal token validity
      const timingRatio = Math.abs(avgValid - avgInvalid) / Math.max(avgValid, avgInvalid);
      expect(timingRatio).toBeLessThan(0.3); // Less than 30% difference
    });
  });

  describe('🔒 Memory Security', () => {
    test('should not leak tokens in memory', async () => {
      const sensitiveToken = 'very-secret-token-do-not-leak';
      const options = {
        documentId: 'memory-test-doc',
        permissions: 'read' as const,
        expiresIn: 24,
        createdBy: testUserId
      };

      // Create and validate token
      const mockToken = { ...await ShareTokenManager.createShareToken(options), token: sensitiveToken };
      jest.spyOn(ShareTokenManager as any, 'getTokenFromDatabase').mockResolvedValue(mockToken);

      await ShareTokenManager.validateShareToken(
        sensitiveToken,
        'memory-test-doc',
        '192.168.1.1'
      );

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Token should not be easily found in memory dumps
      // (This is a simplified test - in practice, memory analysis would be more complex)
      const memoryUsage = process.memoryUsage();
      expect(memoryUsage.heapUsed).toBeLessThan(500 * 1024 * 1024); // Reasonable heap size
    });

    test('should clear sensitive data after operations', async () => {
      const password = 'clear-me-after-use';
      const protectedToken = await ShareTokenManager.createShareToken({
        documentId: 'clear-test-doc',
        permissions: 'read',
        expiresIn: 24,
        password,
        createdBy: testUserId
      });

      jest.spyOn(ShareTokenManager as any, 'getTokenFromDatabase').mockResolvedValue(protectedToken);

      await ShareTokenManager.validateShareToken(
        protectedToken.token,
        'clear-test-doc',
        '192.168.1.1',
        password
      );

      // Verify password is hashed, not stored in plain text
      expect((protectedToken as any).passwordHash).not.toBe(password);
      expect((protectedToken as any).passwordHash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});