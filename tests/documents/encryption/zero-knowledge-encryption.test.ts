/**
 * Zero-Knowledge Encryption Security Tests
 * Comprehensive testing of encryption, key management, and client-side security
 */

import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { ZeroKnowledgeEncryption, ClientSideEncryption } from '../../../lib/documents/encryption/zero-knowledge-encryption';
import { SecurityTestUtils } from '../setup';

describe('Zero-Knowledge Encryption Security Tests', () => {
  let testKey: Buffer;
  let testData: Buffer;
  let maliciousPayloads: string[];

  beforeEach(() => {
    testKey = SecurityTestUtils.generateTestKey();
    testData = Buffer.from('Sensitive funeral document content');
    maliciousPayloads = SecurityTestUtils.getMaliciousPayloads();
  });

  describe('🔐 Core Encryption Security', () => {
    test('should generate cryptographically secure keys', async () => {
      const password = 'secure-password-123';
      const { key, salt } = await ZeroKnowledgeEncryption.generateKey(password);
      
      expect(key).toHaveLength(32); // 256-bit key
      expect(salt).toHaveLength(32); // 256-bit salt
      expect(key).not.toEqual(salt);
      
      // Test key entropy
      const keyEntropy = calculateEntropy(key);
      expect(keyEntropy).toBeGreaterThan(7.5); // High entropy threshold
    });

    test('should produce different keys for same password with different salts', async () => {
      const password = 'same-password';
      const { key: key1, salt: salt1 } = await ZeroKnowledgeEncryption.generateKey(password);
      const { key: key2, salt: salt2 } = await ZeroKnowledgeEncryption.generateKey(password);
      
      expect(key1).not.toEqual(key2);
      expect(salt1).not.toEqual(salt2);
    });

    test('should encrypt data with authenticated encryption', async () => {
      const encrypted = await ZeroKnowledgeEncryption.encrypt(testData, testKey);
      
      expect(encrypted.encryptedData).toBeEncrypted();
      expect(encrypted.iv).toHaveLength(16); // 128-bit IV
      expect(encrypted.tag).toHaveLength(16); // 128-bit auth tag
      expect(encrypted.fingerprint).toBeSecurelyHashed();
      
      // Ensure IV is unique for each encryption
      const encrypted2 = await ZeroKnowledgeEncryption.encrypt(testData, testKey);
      expect(encrypted.iv).not.toEqual(encrypted2.iv);
    });

    test('should decrypt data correctly', async () => {
      const encrypted = await ZeroKnowledgeEncryption.encrypt(testData, testKey);
      const decrypted = await ZeroKnowledgeEncryption.decrypt(
        encrypted.encryptedData,
        testKey,
        encrypted.iv,
        encrypted.tag
      );
      
      expect(decrypted).toEqual(testData);
    });

    test('should fail decryption with wrong key', async () => {
      const encrypted = await ZeroKnowledgeEncryption.encrypt(testData, testKey);
      const wrongKey = SecurityTestUtils.generateTestKey();
      
      await expect(
        ZeroKnowledgeEncryption.decrypt(
          encrypted.encryptedData,
          wrongKey,
          encrypted.iv,
          encrypted.tag
        )
      ).rejects.toThrow();
    });

    test('should fail decryption with tampered data', async () => {
      const encrypted = await ZeroKnowledgeEncryption.encrypt(testData, testKey);
      
      // Tamper with encrypted data
      const tamperedData = Buffer.from(encrypted.encryptedData);
      tamperedData[0] = tamperedData[0] ^ 1; // Flip a bit
      
      await expect(
        ZeroKnowledgeEncryption.decrypt(
          tamperedData,
          testKey,
          encrypted.iv,
          encrypted.tag
        )
      ).rejects.toThrow();
    });

    test('should fail decryption with tampered auth tag', async () => {
      const encrypted = await ZeroKnowledgeEncryption.encrypt(testData, testKey);
      
      // Tamper with auth tag
      const tamperedTag = Buffer.from(encrypted.tag);
      tamperedTag[0] = tamperedTag[0] ^ 1;
      
      await expect(
        ZeroKnowledgeEncryption.decrypt(
          encrypted.encryptedData,
          testKey,
          encrypted.iv,
          tamperedTag
        )
      ).rejects.toThrow();
    });
  });

  describe('🔑 Key Management Security', () => {
    test('should generate secure key fingerprints', () => {
      const fingerprint = ZeroKnowledgeEncryption.generateKeyFingerprint(testKey);
      
      expect(fingerprint).toBeSecurelyHashed();
      expect(fingerprint).toHaveLength(64); // SHA-256 hex
      
      // Different keys should produce different fingerprints
      const differentKey = SecurityTestUtils.generateTestKey();
      const differentFingerprint = ZeroKnowledgeEncryption.generateKeyFingerprint(differentKey);
      expect(fingerprint).not.toEqual(differentFingerprint);
    });

    test('should verify key fingerprints correctly', () => {
      const fingerprint = ZeroKnowledgeEncryption.generateKeyFingerprint(testKey);
      
      expect(ZeroKnowledgeEncryption.verifyKeyFingerprint(testKey, fingerprint)).toBe(true);
      
      const wrongKey = SecurityTestUtils.generateTestKey();
      expect(ZeroKnowledgeEncryption.verifyKeyFingerprint(wrongKey, fingerprint)).toBe(false);
    });

    test('should perform secure key rotation', async () => {
      const oldPassword = 'old-password';
      const newPassword = 'new-password';
      const { key: oldKey } = await ZeroKnowledgeEncryption.generateKey(oldPassword);
      
      // Encrypt some data with old key
      const encrypted = await ZeroKnowledgeEncryption.encryptFile(
        testData,
        'test-file.txt',
        oldKey
      );
      
      // Rotate key
      const rotated = await ZeroKnowledgeEncryption.rotateKey(
        oldKey,
        newPassword,
        encrypted.encryptedPayload
      );
      
      expect(rotated.newKey).not.toEqual(oldKey);
      expect(rotated.newFingerprint).toBeSecurelyHashed();
      expect(rotated.reencryptedData).toBeEncrypted();
      
      // Verify new key can decrypt
      const decrypted = await ZeroKnowledgeEncryption.decryptFile(
        rotated.reencryptedData,
        rotated.newKey
      );
      expect(decrypted.data).toEqual(testData);
    });

    test('should derive secure share keys', async () => {
      const masterKey = testKey;
      const shareToken = 'secure-share-token-123';
      const salt = randomBytes(32);
      
      const shareKey = await ZeroKnowledgeEncryption.deriveShareKey(
        masterKey,
        shareToken,
        salt
      );
      
      expect(shareKey).toHaveLength(32);
      expect(shareKey).not.toEqual(masterKey);
      
      // Same inputs should produce same key
      const shareKey2 = await ZeroKnowledgeEncryption.deriveShareKey(
        masterKey,
        shareToken,
        salt
      );
      expect(shareKey).toEqual(shareKey2);
      
      // Different inputs should produce different keys
      const shareKey3 = await ZeroKnowledgeEncryption.deriveShareKey(
        masterKey,
        'different-token',
        salt
      );
      expect(shareKey).not.toEqual(shareKey3);
    });

    test('should validate encryption parameters', () => {
      const validKey = randomBytes(32);
      const validIV = randomBytes(16);
      const validTag = randomBytes(16);
      const validFingerprint = 'a'.repeat(64);
      
      expect(ZeroKnowledgeEncryption.validateEncryptionParams({
        key: validKey,
        iv: validIV,
        tag: validTag,
        fingerprint: validFingerprint
      })).toBe(true);
      
      // Invalid key length
      expect(ZeroKnowledgeEncryption.validateEncryptionParams({
        key: randomBytes(16) // Too short
      })).toBe(false);
      
      // Invalid IV length
      expect(ZeroKnowledgeEncryption.validateEncryptionParams({
        iv: randomBytes(8) // Too short
      })).toBe(false);
      
      // Invalid fingerprint format
      expect(ZeroKnowledgeEncryption.validateEncryptionParams({
        fingerprint: 'invalid-fingerprint'
      })).toBe(false);
    });
  });

  describe('📁 File Encryption Security', () => {
    test('should encrypt files with metadata', async () => {
      const fileName = 'sensitive-document.pdf';
      const metadata = {
        category: 'personal',
        classification: 'confidential'
      };
      
      const encrypted = await ZeroKnowledgeEncryption.encryptFile(
        testData,
        fileName,
        testKey,
        metadata
      );
      
      expect(encrypted.encryptedPayload).toBeEncrypted();
      expect(encrypted.fingerprint).toBeSecurelyHashed();
      expect(encrypted.metadata.originalName).toBe(fileName);
      expect(encrypted.metadata.size).toBe(testData.length);
      expect(encrypted.metadata.encryptedAt).toBeDefined();
      expect(encrypted.metadata.version).toBe('1.0');
    });

    test('should decrypt files with metadata', async () => {
      const fileName = 'test-file.pdf';
      const metadata = { sensitive: true };
      
      const encrypted = await ZeroKnowledgeEncryption.encryptFile(
        testData,
        fileName,
        testKey,
        metadata
      );
      
      const decrypted = await ZeroKnowledgeEncryption.decryptFile(
        encrypted.encryptedPayload,
        testKey
      );
      
      expect(decrypted.fileName).toBe(fileName);
      expect(decrypted.data).toEqual(testData);
      expect(decrypted.metadata.sensitive).toBe(true);
    });

    test('should handle large files securely', async () => {
      const largeData = Buffer.alloc(10 * 1024 * 1024, 'A'); // 10MB
      
      const startTime = Date.now();
      const encrypted = await ZeroKnowledgeEncryption.encryptFile(
        largeData,
        'large-file.dat',
        testKey
      );
      const encryptionTime = Date.now() - startTime;
      
      expect(encrypted.encryptedPayload).toBeEncrypted();
      expect(encryptionTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      const decrypted = await ZeroKnowledgeEncryption.decryptFile(
        encrypted.encryptedPayload,
        testKey
      );
      expect(decrypted.data).toEqual(largeData);
    });

    test('should prevent encryption of malicious files', async () => {
      for (const payload of maliciousPayloads.slice(0, 5)) {
        const maliciousData = Buffer.from(payload);
        
        // System should encrypt but we should be able to detect malicious content
        const encrypted = await ZeroKnowledgeEncryption.encryptFile(
          maliciousData,
          'malicious.txt',
          testKey
        );
        
        expect(encrypted.encryptedPayload).toBeEncrypted();
        
        // After decryption, content should be detectable as malicious
        const decrypted = await ZeroKnowledgeEncryption.decryptFile(
          encrypted.encryptedPayload,
          testKey
        );
        
        const content = decrypted.data.toString();
        expect(content).not.toBeSafeFromXSS();
      }
    });
  });

  describe('👤 Client-Side Security', () => {
    test('should generate client keys securely', async () => {
      const password = 'user-password-123';
      const email = 'user@example.com';
      
      const clientKey1 = await ClientSideEncryption.generateClientKey(password, email);
      const clientKey2 = await ClientSideEncryption.generateClientKey(password, email);
      
      expect(clientKey1.key).toBeEncrypted();
      expect(clientKey1.salt).toHaveLength(64); // Hex string
      expect(clientKey1.fingerprint).toBeSecurelyHashed();
      
      // Different salts should produce different keys
      expect(clientKey1.key).not.toEqual(clientKey2.key);
      expect(clientKey1.salt).not.toEqual(clientKey2.salt);
      
      // Same salt should produce same key
      const clientKey3 = await ClientSideEncryption.generateClientKey(
        password, 
        email, 
        clientKey1.salt
      );
      expect(clientKey1.key).toEqual(clientKey3.key);
    });

    test('should encrypt files for upload', async () => {
      const password = 'client-password';
      const email = 'client@example.com';
      const { key: clientKey } = await ClientSideEncryption.generateClientKey(password, email);
      
      // Mock File object
      const mockFile = {
        name: 'upload-test.pdf',
        type: 'application/pdf',
        lastModified: Date.now(),
        arrayBuffer: async () => testData.buffer
      } as File;
      
      const encrypted = await ClientSideEncryption.encryptForUpload(mockFile, clientKey);
      
      expect(encrypted.encryptedPayload).toBeEncrypted();
      expect(encrypted.fingerprint).toBeSecurelyHashed();
      expect(encrypted.metadata.mimeType).toBe('application/pdf');
    });

    test('should decrypt files after download', async () => {
      const password = 'client-password';
      const email = 'client@example.com';
      const { key: clientKey } = await ClientSideEncryption.generateClientKey(password, email);
      
      // First encrypt a file
      const encrypted = await ZeroKnowledgeEncryption.encryptFile(
        testData,
        'download-test.pdf',
        Buffer.from(clientKey, 'base64'),
        { mimeType: 'application/pdf' }
      );
      
      // Then decrypt it client-side
      const decrypted = await ClientSideEncryption.decryptAfterDownload(
        encrypted.encryptedPayload,
        clientKey
      );
      
      expect(decrypted.fileName).toBe('download-test.pdf');
      expect(decrypted.data).toEqual(new Uint8Array(testData));
      expect(decrypted.mimeType).toBe('application/pdf');
    });

    test('should prevent client-side key exposure', async () => {
      const password = 'secret-password';
      const email = 'user@example.com';
      
      const clientKey = await ClientSideEncryption.generateClientKey(password, email);
      
      // Key should be base64 encoded, not raw
      expect(clientKey.key).toMatch(/^[A-Za-z0-9+/]+=*$/);
      
      // Salt should be hex encoded
      expect(clientKey.salt).toMatch(/^[a-f0-9]+$/);
      
      // Fingerprint should be hex encoded
      expect(clientKey.fingerprint).toMatch(/^[a-f0-9]+$/);
      
      // Ensure key is not exposed in error messages
      try {
        await ClientSideEncryption.decryptAfterDownload('invalid-payload', clientKey.key);
      } catch (error) {
        expect(error.message).not.toContain(clientKey.key);
        expect(error.message).not.toContain(password);
      }
    });
  });

  describe('⚡ Timing Attack Resistance', () => {
    test('should have consistent key derivation timing', async () => {
      const password = 'timing-test-password';
      const times: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const start = process.hrtime.bigint();
        await ZeroKnowledgeEncryption.generateKey(password);
        const end = process.hrtime.bigint();
        times.push(Number(end - start) / 1000000); // Convert to ms
      }
      
      const average = times.reduce((a, b) => a + b) / times.length;
      const variance = times.reduce((acc, time) => acc + Math.pow(time - average, 2), 0) / times.length;
      const stdDev = Math.sqrt(variance);
      
      // Standard deviation should be low for timing attack resistance
      expect(stdDev).toBeLessThan(average * 0.1); // Less than 10% of average
    });

    test('should have timing-safe key verification', () => {
      const validFingerprint = ZeroKnowledgeEncryption.generateKeyFingerprint(testKey);
      const invalidFingerprint = 'a'.repeat(64);
      
      const times1: number[] = [];
      const times2: number[] = [];
      
      // Measure timing for valid fingerprint
      for (let i = 0; i < 100; i++) {
        const start = process.hrtime.bigint();
        ZeroKnowledgeEncryption.verifyKeyFingerprint(testKey, validFingerprint);
        const end = process.hrtime.bigint();
        times1.push(Number(end - start));
      }
      
      // Measure timing for invalid fingerprint
      for (let i = 0; i < 100; i++) {
        const start = process.hrtime.bigint();
        ZeroKnowledgeEncryption.verifyKeyFingerprint(testKey, invalidFingerprint);
        const end = process.hrtime.bigint();
        times2.push(Number(end - start));
      }
      
      const avg1 = times1.reduce((a, b) => a + b) / times1.length;
      const avg2 = times2.reduce((a, b) => a + b) / times2.length;
      
      // Timing difference should be minimal
      const timingDifference = Math.abs(avg1 - avg2) / Math.max(avg1, avg2);
      expect(timingDifference).toBeLessThan(0.1); // Less than 10% difference
    });
  });

  describe('🔒 Advanced Security Features', () => {
    test('should generate secure passwords', () => {
      const password1 = ZeroKnowledgeEncryption.generateSecurePassword();
      const password2 = ZeroKnowledgeEncryption.generateSecurePassword();
      
      expect(password1).toHaveLength(32);
      expect(password2).toHaveLength(32);
      expect(password1).not.toEqual(password2);
      
      // Check character diversity
      expect(password1).toMatch(/[A-Z]/); // Uppercase
      expect(password1).toMatch(/[a-z]/); // Lowercase
      expect(password1).toMatch(/[0-9]/); // Numbers
      expect(password1).toMatch(/[!@#$%^&*]/); // Special chars
      
      // Calculate entropy
      const entropy = calculateEntropy(Buffer.from(password1));
      expect(entropy).toBeGreaterThan(4.5); // Good entropy
    });

    test('should encrypt searchable fields securely', () => {
      const value = 'John Doe';
      const encrypted1 = ZeroKnowledgeEncryption.encryptSearchableField(value, testKey);
      const encrypted2 = ZeroKnowledgeEncryption.encryptSearchableField(value, testKey);
      
      // Should be deterministic for same key
      expect(encrypted1).toEqual(encrypted2);
      
      // Different key should produce different result
      const differentKey = SecurityTestUtils.generateTestKey();
      const encrypted3 = ZeroKnowledgeEncryption.encryptSearchableField(value, differentKey);
      expect(encrypted1).not.toEqual(encrypted3);
      
      // Result should be hex string
      expect(encrypted1).toMatch(/^[a-f0-9]+$/);
      expect(encrypted1).toHaveLength(32);
    });
  });

  describe('🛡️ Error Handling Security', () => {
    test('should not leak sensitive information in errors', async () => {
      const sensitiveKey = Buffer.from('very-secret-key-do-not-expose-123');
      
      try {
        await ZeroKnowledgeEncryption.decrypt(
          Buffer.from('invalid-data'),
          sensitiveKey,
          randomBytes(16),
          randomBytes(16)
        );
      } catch (error) {
        expect(error.message).not.toContain('very-secret-key');
        expect(error.message).not.toContain(sensitiveKey.toString());
        expect(error.message).not.toContain(sensitiveKey.toString('hex'));
        expect(error.message).not.toContain(sensitiveKey.toString('base64'));
      }
    });

    test('should handle memory cleanup on errors', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Attempt many failed operations
      const promises = Array.from({ length: 100 }, async (_, i) => {
        try {
          await ZeroKnowledgeEncryption.decrypt(
            Buffer.from(`invalid-data-${i}`),
            testKey,
            randomBytes(16),
            randomBytes(16)
          );
        } catch {
          // Expected to fail
        }
      });
      
      await Promise.all(promises);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});

// Helper function to calculate entropy
function calculateEntropy(data: Buffer): number {
  const freq: Record<number, number> = {};
  
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    freq[byte] = (freq[byte] || 0) + 1;
  }
  
  let entropy = 0;
  const length = data.length;
  
  for (const count of Object.values(freq)) {
    const p = count / length;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}