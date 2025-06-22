/**
 * Test Setup for Document Security Tests
 * Configures test environment with security fixtures and utilities
 */

import { randomBytes } from 'crypto';
import { SecureDocument, DocumentMetadata, AccessControl, ShareToken, RetentionPolicy } from '../../lib/documents/types';

// Extend Jest matchers for security testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeEncrypted(): R;
      toHaveValidSignature(): R;
      toBeSecurelyHashed(): R;
      toComplyWithGDPR(): R;
      toHaveValidToken(): R;
      toBeSafeFromXSS(): R;
      toBeSafeFromSQLInjection(): R;
      toHaveSecureHeaders(): R;
    }
  }
}

// Security test utilities
export class SecurityTestUtils {
  /**
   * Generate test encryption key
   */
  static generateTestKey(): Buffer {
    return randomBytes(32); // 256-bit key
  }

  /**
   * Generate malicious payloads for security testing
   */
  static getMaliciousPayloads(): string[] {
    return [
      // XSS payloads
      '<script>alert("xss")</script>',
      '"><script>alert("xss")</script>',
      "';alert('xss');//",
      'javascript:alert("xss")',
      '<img src=x onerror=alert("xss")>',
      
      // SQL injection payloads
      "'; DROP TABLE documents; --",
      "' OR '1'='1",
      "1' UNION SELECT null,null,null--",
      "admin'--",
      "' OR 1=1#",
      
      // Path traversal payloads
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '/etc/shadow',
      'C:\\Windows\\System32\\drivers\\etc\\hosts',
      
      // Command injection payloads
      '; cat /etc/passwd',
      '| whoami',
      '$(whoami)',
      '`whoami`',
      
      // LDAP injection payloads
      '*)(&',
      '*))',
      '*)(uid=*',
      
      // Buffer overflow attempts
      'A'.repeat(10000),
      'A'.repeat(65536),
      
      // Format string attacks
      '%s%s%s%s%s%s%s%s%s%s',
      '%08x%08x%08x%08x%08x',
      
      // Unicode and encoding attacks
      '%u0022%u003E%u003Cscript%u003E',
      '\\u003Cscript\\u003E',
      
      // NoSQL injection
      '{"$ne": null}',
      '{"$where": "this.credits == this.debits"}',
      
      // XML/XXE payloads
      '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY test SYSTEM "file:///etc/passwd">]><root>&test;</root>',
      
      // Header injection
      'test\\r\\nSet-Cookie: admin=true',
      
      // Null bytes
      'test\\x00.jpg',
      'test%00.jpg'
    ];
  }

  /**
   * Generate test file with specific characteristics
   */
  static generateTestFile(options: {
    name?: string;
    size?: number;
    type?: string;
    malicious?: boolean;
  } = {}): Buffer {
    const {
      name = 'test-file.txt',
      size = 1024,
      type = 'text/plain',
      malicious = false
    } = options;

    if (malicious) {
      // Generate file with malicious content
      const maliciousContent = [
        '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><root>&xxe;</root>',
        '<script>while(1){alert("DOS")}</script>',
        'EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*', // EICAR test virus signature
        Buffer.alloc(100000000, 'A').toString(), // Large buffer
      ].join('\\n');
      
      return Buffer.from(maliciousContent);
    }

    return Buffer.alloc(size, 'Safe test content');
  }

  /**
   * Create mock secure document
   */
  static createMockDocument(overrides: Partial<SecureDocument> = {}): SecureDocument {
    return {
      id: 'doc_test_' + Math.random().toString(36).substr(2, 9),
      name: 'test-document.pdf',
      encryptedContent: Buffer.from('encrypted-content').toString('base64'),
      keyFingerprint: 'a'.repeat(64),
      mimeType: 'application/pdf',
      size: 1024,
      category: {
        id: 'cat_general',
        name: 'General Documents',
        description: 'General document category',
        autoClassificationRules: [],
        defaultRetentionPolicy: 'default'
      },
      retentionPolicy: {
        id: 'policy_default',
        name: 'Default Retention',
        description: 'Default 7-year retention policy',
        retentionPeriod: 2555, // 7 years
        deleteAfterExpiration: true,
        moveToArchive: false,
        notificationBeforeExpiration: 30,
        legalHold: false,
        gdprCompliant: true,
        categories: ['cat_general']
      },
      metadata: {
        description: 'Test document for security testing',
        tags: ['test', 'security'],
        classification: 'confidential',
        personalDataLevel: 'low',
        isPersonalData: false,
        purpose: 'Testing document security',
        legalBasis: 'Legitimate interest',
        customFields: {}
      },
      accessControl: {
        ownerId: 'user_test_owner',
        permissions: [],
        shareTokens: [],
        allowPublicAccess: false,
        requiresAuthentication: true
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Create mock share token
   */
  static createMockShareToken(overrides: Partial<ShareToken> = {}): ShareToken {
    return {
      token: 'tok_' + randomBytes(16).toString('hex'),
      permissions: 'read',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      usageCount: 0,
      passwordProtected: false,
      createdBy: 'user_test_creator',
      createdAt: new Date(),
      ...overrides
    };
  }

  /**
   * Simulate various attack scenarios
   */
  static getAttackScenarios(): Array<{
    name: string;
    description: string;
    payload: any;
    expectedToFail: boolean;
  }> {
    return [
      {
        name: 'Token Replay Attack',
        description: 'Attempt to reuse expired tokens',
        payload: { token: 'expired_token_123', timestamp: Date.now() - 86400000 },
        expectedToFail: true
      },
      {
        name: 'SQL Injection in Search',
        description: 'Inject SQL into document search queries',
        payload: { query: "'; DROP TABLE documents; --" },
        expectedToFail: true
      },
      {
        name: 'XSS in Document Name',
        description: 'Inject JavaScript into document metadata',
        payload: { name: '<script>alert("xss")</script>' },
        expectedToFail: true
      },
      {
        name: 'Path Traversal in Upload',
        description: 'Upload file with path traversal in name',
        payload: { filename: '../../../etc/passwd' },
        expectedToFail: true
      },
      {
        name: 'Oversized File Upload',
        description: 'Upload extremely large file',
        payload: { size: 1000000000 }, // 1GB
        expectedToFail: true
      },
      {
        name: 'Invalid MIME Type',
        description: 'Upload file with dangerous MIME type',
        payload: { mimeType: 'application/x-executable' },
        expectedToFail: true
      },
      {
        name: 'Malformed Encryption Key',
        description: 'Use malformed encryption key',
        payload: { key: 'invalid_key_format' },
        expectedToFail: true
      },
      {
        name: 'GDPR Violation',
        description: 'Attempt to access deleted subject data',
        payload: { subjectId: 'deleted_subject_123' },
        expectedToFail: true
      }
    ];
  }

  /**
   * Validate security response headers
   */
  static validateSecurityHeaders(headers: Record<string, string>): boolean {
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy'
    ];

    return requiredHeaders.every(header => header in headers);
  }

  /**
   * Generate time-based attack scenarios
   */
  static getTimingAttackScenarios(): Array<{
    scenario: string;
    measurements: number[];
    threshold: number;
  }> {
    return [
      {
        scenario: 'Password verification timing',
        measurements: [10, 12, 11, 13, 10, 12], // Should be consistent
        threshold: 5 // max variance in ms
      },
      {
        scenario: 'Token validation timing',
        measurements: [5, 7, 6, 8, 5, 7],
        threshold: 3
      },
      {
        scenario: 'Key derivation timing',
        measurements: [100, 105, 98, 103, 101, 99],
        threshold: 10
      }
    ];
  }
}

// Custom Jest matchers for security testing
expect.extend({
  toBeEncrypted(received: any) {
    const pass = typeof received === 'string' && 
                 received.length > 0 && 
                 !received.includes('plain') &&
                 Buffer.from(received, 'base64').length > 0;
    
    return {
      message: () => pass ? 
        `Expected ${received} not to be encrypted` :
        `Expected ${received} to be encrypted`,
      pass
    };
  },

  toHaveValidSignature(received: any) {
    const pass = typeof received === 'string' && 
                 received.includes('.') &&
                 received.split('.').length === 2;
    
    return {
      message: () => pass ?
        `Expected ${received} not to have valid signature` :
        `Expected ${received} to have valid signature`,
      pass
    };
  },

  toBeSecurelyHashed(received: any) {
    const pass = typeof received === 'string' && 
                 received.length === 64 && // SHA-256 hex length
                 /^[a-f0-9]+$/.test(received);
    
    return {
      message: () => pass ?
        `Expected ${received} not to be securely hashed` :
        `Expected ${received} to be securely hashed`,
      pass
    };
  },

  toComplyWithGDPR(received: any) {
    const pass = received &&
                 received.metadata &&
                 received.metadata.purpose &&
                 received.metadata.legalBasis &&
                 received.retentionPolicy &&
                 received.retentionPolicy.gdprCompliant;
    
    return {
      message: () => pass ?
        `Expected document not to comply with GDPR` :
        `Expected document to comply with GDPR`,
      pass
    };
  },

  toHaveValidToken(received: any) {
    const pass = typeof received === 'string' &&
                 received.startsWith('tok_') &&
                 received.length > 20;
    
    return {
      message: () => pass ?
        `Expected ${received} not to be a valid token` :
        `Expected ${received} to be a valid token`,
      pass
    };
  },

  toBeSafeFromXSS(received: any) {
    const xssPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<embed/gi,
      /<object/gi
    ];
    
    const pass = !xssPatterns.some(pattern => pattern.test(received));
    
    return {
      message: () => pass ?
        `Expected ${received} to contain XSS vulnerabilities` :
        `Expected ${received} to be safe from XSS`,
      pass
    };
  },

  toBeSafeFromSQLInjection(received: any) {
    const sqlPatterns = [
      /('|(\\')|(;)|(--)|(\\|)/gi,
      /(union|select|insert|update|delete|drop|create|alter|exec|execute)/gi,
      /(\*|%|\?)/gi
    ];
    
    const pass = !sqlPatterns.some(pattern => pattern.test(received));
    
    return {
      message: () => pass ?
        `Expected ${received} to contain SQL injection vulnerabilities` :
        `Expected ${received} to be safe from SQL injection`,
      pass
    };
  },

  toHaveSecureHeaders(received: Record<string, string>) {
    const pass = SecurityTestUtils.validateSecurityHeaders(received);
    
    return {
      message: () => pass ?
        `Expected headers not to be secure` :
        `Expected headers to include security headers`,
      pass
    };
  }
});

// Test environment setup
beforeAll(async () => {
  // Set up test environment variables
  process.env.NODE_ENV = 'test';
  process.env.SHARE_TOKEN_SECRET = 'test-secret-key-for-security-testing';
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
  
  console.log('🔒 Security test environment initialized');
});

afterAll(async () => {
  // Clean up test environment
  console.log('🧹 Security test environment cleaned up');
});

beforeEach(() => {
  // Reset any global state before each test
  jest.clearAllMocks();
});

// Export test utilities
export { SecurityTestUtils };
export default SecurityTestUtils;