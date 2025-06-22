/**
 * Mock Document Fixtures for Security Testing
 * Provides realistic test data for document security scenarios
 */

import { randomBytes } from 'crypto';
import { SecureDocument, DocumentMetadata, AccessControl, ShareToken, RetentionPolicy } from '../../../lib/documents/types';

export class MockDocumentFactory {
  private static documentCounter = 1;
  private static userCounter = 1;

  /**
   * Create a mock funeral-related document
   */
  static createFuneralDocument(overrides: Partial<SecureDocument> = {}): SecureDocument {
    const docId = `doc_funeral_${this.documentCounter++}`;
    
    return {
      id: docId,
      name: 'Funeral Arrangement Agreement.pdf',
      encryptedContent: randomBytes(2048).toString('base64'),
      keyFingerprint: randomBytes(32).toString('hex'),
      mimeType: 'application/pdf',
      size: 2048576,
      category: {
        id: 'cat_legal_documents',
        name: 'Legal Documents',
        description: 'Official legal documentation for funeral services',
        autoClassificationRules: [
          {
            field: 'name',
            operator: 'contains',
            value: 'arrangement',
            confidence: 0.9
          }
        ],
        defaultRetentionPolicy: 'policy_legal_7_years'
      },
      retentionPolicy: this.createLegalRetentionPolicy(),
      metadata: {
        description: 'Comprehensive funeral arrangement agreement including service details, pricing, and family preferences',
        tags: ['funeral', 'arrangement', 'legal', 'contract'],
        classification: 'confidential',
        personalDataLevel: 'high',
        isPersonalData: true,
        subjectIds: ['subject_deceased_john_doe', 'subject_family_jane_doe'],
        purpose: 'Funeral service arrangement and legal documentation',
        legalBasis: 'Contract (GDPR Article 6(1)(b))',
        customFields: {
          deceasedName: 'John Doe',
          deceasedDOB: '1945-03-15',
          deceasedDOD: '2024-06-15',
          familyContact: 'Jane Doe',
          familyEmail: 'jane.doe@example.com',
          familyPhone: '+31 6 12345678',
          serviceDate: '2024-06-25',
          venue: 'Farewelly Memorial Chapel',
          serviceType: 'Traditional Burial',
          specialRequests: 'Flowers from local garden, classical music',
          estimatedCost: 4500.00,
          paymentStatus: 'deposit_paid'
        }
      },
      accessControl: {
        ownerId: 'user_director_123',
        permissions: [
          {
            userId: 'user_family_456',
            role: 'read',
            grantedAt: new Date(),
            grantedBy: 'user_director_123',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        ],
        shareTokens: [],
        allowPublicAccess: false,
        requiresAuthentication: true,
        ipRestrictions: ['192.168.1.0/24'],
        timeRestrictions: {
          allowedHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17], // Business hours
          allowedDays: [1, 2, 3, 4, 5], // Weekdays
          timezone: 'Europe/Amsterdam'
        }
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      ...overrides
    };
  }

  /**
   * Create a medical certificate document
   */
  static createMedicalCertificate(overrides: Partial<SecureDocument> = {}): SecureDocument {
    const docId = `doc_medical_${this.documentCounter++}`;
    
    return {
      id: docId,
      name: 'Death Certificate - Medical Examiner.pdf',
      encryptedContent: randomBytes(1024).toString('base64'),
      keyFingerprint: randomBytes(32).toString('hex'),
      mimeType: 'application/pdf',
      size: 1024000,
      category: {
        id: 'cat_medical_documents',
        name: 'Medical Documents',
        description: 'Medical certificates and health-related documentation',
        autoClassificationRules: [
          {
            field: 'name',
            operator: 'contains',
            value: 'certificate',
            confidence: 0.95
          },
          {
            field: 'content',
            operator: 'contains',
            value: 'medical examiner',
            confidence: 0.85
          }
        ],
        defaultRetentionPolicy: 'policy_medical_10_years'
      },
      retentionPolicy: this.createMedicalRetentionPolicy(),
      metadata: {
        description: 'Official death certificate issued by medical examiner',
        tags: ['medical', 'certificate', 'official', 'death'],
        classification: 'restricted',
        personalDataLevel: 'high',
        isPersonalData: true,
        subjectIds: ['subject_deceased_john_doe'],
        purpose: 'Legal documentation of death for funeral proceedings',
        legalBasis: 'Legal obligation (GDPR Article 6(1)(c))',
        customFields: {
          certificateNumber: 'DC-2024-06-001234',
          issuingAuthority: 'Municipal Health Department Amsterdam',
          medicalExaminer: 'Dr. Maria van der Berg',
          causeOfDeath: 'Natural causes - cardiac arrest',
          dateOfExamination: '2024-06-16',
          timeOfDeath: '2024-06-15T14:30:00Z',
          placeOfDeath: 'Amsterdam Medical Center',
          confidentialityLevel: 'restricted'
        }
      },
      accessControl: {
        ownerId: 'user_medical_examiner_789',
        permissions: [
          {
            userId: 'user_director_123',
            role: 'read',
            grantedAt: new Date(),
            grantedBy: 'user_medical_examiner_789'
          },
          {
            userId: 'user_registrar_456',
            role: 'read',
            grantedAt: new Date(),
            grantedBy: 'user_medical_examiner_789'
          }
        ],
        shareTokens: [],
        allowPublicAccess: false,
        requiresAuthentication: true,
        ipRestrictions: ['10.0.0.0/8'], // Internal network only
        timeRestrictions: {
          allowedHours: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
          allowedDays: [0, 1, 2, 3, 4, 5, 6],
          timezone: 'Europe/Amsterdam'
        }
      },
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      ...overrides
    };
  }

  /**
   * Create an insurance claim document
   */
  static createInsuranceDocument(overrides: Partial<SecureDocument> = {}): SecureDocument {
    const docId = `doc_insurance_${this.documentCounter++}`;
    
    return {
      id: docId,
      name: 'Life Insurance Claim Form - Policy 789012.pdf',
      encryptedContent: randomBytes(3072).toString('base64'),
      keyFingerprint: randomBytes(32).toString('hex'),
      mimeType: 'application/pdf',
      size: 3145728,
      category: {
        id: 'cat_insurance_documents',
        name: 'Insurance Documents',
        description: 'Insurance policies, claims, and related financial documentation',
        autoClassificationRules: [
          {
            field: 'name',
            operator: 'contains',
            value: 'insurance',
            confidence: 0.9
          },
          {
            field: 'name',
            operator: 'contains',
            value: 'claim',
            confidence: 0.85
          }
        ],
        defaultRetentionPolicy: 'policy_financial_7_years'
      },
      retentionPolicy: this.createFinancialRetentionPolicy(),
      metadata: {
        description: 'Life insurance claim form and supporting documentation',
        tags: ['insurance', 'claim', 'financial', 'policy'],
        classification: 'confidential',
        personalDataLevel: 'high',
        isPersonalData: true,
        subjectIds: ['subject_deceased_john_doe', 'subject_beneficiary_jane_doe'],
        purpose: 'Processing life insurance claim for funeral expenses',
        legalBasis: 'Contract (GDPR Article 6(1)(b))',
        customFields: {
          policyNumber: 'LI-789012-2020',
          insuranceCompany: 'Dutch Life Assurance Ltd',
          policyValue: 25000.00,
          beneficiary: 'Jane Doe',
          beneficiaryRelation: 'Spouse',
          claimAmount: 25000.00,
          claimReason: 'Death benefit claim',
          submissionDate: '2024-06-17',
          expectedProcessingTime: '14-21 business days',
          claimStatus: 'under_review'
        }
      },
      accessControl: {
        ownerId: 'user_insurance_agent_101',
        permissions: [
          {
            userId: 'user_family_456',
            role: 'read',
            grantedAt: new Date(),
            grantedBy: 'user_insurance_agent_101'
          },
          {
            userId: 'user_director_123',
            role: 'read',
            grantedAt: new Date(),
            grantedBy: 'user_insurance_agent_101'
          }
        ],
        shareTokens: [],
        allowPublicAccess: false,
        requiresAuthentication: true
      },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      ...overrides
    };
  }

  /**
   * Create a family photo/memorial document
   */
  static createMemorialPhoto(overrides: Partial<SecureDocument> = {}): SecureDocument {
    const docId = `doc_photo_${this.documentCounter++}`;
    
    return {
      id: docId,
      name: 'Memorial Photo - John Doe Family Portrait.jpg',
      encryptedContent: randomBytes(5120).toString('base64'),
      keyFingerprint: randomBytes(32).toString('hex'),
      mimeType: 'image/jpeg',
      size: 5242880,
      category: {
        id: 'cat_memorial_media',
        name: 'Memorial Media',
        description: 'Photos, videos, and multimedia content for memorial services',
        autoClassificationRules: [
          {
            field: 'name',
            operator: 'contains',
            value: 'memorial',
            confidence: 0.8
          },
          {
            field: 'name',
            operator: 'contains',
            value: 'photo',
            confidence: 0.7
          }
        ],
        defaultRetentionPolicy: 'policy_memorial_indefinite'
      },
      retentionPolicy: this.createMemorialRetentionPolicy(),
      metadata: {
        description: 'Family portrait to be displayed during memorial service',
        tags: ['memorial', 'photo', 'family', 'portrait'],
        classification: 'confidential',
        personalDataLevel: 'medium',
        isPersonalData: true,
        subjectIds: ['subject_deceased_john_doe', 'subject_family_jane_doe'],
        purpose: 'Memorial service presentation and family remembrance',
        legalBasis: 'Consent (GDPR Article 6(1)(a))',
        customFields: {
          photographer: 'Professional Portrait Studio',
          datePhotographed: '2023-12-25',
          familyMembers: ['John Doe', 'Jane Doe', 'Michael Doe', 'Sarah Doe'],
          displayPermission: 'granted',
          highResolutionAvailable: true,
          printQuality: 'professional',
          memorialUsageConsent: 'explicit_consent_given'
        }
      },
      accessControl: {
        ownerId: 'user_family_456',
        permissions: [
          {
            userId: 'user_director_123',
            role: 'read',
            grantedAt: new Date(),
            grantedBy: 'user_family_456'
          }
        ],
        shareTokens: [],
        allowPublicAccess: false,
        requiresAuthentication: true
      },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      ...overrides
    };
  }

  /**
   * Create a document with security vulnerabilities for testing
   */
  static createVulnerableDocument(vulnerabilityType: 'xss' | 'sql_injection' | 'path_traversal' | 'oversized'): SecureDocument {
    const docId = `doc_vuln_${vulnerabilityType}_${this.documentCounter++}`;
    
    const vulnerabilityPayloads = {
      xss: {
        name: '<script>alert("XSS in document name")</script>.pdf',
        description: 'Document with <img src=x onerror=alert("XSS")> in description'
      },
      sql_injection: {
        name: "'; DROP TABLE documents; --.pdf",
        description: "Document with ' OR '1'='1 in description"
      },
      path_traversal: {
        name: '../../../etc/passwd',
        description: 'Document with \\..\\..\\windows\\system32\\config\\sam path'
      },
      oversized: {
        name: 'legitimate-document.pdf',
        size: 1024 * 1024 * 1024 * 2 // 2GB
      }
    };

    const payload = vulnerabilityPayloads[vulnerabilityType];
    
    return {
      id: docId,
      name: payload.name,
      encryptedContent: randomBytes(1024).toString('base64'),
      keyFingerprint: randomBytes(32).toString('hex'),
      mimeType: 'application/pdf',
      size: payload.size || 1024,
      category: {
        id: 'cat_test_vulnerable',
        name: 'Test Vulnerable Documents',
        description: 'Documents with intentional vulnerabilities for security testing',
        autoClassificationRules: [],
        defaultRetentionPolicy: 'policy_test_immediate_deletion'
      },
      retentionPolicy: {
        id: 'policy_test_immediate_deletion',
        name: 'Test Immediate Deletion',
        description: 'Immediate deletion policy for test documents',
        retentionPeriod: 0,
        deleteAfterExpiration: true,
        moveToArchive: false,
        notificationBeforeExpiration: 0,
        legalHold: false,
        gdprCompliant: true,
        categories: ['cat_test_vulnerable']
      },
      metadata: {
        description: payload.description || 'Test document with security vulnerabilities',
        tags: ['test', 'vulnerable', vulnerabilityType],
        classification: 'public',
        personalDataLevel: 'none',
        isPersonalData: false,
        purpose: 'Security testing and vulnerability assessment',
        legalBasis: 'Legitimate interest (testing)',
        customFields: {
          vulnerabilityType,
          testPurpose: 'Security validation',
          autoDelete: true
        }
      },
      accessControl: {
        ownerId: 'user_security_tester',
        permissions: [],
        shareTokens: [],
        allowPublicAccess: false,
        requiresAuthentication: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Create mock share tokens with various security configurations
   */
  static createMockShareTokens(): ShareToken[] {
    return [
      {
        token: `secure-token-${randomBytes(16).toString('hex')}.${randomBytes(16).toString('hex')}`,
        permissions: 'read',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        usageCount: 0,
        usageLimit: 5,
        passwordProtected: false,
        createdBy: 'user_director_123',
        createdAt: new Date(),
        ipRestrictions: ['192.168.1.0/24']
      },
      {
        token: `password-protected-${randomBytes(16).toString('hex')}.${randomBytes(16).toString('hex')}`,
        permissions: 'download',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        usageCount: 2,
        usageLimit: 3,
        passwordProtected: true,
        createdBy: 'user_family_456',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        token: `expired-token-${randomBytes(16).toString('hex')}.${randomBytes(16).toString('hex')}`,
        permissions: 'read',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired
        usageCount: 1,
        usageLimit: 1,
        passwordProtected: false,
        createdBy: 'user_director_123',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  private static createLegalRetentionPolicy(): RetentionPolicy {
    return {
      id: 'policy_legal_7_years',
      name: 'Legal Documents - 7 Years',
      description: 'Standard retention policy for legal documents (7 years)',
      retentionPeriod: 2555, // 7 years in days
      deleteAfterExpiration: false, // Legal documents may need manual review
      moveToArchive: true,
      notificationBeforeExpiration: 90, // 3 months notice
      legalHold: true,
      gdprCompliant: true,
      categories: ['cat_legal_documents']
    };
  }

  private static createMedicalRetentionPolicy(): RetentionPolicy {
    return {
      id: 'policy_medical_10_years',
      name: 'Medical Documents - 10 Years',
      description: 'Extended retention policy for medical documents (10 years)',
      retentionPeriod: 3650, // 10 years in days
      deleteAfterExpiration: false,
      moveToArchive: true,
      notificationBeforeExpiration: 180, // 6 months notice
      legalHold: true,
      gdprCompliant: true,
      categories: ['cat_medical_documents']
    };
  }

  private static createFinancialRetentionPolicy(): RetentionPolicy {
    return {
      id: 'policy_financial_7_years',
      name: 'Financial Documents - 7 Years',
      description: 'Standard retention policy for financial documents (7 years)',
      retentionPeriod: 2555, // 7 years in days
      deleteAfterExpiration: false,
      moveToArchive: true,
      notificationBeforeExpiration: 60, // 2 months notice
      legalHold: false,
      gdprCompliant: true,
      categories: ['cat_insurance_documents', 'cat_financial_documents']
    };
  }

  private static createMemorialRetentionPolicy(): RetentionPolicy {
    return {
      id: 'policy_memorial_indefinite',
      name: 'Memorial Content - Indefinite',
      description: 'Indefinite retention for memorial content with family consent',
      retentionPeriod: 36500, // 100 years (effectively indefinite)
      deleteAfterExpiration: false,
      moveToArchive: false,
      notificationBeforeExpiration: 365, // 1 year notice
      legalHold: false,
      gdprCompliant: true,
      categories: ['cat_memorial_media']
    };
  }

  /**
   * Create a batch of realistic test documents
   */
  static createDocumentBatch(count: number = 10): SecureDocument[] {
    const documents: SecureDocument[] = [];
    
    for (let i = 0; i < count; i++) {
      const docType = i % 4;
      
      switch (docType) {
        case 0:
          documents.push(this.createFuneralDocument());
          break;
        case 1:
          documents.push(this.createMedicalCertificate());
          break;
        case 2:
          documents.push(this.createInsuranceDocument());
          break;
        case 3:
          documents.push(this.createMemorialPhoto());
          break;
      }
    }
    
    return documents;
  }

  /**
   * Create documents with specific GDPR scenarios
   */
  static createGDPRTestDocuments(): {
    documents: SecureDocument[];
    scenarios: Array<{
      name: string;
      documents: string[];
      testPurpose: string;
    }>;
  } {
    const documents = [
      this.createFuneralDocument({
        metadata: {
          ...this.createFuneralDocument().metadata,
          subjectIds: ['subject_gdpr_test_1'],
          purpose: 'GDPR consent withdrawal test'
        }
      }),
      this.createMedicalCertificate({
        metadata: {
          ...this.createMedicalCertificate().metadata,
          subjectIds: ['subject_gdpr_test_1'],
          purpose: 'GDPR data portability test'
        }
      }),
      this.createInsuranceDocument({
        metadata: {
          ...this.createInsuranceDocument().metadata,
          subjectIds: ['subject_gdpr_test_2'],
          purpose: 'GDPR right to erasure test'
        }
      })
    ];

    const scenarios = [
      {
        name: 'Data Subject Rights - Full Export',
        documents: [documents[0].id, documents[1].id],
        testPurpose: 'Test complete data export for subject_gdpr_test_1'
      },
      {
        name: 'Right to be Forgotten',
        documents: [documents[2].id],
        testPurpose: 'Test data deletion for subject_gdpr_test_2'
      },
      {
        name: 'Data Portability',
        documents: [documents[1].id],
        testPurpose: 'Test structured data export in machine-readable format'
      }
    ];

    return { documents, scenarios };
  }
}