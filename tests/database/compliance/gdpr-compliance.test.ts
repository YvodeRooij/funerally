import { describe, it, expect, beforeEach } from 'vitest';
import { executeQuery, getTestClient } from '../setup/setup';
import { createFullTestScenario } from '../fixtures/dutch-funeral-mock-data';

describe('GDPR Compliance Tests', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await createFullTestScenario();
  });

  describe('Data Retention Policies', () => {
    it('should automatically set retention dates for GDPR-subject data', async () => {
      const result = await executeQuery(`
        SELECT 
          table_name,
          column_name,
          column_default
        FROM information_schema.columns
        WHERE column_name LIKE '%retention%'
        AND table_schema = 'public'
        ORDER BY table_name
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      
      // Check specific retention defaults
      const retentionColumns = result.rows.filter(row => 
        row.column_name === 'data_retention_until' || 
        row.column_name === 'retention_until'
      );

      retentionColumns.forEach(column => {
        expect(column.column_default).toContain('INTERVAL');
      });
    });

    it('should respect different retention periods for different data types', async () => {
      // Family data (living persons) - 7 years tax requirement
      const familyRetention = await executeQuery(`
        SELECT data_retention_until
        FROM funeral_requests
        WHERE primary_contact_id = $1
      `, [testData.userIds.family[0]]);

      expect(familyRetention.rows.length).toBeGreaterThan(0);
      
      // Audit logs - 10 years
      const auditRetention = await executeQuery(`
        SELECT retention_until
        FROM audit_log
        WHERE user_id = $1
        LIMIT 1
      `, [testData.userIds.family[0]]);

      if (auditRetention.rows.length > 0) {
        const auditDate = new Date(auditRetention.rows[0].retention_until);
        const familyDate = new Date(familyRetention.rows[0].data_retention_until);
        
        // Audit retention should be longer than family data retention
        expect(auditDate.getTime()).toBeGreaterThan(familyDate.getTime());
      }
    });

    it('should identify data approaching retention deadline', async () => {
      const client = await getTestClient();
      
      try {
        // Create data with retention deadline in 30 days
        const nearRetentionDate = new Date();
        nearRetentionDate.setDate(nearRetentionDate.getDate() + 25);

        await client.query(`
          UPDATE funeral_requests 
          SET data_retention_until = $1
          WHERE id = $2
        `, [nearRetentionDate, testData.funeralRequestIds[0]]);

        // Query for data approaching retention
        const approachingRetention = await client.query(`
          SELECT id, data_retention_until
          FROM funeral_requests
          WHERE data_retention_until <= CURRENT_DATE + INTERVAL '30 days'
          AND data_retention_until > CURRENT_DATE
        `);

        expect(approachingRetention.rows.length).toBeGreaterThan(0);
        
        // All returned records should be within 30 days
        approachingRetention.rows.forEach(row => {
          const retentionDate = new Date(row.data_retention_until);
          const now = new Date();
          const daysDiff = Math.ceil((retentionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          expect(daysDiff).toBeLessThanOrEqual(30);
          expect(daysDiff).toBeGreaterThan(0);
        });
      } finally {
        client.release();
      }
    });

    it('should handle deceased persons data retention (not subject to GDPR)', async () => {
      // Deceased persons data is NOT subject to GDPR in Dutch law
      const deceasedData = await executeQuery(`
        SELECT id, retention_until
        FROM deceased_persons
        WHERE retention_until IS NOT NULL
      `);

      // Deceased persons may have longer retention for business needs
      if (deceasedData.rows.length > 0) {
        deceasedData.rows.forEach(row => {
          const retentionDate = new Date(row.retention_until);
          const now = new Date();
          
          // Should have a retention date set
          expect(retentionDate instanceof Date).toBe(true);
          expect(retentionDate.getTime()).toBeGreaterThan(now.getTime());
        });
      }
    });
  });

  describe('Consent Tracking', () => {
    it('should track user consent with proper evidence', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        
        // Record consent
        await client.query(`
          INSERT INTO consent_tracking (
            user_id, consent_type, processing_purpose, data_categories,
            consent_given, consent_method, lawful_basis, consent_given_at,
            consent_evidence, ip_address, user_agent
          ) VALUES (
            $1, 'data_processing', 'Funeral service coordination', 
            ARRAY['personal_details', 'contact_information'], true, 'web_form',
            'consent', NOW(), 'Checkbox checked on registration form',
            '192.168.1.100', 'Mozilla/5.0 Test Browser'
          )
        `, [userId]);

        // Verify consent record
        const consentRecord = await client.query(`
          SELECT 
            user_id, consent_type, consent_given, is_active,
            consent_evidence, lawful_basis
          FROM consent_tracking
          WHERE user_id = $1 AND consent_type = 'data_processing'
        `, [userId]);

        expect(consentRecord.rows.length).toBe(1);
        expect(consentRecord.rows[0].consent_given).toBe(true);
        expect(consentRecord.rows[0].is_active).toBe(true);
        expect(consentRecord.rows[0].consent_evidence).toContain('Checkbox checked');
        expect(consentRecord.rows[0].lawful_basis).toBe('consent');
      } finally {
        client.release();
      }
    });

    it('should handle consent withdrawal properly', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        
        // First give consent
        await client.query(`
          INSERT INTO consent_tracking (
            user_id, consent_type, processing_purpose, data_categories,
            consent_given, consent_method, lawful_basis, consent_given_at
          ) VALUES (
            $1, 'marketing', 'Marketing communications', ARRAY['email', 'preferences'],
            true, 'web_form', 'consent', NOW() - INTERVAL '1 day'
          )
        `, [userId]);

        // Withdraw consent
        await client.query(`
          UPDATE consent_tracking 
          SET 
            consent_given = false,
            consent_withdrawn_at = NOW(),
            withdrawal_method = 'email_request',
            withdrawal_reason = 'No longer interested in marketing'
          WHERE user_id = $1 AND consent_type = 'marketing'
        `, [userId]);

        // Verify consent withdrawal
        const withdrawnConsent = await client.query(`
          SELECT 
            consent_given, is_active, consent_withdrawn_at, withdrawal_reason
          FROM consent_tracking
          WHERE user_id = $1 AND consent_type = 'marketing'
        `, [userId]);

        expect(withdrawnConsent.rows.length).toBe(1);
        expect(withdrawnConsent.rows[0].consent_given).toBe(false);
        expect(withdrawnConsent.rows[0].is_active).toBe(false);
        expect(withdrawnConsent.rows[0].withdrawal_reason).toContain('No longer interested');
      } finally {
        client.release();
      }
    });

    it('should handle consent expiration', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        
        // Create consent that expires in the past
        await client.query(`
          INSERT INTO consent_tracking (
            user_id, consent_type, processing_purpose, data_categories,
            consent_given, consent_method, lawful_basis, consent_given_at,
            consent_expires_at
          ) VALUES (
            $1, 'temporary_processing', 'Temporary data processing', ARRAY['contact_info'],
            true, 'web_form', 'consent', NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '1 day'
          )
        `, [userId]);

        // Check that expired consent is marked as inactive
        const expiredConsent = await client.query(`
          SELECT consent_given, is_active, consent_expires_at
          FROM consent_tracking
          WHERE user_id = $1 AND consent_type = 'temporary_processing'
        `, [userId]);

        expect(expiredConsent.rows.length).toBe(1);
        expect(expiredConsent.rows[0].consent_given).toBe(true); // Still given, but...
        expect(expiredConsent.rows[0].is_active).toBe(false); // ...not active due to expiration
      } finally {
        client.release();
      }
    });
  });

  describe('Data Subject Rights', () => {
    it('should log data access requests properly', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        
        // Create GDPR data access request
        await client.query(`
          INSERT INTO gdpr_compliance_log (
            data_subject_id, data_subject_email, data_subject_type,
            activity_type, request_description, request_source, lawful_basis,
            response_deadline, response_status
          ) VALUES (
            $1, 'user@example.com', 'family_member',
            'data_access_request', 'User requested copy of all personal data',
            'web_form', 'legal_obligation', CURRENT_DATE + INTERVAL '30 days',
            'received'
          )
        `, [userId]);

        // Verify GDPR request was logged
        const gdprRequest = await client.query(`
          SELECT 
            data_subject_id, activity_type, response_deadline, response_status
          FROM gdpr_compliance_log
          WHERE data_subject_id = $1 AND activity_type = 'data_access_request'
        `, [userId]);

        expect(gdprRequest.rows.length).toBe(1);
        expect(gdprRequest.rows[0].response_status).toBe('received');
        
        // Response deadline should be within 30 days
        const deadline = new Date(gdprRequest.rows[0].response_deadline);
        const now = new Date();
        const daysDiff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        expect(daysDiff).toBeLessThanOrEqual(30);
      } finally {
        client.release();
      }
    });

    it('should handle data erasure requests', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        
        // Create data erasure request
        await client.query(`
          INSERT INTO gdpr_compliance_log (
            data_subject_id, data_subject_email, data_subject_type,
            activity_type, request_description, lawful_basis,
            response_deadline, data_deleted, actions_taken
          ) VALUES (
            $1, 'user@example.com', 'family_member',
            'data_erasure_request', 'User requested deletion of personal data',
            'legal_obligation', CURRENT_DATE + INTERVAL '30 days',
            true, 'Personal data anonymized, funeral service data retained for legal compliance'
          )
        `, [userId]);

        // Verify erasure request
        const erasureRequest = await client.query(`
          SELECT data_deleted, actions_taken
          FROM gdpr_compliance_log
          WHERE data_subject_id = $1 AND activity_type = 'data_erasure_request'
        `, [userId]);

        expect(erasureRequest.rows.length).toBe(1);
        expect(erasureRequest.rows[0].data_deleted).toBe(true);
        expect(erasureRequest.rows[0].actions_taken).toContain('anonymized');
      } finally {
        client.release();
      }
    });

    it('should handle data portability requests', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        
        // Create data portability request
        await client.query(`
          INSERT INTO gdpr_compliance_log (
            data_subject_id, data_subject_email, data_subject_type,
            activity_type, request_description, lawful_basis,
            response_deadline, data_exported, actions_taken
          ) VALUES (
            $1, 'user@example.com', 'family_member',
            'data_portability_request', 'User requested data export in machine-readable format',
            'legal_obligation', CURRENT_DATE + INTERVAL '30 days',
            true, 'Data exported in JSON format and delivered via secure download link'
          )
        `, [userId]);

        // Verify portability request
        const portabilityRequest = await client.query(`
          SELECT data_exported, actions_taken
          FROM gdpr_compliance_log
          WHERE data_subject_id = $1 AND activity_type = 'data_portability_request'
        `, [userId]);

        expect(portabilityRequest.rows.length).toBe(1);
        expect(portabilityRequest.rows[0].data_exported).toBe(true);
        expect(portabilityRequest.rows[0].actions_taken).toContain('JSON format');
      } finally {
        client.release();
      }
    });
  });

  describe('Data Breach Notification', () => {
    it('should log data breaches with proper timeline tracking', async () => {
      const client = await getTestClient();
      
      try {
        const discoveryTime = new Date();
        const notificationDeadline = new Date(discoveryTime.getTime() + 72 * 60 * 60 * 1000); // 72 hours
        
        // Create data breach log
        await client.query(`
          INSERT INTO data_breach_log (
            breach_reference, breach_type, discovered_at, discovery_method,
            description, severity_level, data_subjects_affected, data_categories_affected,
            systems_affected, immediate_actions_taken, requires_authority_notification,
            authority_notification_deadline, requires_data_subject_notification
          ) VALUES (
            'BREACH-2024-001', 'unauthorized_access', $1, 'security_audit',
            'Unauthorized access to user profiles database', 'medium', 150,
            ARRAY['personal_details', 'contact_information'], ARRAY['user_profiles_db'],
            'Access revoked, passwords reset, systems patched', true, $2, true
          )
        `, [discoveryTime, notificationDeadline]);

        // Verify breach was logged correctly
        const breachLog = await client.query(`
          SELECT 
            breach_reference, severity_level, data_subjects_affected,
            requires_authority_notification, authority_notification_deadline
          FROM data_breach_log
          WHERE breach_reference = 'BREACH-2024-001'
        `);

        expect(breachLog.rows.length).toBe(1);
        expect(breachLog.rows[0].severity_level).toBe('medium');
        expect(breachLog.rows[0].data_subjects_affected).toBe(150);
        expect(breachLog.rows[0].requires_authority_notification).toBe(true);
        
        // Deadline should be within 72 hours of discovery
        const deadline = new Date(breachLog.rows[0].authority_notification_deadline);
        const timeDiff = deadline.getTime() - discoveryTime.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        expect(hoursDiff).toBeLessThanOrEqual(72);
      } finally {
        client.release();
      }
    });

    it('should track breach notification status', async () => {
      const client = await getTestClient();
      
      try {
        // Insert initial breach
        await client.query(`
          INSERT INTO data_breach_log (
            breach_reference, breach_type, discovered_at, description,
            severity_level, data_categories_affected, systems_affected,
            immediate_actions_taken, requires_authority_notification
          ) VALUES (
            'BREACH-2024-002', 'data_loss', NOW(), 'Backup tape lost in transit',
            'high', ARRAY['financial_data'], ARRAY['backup_system'],
            'Transport company notified, police report filed', true
          )
        `);

        // Update with authority notification
        await client.query(`
          UPDATE data_breach_log 
          SET 
            authority_notified_at = NOW(),
            management_notified_at = NOW() - INTERVAL '30 minutes'
          WHERE breach_reference = 'BREACH-2024-002'
        `);

        // Verify notification tracking
        const notificationStatus = await client.query(`
          SELECT 
            authority_notified_at, management_notified_at, 
            requires_authority_notification
          FROM data_breach_log
          WHERE breach_reference = 'BREACH-2024-002'
        `);

        expect(notificationStatus.rows.length).toBe(1);
        expect(notificationStatus.rows[0].authority_notified_at).not.toBeNull();
        expect(notificationStatus.rows[0].management_notified_at).not.toBeNull();
      } finally {
        client.release();
      }
    });

    it('should identify breaches requiring immediate notification', async () => {
      const client = await getTestClient();
      
      try {
        // Create breach requiring urgent notification
        const discoveryTime = new Date();
        const urgentDeadline = new Date(discoveryTime.getTime() + 3 * 60 * 60 * 1000); // 3 hours
        
        await client.query(`
          INSERT INTO data_breach_log (
            breach_reference, breach_type, discovered_at, description,
            severity_level, data_subjects_affected, data_categories_affected,
            systems_affected, immediate_actions_taken, requires_authority_notification,
            authority_notification_deadline
          ) VALUES (
            'BREACH-2024-URGENT', 'system_compromise', $1, 'Complete system compromise',
            'critical', 1000, ARRAY['personal_details', 'financial_data', 'health_data'],
            ARRAY['all_systems'], 'Systems taken offline immediately', true, $2
          )
        `, [discoveryTime, urgentDeadline]);

        // Query for urgent breaches
        const urgentBreaches = await client.query(`
          SELECT breach_reference, severity_level, authority_notification_deadline
          FROM data_breach_log
          WHERE severity_level = 'critical'
          AND requires_authority_notification = true
          AND authority_notified_at IS NULL
          AND authority_notification_deadline <= NOW() + INTERVAL '6 hours'
        `);

        expect(urgentBreaches.rows.length).toBeGreaterThan(0);
        urgentBreaches.rows.forEach(row => {
          expect(row.severity_level).toBe('critical');
        });
      } finally {
        client.release();
      }
    });
  });

  describe('Data Processing Activities (ROPA)', () => {
    it('should maintain Record of Processing Activities as required by GDPR Article 30', async () => {
      const client = await getTestClient();
      
      try {
        // Create ROPA entry
        await client.query(`
          INSERT INTO data_processing_activities (
            activity_name, activity_description, activity_category,
            data_subject_categories, data_categories, processing_purposes,
            lawful_basis, data_sources, retention_period, deletion_criteria,
            technical_measures, organizational_measures, dpia_required,
            last_reviewed_date, next_review_date
          ) VALUES (
            'Funeral Service Coordination', 
            'Processing personal data to coordinate funeral services',
            'Service Delivery',
            ARRAY['family_members', 'deceased_relatives'],
            ARRAY['personal_details', 'contact_information', 'financial_data'],
            ARRAY['service_coordination', 'legal_compliance'],
            ARRAY['contract', 'legal_obligation'],
            ARRAY['user_registration', 'service_forms'],
            INTERVAL '7 years',
            'Data deleted after retention period unless legal hold applies',
            ARRAY['encryption', 'access_controls', 'audit_logging'],
            ARRAY['staff_training', 'data_governance_policies'],
            true, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year'
          )
        `);

        // Verify ROPA entry
        const ropaEntry = await client.query(`
          SELECT 
            activity_name, data_subject_categories, lawful_basis,
            retention_period, dpia_required, next_review_date
          FROM data_processing_activities
          WHERE activity_name = 'Funeral Service Coordination'
        `);

        expect(ropaEntry.rows.length).toBe(1);
        expect(ropaEntry.rows[0].dpia_required).toBe(true);
        expect(ropaEntry.rows[0].lawful_basis).toContain('contract');
        expect(ropaEntry.rows[0].data_subject_categories).toContain('family_members');
      } finally {
        client.release();
      }
    });

    it('should track DPIA requirements and completion', async () => {
      const client = await getTestClient();
      
      try {
        // Create activity requiring DPIA
        await client.query(`
          INSERT INTO data_processing_activities (
            activity_name, activity_description, activity_category,
            data_subject_categories, data_categories, processing_purposes,
            lawful_basis, retention_period, deletion_criteria,
            technical_measures, organizational_measures, dpia_required,
            dpia_completed, dpia_date, dpia_outcome
          ) VALUES (
            'Advanced Analytics Processing',
            'ML-based analytics on user behavior for service improvement',
            'Analytics',
            ARRAY['all_users'], ARRAY['behavioral_data', 'usage_patterns'],
            ARRAY['service_improvement', 'business_intelligence'],
            ARRAY['legitimate_interests'], INTERVAL '2 years',
            'Anonymized after analysis completion',
            ARRAY['pseudonymization', 'encryption'], ARRAY['ethics_review'],
            true, true, CURRENT_DATE - INTERVAL '30 days',
            'DPIA completed - low risk with appropriate safeguards'
          )
        `);

        // Query DPIA status
        const dpiaStatus = await client.query(`
          SELECT 
            activity_name, dpia_required, dpia_completed, dpia_outcome
          FROM data_processing_activities
          WHERE dpia_required = true
        `);

        expect(dpiaStatus.rows.length).toBeGreaterThan(0);
        
        const completedDpia = dpiaStatus.rows.find(row => 
          row.activity_name === 'Advanced Analytics Processing'
        );
        expect(completedDpia.dpia_completed).toBe(true);
        expect(completedDpia.dpia_outcome).toContain('low risk');
      } finally {
        client.release();
      }
    });
  });

  describe('Legal Hold and Compliance', () => {
    it('should prevent deletion of data under legal hold', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        
        // Insert document with legal hold
        await client.query(`
          INSERT INTO document_vault (
            owner_id, category_id, original_filename, file_size_bytes,
            mime_type, encrypted_content, client_encrypted_key, encryption_iv,
            content_hash, retention_until, legal_hold, legal_hold_reason
          ) VALUES (
            $1, (SELECT id FROM document_categories LIMIT 1), 'legal_document.pdf', 2048,
            'application/pdf', 'encrypted_content'::bytea, 'key', 'iv'::bytea,
            'hash', CURRENT_DATE - INTERVAL '1 day', true, 
            'Subject to ongoing legal proceedings - Case #12345'
          )
        `, [userId]);

        // Attempt to delete document under legal hold should fail
        const deleteAttempt = await client.query(`
          DELETE FROM document_vault 
          WHERE owner_id = $1 AND legal_hold = true
          RETURNING id
        `, [userId]);

        // Should not delete any records under legal hold
        expect(deleteAttempt.rows.length).toBe(0);

        // Verify document still exists
        const documentCheck = await client.query(`
          SELECT id, legal_hold, legal_hold_reason
          FROM document_vault
          WHERE owner_id = $1 AND legal_hold = true
        `, [userId]);

        expect(documentCheck.rows.length).toBe(1);
        expect(documentCheck.rows[0].legal_hold_reason).toContain('Case #12345');
      } finally {
        client.release();
      }
    });

    it('should track regulatory compliance events', async () => {
      const client = await getTestClient();
      
      try {
        // Record compliance event
        await client.query(`
          INSERT INTO regulatory_compliance_events (
            regulation, compliance_requirement, event_type,
            affected_users, affected_systems, compliance_status,
            evidence_location, compliance_notes, due_date
          ) VALUES (
            'GDPR', 'Annual data retention review', 'data_retention_review',
            500, ARRAY['user_profiles', 'document_vault'], 'compliant',
            '/compliance/reports/2024/retention_review.pdf',
            'All data retention policies reviewed and updated', 
            CURRENT_DATE + INTERVAL '365 days'
          )
        `);

        // Verify compliance tracking
        const complianceEvent = await client.query(`
          SELECT 
            regulation, compliance_requirement, compliance_status, due_date
          FROM regulatory_compliance_events
          WHERE regulation = 'GDPR' AND event_type = 'data_retention_review'
        `);

        expect(complianceEvent.rows.length).toBe(1);
        expect(complianceEvent.rows[0].compliance_status).toBe('compliant');
        expect(complianceEvent.rows[0].affected_users).toBe(500);
      } finally {
        client.release();
      }
    });
  });

  describe('Audit Trail Integrity', () => {
    it('should maintain immutable audit logs', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        
        // Insert audit log entry
        await client.query(`
          INSERT INTO audit_log (
            event_type, event_category, user_id, action, target_type, target_id,
            ip_address, success, gdpr_lawful_basis, processing_purpose
          ) VALUES (
            'gdpr_test', 'data_access', $1, 'SELECT', 'user_profiles', $1,
            '192.168.1.100', true, 'consent', 'User profile access'
          )
        `, [userId]);

        // Get the audit entry
        const originalAudit = await client.query(`
          SELECT id, event_type, occurred_at, gdpr_lawful_basis
          FROM audit_log
          WHERE event_type = 'gdpr_test' AND user_id = $1
        `, [userId]);

        expect(originalAudit.rows.length).toBe(1);
        const auditId = originalAudit.rows[0].id;
        const originalTimestamp = originalAudit.rows[0].occurred_at;

        // Attempt to modify audit log (should be prevented by business logic)
        await expect(
          client.query(`
            UPDATE audit_log 
            SET event_type = 'modified', occurred_at = NOW()
            WHERE id = $1
          `, [auditId])
        ).rejects.toThrow();

        // Verify audit log was not modified
        const unchangedAudit = await client.query(`
          SELECT event_type, occurred_at
          FROM audit_log
          WHERE id = $1
        `, [auditId]);

        expect(unchangedAudit.rows[0].event_type).toBe('gdpr_test');
        expect(unchangedAudit.rows[0].occurred_at).toEqual(originalTimestamp);
      } finally {
        client.release();
      }
    });

    it('should log all GDPR-relevant activities', async () => {
      const userId = testData.userIds.family[0];
      
      // Perform various operations that should be audited
      await executeQuery(`
        SELECT id, email FROM user_profiles WHERE id = $1
      `, [userId]);

      // Check that GDPR-relevant activities are logged
      const gdprAuditLogs = await executeQuery(`
        SELECT 
          event_type, event_category, action, gdpr_lawful_basis, processing_purpose
        FROM audit_log
        WHERE user_id = $1
        AND gdpr_lawful_basis IS NOT NULL
        ORDER BY occurred_at DESC
      `, [userId]);

      // Should have audit entries for GDPR-relevant activities
      expect(gdprAuditLogs.rows.length).toBeGreaterThan(0);
      
      gdprAuditLogs.rows.forEach(row => {
        expect(row.gdpr_lawful_basis).toBeDefined();
        expect(['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'])
          .toContain(row.gdpr_lawful_basis);
      });
    });
  });
});