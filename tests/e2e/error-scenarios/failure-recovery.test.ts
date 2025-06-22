import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Error Scenario and Failure Recovery Tests
 * Tests application behavior under various failure conditions and error scenarios
 */

test.describe('Error Scenarios and Failure Recovery', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Network Connectivity Issues', () => {
    test('Graceful handling of network disconnection during critical operations', async ({ page }) => {
      await test.step('Test offline behavior during document upload', async () => {
        await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        await helpers.navigateToSection('documents');
        await helpers.page.click('[data-testid="upload-document"]');
        
        // Start upload process
        await helpers.page.selectOption('[data-testid="document-type"]', 'death-certificate');
        await helpers.uploadFile('[data-testid="file-input"]', 'tests/e2e/fixtures/test-document.pdf');
        
        // Simulate network disconnection during upload
        await helpers.simulateOfflineMode();
        
        await helpers.submitForm('upload-document');
        
        // Verify offline handling
        await helpers.waitForElement('[data-testid="offline-error"]');
        await expect(helpers.page.locator('[data-testid="error-message"]')).toContainText('Connection lost');
        
        // Verify retry mechanism
        await helpers.assertElementVisible('[data-testid="retry-button"]');
        await helpers.assertElementVisible('[data-testid="save-draft-button"]');
        
        // Test save as draft functionality
        await helpers.page.click('[data-testid="save-draft-button"]');
        await helpers.waitForToast('Draft saved locally');
        
        // Restore connection and retry
        await helpers.restoreNetworkConditions();
        await helpers.page.click('[data-testid="retry-button"]');
        
        await helpers.waitForToast('Document uploaded successfully');
      });

      await test.step('Test offline form submission with queue', async () => {
        await helpers.navigateToSection('profile');
        
        // Make changes to profile
        await helpers.page.fill('[data-testid="first-name"]', 'Updated Name');
        await helpers.page.fill('[data-testid="phone"]', '+31 6 9876 5432');
        
        // Go offline before submission
        await helpers.simulateOfflineMode();
        
        await helpers.submitForm('save-profile');
        
        // Verify queuing mechanism
        await helpers.waitForElement('[data-testid="queued-update"]');
        await expect(helpers.page.locator('[data-testid="queue-message"]')).toContainText('Changes will be saved when connection is restored');
        
        // Restore connection
        await helpers.restoreNetworkConditions();
        
        // Verify automatic retry
        await helpers.waitForToast('Profile updated successfully');
      });

      await test.step('Test intermittent connectivity during real-time chat', async () => {
        await helpers.navigateToSection('chat');
        await helpers.page.click('[data-testid="director-chat"]');
        
        // Send message while online
        await helpers.page.fill('[data-testid="message-input"]', 'First message while online');
        await helpers.page.click('[data-testid="send-message"]');
        await helpers.waitForText('First message while online');
        
        // Simulate intermittent connectivity
        await helpers.simulateSlowNetwork();
        
        // Try to send message with slow connection
        await helpers.page.fill('[data-testid="message-input"]', 'Message with slow connection');
        await helpers.page.click('[data-testid="send-message"]');
        
        // Verify loading state and eventual delivery
        await helpers.waitForElement('[data-testid="message-sending"]');
        await helpers.waitForElement('[data-testid="message-delivered"]', 10000);
        
        // Go completely offline
        await helpers.simulateOfflineMode();
        
        // Try to send message while offline
        await helpers.page.fill('[data-testid="message-input"]', 'Offline message');
        await helpers.page.click('[data-testid="send-message"]');
        
        // Verify offline queueing
        await helpers.waitForElement('[data-testid="message-queued"]');
        
        // Restore connection
        await helpers.restoreNetworkConditions();
        
        // Verify message is sent when connection restored
        await helpers.waitForText('Offline message');
      });
    });

    test('Slow network conditions and timeout handling', async ({ page }) => {
      await test.step('Test slow loading with graceful degradation', async () => {
        await helpers.simulateSlowNetwork();
        
        await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        // Navigate to data-heavy section
        await helpers.navigateToSection('dashboard');
        
        // Verify loading states
        await helpers.waitForElement('[data-testid="loading-skeleton"]');
        await helpers.assertElementVisible('[data-testid="loading-metrics"]');
        
        // Verify progressive loading
        await helpers.waitForElement('[data-testid="basic-content"]', 5000);
        await helpers.waitForElement('[data-testid="enhanced-content"]', 15000);
        
        // Test timeout handling for non-critical components
        await helpers.navigateToSection('analytics');
        
        // Verify graceful fallback for slow-loading analytics
        await helpers.waitForElement('[data-testid="analytics-fallback"]', 10000);
        await expect(helpers.page.locator('[data-testid="fallback-message"]')).toContainText('Analytics loading slowly');
      });

      await test.step('Test request timeout and retry logic', async () => {
        // Mock slow API responses
        await helpers.page.route('**/api/venues', async route => {
          await new Promise(resolve => setTimeout(resolve, 35000)); // 35 second delay
          route.continue();
        });
        
        await helpers.navigateToSection('venues');
        
        // Verify timeout handling
        await helpers.waitForElement('[data-testid="request-timeout"]', 40000);
        await expect(helpers.page.locator('[data-testid="timeout-message"]')).toContainText('Request timed out');
        
        // Test retry mechanism
        await helpers.page.click('[data-testid="retry-request"]');
        await helpers.waitForElement('[data-testid="retrying-request"]');
      });
    });
  });

  test.describe('API Service Failures', () => {
    test('Handle various API error responses', async ({ page }) => {
      await test.step('Test 500 Internal Server Error handling', async () => {
        await helpers.mockAPIError('/api/family/dashboard', 500, 'Internal server error');
        
        await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        // Verify error handling
        await helpers.waitForElement('[data-testid="server-error"]');
        await expect(helpers.page.locator('[data-testid="error-message"]')).toContainText('Server temporarily unavailable');
        
        // Verify retry option
        await helpers.assertElementVisible('[data-testid="retry-button"]');
        await helpers.assertElementVisible('[data-testid="contact-support"]');
      });

      await test.step('Test 401 Unauthorized and session expiry', async () => {
        await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        // Mock session expiry
        await helpers.mockAPIError('/api/family/profile', 401, 'Session expired');
        
        await helpers.navigateToSection('profile');
        
        // Verify automatic redirect to login
        await helpers.waitForElement('[data-testid="session-expired"]');
        await expect(helpers.page.locator('[data-testid="expiry-message"]')).toContainText('Session has expired');
        
        // Verify data preservation option
        await helpers.assertElementVisible('[data-testid="preserve-changes"]');
      });

      await test.step('Test 403 Forbidden access', async () => {
        await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        // Mock forbidden access to admin features
        await helpers.mockAPIError('/api/admin/users', 403, 'Access denied');
        
        // Try to access admin area
        await helpers.page.goto('/admin');
        
        // Verify access denied handling
        await helpers.waitForElement('[data-testid="access-denied"]');
        await expect(helpers.page.locator('[data-testid="access-message"]')).toContainText('You do not have permission');
        
        // Verify redirect to appropriate area
        await helpers.assertElementVisible('[data-testid="return-home"]');
      });

      await test.step('Test 404 Not Found errors', async () => {
        await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        // Navigate to non-existent resource
        await helpers.page.goto('/documents/non-existent-document-id');
        
        // Verify 404 handling
        await helpers.waitForElement('[data-testid="not-found"]');
        await expect(helpers.page.locator('[data-testid="not-found-message"]')).toContainText('Document not found');
        
        // Verify helpful navigation options
        await helpers.assertElementVisible('[data-testid="back-to-documents"]');
        await helpers.assertElementVisible('[data-testid="search-documents"]');
      });

      await test.step('Test 429 Rate Limiting', async () => {
        await helpers.mockAPIError('/api/documents/upload', 429, 'Too many requests');
        
        await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        await helpers.navigateToSection('documents');
        await helpers.page.click('[data-testid="upload-document"]');
        
        await helpers.uploadFile('[data-testid="file-input"]', 'tests/e2e/fixtures/test-document.pdf');
        await helpers.submitForm('upload-document');
        
        // Verify rate limiting handling
        await helpers.waitForElement('[data-testid="rate-limited"]');
        await expect(helpers.page.locator('[data-testid="rate-limit-message"]')).toContainText('Please wait before uploading');
        
        // Verify cooldown timer
        await helpers.assertElementVisible('[data-testid="cooldown-timer"]');
      });
    });

    test('Service dependency failures', async ({ page }) => {
      await test.step('Test payment service unavailability', async () => {
        await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        // Mock payment service failure
        await helpers.mockAPIError('/api/payments/process', 503, 'Payment service unavailable');
        
        await helpers.navigateToSection('payments');
        await helpers.page.click('[data-testid="pay-balance"]');
        
        await helpers.fillForm({
          'card-number': '4111111111111111',
          'expiry-date': '12/25',
          'cvv': '123'
        });
        
        await helpers.submitForm('process-payment');
        
        // Verify service unavailable handling
        await helpers.waitForElement('[data-testid="payment-service-down"]');
        await expect(helpers.page.locator('[data-testid="service-error"]')).toContainText('Payment processing temporarily unavailable');
        
        // Verify alternative payment options
        await helpers.assertElementVisible('[data-testid="alternative-payment-methods"]');
        await helpers.assertElementVisible('[data-testid="bank-transfer-option"]');
      });

      await test.step('Test document storage service failure', async () => {
        await helpers.mockAPIError('/api/documents/storage', 503, 'Storage service unavailable');
        
        await helpers.navigateToSection('documents');
        await helpers.page.click('[data-testid="upload-document"]');
        
        await helpers.uploadFile('[data-testid="file-input"]', 'tests/e2e/fixtures/test-document.pdf');
        await helpers.submitForm('upload-document');
        
        // Verify storage failure handling
        await helpers.waitForElement('[data-testid="storage-unavailable"]');
        
        // Verify local storage fallback
        await helpers.assertElementVisible('[data-testid="local-storage-option"]');
        await helpers.page.click('[data-testid="save-locally"]');
        await helpers.waitForToast('Document saved locally');
      });

      await test.step('Test email service failure', async () => {
        await helpers.mockAPIError('/api/notifications/email', 503, 'Email service down');
        
        await helpers.navigateToSection('messages');
        await helpers.page.click('[data-testid="compose-message"]');
        
        await helpers.fillForm({
          'recipient': 'director',
          'subject': 'Test message',
          'message': 'This is a test message'
        });
        
        await helpers.submitForm('send-message');
        
        // Verify email failure with alternative delivery
        await helpers.waitForElement('[data-testid="email-failed"]');
        await expect(helpers.page.locator('[data-testid="delivery-alternative"]')).toContainText('Message will be delivered via in-app notification');
      });
    });
  });

  test.describe('Data Corruption and Validation Errors', () => {
    test('Handle corrupted form data and validation failures', async ({ page }) => {
      await test.step('Test client-side validation errors', async () => {
        await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        await helpers.navigateToSection('profile');
        
        // Test invalid email format
        await helpers.page.fill('[data-testid="email-input"]', 'invalid-email');
        await helpers.submitForm('save-profile');
        
        await helpers.waitForElement('[data-testid="validation-error"]');
        await expect(helpers.page.locator('[data-testid="email-error"]')).toContainText('Invalid email format');
        
        // Test invalid phone number
        await helpers.page.fill('[data-testid="phone-input"]', '123');
        await helpers.submitForm('save-profile');
        
        await expect(helpers.page.locator('[data-testid="phone-error"]')).toContainText('Invalid phone number');
        
        // Test required field validation
        await helpers.page.fill('[data-testid="first-name"]', '');
        await helpers.submitForm('save-profile');
        
        await expect(helpers.page.locator('[data-testid="first-name-error"]')).toContainText('First name is required');
      });

      await test.step('Test server-side validation errors', async () => {
        // Mock server validation failure
        await helpers.mockAPIError('/api/family/profile', 422, 'Validation failed: Email already exists');
        
        await helpers.page.fill('[data-testid="email-input"]', 'existing@email.com');
        await helpers.submitForm('save-profile');
        
        await helpers.waitForElement('[data-testid="server-validation-error"]');
        await expect(helpers.page.locator('[data-testid="server-error-message"]')).toContainText('Email already exists');
      });

      await test.step('Test file corruption during upload', async () => {
        await helpers.navigateToSection('documents');
        await helpers.page.click('[data-testid="upload-document"]');
        
        // Mock corrupted file upload
        await helpers.mockAPIError('/api/documents/upload', 400, 'File corrupted or invalid format');
        
        await helpers.uploadFile('[data-testid="file-input"]', 'tests/e2e/fixtures/corrupted-file.pdf');
        await helpers.submitForm('upload-document');
        
        await helpers.waitForElement('[data-testid="file-corruption-error"]');
        await expect(helpers.page.locator('[data-testid="corruption-message"]')).toContainText('File appears to be corrupted');
        
        // Verify recovery options
        await helpers.assertElementVisible('[data-testid="retry-upload"]');
        await helpers.assertElementVisible('[data-testid="file-help"]');
      });
    });

    test('Handle database consistency issues', async ({ page }) => {
      await test.step('Test data synchronization conflicts', async () => {
        await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        // Simulate concurrent edit conflict
        await helpers.mockAPIError('/api/appointments/update', 409, 'Appointment was modified by another user');
        
        await helpers.navigateToSection('appointments');
        await helpers.page.click('[data-testid="appointment-item"]:first-child');
        await helpers.page.click('[data-testid="edit-appointment"]');
        
        await helpers.page.fill('[data-testid="appointment-notes"]', 'Updated notes');
        await helpers.submitForm('save-appointment');
        
        // Verify conflict resolution
        await helpers.waitForElement('[data-testid="edit-conflict"]');
        await expect(helpers.page.locator('[data-testid="conflict-message"]')).toContainText('Another user has modified this appointment');
        
        // Verify conflict resolution options
        await helpers.assertElementVisible('[data-testid="view-other-changes"]');
        await helpers.assertElementVisible('[data-testid="merge-changes"]');
        await helpers.assertElementVisible('[data-testid="overwrite-changes"]');
      });

      await test.step('Test referential integrity violations', async () => {
        // Mock referential integrity error
        await helpers.mockAPIError('/api/bookings/delete', 400, 'Cannot delete booking with associated payments');
        
        await helpers.navigateToSection('bookings');
        await helpers.page.click('[data-testid="booking-item"]:first-child');
        await helpers.page.click('[data-testid="cancel-booking"]');
        
        await helpers.submitForm('confirm-cancellation');
        
        await helpers.waitForElement('[data-testid="integrity-error"]');
        await expect(helpers.page.locator('[data-testid="integrity-message"]')).toContainText('Cannot cancel booking with processed payments');
        
        // Verify alternative actions
        await helpers.assertElementVisible('[data-testid="modify-booking"]');
        await helpers.assertElementVisible('[data-testid="contact-support"]');
      });
    });
  });

  test.describe('User Interface Error Handling', () => {
    test('Handle JavaScript errors and runtime exceptions', async ({ page }) => {
      await test.step('Test unhandled JavaScript errors', async () => {
        await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        // Inject JavaScript error
        await helpers.page.evaluate(() => {
          window.addEventListener('error', (e) => {
            console.error('Caught error:', e.error);
          });
          
          // Simulate JavaScript error
          setTimeout(() => {
            throw new Error('Simulated JavaScript error');
          }, 1000);
        });
        
        await helpers.navigateToSection('dashboard');
        
        // Verify error boundary handling
        await helpers.waitForElement('[data-testid="error-boundary"]', 5000);
        await expect(helpers.page.locator('[data-testid="error-boundary-message"]')).toContainText('Something went wrong');
        
        // Verify recovery options
        await helpers.assertElementVisible('[data-testid="reload-component"]');
        await helpers.assertElementVisible('[data-testid="report-error"]');
      });

      await test.step('Test component crash recovery', async () => {
        // Mock component failure
        await helpers.page.route('**/api/family/dashboard', route => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ malformed: 'data that will cause parsing error' })
          });
        });
        
        await helpers.navigateToSection('dashboard');
        
        // Verify graceful degradation
        await helpers.waitForElement('[data-testid="component-fallback"]');
        await expect(helpers.page.locator('[data-testid="fallback-message"]')).toContainText('Dashboard temporarily unavailable');
        
        // Test component reload
        await helpers.page.click('[data-testid="reload-dashboard"]');
        await helpers.waitForElement('[data-testid="loading-dashboard"]');
      });
    });

    test('Handle browser compatibility issues', async ({ page }) => {
      await test.step('Test unsupported browser features', async () => {
        // Mock missing browser APIs
        await helpers.page.addInitScript(() => {
          // Remove File API to simulate older browser
          delete (window as any).FileReader;
          delete (window as any).FormData;
        });
        
        await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        await helpers.navigateToSection('documents');
        await helpers.page.click('[data-testid="upload-document"]');
        
        // Verify fallback for unsupported features
        await helpers.waitForElement('[data-testid="browser-compatibility-warning"]');
        await expect(helpers.page.locator('[data-testid="compatibility-message"]')).toContainText('Browser does not support file uploads');
        
        // Verify alternative upload method
        await helpers.assertElementVisible('[data-testid="alternative-upload"]');
      });

      await test.step('Test browser storage limitations', async () => {
        // Mock storage quota exceeded
        await helpers.page.addInitScript(() => {
          const originalSetItem = localStorage.setItem;
          localStorage.setItem = function(key, value) {
            throw new Error('Quota exceeded');
          };
        });
        
        await helpers.navigateToSection('documents');
        
        // Try to save large amount of data locally
        await helpers.page.evaluate(() => {
          try {
            localStorage.setItem('large-data', 'x'.repeat(10000000));
          } catch (e) {
            console.error('Storage error:', e);
          }
        });
        
        // Verify storage error handling
        await helpers.waitForElement('[data-testid="storage-error"]');
        await expect(helpers.page.locator('[data-testid="storage-message"]')).toContainText('Local storage is full');
        
        // Verify cleanup options
        await helpers.assertElementVisible('[data-testid="clear-cache"]');
      });
    });
  });

  test.describe('Security and Authentication Errors', () => {
    test('Handle authentication and authorization failures', async ({ page }) => {
      await test.step('Test invalid login credentials', async () => {
        await helpers.page.goto('/auth/signin');
        
        await helpers.fillForm({
          'email': 'invalid@email.com',
          'password': 'wrongpassword'
        });
        
        await helpers.submitForm('signin');
        
        // Verify authentication error
        await helpers.waitForElement('[data-testid="auth-error"]');
        await expect(helpers.page.locator('[data-testid="auth-error-message"]')).toContainText('Invalid credentials');
        
        // Verify account lockout protection
        for (let i = 0; i < 5; i++) {
          await helpers.submitForm('signin');
          await helpers.waitForElement('[data-testid="auth-error"]');
        }
        
        await helpers.waitForElement('[data-testid="account-locked"]');
        await expect(helpers.page.locator('[data-testid="lockout-message"]')).toContainText('Account temporarily locked');
      });

      await test.step('Test CSRF token validation', async () => {
        await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        // Mock CSRF token error
        await helpers.mockAPIError('/api/family/profile', 403, 'CSRF token mismatch');
        
        await helpers.navigateToSection('profile');
        await helpers.page.fill('[data-testid="first-name"]', 'Updated Name');
        await helpers.submitForm('save-profile');
        
        // Verify CSRF error handling
        await helpers.waitForElement('[data-testid="csrf-error"]');
        await expect(helpers.page.locator('[data-testid="csrf-message"]')).toContainText('Security token expired');
        
        // Verify automatic token refresh
        await helpers.page.click('[data-testid="refresh-and-retry"]');
        await helpers.waitForToast('Profile updated successfully');
      });
    });

    test('Handle permission and access control errors', async ({ page }) => {
      await test.step('Test unauthorized access attempts', async () => {
        await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        // Try to access director-only features
        await helpers.page.goto('/director/analytics');
        
        await helpers.waitForElement('[data-testid="unauthorized-access"]');
        await expect(helpers.page.locator('[data-testid="unauthorized-message"]')).toContainText('Access denied');
        
        // Verify secure redirect
        await helpers.assertPageURL('/dashboard');
      });

      await test.step('Test data access violations', async () => {
        // Mock unauthorized data access
        await helpers.mockAPIError('/api/documents/other-family-document', 403, 'Access denied to document');
        
        // Try to access another family's document directly
        await helpers.page.goto('/documents/other-family-document-id');
        
        await helpers.waitForElement('[data-testid="data-access-denied"]');
        await expect(helpers.page.locator('[data-testid="access-violation-message"]')).toContainText('You do not have access to this document');
      });
    });
  });

  test.describe('Critical System Failures', () => {
    test('Handle complete system outages', async ({ page }) => {
      await test.step('Test graceful degradation during outage', async () => {
        // Mock complete API failure
        await helpers.page.route('**/api/**', route => {
          route.abort();
        });
        
        await helpers.page.goto('/');
        
        // Verify maintenance mode activation
        await helpers.waitForElement('[data-testid="maintenance-mode"]');
        await expect(helpers.page.locator('[data-testid="maintenance-message"]')).toContainText('System temporarily unavailable');
        
        // Verify emergency contact information
        await helpers.assertElementVisible('[data-testid="emergency-contact"]');
        await helpers.assertElementVisible('[data-testid="estimated-restoration"]');
      });

      await test.step('Test data recovery after outage', async () => {
        // Restore API functionality
        await helpers.page.unroute('**/api/**');
        
        await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        // Verify data integrity after recovery
        await helpers.navigateToSection('dashboard');
        await helpers.waitForElement('[data-testid="recovery-check"]');
        
        // Verify cached data synchronization
        await helpers.assertElementVisible('[data-testid="sync-status"]');
        await expect(helpers.page.locator('[data-testid="sync-message"]')).toContainText('Data synchronized');
      });
    });
  });

  test.describe('Edge Cases and Boundary Conditions', () => {
    test('Handle extreme data conditions', async ({ page }) => {
      await test.step('Test very large file uploads', async () => {
        await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        await helpers.navigateToSection('documents');
        await helpers.page.click('[data-testid="upload-document"]');
        
        // Mock large file upload error
        await helpers.mockAPIError('/api/documents/upload', 413, 'File too large');
        
        await helpers.uploadFile('[data-testid="file-input"]', 'tests/e2e/fixtures/large-document.pdf');
        await helpers.submitForm('upload-document');
        
        await helpers.waitForElement('[data-testid="file-size-error"]');
        await expect(helpers.page.locator('[data-testid="size-error-message"]')).toContainText('File exceeds maximum size limit');
        
        // Verify file compression option
        await helpers.assertElementVisible('[data-testid="compress-file"]');
      });

      await test.step('Test concurrent user limits', async () => {
        // Mock concurrent user limit
        await helpers.mockAPIError('/api/auth/signin', 503, 'Maximum concurrent users reached');
        
        await helpers.page.goto('/auth/signin');
        await helpers.fillForm({
          'email': 'test-family@farewelly.test',
          'password': 'TestPassword123!'
        });
        
        await helpers.submitForm('signin');
        
        await helpers.waitForElement('[data-testid="concurrent-limit"]');
        await expect(helpers.page.locator('[data-testid="limit-message"]')).toContainText('System is at capacity');
        
        // Verify queue position
        await helpers.assertElementVisible('[data-testid="queue-position"]');
      });
    });
  });
});