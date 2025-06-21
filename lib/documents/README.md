# Farewelly Secure Document Vault

A zero-knowledge document management system with end-to-end encryption, time-limited sharing, GDPR compliance, and automated retention policies.

## Features

### 🔐 Zero-Knowledge Encryption
- Client-side AES-256-GCM encryption
- PBKDF2 key derivation with 100,000 iterations
- Server never sees plaintext data
- Automatic key rotation support

### ⏰ Time-Limited Share Tokens
- Configurable expiration (1 hour to 1 year)
- Usage count limitations
- IP address restrictions
- Password protection
- Complete audit trail

### 📋 GDPR Compliance
- Comprehensive audit logging
- Automated data subject rights handling
- Legal basis tracking
- Consent management
- Automatic log anonymization

### 🏷️ Auto-Classification
- Rule-based document categorization
- Personal data detection
- Sensitivity assessment
- Automatic tag extraction

### 📅 Retention Policies
- Predefined policies for different document types
- Automated lifecycle management
- Legal hold support
- Compliance monitoring

### 🛡️ Security Features
- Rate limiting on all endpoints
- File type validation
- Virus scanning integration
- Security headers
- JWT authentication

## Quick Start

```typescript
import { documentVault, SecureDocumentAPI } from './lib/documents';

// Initialize the vault
await documentVault.initialize({
  encryptionAlgorithm: 'AES-256-GCM',
  keyRotationPeriod: 90,
  defaultRetentionPeriod: 2555, // 7 years
  maxFileSize: 100 * 1024 * 1024, // 100MB
  virusScanningEnabled: true
});

// Check system health
const health = await documentVault.healthCheck();
console.log('Vault status:', health.status);
```

## API Endpoints

### Upload Document
```
POST /api/documents/upload
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "fileName": "document.pdf",
  "fileSize": 1024,
  "mimeType": "application/pdf",
  "encryptedPayload": "<base64-encrypted-data>",
  "fingerprint": "<key-fingerprint>",
  "category": "legal",
  "tags": ["contract", "important"],
  "retentionPolicyId": "legal-7years"
}
```

### Download Document
```
GET /api/documents/:id/download?token=<share-token>&password=<optional>
```

### Create Share Token
```
POST /api/documents/:id/share
Authorization: Bearer <jwt-token>

{
  "permissions": "download",
  "expiresInHours": 24,
  "usageLimit": 5,
  "password": "optional-password",
  "ipRestrictions": ["192.168.1.0/24"]
}
```

## Client-Side Encryption Example

```typescript
import { ClientSideEncryption } from './lib/documents';

// Generate encryption key from user password
const { key, salt, fingerprint } = await ClientSideEncryption.generateClientKey(
  userPassword,
  userEmail
);

// Encrypt file before upload
const { encryptedPayload, metadata } = await ClientSideEncryption.encryptForUpload(
  file,
  key
);

// Upload to server
const response = await fetch('/api/documents/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    encryptedPayload,
    fingerprint,
    // ... other fields
  })
});
```

## Document Categories

The system includes predefined categories with automatic classification:

- **Legal Documents** (7-year retention)
- **Financial Records** (7-year retention)
- **Medical Records** (10-year retention)
- **Personal Documents** (indefinite retention)
- **Funeral Planning** (indefinite retention)
- **Insurance Documents** (5-year retention)

## Security Architecture

The complete security architecture is stored in Memory at:
`swarm-auto-centralized-1750494292308/documents/security`

### Key Security Principles

1. **Zero-Knowledge**: Server never accesses plaintext
2. **Defense in Depth**: Multiple security layers
3. **Principle of Least Privilege**: Minimal access rights
4. **Data Minimization**: Only necessary data collected
5. **Purpose Limitation**: Data used only for stated purposes

## File Structure

```
/lib/documents/
├── types.ts                           # Core type definitions
├── encryption/
│   └── zero-knowledge-encryption.ts   # Encryption system
├── tokens/
│   └── share-tokens.ts                # Share token management
├── audit/
│   └── gdpr-audit.ts                  # GDPR compliance & audit
├── categorization/
│   └── auto-classifier.ts             # Document classification
├── retention/
│   └── auto-retention.ts              # Retention policy automation
├── api/
│   └── secure-endpoints.ts            # Secure API endpoints
├── index.ts                           # Main export & orchestration
└── README.md                          # This file
```

## Integration with Farewelly

This document vault system is designed specifically for Farewelly's needs:

- **Funeral Planning Documents**: Indefinite retention for memorial purposes
- **Legal Documents**: Proper retention for estate planning
- **Personal Records**: Secure storage of sensitive personal information
- **Medical Documents**: Healthcare record management with compliance
- **Financial Records**: Tax and estate planning documentation

## Next Steps

1. Database schema implementation with Supabase
2. Client-side JavaScript library for encryption
3. Admin dashboard for document management
4. Performance optimization and caching
5. Security testing and penetration testing
6. Mobile app integration

## Support

For questions or issues with the document vault system, please refer to the security architecture documentation stored in Memory or contact the development team.