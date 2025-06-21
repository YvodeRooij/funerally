/**
 * Zero-Knowledge Encryption System
 * Client-side encryption with server-side zero-knowledge storage
 */

import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { promisify } from 'util';
import { EncryptionKey } from '../types';

export class ZeroKnowledgeEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits
  private static readonly SALT_LENGTH = 32; // 256 bits

  /**
   * Generate a new encryption key from password and salt
   */
  static async generateKey(password: string, salt?: Buffer): Promise<{ key: Buffer; salt: Buffer }> {
    const actualSalt = salt || randomBytes(this.SALT_LENGTH);
    const key = await this.deriveKey(password, actualSalt);
    return { key, salt: actualSalt };
  }

  /**
   * Derive key using PBKDF2 with high iteration count
   */
  private static async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    const pbkdf2 = promisify(require('crypto').pbkdf2);
    return pbkdf2(password, salt, 100000, this.KEY_LENGTH, 'sha256');
  }

  /**
   * Encrypt data with zero-knowledge approach
   * Returns encrypted data that can be stored server-side without revealing content
   */
  static async encrypt(data: Buffer, key: Buffer): Promise<{
    encryptedData: Buffer;
    iv: Buffer;
    tag: Buffer;
    fingerprint: string;
  }> {
    const iv = randomBytes(this.IV_LENGTH);
    const cipher = createCipheriv(this.ALGORITHM, key, iv);
    
    const encryptedChunks: Buffer[] = [];
    encryptedChunks.push(cipher.update(data));
    encryptedChunks.push(cipher.final());
    
    const tag = cipher.getAuthTag();
    const encryptedData = Buffer.concat(encryptedChunks);
    const fingerprint = this.generateKeyFingerprint(key);
    
    return {
      encryptedData,
      iv,
      tag,
      fingerprint
    };
  }

  /**
   * Decrypt data with zero-knowledge approach
   */
  static async decrypt(
    encryptedData: Buffer,
    key: Buffer,
    iv: Buffer,
    tag: Buffer
  ): Promise<Buffer> {
    const decipher = createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    const decryptedChunks: Buffer[] = [];
    decryptedChunks.push(decipher.update(encryptedData));
    decryptedChunks.push(decipher.final());
    
    return Buffer.concat(decryptedChunks);
  }

  /**
   * Generate fingerprint for key verification without revealing the key
   */
  static generateKeyFingerprint(key: Buffer): string {
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * Verify key fingerprint without revealing the key
   */
  static verifyKeyFingerprint(key: Buffer, fingerprint: string): boolean {
    return this.generateKeyFingerprint(key) === fingerprint;
  }

  /**
   * Encrypt file with metadata
   */
  static async encryptFile(
    fileData: Buffer,
    fileName: string,
    key: Buffer,
    metadata: Record<string, any> = {}
  ): Promise<{
    encryptedPayload: string; // Base64 encoded
    fingerprint: string;
    metadata: {
      originalName: string;
      size: number;
      encryptedAt: string;
      version: string;
      [key: string]: any;
    };
  }> {
    // Create payload with metadata
    const payload = {
      fileName,
      data: fileData,
      metadata: {
        ...metadata,
        encryptedAt: new Date().toISOString(),
        version: '1.0'
      }
    };

    const payloadBuffer = Buffer.from(JSON.stringify(payload));
    const encrypted = await this.encrypt(payloadBuffer, key);
    
    // Combine all encrypted components
    const combined = Buffer.concat([
      encrypted.iv,
      encrypted.tag,
      encrypted.encryptedData
    ]);

    return {
      encryptedPayload: combined.toString('base64'),
      fingerprint: encrypted.fingerprint,
      metadata: {
        originalName: fileName,
        size: fileData.length,
        encryptedAt: new Date().toISOString(),
        version: '1.0',
        ...metadata
      }
    };
  }

  /**
   * Decrypt file with metadata
   */
  static async decryptFile(
    encryptedPayload: string,
    key: Buffer
  ): Promise<{
    fileName: string;
    data: Buffer;
    metadata: Record<string, any>;
  }> {
    const combined = Buffer.from(encryptedPayload, 'base64');
    
    // Extract components
    const iv = combined.slice(0, this.IV_LENGTH);
    const tag = combined.slice(this.IV_LENGTH, this.IV_LENGTH + this.TAG_LENGTH);
    const encryptedData = combined.slice(this.IV_LENGTH + this.TAG_LENGTH);
    
    // Decrypt
    const decryptedPayload = await this.decrypt(encryptedData, key, iv, tag);
    const payload = JSON.parse(decryptedPayload.toString());
    
    return {
      fileName: payload.fileName,
      data: Buffer.from(payload.data),
      metadata: payload.metadata
    };
  }

  /**
   * Generate secure random password for client-side encryption
   */
  static generateSecurePassword(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    const randomArray = randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomArray[i] % chars.length];
    }
    
    return result;
  }

  /**
   * Key rotation functionality
   */
  static async rotateKey(
    oldKey: Buffer,
    newPassword: string,
    encryptedData: string
  ): Promise<{
    newKey: Buffer;
    newSalt: Buffer;
    reencryptedData: string;
    newFingerprint: string;
  }> {
    // Generate new key
    const { key: newKey, salt: newSalt } = await this.generateKey(newPassword);
    
    // Decrypt with old key
    const decrypted = await this.decryptFile(encryptedData, oldKey);
    
    // Re-encrypt with new key
    const reencrypted = await this.encryptFile(
      decrypted.data,
      decrypted.fileName,
      newKey,
      decrypted.metadata
    );
    
    return {
      newKey,
      newSalt,
      reencryptedData: reencrypted.encryptedPayload,
      newFingerprint: reencrypted.fingerprint
    };
  }

  /**
   * Secure key derivation for share tokens
   */
  static async deriveShareKey(
    masterKey: Buffer,
    shareToken: string,
    salt: Buffer
  ): Promise<Buffer> {
    const combined = Buffer.concat([masterKey, Buffer.from(shareToken), salt]);
    return createHash('sha256').update(combined).digest();
  }

  /**
   * Encrypt sensitive metadata that needs to be searchable
   * Uses format-preserving encryption for certain fields
   */
  static encryptSearchableField(value: string, key: Buffer): string {
    // Simple deterministic encryption for searchable fields
    // In production, consider using format-preserving encryption
    const hash = createHash('sha256').update(value + key.toString('hex')).digest('hex');
    return hash.substring(0, 32); // Truncate to reasonable length
  }

  /**
   * Validate encryption parameters
   */
  static validateEncryptionParams(params: {
    key?: Buffer;
    iv?: Buffer;
    tag?: Buffer;
    fingerprint?: string;
  }): boolean {
    if (params.key && params.key.length !== this.KEY_LENGTH) return false;
    if (params.iv && params.iv.length !== this.IV_LENGTH) return false;
    if (params.tag && params.tag.length !== this.TAG_LENGTH) return false;
    if (params.fingerprint && !/^[a-f0-9]{64}$/.test(params.fingerprint)) return false;
    
    return true;
  }
}

/**
 * Client-side encryption utilities
 */
export class ClientSideEncryption {
  /**
   * Generate encryption key from user password
   * This should be done client-side to maintain zero-knowledge
   */
  static async generateClientKey(
    password: string,
    email: string,
    salt?: string
  ): Promise<{
    key: string; // Base64 encoded for client storage
    salt: string;
    fingerprint: string;
  }> {
    const actualSalt = salt ? Buffer.from(salt, 'hex') : randomBytes(32);
    const userSalt = Buffer.concat([actualSalt, Buffer.from(email)]);
    
    const { key } = await ZeroKnowledgeEncryption.generateKey(password, userSalt);
    const fingerprint = ZeroKnowledgeEncryption.generateKeyFingerprint(key);
    
    return {
      key: key.toString('base64'),
      salt: actualSalt.toString('hex'),
      fingerprint
    };
  }

  /**
   * Encrypt file on client side before upload
   */
  static async encryptForUpload(
    file: File,
    clientKey: string
  ): Promise<{
    encryptedPayload: string;
    fingerprint: string;
    metadata: any;
  }> {
    const key = Buffer.from(clientKey, 'base64');
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    return ZeroKnowledgeEncryption.encryptFile(
      fileBuffer,
      file.name,
      key,
      {
        mimeType: file.type,
        lastModified: file.lastModified
      }
    );
  }

  /**
   * Decrypt file on client side after download
   */
  static async decryptAfterDownload(
    encryptedPayload: string,
    clientKey: string
  ): Promise<{
    fileName: string;
    data: Uint8Array;
    mimeType: string;
  }> {
    const key = Buffer.from(clientKey, 'base64');
    const decrypted = await ZeroKnowledgeEncryption.decryptFile(encryptedPayload, key);
    
    return {
      fileName: decrypted.fileName,
      data: new Uint8Array(decrypted.data),
      mimeType: decrypted.metadata.mimeType
    };
  }
}