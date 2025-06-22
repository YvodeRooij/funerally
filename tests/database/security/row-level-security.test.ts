import { describe, it, expect, beforeEach } from 'vitest';
import { executeQuery, getTestClient } from '../setup/setup';
import { createFullTestScenario } from '../fixtures/dutch-funeral-mock-data';

describe('Row Level Security (RLS) Tests', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await createFullTestScenario();
  });

  /**
   * Helper function to set JWT claims for testing RLS
   */
  async function setUserContext(client: any, userId: string, userType: string, email: string, isAdmin = false) {
    const claims = {
      user_id: userId,
      user_type: userType,
      email: email,
      is_admin: isAdmin
    };
    
    await client.query(`
      SELECT set_config('request.jwt.claims', $1, true)
    `, [JSON.stringify(claims)]);
  }

  describe('User Profile Access Control', () => {
    it('should allow users to view their own profile', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        await setUserContext(client, userId, 'family', 'test@example.com');

        const result = await client.query(`
          SELECT id, email, first_name, last_name
          FROM user_profiles
          WHERE id = $1
        `, [userId]);

        expect(result.rows.length).toBe(1);
        expect(result.rows[0].id).toBe(userId);
      } finally {
        client.release();
      }
    });

    it('should prevent users from viewing other users profiles', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        const otherUserId = testData.userIds.family[1];
        
        await setUserContext(client, userId, 'family', 'test@example.com');

        const result = await client.query(`
          SELECT id, email, first_name, last_name
          FROM user_profiles
          WHERE id = $1
        `, [otherUserId]);

        // Should not be able to see other user's profile
        expect(result.rows.length).toBe(0);
      } finally {
        client.release();
      }
    });

    it('should allow admins to view all user profiles', async () => {
      const client = await getTestClient();
      
      try {
        const adminUserId = testData.userIds.all[0];
        await setUserContext(client, adminUserId, 'admin', 'admin@example.com', true);

        const result = await client.query(`
          SELECT id, email, first_name, last_name
          FROM user_profiles
          ORDER BY created_at
        `);

        // Admin should see all users
        expect(result.rows.length).toBe(testData.userIds.all.length);
      } finally {
        client.release();
      }
    });

    it('should allow service providers to view assigned family profiles', async () => {
      const client = await getTestClient();
      
      try {
        const directorId = testData.userIds.directors[0];
        const familyId = testData.userIds.family[0];
        
        // Assign director to a funeral request
        await client.query(`
          UPDATE funeral_requests 
          SET assigned_director_id = $1 
          WHERE primary_contact_id = $2
        `, [directorId, familyId]);

        await setUserContext(client, directorId, 'director', 'director@example.com');

        const result = await client.query(`
          SELECT id, first_name, last_name, user_type
          FROM user_profiles
          WHERE id = $1
        `, [familyId]);

        // Director should be able to see assigned family profile
        expect(result.rows.length).toBe(1);
        expect(result.rows[0].user_type).toBe('family');
      } finally {
        client.release();
      }
    });
  });

  describe('Funeral Request Access Control', () => {
    it('should allow family members to view their own funeral requests', async () => {
      const client = await getTestClient();
      
      try {
        const familyId = testData.userIds.family[0];
        await setUserContext(client, familyId, 'family', 'family@example.com');

        const result = await client.query(`
          SELECT id, primary_contact_id, status
          FROM funeral_requests
          WHERE primary_contact_id = $1
        `, [familyId]);

        expect(result.rows.length).toBeGreaterThan(0);
        result.rows.forEach(row => {
          expect(row.primary_contact_id).toBe(familyId);
        });
      } finally {
        client.release();
      }
    });

    it('should prevent family members from viewing other family requests', async () => {
      const client = await getTestClient();
      
      try {
        const familyId = testData.userIds.family[0];
        const otherFamilyId = testData.userIds.family[1];
        
        await setUserContext(client, familyId, 'family', 'family@example.com');

        const result = await client.query(`
          SELECT id, primary_contact_id
          FROM funeral_requests
          WHERE primary_contact_id = $1
        `, [otherFamilyId]);

        // Should not see other family's requests
        expect(result.rows.length).toBe(0);
      } finally {
        client.release();
      }
    });

    it('should allow service providers to view assigned funeral requests', async () => {
      const client = await getTestClient();
      
      try {
        const directorId = testData.userIds.directors[0];
        
        // Assign director to requests
        await client.query(`
          UPDATE funeral_requests 
          SET assigned_director_id = $1 
          WHERE id = $2
        `, [directorId, testData.funeralRequestIds[0]]);

        await setUserContext(client, directorId, 'director', 'director@example.com');

        const result = await client.query(`
          SELECT id, assigned_director_id, status
          FROM funeral_requests
          WHERE assigned_director_id = $1
        `, [directorId]);

        expect(result.rows.length).toBeGreaterThan(0);
        result.rows.forEach(row => {
          expect(row.assigned_director_id).toBe(directorId);
        });
      } finally {
        client.release();
      }
    });

    it('should prevent service providers from viewing unassigned requests', async () => {
      const client = await getTestClient();
      
      try {
        const directorId = testData.userIds.directors[0];
        const otherDirectorId = testData.userIds.directors[1];
        
        // Assign request to other director
        await client.query(`
          UPDATE funeral_requests 
          SET assigned_director_id = $1 
          WHERE id = $2
        `, [otherDirectorId, testData.funeralRequestIds[0]]);

        await setUserContext(client, directorId, 'director', 'director@example.com');

        const result = await client.query(`
          SELECT id, assigned_director_id
          FROM funeral_requests
          WHERE id = $1
        `, [testData.funeralRequestIds[0]]);

        // Should not see request assigned to other director
        expect(result.rows.length).toBe(0);
      } finally {
        client.release();
      }
    });
  });

  describe('Deceased Persons Access Control', () => {
    it('should allow family members to view their deceased persons', async () => {
      const client = await getTestClient();
      
      try {
        const familyId = testData.userIds.family[0];
        await setUserContext(client, familyId, 'family', 'family@example.com');

        const result = await client.query(`
          SELECT dp.id, dp.full_name, fr.primary_contact_id
          FROM deceased_persons dp
          JOIN funeral_requests fr ON dp.id = fr.deceased_id
          WHERE fr.primary_contact_id = $1
        `, [familyId]);

        expect(result.rows.length).toBeGreaterThan(0);
        result.rows.forEach(row => {
          expect(row.primary_contact_id).toBe(familyId);
        });
      } finally {
        client.release();
      }
    });

    it('should allow service providers to view assigned deceased persons', async () => {
      const client = await getTestClient();
      
      try {
        const directorId = testData.userIds.directors[0];
        
        // Assign director to a request
        await client.query(`
          UPDATE funeral_requests 
          SET assigned_director_id = $1 
          WHERE id = $2
        `, [directorId, testData.funeralRequestIds[0]]);

        await setUserContext(client, directorId, 'director', 'director@example.com');

        // Get the deceased person for the assigned request
        const assignedDeceased = await client.query(`
          SELECT deceased_id FROM funeral_requests 
          WHERE assigned_director_id = $1 AND id = $2
        `, [directorId, testData.funeralRequestIds[0]]);

        const deceasedId = assignedDeceased.rows[0].deceased_id;

        const result = await client.query(`
          SELECT id, full_name
          FROM deceased_persons
          WHERE id = $1
        `, [deceasedId]);

        expect(result.rows.length).toBe(1);
        expect(result.rows[0].id).toBe(deceasedId);
      } finally {
        client.release();
      }
    });

    it('should prevent unauthorized access to deceased persons', async () => {
      const client = await getTestClient();
      
      try {
        const unauthorizedFamilyId = testData.userIds.family[1];
        await setUserContext(client, unauthorizedFamilyId, 'family', 'unauthorized@example.com');

        // Try to access deceased person from another family's request
        const otherFamilyDeceased = await client.query(`
          SELECT deceased_id FROM funeral_requests 
          WHERE primary_contact_id = $1
        `, [testData.userIds.family[0]]);

        if (otherFamilyDeceased.rows.length > 0) {
          const deceasedId = otherFamilyDeceased.rows[0].deceased_id;

          const result = await client.query(`
            SELECT id, full_name
            FROM deceased_persons
            WHERE id = $1
          `, [deceasedId]);

          // Should not be able to see other family's deceased person
          expect(result.rows.length).toBe(0);
        }
      } finally {
        client.release();
      }
    });
  });

  describe('Venue Access Control', () => {
    it('should allow everyone to view approved venues', async () => {
      const client = await getTestClient();
      
      try {
        const familyId = testData.userIds.family[0];
        await setUserContext(client, familyId, 'family', 'family@example.com');

        const result = await client.query(`
          SELECT id, name, status
          FROM venues
          WHERE status = 'approved'
        `);

        expect(result.rows.length).toBeGreaterThan(0);
        result.rows.forEach(row => {
          expect(row.status).toBe('approved');
        });
      } finally {
        client.release();
      }
    });

    it('should allow venue owners to view their own venues', async () => {
      const client = await getTestClient();
      
      try {
        const venueOwnerId = testData.userIds.venueOwners[0];
        await setUserContext(client, venueOwnerId, 'venue', 'venue@example.com');

        const result = await client.query(`
          SELECT id, name, owner_id, status
          FROM venues
          WHERE owner_id = $1
        `, [venueOwnerId]);

        expect(result.rows.length).toBeGreaterThan(0);
        result.rows.forEach(row => {
          expect(row.owner_id).toBe(venueOwnerId);
        });
      } finally {
        client.release();
      }
    });

    it('should prevent venue owners from viewing other venues (except approved)', async () => {
      const client = await getTestClient();
      
      try {
        const venueOwnerId = testData.userIds.venueOwners[0];
        const otherVenueOwnerId = testData.userIds.venueOwners[1];
        
        await setUserContext(client, venueOwnerId, 'venue', 'venue@example.com');

        // Set another venue to pending status
        await client.query(`
          UPDATE venues 
          SET status = 'pending' 
          WHERE owner_id = $1
        `, [otherVenueOwnerId]);

        const result = await client.query(`
          SELECT id, name, owner_id, status
          FROM venues
          WHERE owner_id = $1 AND status = 'pending'
        `, [otherVenueOwnerId]);

        // Should not see other owner's pending venues
        expect(result.rows.length).toBe(0);
      } finally {
        client.release();
      }
    });
  });

  describe('Document Vault Access Control', () => {
    it('should allow users to view their own documents', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        await setUserContext(client, userId, 'family', 'family@example.com');

        // Insert a test document
        await client.query(`
          INSERT INTO document_vault (
            owner_id, category_id, original_filename, file_size_bytes,
            mime_type, encrypted_content, client_encrypted_key, encryption_iv,
            content_hash, retention_until
          ) VALUES (
            $1, (SELECT id FROM document_categories LIMIT 1), 'test.pdf', 1024,
            'application/pdf', 'encrypted_content'::bytea, 'encrypted_key', 'iv'::bytea,
            'hash', CURRENT_DATE + INTERVAL '7 years'
          )
        `, [userId]);

        const result = await client.query(`
          SELECT id, owner_id, original_filename
          FROM document_vault
          WHERE owner_id = $1
        `, [userId]);

        expect(result.rows.length).toBeGreaterThan(0);
        result.rows.forEach(row => {
          expect(row.owner_id).toBe(userId);
        });
      } finally {
        client.release();
      }
    });

    it('should prevent users from viewing other users documents', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        const otherUserId = testData.userIds.family[1];
        
        await setUserContext(client, userId, 'family', 'family@example.com');

        // Try to access another user's documents
        const result = await client.query(`
          SELECT id, owner_id, original_filename
          FROM document_vault
          WHERE owner_id = $1
        `, [otherUserId]);

        // Should not see other user's documents
        expect(result.rows.length).toBe(0);
      } finally {
        client.release();
      }
    });

    it('should allow service providers to view case documents', async () => {
      const client = await getTestClient();
      
      try {
        const directorId = testData.userIds.directors[0];
        const familyId = testData.userIds.family[0];
        const funeralRequestId = testData.funeralRequestIds[0];
        
        // Assign director to the request
        await client.query(`
          UPDATE funeral_requests 
          SET assigned_director_id = $1, primary_contact_id = $2
          WHERE id = $3
        `, [directorId, familyId, funeralRequestId]);

        // Insert a document linked to the funeral request
        await client.query(`
          INSERT INTO document_vault (
            owner_id, funeral_request_id, category_id, original_filename, file_size_bytes,
            mime_type, encrypted_content, client_encrypted_key, encryption_iv,
            content_hash, retention_until
          ) VALUES (
            $1, $2, (SELECT id FROM document_categories LIMIT 1), 'case_document.pdf', 1024,
            'application/pdf', 'encrypted_content'::bytea, 'encrypted_key', 'iv'::bytea,
            'hash', CURRENT_DATE + INTERVAL '7 years'
          )
        `, [familyId, funeralRequestId]);

        await setUserContext(client, directorId, 'director', 'director@example.com');

        const result = await client.query(`
          SELECT id, funeral_request_id, original_filename
          FROM document_vault
          WHERE funeral_request_id = $1
        `, [funeralRequestId]);

        expect(result.rows.length).toBeGreaterThan(0);
        result.rows.forEach(row => {
          expect(row.funeral_request_id).toBe(funeralRequestId);
        });
      } finally {
        client.release();
      }
    });
  });

  describe('Audit Log Access Control', () => {
    it('should allow users to view their own audit logs', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        await setUserContext(client, userId, 'family', 'family@example.com');

        // Insert test audit log entry
        await client.query(`
          INSERT INTO audit_log (
            event_type, event_category, user_id, action, ip_address, success
          ) VALUES (
            'test_event', 'data_access', $1, 'SELECT', '127.0.0.1', true
          )
        `, [userId]);

        const result = await client.query(`
          SELECT id, user_id, event_type
          FROM audit_log
          WHERE user_id = $1 AND event_type = 'test_event'
        `, [userId]);

        expect(result.rows.length).toBeGreaterThan(0);
        result.rows.forEach(row => {
          expect(row.user_id).toBe(userId);
        });
      } finally {
        client.release();
      }
    });

    it('should prevent users from viewing other users audit logs', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        const otherUserId = testData.userIds.family[1];
        
        await setUserContext(client, userId, 'family', 'family@example.com');

        const result = await client.query(`
          SELECT id, user_id, event_type
          FROM audit_log
          WHERE user_id = $1
        `, [otherUserId]);

        // Should not see other user's audit logs
        expect(result.rows.length).toBe(0);
      } finally {
        client.release();
      }
    });

    it('should allow admins to view all audit logs', async () => {
      const client = await getTestClient();
      
      try {
        const adminUserId = testData.userIds.all[0];
        await setUserContext(client, adminUserId, 'admin', 'admin@example.com', true);

        const result = await client.query(`
          SELECT id, user_id, event_type
          FROM audit_log
          LIMIT 10
        `);

        // Admin should see audit logs
        expect(result.rows.length).toBeGreaterThan(0);
      } finally {
        client.release();
      }
    });
  });

  describe('GDPR Compliance Access Control', () => {
    it('should allow users to view their own GDPR compliance records', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        await setUserContext(client, userId, 'family', 'family@example.com');

        // Insert test GDPR compliance record
        await client.query(`
          INSERT INTO gdpr_compliance_log (
            data_subject_id, data_subject_email, data_subject_type,
            activity_type, request_description, lawful_basis, response_deadline
          ) VALUES (
            $1, 'family@example.com', 'family_member',
            'data_access_request', 'User requested data access', 'consent', 
            CURRENT_DATE + INTERVAL '30 days'
          )
        `, [userId]);

        const result = await client.query(`
          SELECT id, data_subject_id, activity_type
          FROM gdpr_compliance_log
          WHERE data_subject_id = $1
        `, [userId]);

        expect(result.rows.length).toBeGreaterThan(0);
        result.rows.forEach(row => {
          expect(row.data_subject_id).toBe(userId);
        });
      } finally {
        client.release();
      }
    });

    it('should prevent users from viewing other users GDPR records', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        const otherUserId = testData.userIds.family[1];
        
        await setUserContext(client, userId, 'family', 'family@example.com');

        const result = await client.query(`
          SELECT id, data_subject_id, activity_type
          FROM gdpr_compliance_log
          WHERE data_subject_id = $1
        `, [otherUserId]);

        // Should not see other user's GDPR records
        expect(result.rows.length).toBe(0);
      } finally {
        client.release();
      }
    });

    it('should allow only admins to view data breach logs', async () => {
      const client = await getTestClient();
      
      try {
        // Test non-admin access
        const userId = testData.userIds.family[0];
        await setUserContext(client, userId, 'family', 'family@example.com');

        const nonAdminResult = await client.query(`
          SELECT id, breach_reference
          FROM data_breach_log
          LIMIT 1
        `);

        // Should not see any breach logs as non-admin
        expect(nonAdminResult.rows.length).toBe(0);

        // Test admin access
        const adminUserId = testData.userIds.all[0];
        await setUserContext(client, adminUserId, 'admin', 'admin@example.com', true);

        // Insert test breach log
        await client.query(`
          INSERT INTO data_breach_log (
            breach_reference, breach_type, discovered_at, description,
            severity_level, data_categories_affected, systems_affected,
            immediate_actions_taken
          ) VALUES (
            'BREACH-001', 'unauthorized_access', NOW(), 'Test breach',
            'low', ARRAY['test_data'], ARRAY['test_system'], 'Immediate containment'
          )
        `);

        const adminResult = await client.query(`
          SELECT id, breach_reference
          FROM data_breach_log
          WHERE breach_reference = 'BREACH-001'
        `);

        // Admin should see breach logs
        expect(adminResult.rows.length).toBe(1);
      } finally {
        client.release();
      }
    });
  });

  describe('RLS Policy Enforcement', () => {
    it('should enforce RLS even with direct table access attempts', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        const otherUserId = testData.userIds.family[1];
        
        await setUserContext(client, userId, 'family', 'family@example.com');

        // Attempt to bypass RLS by selecting all records
        const result = await client.query(`
          SELECT COUNT(*) as count
          FROM user_profiles
        `);

        // Should only see own profile (count should be 1)
        expect(parseInt(result.rows[0].count)).toBe(1);

        // Attempt to access specific other user by ID
        const specificResult = await client.query(`
          SELECT id, email
          FROM user_profiles
          WHERE id = $1
        `, [otherUserId]);

        // Should not see other user
        expect(specificResult.rows.length).toBe(0);
      } finally {
        client.release();
      }
    });

    it('should prevent data modification outside of user scope', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        const otherUserId = testData.userIds.family[1];
        
        await setUserContext(client, userId, 'family', 'family@example.com');

        // Attempt to update another user's profile
        await expect(
          client.query(`
            UPDATE user_profiles 
            SET first_name = 'Hacked'
            WHERE id = $1
          `, [otherUserId])
        ).rejects.toThrow();

        // Verify other user's profile was not changed
        await setUserContext(client, otherUserId, 'family', 'other@example.com');
        
        const result = await client.query(`
          SELECT first_name
          FROM user_profiles
          WHERE id = $1
        `, [otherUserId]);

        expect(result.rows[0].first_name).not.toBe('Hacked');
      } finally {
        client.release();
      }
    });

    it('should enforce RLS on insert operations', async () => {
      const client = await getTestClient();
      
      try {
        const userId = testData.userIds.family[0];
        const otherUserId = testData.userIds.family[1];
        
        await setUserContext(client, userId, 'family', 'family@example.com');

        // Attempt to insert audit log for another user
        await expect(
          client.query(`
            INSERT INTO audit_log (
              event_type, event_category, user_id, action, ip_address, success
            ) VALUES (
              'malicious', 'attack', $1, 'SELECT', '127.0.0.1', true
            )
          `, [otherUserId])
        ).rejects.toThrow();
      } finally {
        client.release();
      }
    });
  });
});