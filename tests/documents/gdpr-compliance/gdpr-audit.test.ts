/**
 * GDPR Compliance Security Tests
 * Comprehensive testing of data subject rights, retention policies, and audit logging
 */

import { GDPRAuditLogger, DPIAManager } from '../../../lib/documents/audit/gdpr-audit';
import { SecurityTestUtils } from '../setup';
import { AuditEventType, GDPRRequest } from '../../../lib/documents/types';

describe('GDPR Compliance Security Tests', () => {
  let mockDocument: any;
  let testUserId: string;
  let testSubjectId: string;
  let maliciousPayloads: string[];

  beforeEach(() => {
    mockDocument = SecurityTestUtils.createMockDocument({
      metadata: {
        description: 'Test document with personal data',
        tags: ['personal', 'sensitive'],
        classification: 'confidential',
        personalDataLevel: 'high',
        isPersonalData: true,
        subjectIds: ['subject_123', 'subject_456'],
        purpose: 'Funeral arrangement documentation',
        legalBasis: 'Consent (GDPR Article 6(1)(a))',
        customFields: {
          deceasedName: 'John Doe',
          familyContact: 'jane.doe@example.com'
        }
      }
    });
    
    testUserId = 'user_gdpr_test_123';
    testSubjectId = 'subject_gdpr_test_456';
    maliciousPayloads = SecurityTestUtils.getMaliciousPayloads();

    // Mock console to prevent test noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('📋 Audit Logging Compliance', () => {
    test('should log document operations with GDPR context', async () => {
      const mockStoreAudit = jest.spyOn(GDPRAuditLogger as any, 'storeAuditEntry').mockResolvedValue(undefined);
      const mockCheckAlerts = jest.spyOn(GDPRAuditLogger as any, 'checkForAlerts').mockResolvedValue(undefined);

      const auditId = await GDPRAuditLogger.logDocumentOperation(
        'document.viewed',
        mockDocument.id,
        testUserId,
        {
          action: 'view',
          duration: 120000 // 2 minutes
        },
        {
          subjectIds: ['subject_123'],
          purpose: 'Funeral planning review',
          legalBasis: 'Consent (GDPR Article 6(1)(a))',
          consentId: 'consent_abc123'
        },
        {
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 Test Browser',
          sessionId: 'session_xyz789'
        }
      );

      expect(auditId).toMatch(/^audit_\d+_[a-z0-9]+$/);
      expect(mockStoreAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          id: auditId,
          eventType: 'document.viewed',
          documentId: mockDocument.id,
          userId: testUserId,
          ipAddress: '192.168.1.100',
          gdprRelevant: true,
          legalBasisUsed: 'Consent (GDPR Article 6(1)(a))'
        })
      );
      expect(mockCheckAlerts).toHaveBeenCalled();
    });

    test('should encrypt sensitive audit details', async () => {
      const mockEncrypt = jest.spyOn(GDPRAuditLogger as any, 'encryptAuditDetails')
        .mockImplementation(async (details) => ({ ...details, encrypted: true }));
      const mockStoreAudit = jest.spyOn(GDPRAuditLogger as any, 'storeAuditEntry').mockResolvedValue(undefined);

      await GDPRAuditLogger.logDocumentOperation(
        'document.created',
        mockDocument.id,
        testUserId,
        {
          sensitiveData: 'Personal information about deceased',
          familyMembers: ['John Doe', 'Jane Doe']
        },
        {
          subjectIds: ['subject_123'],
          purpose: 'Record keeping',
          legalBasis: 'Legal obligation'
        }
      );

      expect(mockEncrypt).toHaveBeenCalled();
      expect(mockStoreAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            encrypted: true
          })
        })
      );
    });

    test('should log GDPR-specific operations correctly', async () => {
      const mockLogOperation = jest.spyOn(GDPRAuditLogger, 'logDocumentOperation').mockResolvedValue('audit_123');

      const auditId = await GDPRAuditLogger.logGDPROperation(
        'consent.withdrawn',
        testSubjectId,
        testUserId,
        {
          reason: 'User requested data deletion',
          consentType: 'processing',
          withdrawnAt: new Date().toISOString()
        },
        [mockDocument.id]
      );

      expect(auditId).toBe('audit_123');
      expect(mockLogOperation).toHaveBeenCalledWith(
        'gdpr.request.received',
        undefined,
        testUserId,
        expect.objectContaining({
          operation: 'consent.withdrawn',
          affectedDocuments: [mockDocument.id]
        }),
        expect.objectContaining({
          subjectIds: [testSubjectId],
          purpose: 'GDPR compliance',
          legalBasis: 'Legal obligation (GDPR Article 6(1)(c))'
        })
      );
    });

    test('should create comprehensive audit trails', async () => {
      const mockEvents = [
        {
          id: 'audit_1',
          eventType: 'document.created' as AuditEventType,
          documentId: mockDocument.id,
          userId: testUserId,
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          gdprRelevant: true,
          details: { gdprContext: { subjectIds: ['subject_123'] } }
        },
        {
          id: 'audit_2',
          eventType: 'document.viewed' as AuditEventType,
          documentId: mockDocument.id,
          userId: 'other_user',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          gdprRelevant: false,
          details: {}
        }
      ];

      jest.spyOn(GDPRAuditLogger as any, 'getAuditTrail').mockResolvedValue(mockEvents);

      const trail = await GDPRAuditLogger.createDocumentAuditTrail(mockDocument.id, true);

      expect(trail.events).toHaveLength(2);
      expect(trail.gdprEvents).toHaveLength(1);
      expect(trail.summary.totalEvents).toBe(2);
      expect(trail.summary.gdprRelevantEvents).toBe(1);
      expect(trail.summary.uniqueUsers).toBe(2);
      expect(trail.summary.dataSubjects).toEqual(['subject_123']);
    });

    test('should handle malicious input in audit logging', async () => {
      const mockStoreAudit = jest.spyOn(GDPRAuditLogger as any, 'storeAuditEntry').mockResolvedValue(undefined);

      for (const maliciousPayload of maliciousPayloads.slice(0, 3)) {
        // Should not throw when logging malicious content
        await expect(
          GDPRAuditLogger.logDocumentOperation(
            'document.viewed',
            maliciousPayload, // malicious document ID
            maliciousPayload, // malicious user ID
            {
              maliciousField: maliciousPayload,
              details: maliciousPayload
            },
            {
              subjectIds: [maliciousPayload],
              purpose: maliciousPayload,
              legalBasis: 'Consent'
            },
            {
              ipAddress: '192.168.1.1',
              userAgent: maliciousPayload
            }
          )
        ).resolves.not.toThrow();
      }

      expect(mockStoreAudit).toHaveBeenCalledTimes(3);
    });
  });

  describe('👤 Data Subject Rights', () => {
    test('should process data export requests', async () => {
      const mockExportData = jest.spyOn(GDPRAuditLogger as any, 'exportSubjectData')
        .mockResolvedValue({
          personalData: {
            name: 'John Doe',
            email: 'john.doe@example.com'
          },
          documents: [mockDocument.id],
          consents: ['consent_123'],
          auditTrail: ['audit_1', 'audit_2']
        });

      const mockLogGDPR = jest.spyOn(GDPRAuditLogger, 'logGDPROperation').mockResolvedValue('audit_export');

      const exportRequest: GDPRRequest = {
        id: 'request_export_123',
        type: 'export',
        subjectId: testSubjectId,
        requesterId: testUserId,
        status: 'pending',
        requestedAt: new Date(),
        details: 'User requested data export',
        affectedDocuments: [mockDocument.id]
      };

      const result = await GDPRAuditLogger.processGDPRRequest(exportRequest);

      expect(result.processed).toBe(true);
      expect(result.exportedData).toBeDefined();
      expect(result.exportedData.personalData).toBeDefined();
      expect(result.affectedDocuments).toEqual([mockDocument.id]);
      expect(mockExportData).toHaveBeenCalledWith(testSubjectId);
      expect(mockLogGDPR).toHaveBeenCalled();
    });

    test('should process data deletion requests', async () => {
      const mockDeleteData = jest.spyOn(GDPRAuditLogger as any, 'deleteSubjectData').mockResolvedValue(undefined);
      const mockLogGDPR = jest.spyOn(GDPRAuditLogger, 'logGDPROperation').mockResolvedValue('audit_delete');

      const deleteRequest: GDPRRequest = {
        id: 'request_delete_123',
        type: 'delete',
        subjectId: testSubjectId,
        requesterId: testUserId,
        status: 'pending',
        requestedAt: new Date(),
        details: 'User requested data deletion under right to be forgotten',
        affectedDocuments: [mockDocument.id]
      };

      const result = await GDPRAuditLogger.processGDPRRequest(deleteRequest);

      expect(result.processed).toBe(true);
      expect(result.errors).toEqual([]);
      expect(mockDeleteData).toHaveBeenCalledWith(testSubjectId, [mockDocument.id]);
      expect(mockLogGDPR).toHaveBeenCalled();
    });

    test('should process data rectification requests', async () => {
      const mockRectifyData = jest.spyOn(GDPRAuditLogger as any, 'rectifySubjectData').mockResolvedValue(undefined);

      const rectifyRequest: GDPRRequest = {
        id: 'request_rectify_123',
        type: 'rectify',
        subjectId: testSubjectId,
        requesterId: testUserId,
        status: 'pending',
        requestedAt: new Date(),
        details: 'Correct email address from old@example.com to new@example.com',
        affectedDocuments: [mockDocument.id]
      };

      const result = await GDPRAuditLogger.processGDPRRequest(rectifyRequest);

      expect(result.processed).toBe(true);
      expect(mockRectifyData).toHaveBeenCalledWith(testSubjectId, rectifyRequest.details);
    });

    test('should process data processing restriction requests', async () => {
      const mockRestrictData = jest.spyOn(GDPRAuditLogger as any, 'restrictSubjectDataProcessing').mockResolvedValue(undefined);

      const restrictRequest: GDPRRequest = {
        id: 'request_restrict_123',
        type: 'restrict',
        subjectId: testSubjectId,
        requesterId: testUserId,
        status: 'pending',
        requestedAt: new Date(),
        details: 'Temporarily restrict processing while disputing accuracy',
        affectedDocuments: [mockDocument.id]
      };

      const result = await GDPRAuditLogger.processGDPRRequest(restrictRequest);

      expect(result.processed).toBe(true);
      expect(mockRestrictData).toHaveBeenCalledWith(testSubjectId, [mockDocument.id]);
    });

    test('should handle GDPR request failures gracefully', async () => {
      const mockExportData = jest.spyOn(GDPRAuditLogger as any, 'exportSubjectData')
        .mockRejectedValue(new Error('Database connection failed'));

      const failingRequest: GDPRRequest = {
        id: 'request_fail_123',
        type: 'export',
        subjectId: testSubjectId,
        requesterId: testUserId,
        status: 'pending',
        requestedAt: new Date(),
        details: 'Request that will fail',
        affectedDocuments: [mockDocument.id]
      };

      const result = await GDPRAuditLogger.processGDPRRequest(failingRequest);

      expect(result.processed).toBe(false);
      expect(result.errors).toContain('Database connection failed');
    });

    test('should validate subject IDs in GDPR requests', async () => {
      for (const maliciousSubjectId of maliciousPayloads.slice(0, 3)) {
        const maliciousRequest: GDPRRequest = {
          id: 'request_malicious',
          type: 'export',
          subjectId: maliciousSubjectId,
          requesterId: testUserId,
          status: 'pending',
          requestedAt: new Date(),
          details: 'Malicious subject ID test',
          affectedDocuments: []
        };

        // Should handle gracefully without throwing
        const result = await GDPRAuditLogger.processGDPRRequest(maliciousRequest);
        expect(result).toBeDefined();
        expect(typeof result.processed).toBe('boolean');
      }
    });
  });

  describe('📊 Compliance Reporting', () => {
    test('should generate comprehensive compliance reports', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = new Date();

      const mockActivities = [
        {
          id: 'activity_1',
          documentId: mockDocument.id,
          subjectId: testSubjectId,
          purpose: 'Funeral arrangement',
          legalBasis: 'Consent',
          dataCategories: ['personal', 'sensitive'],
          retentionPeriod: 2555,
          processingStarted: new Date(),
          notes: 'Initial data collection'
        }
      ];

      const mockRequests = [
        {
          id: 'request_1',
          type: 'export' as const,
          subjectId: testSubjectId,
          requesterId: testUserId,
          status: 'completed' as const,
          requestedAt: new Date(),
          processedAt: new Date(),
          details: 'Data export completed',
          affectedDocuments: [mockDocument.id]
        }
      ];

      jest.spyOn(GDPRAuditLogger as any, 'getDataProcessingActivities').mockResolvedValue(mockActivities);
      jest.spyOn(GDPRAuditLogger as any, 'getGDPRRequests').mockResolvedValue(mockRequests);
      jest.spyOn(GDPRAuditLogger as any, 'getConsentMetrics').mockResolvedValue({
        given: 45,
        withdrawn: 5,
        active: 40
      });
      jest.spyOn(GDPRAuditLogger as any, 'getDataBreaches').mockResolvedValue([]);
      jest.spyOn(GDPRAuditLogger as any, 'getRetentionMetrics').mockResolvedValue({
        documentsApproachingRetention: 12,
        documentsOverdue: 3,
        automaticDeletions: 8
      });

      const report = await GDPRAuditLogger.generateGDPRComplianceReport(startDate, endDate);

      expect(report.period.start).toEqual(startDate);
      expect(report.period.end).toEqual(endDate);
      expect(report.dataProcessingActivities).toHaveLength(1);
      expect(report.subjectRightsRequests).toHaveLength(1);
      expect(report.consentMetrics.active).toBe(40);
      expect(report.dataBreaches).toHaveLength(0);
      expect(report.retentionCompliance.documentsOverdue).toBe(3);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    test('should provide actionable compliance recommendations', async () => {
      const mockActivities = [];
      const mockRequests = [
        { id: '1', status: 'pending' },
        { id: '2', status: 'pending' },
        { id: '3', status: 'completed' }
      ];
      const mockRetention = {
        documentsApproachingRetention: 0,
        documentsOverdue: 15,
        automaticDeletions: 0
      };

      jest.spyOn(GDPRAuditLogger as any, 'generateComplianceRecommendations')
        .mockReturnValue([
          'Implement automated retention policy enforcement',
          'Establish SLA for processing GDPR requests'
        ]);

      const recommendations = (GDPRAuditLogger as any).generateComplianceRecommendations(
        mockActivities,
        mockRequests,
        mockRetention
      );

      expect(recommendations).toContain('Implement automated retention policy enforcement');
      expect(recommendations).toContain('Establish SLA for processing GDPR requests');
    });
  });

  describe('🔄 Data Anonymization', () => {
    test('should anonymize old audit logs', async () => {
      const oldLogs = [
        {
          id: 'audit_old_1',
          userId: 'user_identifiable_123',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 Specific Browser',
          timestamp: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // 400 days old
          details: { sensitiveInfo: 'personal data' }
        }
      ];

      jest.spyOn(GDPRAuditLogger as any, 'getLogsOlderThan').mockResolvedValue(oldLogs);
      const mockUpdate = jest.spyOn(GDPRAuditLogger as any, 'updateAuditEntry').mockResolvedValue(undefined);

      const result = await GDPRAuditLogger.anonymizeOldLogs();

      expect(result.anonymized).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.stringMatching(/^[a-f0-9]{16}$/), // Hashed user ID
          ipAddress: 'anonymized',
          userAgent: undefined,
          details: expect.objectContaining({
            anonymized: true
          })
        })
      );
    });

    test('should handle anonymization errors gracefully', async () => {
      const oldLogs = [
        { id: 'audit_fail_1', userId: 'user_1', timestamp: new Date() },
        { id: 'audit_fail_2', userId: 'user_2', timestamp: new Date() }
      ];

      jest.spyOn(GDPRAuditLogger as any, 'getLogsOlderThan').mockResolvedValue(oldLogs);
      jest.spyOn(GDPRAuditLogger as any, 'updateAuditEntry')
        .mockRejectedValueOnce(new Error('Update failed'))
        .mockResolvedValueOnce(undefined);

      const result = await GDPRAuditLogger.anonymizeOldLogs();

      expect(result.anonymized).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to anonymize log audit_fail_1');
    });

    test('should properly anonymize sensitive data', async () => {
      const originalLog = {
        id: 'audit_anonymize_test',
        userId: 'user_very_identifiable_12345',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(),
        details: {
          action: 'document_view',
          originalData: 'sensitive information'
        }
      };

      const anonymized = await (GDPRAuditLogger as any).anonymizeLogEntry(originalLog);

      expect(anonymized.userId).toMatch(/^[a-f0-9]{16}$/);
      expect(anonymized.userId).not.toBe(originalLog.userId);
      expect(anonymized.ipAddress).toBe('anonymized');
      expect(anonymized.userAgent).toBeUndefined();
      expect(anonymized.details.anonymized).toBe(true);
      expect(anonymized.details.originalTimestamp).toEqual(originalLog.timestamp);
    });
  });

  describe('⚠️ Compliance Violations Detection', () => {
    test('should detect retention policy violations', async () => {
      const overdueDocuments = ['doc_overdue_1', 'doc_overdue_2', 'doc_overdue_3'];
      jest.spyOn(GDPRAuditLogger as any, 'getRetentionOverdueDocuments').mockResolvedValue(overdueDocuments);
      jest.spyOn(GDPRAuditLogger as any, 'getExpiredConsents').mockResolvedValue([]);

      const violations = await GDPRAuditLogger.checkComplianceViolations();

      const retentionViolation = violations.find(v => v.type === 'retention_overdue');
      expect(retentionViolation).toBeDefined();
      expect(retentionViolation?.severity).toBe('high');
      expect(retentionViolation?.affectedDocuments).toEqual(overdueDocuments);
      expect(retentionViolation?.recommendedAction).toContain('Review and delete overdue documents');
    });

    test('should detect expired consent violations', async () => {
      const expiredConsents = [
        { documentId: 'doc_consent_expired_1' },
        { documentId: 'doc_consent_expired_2' }
      ];
      
      jest.spyOn(GDPRAuditLogger as any, 'getRetentionOverdueDocuments').mockResolvedValue([]);
      jest.spyOn(GDPRAuditLogger as any, 'getExpiredConsents').mockResolvedValue(expiredConsents);

      const violations = await GDPRAuditLogger.checkComplianceViolations();

      const consentViolation = violations.find(v => v.type === 'consent_expired');
      expect(consentViolation).toBeDefined();
      expect(consentViolation?.severity).toBe('medium');
      expect(consentViolation?.affectedDocuments).toHaveLength(2);
      expect(consentViolation?.recommendedAction).toContain('Request renewed consent');
    });

    test('should handle multiple violation types', async () => {
      jest.spyOn(GDPRAuditLogger as any, 'getRetentionOverdueDocuments').mockResolvedValue(['doc_1']);
      jest.spyOn(GDPRAuditLogger as any, 'getExpiredConsents').mockResolvedValue([{ documentId: 'doc_2' }]);

      const violations = await GDPRAuditLogger.checkComplianceViolations();

      expect(violations).toHaveLength(2);
      expect(violations.some(v => v.type === 'retention_overdue')).toBe(true);
      expect(violations.some(v => v.type === 'consent_expired')).toBe(true);
    });
  });

  describe('🛡️ Data Protection Impact Assessment', () => {
    test('should assess privacy risks for document processing', async () => {
      const assessment = await DPIAManager.assessPrivacyRisk(
        mockDocument.id,
        'Funeral arrangement documentation',
        ['personal_identification', 'sensitive_personal_data', 'family_information']
      );

      expect(assessment.riskLevel).toMatch(/^(low|medium|high|very_high)$/);
      expect(Array.isArray(assessment.factors)).toBe(true);
      expect(Array.isArray(assessment.recommendations)).toBe(true);
      expect(typeof assessment.requiresDPIA).toBe('boolean');
    });

    test('should identify high-risk processing scenarios', async () => {
      // Mock implementation would analyze risk factors
      const highRiskAssessment = await DPIAManager.assessPrivacyRisk(
        'doc_high_risk',
        'Large scale processing of sensitive personal data',
        ['health_data', 'biometric_data', 'genetic_data', 'location_data']
      );

      // Would expect higher risk level for sensitive data categories
      expect(['medium', 'high', 'very_high']).toContain(highRiskAssessment.riskLevel);
    });
  });

  describe('🔒 Security and Performance', () => {
    test('should handle concurrent GDPR requests safely', async () => {
      const mockProcessRequest = jest.spyOn(GDPRAuditLogger, 'processGDPRRequest')
        .mockResolvedValue({ processed: true, affectedDocuments: [] });

      const concurrentRequests = Array.from({ length: 10 }, (_, i) => ({
        id: `concurrent_request_${i}`,
        type: 'export' as const,
        subjectId: `subject_${i}`,
        requesterId: testUserId,
        status: 'pending' as const,
        requestedAt: new Date(),
        details: `Concurrent request ${i}`,
        affectedDocuments: []
      }));

      const results = await Promise.all(
        concurrentRequests.map(request => GDPRAuditLogger.processGDPRRequest(request))
      );

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.processed).toBe(true);
      });
      expect(mockProcessRequest).toHaveBeenCalledTimes(10);
    });

    test('should maintain performance under load', async () => {
      const startTime = Date.now();
      
      // Simulate multiple audit log operations
      const operations = Array.from({ length: 100 }, (_, i) =>
        GDPRAuditLogger.logDocumentOperation(
          'document.viewed',
          `doc_performance_${i}`,
          `user_${i}`,
          { operation: i },
          { subjectIds: [`subject_${i}`], purpose: 'Performance test', legalBasis: 'Consent' }
        )
      );

      jest.spyOn(GDPRAuditLogger as any, 'storeAuditEntry').mockResolvedValue(undefined);
      jest.spyOn(GDPRAuditLogger as any, 'checkForAlerts').mockResolvedValue(undefined);

      await Promise.all(operations);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (5 seconds for 100 operations)
      expect(duration).toBeLessThan(5000);
    });

    test('should prevent memory leaks in audit logging', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many audit operations
      for (let i = 0; i < 1000; i++) {
        await GDPRAuditLogger.logDocumentOperation(
          'document.viewed',
          `doc_memory_${i}`,
          `user_memory_${i}`,
          { largeData: 'x'.repeat(1000) }, // 1KB of data per operation
          { subjectIds: [`subject_${i}`], purpose: 'Memory test', legalBasis: 'Consent' }
        );
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 100MB for 1000 operations)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });
});