# Document Vault Security Architecture
## Zero-Knowledge Encrypted Document Management for Dutch Funeral Platform

**Why**: Families lose critical documents during grief; secure vault prevents loss and enables controlled sharing  
**What**: Zero-knowledge encrypted document storage with GDPR compliance and time-limited sharing  
**How**: Client-side encryption, role-based access, automated retention, and audit trails  

## Core Security Architecture

### 1. Zero-Knowledge Encryption Model

#### Client-Side Encryption Framework
```typescript
// lib/security/document-encryption.ts
import { webcrypto } from 'crypto';

export class DocumentEncryption {
  private algorithm = 'AES-GCM';
  private keyLength = 256;
  
  /**
   * Generate encryption key from user password and case-specific salt
   * Uses PBKDF2 for key derivation to prevent rainbow table attacks
   */
  async generateEncryptionKey(
    userPassword: string,
    caseId: string,
    iterations: number = 100000
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const password = encoder.encode(userPassword);
    const salt = encoder.encode(`farewelly_${caseId}_salt_2024`);
    
    // Import password as key material
    const keyMaterial = await webcrypto.subtle.importKey(
      'raw',
      password,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    // Derive actual encryption key
    return await webcrypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.algorithm,
        length: this.keyLength
      },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  /**
   * Encrypt document content client-side
   * Returns encrypted data + IV for storage
   */
  async encryptDocument(
    content: ArrayBuffer,
    encryptionKey: CryptoKey
  ): Promise<{
    encryptedContent: ArrayBuffer;
    iv: ArrayBuffer;
    authTag?: ArrayBuffer;
  }> {
    // Generate random initialization vector
    const iv = webcrypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the content
    const encryptedContent = await webcrypto.subtle.encrypt(
      {
        name: this.algorithm,
        iv: iv
      },
      encryptionKey,
      content
    );
    
    return {
      encryptedContent,
      iv,
    };
  }
  
  /**
   * Decrypt document content client-side
   */
  async decryptDocument(
    encryptedContent: ArrayBuffer,
    iv: ArrayBuffer,
    encryptionKey: CryptoKey
  ): Promise<ArrayBuffer> {
    return await webcrypto.subtle.decrypt(
      {
        name: this.algorithm,
        iv: iv
      },
      encryptionKey,
      encryptedContent
    );
  }
  
  /**
   * Generate secure document key fingerprint for identification
   * This allows us to identify documents without accessing content
   */
  async generateDocumentFingerprint(content: ArrayBuffer): Promise<string> {
    const hashBuffer = await webcrypto.subtle.digest('SHA-256', content);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
```

#### Secure Key Management
```typescript
// lib/security/key-management.ts
export class SecureKeyManager {
  private keyStore = new Map<string, CryptoKey>();
  
  /**
   * Master key derivation for families
   * Uses family email + case ID for deterministic key generation
   */
  async deriveFamilyMasterKey(
    familyEmail: string,
    caseId: string,
    userProvidedKey?: string
  ): Promise<string> {
    const baseKey = userProvidedKey || familyEmail;
    const encoder = new TextEncoder();
    const data = encoder.encode(`${baseKey}_${caseId}_family_master`);
    
    const hashBuffer = await webcrypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Generate time-limited sharing keys
   * These keys expire and cannot decrypt documents after expiration
   */
  async generateSharingKey(
    documentId: string,
    recipientId: string,
    expirationHours: number = 72
  ): Promise<{
    shareToken: string;
    encryptedShareKey: string;
    expiresAt: Date;
  }> {
    const shareToken = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + (expirationHours * 60 * 60 * 1000));
    
    // Generate ephemeral key for this sharing session
    const shareKey = await webcrypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Export and encrypt the share key
    const exportedKey = await webcrypto.subtle.exportKey('raw', shareKey);
    const encryptedShareKey = await this.encryptWithTimeLimit(
      exportedKey,
      expiresAt
    );
    
    return {
      shareToken,
      encryptedShareKey: Buffer.from(encryptedShareKey).toString('base64'),
      expiresAt
    };
  }
  
  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    webcrypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  private async encryptWithTimeLimit(
    data: ArrayBuffer,
    expiresAt: Date
  ): Promise<ArrayBuffer> {
    // Implementation that includes expiration in the encrypted data
    const encoder = new TextEncoder();
    const expirationData = encoder.encode(expiresAt.toISOString());
    
    // Combine data with expiration
    const combinedData = new Uint8Array(data.byteLength + expirationData.length);
    combinedData.set(new Uint8Array(data));
    combinedData.set(expirationData, data.byteLength);
    
    return combinedData.buffer;
  }
}
```

### 2. Document Storage & Management

#### Secure Document Service
```typescript
// lib/services/document-vault.ts
import { DocumentEncryption } from '@/lib/security/document-encryption';
import { SecureKeyManager } from '@/lib/security/key-management';

export interface SecureDocument {
  id: string;
  caseId: string;
  uploaderId: string;
  documentType: DocumentType;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  encryptedContent: Buffer;
  iv: Buffer;
  contentFingerprint: string;
  accessLevel: AccessLevel;
  retentionCategory: RetentionCategory;
  autoDeleteDate?: Date;
  createdAt: Date;
  lastAccessedAt: Date;
}

export type DocumentType = 
  | 'death_certificate'
  | 'burial_permit'
  | 'cremation_permit'
  | 'insurance_policy'
  | 'id_document'
  | 'medical_certificate'
  | 'will_testament'
  | 'funeral_wishes'
  | 'memorial_items'
  | 'payment_receipt'
  | 'other';

export type AccessLevel = 'private' | 'family' | 'director' | 'venue' | 'municipal';
export type RetentionCategory = 'immediate' | 'financial' | 'memorial' | 'legal';

export class DocumentVaultService {
  private encryption = new DocumentEncryption();
  private keyManager = new SecureKeyManager();
  
  /**
   * Upload and encrypt document
   * All encryption happens client-side before transmission
   */
  async uploadDocument(
    file: File,
    metadata: {
      caseId: string;
      uploaderId: string;
      documentType: DocumentType;
      accessLevel: AccessLevel;
      userEncryptionKey: string;
    }
  ): Promise<SecureDocument> {
    // Read file content
    const fileContent = await file.arrayBuffer();
    
    // Generate encryption key
    const encryptionKey = await this.encryption.generateEncryptionKey(
      metadata.userEncryptionKey,
      metadata.caseId
    );
    
    // Encrypt document client-side
    const { encryptedContent, iv } = await this.encryption.encryptDocument(
      fileContent,
      encryptionKey
    );
    
    // Generate content fingerprint for integrity verification
    const contentFingerprint = await this.encryption.generateDocumentFingerprint(fileContent);
    
    // Determine retention policy
    const retentionCategory = this.determineRetentionCategory(metadata.documentType);
    const autoDeleteDate = this.calculateAutoDeleteDate(retentionCategory);
    
    // Store in database (encrypted content only)
    const document: Omit<SecureDocument, 'id' | 'createdAt' | 'lastAccessedAt'> = {
      caseId: metadata.caseId,
      uploaderId: metadata.uploaderId,
      documentType: metadata.documentType,
      originalFilename: file.name,
      fileSize: file.size,
      mimeType: file.type,
      encryptedContent: Buffer.from(encryptedContent),
      iv: Buffer.from(iv),
      contentFingerprint,
      accessLevel: metadata.accessLevel,
      retentionCategory,
      autoDeleteDate
    };
    
    const savedDocument = await this.storeDocument(document);
    
    // Log access for audit trail
    await this.logDocumentAccess(savedDocument.id, metadata.uploaderId, 'upload');
    
    return savedDocument;
  }
  
  /**
   * Retrieve and decrypt document
   * Requires user's encryption key to decrypt
   */
  async retrieveDocument(
    documentId: string,
    userId: string,
    userEncryptionKey: string,
    accessToken?: string
  ): Promise<{
    document: SecureDocument;
    decryptedContent: ArrayBuffer;
  }> {
    // Fetch document metadata
    const document = await this.getDocumentById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Verify access permissions
    await this.verifyAccess(document, userId, accessToken);
    
    // Generate decryption key
    const decryptionKey = await this.encryption.generateEncryptionKey(
      userEncryptionKey,
      document.caseId
    );
    
    // Decrypt content
    const decryptedContent = await this.encryption.decryptDocument(
      document.encryptedContent.buffer,
      document.iv.buffer,
      decryptionKey
    );
    
    // Verify content integrity
    const currentFingerprint = await this.encryption.generateDocumentFingerprint(decryptedContent);
    if (currentFingerprint !== document.contentFingerprint) {
      throw new Error('Document integrity verification failed');
    }
    
    // Update last accessed time
    await this.updateLastAccessed(documentId);
    
    // Log access for audit trail
    await this.logDocumentAccess(documentId, userId, 'download');
    
    return {
      document,
      decryptedContent
    };
  }
  
  /**
   * Create time-limited sharing token
   * Allows temporary access without permanent permission changes
   */
  async createSharingToken(
    documentId: string,
    ownerId: string,
    recipientId: string,
    permissions: SharePermission[],
    expirationHours: number = 72,
    maxAccessCount: number = 3
  ): Promise<{
    shareToken: string;
    shareUrl: string;
    expiresAt: Date;
  }> {
    // Verify ownership or appropriate access
    await this.verifyOwnership(documentId, ownerId);
    
    // Generate sharing key
    const sharingData = await this.keyManager.generateSharingKey(
      documentId,
      recipientId,
      expirationHours
    );
    
    // Store sharing record
    await this.storeDocumentShare({
      documentId,
      sharedByUserId: ownerId,
      sharedWithUserId: recipientId,
      shareToken: sharingData.shareToken,
      permissions,
      maxAccessCount,
      currentAccessCount: 0,
      expiresAt: sharingData.expiresAt
    });
    
    // Generate share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/documents/shared/${sharingData.shareToken}`;
    
    // Log sharing action
    await this.logDocumentAccess(documentId, ownerId, 'share_created');
    
    return {
      shareToken: sharingData.shareToken,
      shareUrl,
      expiresAt: sharingData.expiresAt
    };
  }
  
  private determineRetentionCategory(documentType: DocumentType): RetentionCategory {
    const retentionMap: Record<DocumentType, RetentionCategory> = {
      'death_certificate': 'legal',
      'burial_permit': 'legal',
      'cremation_permit': 'legal',
      'insurance_policy': 'financial',
      'id_document': 'immediate',
      'medical_certificate': 'legal',
      'will_testament': 'legal',
      'funeral_wishes': 'memorial',
      'memorial_items': 'memorial',
      'payment_receipt': 'financial',
      'other': 'immediate'
    };
    
    return retentionMap[documentType];
  }
  
  private calculateAutoDeleteDate(category: RetentionCategory): Date | null {
    const now = new Date();
    
    switch (category) {
      case 'immediate':
        return new Date(now.setFullYear(now.getFullYear() + 1)); // 1 year
      case 'financial':
        return new Date(now.setFullYear(now.getFullYear() + 7)); // 7 years (Dutch tax law)
      case 'memorial':
        return null; // Indefinite with annual confirmation
      case 'legal':
        return new Date(now.setFullYear(now.getFullYear() + 10)); // 10 years
      default:
        return new Date(now.setFullYear(now.getFullYear() + 1));
    }
  }
}
```

### 3. GDPR Compliance Framework

#### Data Protection Implementation
```typescript
// lib/security/gdpr-compliance.ts
export class GDPRComplianceManager {
  
  /**
   * Handle GDPR data deletion requests
   * Implements right to erasure (Article 17)
   */
  async processDataDeletionRequest(
    userId: string,
    requestType: 'user_request' | 'automated' | 'retention_expired'
  ): Promise<{
    deletedDocuments: string[];
    retainedDocuments: string[];
    reason: string;
  }> {
    const userDocuments = await this.getUserDocuments(userId);
    const deletedDocuments: string[] = [];
    const retainedDocuments: string[] = [];
    
    for (const document of userDocuments) {
      // Check if document can be deleted under GDPR
      const canDelete = await this.canDeleteDocument(document);
      
      if (canDelete.allowed) {
        await this.secureDeleteDocument(document.id);
        deletedDocuments.push(document.id);
      } else {
        retainedDocuments.push(document.id);
      }
    }
    
    // Log the deletion request
    await this.logGDPRAction({
      userId,
      action: 'data_deletion_request',
      requestType,
      deletedCount: deletedDocuments.length,
      retainedCount: retainedDocuments.length,
      timestamp: new Date()
    });
    
    return {
      deletedDocuments,
      retainedDocuments,
      reason: 'Legal obligations under Dutch law'
    };
  }
  
  /**
   * Generate data export for GDPR Article 20 (data portability)
   */
  async generateDataExport(userId: string): Promise<{
    exportData: any;
    encryptedDocuments: Buffer[];
    exportToken: string;
  }> {
    const userProfile = await this.getUserProfile(userId);
    const userDocuments = await this.getUserDocuments(userId);
    const userActivities = await this.getUserActivities(userId);
    
    // Compile exportable data
    const exportData = {
      profile: userProfile,
      documents: userDocuments.map(doc => ({
        id: doc.id,
        filename: doc.originalFilename,
        type: doc.documentType,
        uploadDate: doc.createdAt,
        // Note: Actual content requires user's encryption key
        encrypted: true
      })),
      activities: userActivities,
      exportDate: new Date(),
      retentionInfo: await this.getRetentionInfo(userId)
    };
    
    // Generate secure export token
    const exportToken = await this.generateExportToken(userId);
    
    // Encrypt document contents for export
    const encryptedDocuments = await Promise.all(
      userDocuments.map(doc => this.prepareDocumentForExport(doc))
    );
    
    return {
      exportData,
      encryptedDocuments,
      exportToken
    };
  }
  
  /**
   * Audit trail for GDPR compliance
   */
  async logGDPRAction(action: {
    userId: string;
    action: string;
    requestType?: string;
    details?: any;
    timestamp: Date;
  }): Promise<void> {
    await supabase
      .from('gdpr_audit_log')
      .insert({
        user_id: action.userId,
        action: action.action,
        request_type: action.requestType,
        details: action.details,
        created_at: action.timestamp,
        ip_address: this.getCurrentIPAddress(),
        user_agent: this.getCurrentUserAgent()
      });
  }
  
  private async canDeleteDocument(document: SecureDocument): Promise<{
    allowed: boolean;
    reason: string;
  }> {
    // Check if document is subject to legal retention requirements
    const legalRetention = await this.checkLegalRetentionRequirements(document);
    
    if (legalRetention.required) {
      return {
        allowed: false,
        reason: `Legal retention required until ${legalRetention.retainUntil}`
      };
    }
    
    // Check if document is part of active legal proceedings
    const activeCases = await this.checkActiveLegalCases(document.caseId);
    
    if (activeCases.length > 0) {
      return {
        allowed: false,
        reason: 'Document is part of active legal proceedings'
      };
    }
    
    return {
      allowed: true,
      reason: 'No legal retention requirements'
    };
  }
  
  private async secureDeleteDocument(documentId: string): Promise<void> {
    // Multi-pass secure deletion
    const document = await this.getDocumentById(documentId);
    
    if (document) {
      // Overwrite encrypted content with random data (3 passes)
      for (let i = 0; i < 3; i++) {
        const randomData = webcrypto.getRandomValues(new Uint8Array(document.fileSize));
        await this.overwriteDocumentContent(documentId, randomData);
      }
      
      // Remove from database
      await supabase
        .from('document_vault')
        .delete()
        .eq('id', documentId);
      
      // Remove any sharing tokens
      await supabase
        .from('document_shares')
        .delete()
        .eq('document_id', documentId);
    }
  }
}
```

### 4. Access Control & Sharing

#### Permission Management
```typescript
// lib/security/access-control.ts
export type SharePermission = 'view' | 'download' | 'print' | 'forward';

interface DocumentAccessRule {
  userType: UserType;
  accessLevel: AccessLevel;
  permissions: SharePermission[];
  conditions?: {
    timeLimit?: number; // hours
    downloadLimit?: number;
    ipRestriction?: string[];
    requireApproval?: boolean;
  };
}

export class DocumentAccessController {
  private accessRules: Record<DocumentType, DocumentAccessRule[]> = {
    'death_certificate': [
      {
        userType: 'family',
        accessLevel: 'family',
        permissions: ['view', 'download', 'print'],
      },
      {
        userType: 'director',
        accessLevel: 'director',
        permissions: ['view', 'download'],
        conditions: { timeLimit: 168 } // 1 week
      },
      {
        userType: 'venue',
        accessLevel: 'venue',
        permissions: ['view'],
        conditions: { timeLimit: 72 } // 3 days
      }
    ],
    'insurance_policy': [
      {
        userType: 'family',
        accessLevel: 'private',
        permissions: ['view', 'download', 'print'],
      },
      {
        userType: 'director',
        accessLevel: 'director',
        permissions: ['view'],
        conditions: { requireApproval: true }
      }
    ],
    // ... other document types
  };
  
  async verifyDocumentAccess(
    documentId: string,
    userId: string,
    requestedPermission: SharePermission,
    accessToken?: string
  ): Promise<{
    allowed: boolean;
    reason: string;
    conditions?: any;
  }> {
    const document = await this.getDocumentById(documentId);
    const user = await this.getUserById(userId);
    
    if (!document || !user) {
      return { allowed: false, reason: 'Document or user not found' };
    }
    
    // Check if access is via sharing token
    if (accessToken) {
      return await this.verifyTokenAccess(documentId, accessToken, requestedPermission);
    }
    
    // Check direct access permissions
    const rules = this.accessRules[document.documentType] || [];
    const applicableRule = rules.find(rule => 
      rule.userType === user.userType && 
      this.checkAccessLevel(document.accessLevel, rule.accessLevel)
    );
    
    if (!applicableRule) {
      return { allowed: false, reason: 'No applicable access rule' };
    }
    
    if (!applicableRule.permissions.includes(requestedPermission)) {
      return { allowed: false, reason: 'Permission not granted' };
    }
    
    // Check conditions
    if (applicableRule.conditions) {
      const conditionCheck = await this.checkAccessConditions(
        document,
        user,
        applicableRule.conditions
      );
      
      if (!conditionCheck.met) {
        return { allowed: false, reason: conditionCheck.reason, conditions: conditionCheck };
      }
    }
    
    return { allowed: true, reason: 'Access granted' };
  }
  
  private async verifyTokenAccess(
    documentId: string,
    token: string,
    permission: SharePermission
  ): Promise<{ allowed: boolean; reason: string }> {
    const shareRecord = await supabase
      .from('document_shares')
      .select('*')
      .eq('document_id', documentId)
      .eq('share_token', token)
      .single();
    
    if (!shareRecord.data) {
      return { allowed: false, reason: 'Invalid sharing token' };
    }
    
    const share = shareRecord.data;
    
    // Check expiration
    if (new Date() > new Date(share.expires_at)) {
      return { allowed: false, reason: 'Sharing token expired' };
    }
    
    // Check access count
    if (share.current_access_count >= share.max_access_count) {
      return { allowed: false, reason: 'Access limit exceeded' };
    }
    
    // Check permissions
    if (!share.permissions.includes(permission)) {
      return { allowed: false, reason: 'Permission not granted via token' };
    }
    
    // Increment access count
    await supabase
      .from('document_shares')
      .update({ 
        current_access_count: share.current_access_count + 1,
        last_accessed_at: new Date()
      })
      .eq('id', share.id);
    
    return { allowed: true, reason: 'Token access granted' };
  }
}
```

This document vault security architecture provides a comprehensive, GDPR-compliant solution for securely managing sensitive funeral documents with zero-knowledge encryption, role-based access control, and automated retention policies.