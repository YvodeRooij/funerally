import { test, expect } from '@playwright/test';
import { TestHelpers, FamilyUserData, DirectorData, VenueData } from '../utils/test-helpers';

/**
 * Critical Business Process Tests
 * Tests essential business workflows for booking, payments, and document management
 */

test.describe('Critical Business Process Tests', () => {
  let familyHelpers: TestHelpers;
  let directorHelpers: TestHelpers;
  let venueHelpers: TestHelpers;

  test.beforeEach(async ({ browser }) => {
    const familyContext = await browser.newContext();
    const directorContext = await browser.newContext();
    const venueContext = await browser.newContext();

    familyHelpers = new TestHelpers(await familyContext.newPage());
    directorHelpers = new TestHelpers(await directorContext.newPage());
    venueHelpers = new TestHelpers(await venueContext.newPage());
  });

  test.describe('Booking Flow Tests', () => {
    test('Complete venue booking flow with availability checks', async () => {
      let bookingReference: string;

      await test.step('Family user initiates venue booking', async () => {
        await familyHelpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        // Browse available venues
        await familyHelpers.navigateToSection('venues');
        await familyHelpers.waitForElement('[data-testid="venue-list"]');
        
        // Apply filters for specific requirements
        await familyHelpers.page.click('[data-testid="filter-capacity"]');
        await familyHelpers.page.selectOption('[data-testid="capacity-filter"]', '100');
        
        await familyHelpers.page.click('[data-testid="filter-date"]');
        await familyHelpers.page.fill('[data-testid="date-filter"]', '2024-07-15');
        
        await familyHelpers.page.click('[data-testid="filter-amenities"]');
        await familyHelpers.page.check('[data-testid="amenity-parking"]');
        await familyHelpers.page.check('[data-testid="amenity-catering"]');
        
        await familyHelpers.submitForm('apply-filters');
        await familyHelpers.waitForElement('[data-testid="filtered-venues"]');
        
        // Select venue and view details
        await familyHelpers.page.click('[data-testid="venue-card"]:first-child');
        await familyHelpers.waitForElement('[data-testid="venue-details"]');
        
        // Verify venue information
        await familyHelpers.assertElementVisible('[data-testid="venue-photos"]');
        await familyHelpers.assertElementVisible('[data-testid="venue-amenities"]');
        await familyHelpers.assertElementVisible('[data-testid="venue-pricing"]');
        await familyHelpers.assertElementVisible('[data-testid="venue-reviews"]');
        
        // Check real-time availability
        await familyHelpers.page.click('[data-testid="check-availability"]');
        await familyHelpers.waitForElement('[data-testid="availability-calendar"]');
        
        // Select preferred date and time
        await familyHelpers.page.click('[data-testid="date-2024-07-15"]');
        await familyHelpers.waitForElement('[data-testid="time-slots"]');
        
        await familyHelpers.page.click('[data-testid="time-slot-1100"]');
        await familyHelpers.waitForElement('[data-testid="booking-summary"]');
        
        // Review booking details
        await expect(familyHelpers.page.locator('[data-testid="booking-date"]')).toContainText('July 15, 2024');
        await expect(familyHelpers.page.locator('[data-testid="booking-time"]')).toContainText('11:00 AM');
        
        // Proceed with booking
        await familyHelpers.page.click('[data-testid="proceed-booking"]');
        await familyHelpers.waitForElement('[data-testid="booking-form"]');
        
        // Fill booking details
        await familyHelpers.fillForm({
          'event-type': 'memorial-service',
          'guest-count': '75',
          'setup-requirements': 'Projector and sound system needed',
          'catering-requirements': 'Light refreshments for 75 people',
          'special-requests': 'Wheelchair accessibility required',
          'contact-person': 'John Smith',
          'contact-phone': '+31 6 1234 5678'
        });
        
        // Submit booking request
        await familyHelpers.submitForm('submit-booking-request');
        await familyHelpers.waitForToast('Booking request submitted successfully');
        
        // Extract booking reference
        bookingReference = await familyHelpers.page.getAttribute('[data-testid="booking-reference"]', 'data-value') || '';
        expect(bookingReference).toBeTruthy();
      });

      await test.step('Venue manager processes booking request', async () => {
        await venueHelpers.signIn('test-venue@farewelly.test', 'TestPassword123!');
        
        // Check for new booking requests
        await venueHelpers.navigateToSection('bookings');
        await venueHelpers.page.click('[data-testid="pending-requests"]');
        await venueHelpers.waitForElement('[data-testid="request-list"]');
        
        // Find and review the specific booking request
        await venueHelpers.page.click(`[data-testid="booking-${bookingReference}"]`);
        await venueHelpers.waitForElement('[data-testid="booking-details"]');
        
        // Verify booking details
        await expect(venueHelpers.page.locator('[data-testid="event-type"]')).toContainText('memorial-service');
        await expect(venueHelpers.page.locator('[data-testid="guest-count"]')).toContainText('75');
        
        // Check venue availability conflicts
        await venueHelpers.page.click('[data-testid="check-conflicts"]');
        await venueHelpers.waitForElement('[data-testid="conflict-check-results"]');
        
        // Approve booking with terms
        await venueHelpers.page.click('[data-testid="approve-booking"]');
        await venueHelpers.waitForElement('[data-testid="approval-form"]');
        
        await venueHelpers.fillForm({
          'venue-fee': '2500',
          'setup-fee': '200',
          'catering-coordination-fee': '150',
          'deposit-required': '500',
          'payment-terms': 'Deposit due within 48 hours, balance due 7 days before event',
          'cancellation-policy': 'Full refund if cancelled 14+ days prior, 50% refund 7-14 days prior',
          'venue-policies': 'No alcohol without permit, decorations must be non-damaging'
        });
        
        await venueHelpers.submitForm('confirm-approval');
        await venueHelpers.waitForToast('Booking approved successfully');
      });

      await test.step('Family user confirms booking and makes deposit', async () => {
        // Family should receive booking approval notification
        await familyHelpers.page.reload();
        await familyHelpers.navigateToSection('bookings');
        
        // Check booking status
        await familyHelpers.page.click(`[data-testid="booking-${bookingReference}"]`);
        await familyHelpers.waitForElement('[data-testid="booking-status"]');
        
        await expect(familyHelpers.page.locator('[data-testid="booking-status"]')).toContainText('Approved');
        
        // Review approved terms
        await familyHelpers.assertElementVisible('[data-testid="venue-terms"]');
        await familyHelpers.assertElementVisible('[data-testid="pricing-breakdown"]');
        
        // Confirm booking acceptance
        await familyHelpers.page.click('[data-testid="accept-booking-terms"]');
        await familyHelpers.page.check('[data-testid="terms-agreement"]');
        
        await familyHelpers.submitForm('confirm-booking');
        await familyHelpers.waitForToast('Booking confirmed successfully');
        
        // Process deposit payment
        await familyHelpers.page.click('[data-testid="pay-deposit"]');
        await familyHelpers.waitForElement('[data-testid="payment-form"]');
        
        await familyHelpers.fillForm({
          'payment-method': 'credit-card',
          'card-number': '4111111111111111',
          'expiry-date': '12/25',
          'cvv': '123',
          'cardholder-name': 'John Smith'
        });
        
        await familyHelpers.submitForm('process-payment');
        await familyHelpers.waitForToast('Deposit payment successful');
        
        // Verify booking confirmation
        await familyHelpers.assertElementVisible('[data-testid="booking-confirmed"]');
        await familyHelpers.assertElementVisible('[data-testid="payment-receipt"]');
      });

      await test.step('Venue manager confirms deposit and finalizes booking', async () => {
        await venueHelpers.page.reload();
        await venueHelpers.navigateToSection('bookings');
        
        // Check confirmed bookings
        await venueHelpers.page.click('[data-testid="confirmed-bookings"]');
        await venueHelpers.page.click(`[data-testid="booking-${bookingReference}"]`);
        
        // Verify deposit payment received
        await expect(venueHelpers.page.locator('[data-testid="deposit-status"]')).toContainText('Paid');
        
        // Finalize booking
        await venueHelpers.page.click('[data-testid="finalize-booking"]');
        await venueHelpers.fillForm({
          'final-setup-time': '09:00',
          'venue-coordinator': 'Sarah Johnson',
          'emergency-contact': '+31 20 123 4567',
          'final-notes': 'Booking confirmed, all arrangements in place'
        });
        
        await venueHelpers.submitForm('finalize-booking');
        await venueHelpers.waitForToast('Booking finalized successfully');
      });
    });

    test('Booking modification and cancellation flow', async () => {
      await test.step('Family user modifies existing booking', async () => {
        await familyHelpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        await familyHelpers.navigateToSection('bookings');
        await familyHelpers.page.click('[data-testid="active-booking"]:first-child');
        
        // Request modification
        await familyHelpers.page.click('[data-testid="modify-booking"]');
        await familyHelpers.waitForElement('[data-testid="modification-form"]');
        
        await familyHelpers.fillForm({
          'modification-type': 'guest-count-change',
          'new-guest-count': '90',
          'modification-reason': 'Additional family members will attend',
          'modification-notes': 'Need to increase catering for 15 additional guests'
        });
        
        await familyHelpers.submitForm('request-modification');
        await familyHelpers.waitForToast('Modification request submitted');
      });

      await test.step('Venue manager processes modification request', async () => {
        await venueHelpers.signIn('test-venue@farewelly.test', 'TestPassword123!');
        
        await venueHelpers.navigateToSection('bookings');
        await venueHelpers.page.click('[data-testid="modification-requests"]');
        
        await venueHelpers.page.click('[data-testid="modification-request"]:first-child');
        await venueHelpers.waitForElement('[data-testid="modification-details"]');
        
        // Approve modification with price adjustment
        await venueHelpers.page.click('[data-testid="approve-modification"]');
        await venueHelpers.fillForm({
          'additional-fee': '200',
          'additional-fee-reason': 'Increased catering requirements',
          'modification-notes': 'Approved for 90 guests, additional catering coordinated'
        });
        
        await venueHelpers.submitForm('confirm-modification');
        await venueHelpers.waitForToast('Modification approved');
      });

      await test.step('Family user cancels booking within policy', async () => {
        await familyHelpers.navigateToSection('bookings');
        await familyHelpers.page.click('[data-testid="active-booking"]:first-child');
        
        // Initiate cancellation
        await familyHelpers.page.click('[data-testid="cancel-booking"]');
        await familyHelpers.waitForElement('[data-testid="cancellation-form"]');
        
        // Review cancellation policy
        await familyHelpers.assertElementVisible('[data-testid="cancellation-policy"]');
        await familyHelpers.assertElementVisible('[data-testid="refund-calculation"]');
        
        await familyHelpers.fillForm({
          'cancellation-reason': 'Family emergency - need to postpone',
          'cancellation-notes': 'Hoping to reschedule for a later date'
        });
        
        await familyHelpers.page.check('[data-testid="understand-policy"]');
        await familyHelpers.submitForm('cancel-booking');
        await familyHelpers.waitForToast('Cancellation request submitted');
      });
    });
  });

  test.describe('Payment Processing Tests', () => {
    test('Complete payment processing workflow', async () => {
      await test.step('Process full service payment', async () => {
        await familyHelpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        await familyHelpers.navigateToSection('payments');
        await familyHelpers.waitForElement('[data-testid="payment-dashboard"]');
        
        // Review payment summary
        await familyHelpers.assertElementVisible('[data-testid="outstanding-balance"]');
        await familyHelpers.assertElementVisible('[data-testid="payment-schedule"]');
        
        // Process payment for services
        await familyHelpers.page.click('[data-testid="pay-balance"]');
        await familyHelpers.waitForElement('[data-testid="payment-breakdown"]');
        
        // Verify payment breakdown
        await expect(familyHelpers.page.locator('[data-testid="director-fee"]')).toBeVisible();
        await expect(familyHelpers.page.locator('[data-testid="venue-fee"]')).toBeVisible();
        await expect(familyHelpers.page.locator('[data-testid="additional-services"]')).toBeVisible();
        await expect(familyHelpers.page.locator('[data-testid="total-amount"]')).toBeVisible();
        
        // Select payment method
        await familyHelpers.page.click('[data-testid="payment-method-card"]');
        
        // Fill payment details
        await familyHelpers.fillForm({
          'card-number': '4111111111111111',
          'expiry-month': '12',
          'expiry-year': '2025',
          'cvv': '123',
          'cardholder-name': 'John Smith',
          'billing-address': '123 Main Street',
          'billing-city': 'Amsterdam',
          'billing-postal': '1012AB'
        });
        
        // Review payment terms
        await familyHelpers.page.check('[data-testid="payment-terms-agreed"]');
        
        // Process payment
        await familyHelpers.submitForm('process-payment');
        await familyHelpers.waitForElement('[data-testid="payment-processing"]');
        
        // Wait for payment confirmation
        await familyHelpers.waitForElement('[data-testid="payment-success"]', 30000);
        await familyHelpers.assertElementVisible('[data-testid="payment-receipt"]');
        
        // Download receipt
        await familyHelpers.page.click('[data-testid="download-receipt"]');
        // Note: In real implementation, this would trigger a download
      });

      await test.step('Handle payment splitting between parties', async () => {
        await familyHelpers.navigateToSection('payments');
        await familyHelpers.page.click('[data-testid="payment-splitting"]');
        
        // Set up payment splitting
        await familyHelpers.waitForElement('[data-testid="splitting-form"]');
        
        await familyHelpers.fillForm({
          'split-method': 'percentage',
          'director-percentage': '80',
          'venue-percentage': '20',
          'processing-fee-allocation': 'proportional'
        });
        
        await familyHelpers.submitForm('configure-splitting');
        await familyHelpers.waitForToast('Payment splitting configured');
      });

      await test.step('Process refund request', async () => {
        await familyHelpers.navigateToSection('payments');
        await familyHelpers.page.click('[data-testid="request-refund"]');
        
        await familyHelpers.waitForElement('[data-testid="refund-form"]');
        
        await familyHelpers.fillForm({
          'refund-reason': 'Service cancelled due to family emergency',
          'refund-amount': 'partial',
          'refund-notes': 'Request partial refund according to cancellation policy'
        });
        
        await familyHelpers.submitForm('submit-refund-request');
        await familyHelpers.waitForToast('Refund request submitted');
      });
    });

    test('Payment failure and retry scenarios', async () => {
      await test.step('Handle payment failure', async () => {
        await familyHelpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        // Simulate payment failure
        await familyHelpers.mockAPIError('/api/payments/process', 400, 'Payment declined');
        
        await familyHelpers.navigateToSection('payments');
        await familyHelpers.page.click('[data-testid="pay-balance"]');
        
        // Fill payment details with invalid card
        await familyHelpers.fillForm({
          'card-number': '4000000000000002', // Test card that will be declined
          'expiry-month': '12',
          'expiry-year': '2025',
          'cvv': '123',
          'cardholder-name': 'John Smith'
        });
        
        await familyHelpers.submitForm('process-payment');
        
        // Verify error handling
        await familyHelpers.waitForElement('[data-testid="payment-error"]');
        await expect(familyHelpers.page.locator('[data-testid="error-message"]')).toContainText('Payment declined');
        
        // Retry with different payment method
        await familyHelpers.page.click('[data-testid="retry-payment"]');
        await familyHelpers.page.click('[data-testid="payment-method-bank-transfer"]');
        
        await familyHelpers.fillForm({
          'bank-account': 'NL91ABNA0417164300',
          'account-holder': 'John Smith'
        });
        
        await familyHelpers.submitForm('process-bank-transfer');
        await familyHelpers.waitForToast('Bank transfer initiated');
      });
    });

    test('Subscription and recurring payment handling', async () => {
      await test.step('Set up recurring payment plan', async () => {
        await familyHelpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        await familyHelpers.navigateToSection('payments');
        await familyHelpers.page.click('[data-testid="payment-plans"]');
        
        // Select payment plan
        await familyHelpers.page.click('[data-testid="monthly-plan"]');
        await familyHelpers.waitForElement('[data-testid="plan-details"]');
        
        await familyHelpers.fillForm({
          'plan-duration': '6-months',
          'monthly-amount': '500',
          'start-date': '2024-07-01',
          'auto-payment': 'enabled'
        });
        
        await familyHelpers.submitForm('setup-payment-plan');
        await familyHelpers.waitForToast('Payment plan activated');
      });
    });
  });

  test.describe('Document Management and Sharing Tests', () => {
    test('Comprehensive document lifecycle management', async () => {
      let documentId: string;

      await test.step('Family user uploads documents', async () => {
        await familyHelpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        await familyHelpers.navigateToSection('documents');
        await familyHelpers.waitForElement('[data-testid="document-vault"]');
        
        // Upload death certificate
        await familyHelpers.page.click('[data-testid="upload-document"]');
        await familyHelpers.waitForElement('[data-testid="upload-form"]');
        
        await familyHelpers.page.selectOption('[data-testid="document-type"]', 'death-certificate');
        await familyHelpers.uploadFile('[data-testid="file-input"]', 'tests/e2e/fixtures/death-certificate.pdf');
        
        await familyHelpers.fillForm({
          'document-name': 'Official Death Certificate',
          'document-description': 'Official death certificate for John Doe',
          'document-category': 'legal-documents',
          'privacy-level': 'confidential'
        });
        
        await familyHelpers.submitForm('upload-document');
        await familyHelpers.waitForToast('Document uploaded successfully');
        
        documentId = await familyHelpers.page.getAttribute('[data-testid="document-id"]', 'data-value') || '';
        
        // Upload additional documents
        const additionalDocs = [
          { type: 'identification', file: 'identification.pdf', name: 'Personal Identification' },
          { type: 'medical-records', file: 'medical-records.pdf', name: 'Medical Records' },
          { type: 'insurance-policy', file: 'insurance-policy.pdf', name: 'Life Insurance Policy' }
        ];
        
        for (const doc of additionalDocs) {
          await familyHelpers.page.click('[data-testid="upload-document"]');
          await familyHelpers.page.selectOption('[data-testid="document-type"]', doc.type);
          await familyHelpers.uploadFile('[data-testid="file-input"]', `tests/e2e/fixtures/${doc.file}`);
          await familyHelpers.page.fill('[data-testid="document-name"]', doc.name);
          await familyHelpers.submitForm('upload-document');
          await familyHelpers.waitForToast('Document uploaded successfully');
        }
        
        // Verify all documents are listed
        await familyHelpers.assertElementCount('[data-testid="document-item"]', 4);
      });

      await test.step('Organize documents with categories and tags', async () => {
        // Create document categories
        await familyHelpers.page.click('[data-testid="manage-categories"]');
        await familyHelpers.waitForElement('[data-testid="category-manager"]');
        
        await familyHelpers.page.click('[data-testid="add-category"]');
        await familyHelpers.fillForm({
          'category-name': 'Estate Planning',
          'category-description': 'Documents related to estate and inheritance',
          'category-color': '#4F46E5'
        });
        await familyHelpers.submitForm('create-category');
        
        // Add tags to documents
        await familyHelpers.page.click(`[data-testid="document-${documentId}"]`);
        await familyHelpers.page.click('[data-testid="add-tags"]');
        
        await familyHelpers.fillForm({
          'tags': 'official, government, required, original'
        });
        await familyHelpers.submitForm('save-tags');
        
        // Organize documents into folders
        await familyHelpers.page.click('[data-testid="create-folder"]');
        await familyHelpers.fillForm({
          'folder-name': 'Legal Documents',
          'folder-description': 'All legal and official documents'
        });
        await familyHelpers.submitForm('create-folder');
        
        // Move documents to folder
        await familyHelpers.page.click('[data-testid="select-documents"]');
        await familyHelpers.page.check(`[data-testid="select-doc-${documentId}"]`);
        await familyHelpers.page.click('[data-testid="move-to-folder"]');
        await familyHelpers.page.selectOption('[data-testid="folder-select"]', 'Legal Documents');
        await familyHelpers.submitForm('move-documents');
      });

      await test.step('Share documents with director', async () => {
        // Share specific document
        await familyHelpers.page.click(`[data-testid="document-${documentId}"]`);
        await familyHelpers.page.click('[data-testid="share-document"]');
        
        await familyHelpers.waitForElement('[data-testid="sharing-form"]');
        
        await familyHelpers.fillForm({
          'share-with': 'director',
          'permission-level': 'view-only',
          'share-message': 'Please review the death certificate for service planning',
          'expiry-date': '2024-08-15',
          'notification-method': 'email'
        });
        
        await familyHelpers.submitForm('share-document');
        await familyHelpers.waitForToast('Document shared successfully');
        
        // Verify sharing confirmation
        await familyHelpers.assertElementVisible('[data-testid="sharing-confirmation"]');
        await familyHelpers.assertElementVisible('[data-testid="share-link"]');
      });

      await test.step('Director accesses shared documents', async () => {
        await directorHelpers.signIn('test-director@farewelly.test', 'TestPassword123!');
        
        // Check for shared documents notification
        await directorHelpers.navigateToSection('documents');
        await directorHelpers.page.click('[data-testid="shared-with-me"]');
        
        await directorHelpers.waitForElement('[data-testid="shared-documents"]');
        
        // View shared document
        await directorHelpers.page.click(`[data-testid="shared-doc-${documentId}"]`);
        await directorHelpers.waitForElement('[data-testid="document-viewer"]');
        
        // Verify document details
        await expect(directorHelpers.page.locator('[data-testid="document-name"]')).toContainText('Official Death Certificate');
        await expect(directorHelpers.page.locator('[data-testid="shared-by"]')).toContainText('Family');
        
        // Add director notes
        await directorHelpers.page.click('[data-testid="add-notes"]');
        await directorHelpers.fillForm({
          'notes': 'Document verified and accepted for service planning'
        });
        await directorHelpers.submitForm('save-notes');
        
        // Download document (if permitted)
        await directorHelpers.page.click('[data-testid="download-document"]');
        // Note: In real implementation, this would trigger a download
      });

      await test.step('Collaborative document review', async () => {
        // Director shares document with venue
        await directorHelpers.page.click('[data-testid="share-with-venue"]');
        await directorHelpers.fillForm({
          'share-message': 'Venue coordinator needs to review capacity requirements',
          'permission-level': 'view-comment'
        });
        await directorHelpers.submitForm('share-document');
        
        // Venue manager reviews document
        await venueHelpers.signIn('test-venue@farewelly.test', 'TestPassword123!');
        await venueHelpers.navigateToSection('documents');
        await venueHelpers.page.click('[data-testid="shared-with-me"]');
        
        await venueHelpers.page.click(`[data-testid="shared-doc-${documentId}"]`);
        
        // Add venue comments
        await venueHelpers.page.click('[data-testid="add-comment"]');
        await venueHelpers.fillForm({
          'comment': 'Venue capacity confirmed adequate for the service requirements'
        });
        await venueHelpers.submitForm('save-comment');
      });

      await test.step('Document version control and updates', async () => {
        // Family user uploads updated version
        await familyHelpers.page.click(`[data-testid="document-${documentId}"]`);
        await familyHelpers.page.click('[data-testid="upload-new-version"]');
        
        await familyHelpers.uploadFile('[data-testid="file-input"]', 'tests/e2e/fixtures/death-certificate-updated.pdf');
        await familyHelpers.fillForm({
          'version-notes': 'Updated version with additional certifications'
        });
        await familyHelpers.submitForm('upload-version');
        
        // Verify version history
        await familyHelpers.page.click('[data-testid="version-history"]');
        await familyHelpers.waitForElement('[data-testid="version-list"]');
        
        await familyHelpers.assertElementCount('[data-testid="version-item"]', 2);
        
        // Compare versions
        await familyHelpers.page.click('[data-testid="compare-versions"]');
        await familyHelpers.waitForElement('[data-testid="version-comparison"]');
      });

      await test.step('Document security and audit trail', async () => {
        // View document access history
        await familyHelpers.page.click(`[data-testid="document-${documentId}"]`);
        await familyHelpers.page.click('[data-testid="access-history"]');
        
        await familyHelpers.waitForElement('[data-testid="audit-trail"]');
        
        // Verify audit entries
        await familyHelpers.assertElementVisible('[data-testid="upload-event"]');
        await familyHelpers.assertElementVisible('[data-testid="share-event"]');
        await familyHelpers.assertElementVisible('[data-testid="view-event"]');
        
        // Set document expiration
        await familyHelpers.page.click('[data-testid="set-expiration"]');
        await familyHelpers.fillForm({
          'expiry-date': '2025-07-15',
          'expiry-action': 'archive'
        });
        await familyHelpers.submitForm('set-expiration');
        
        // Configure document permissions
        await familyHelpers.page.click('[data-testid="manage-permissions"]');
        await familyHelpers.waitForElement('[data-testid="permissions-manager"]');
        
        await familyHelpers.page.click('[data-testid="restrict-downloads"]');
        await familyHelpers.page.check('[data-testid="watermark-enabled"]');
        await familyHelpers.submitForm('save-permissions');
      });
    });

    test('Bulk document operations', async () => {
      await test.step('Bulk document upload and processing', async () => {
        await familyHelpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        await familyHelpers.navigateToSection('documents');
        await familyHelpers.page.click('[data-testid="bulk-upload"]');
        
        // Upload multiple documents
        await familyHelpers.uploadMultipleFiles('[data-testid="bulk-file-input"]', [
          'tests/e2e/fixtures/document1.pdf',
          'tests/e2e/fixtures/document2.pdf',
          'tests/e2e/fixtures/document3.pdf'
        ]);
        
        // Configure bulk settings
        await familyHelpers.fillForm({
          'bulk-category': 'supporting-documents',
          'bulk-privacy': 'private',
          'bulk-tags': 'estate, planning, family'
        });
        
        await familyHelpers.submitForm('process-bulk-upload');
        await familyHelpers.waitForToast('Bulk upload completed');
      });

      await test.step('Bulk document sharing', async () => {
        // Select multiple documents
        await familyHelpers.page.click('[data-testid="select-all-documents"]');
        
        // Bulk share operation
        await familyHelpers.page.click('[data-testid="bulk-share"]');
        await familyHelpers.waitForElement('[data-testid="bulk-share-form"]');
        
        await familyHelpers.fillForm({
          'share-with': 'director',
          'permission-level': 'view-only',
          'bulk-message': 'All supporting documents for review'
        });
        
        await familyHelpers.submitForm('bulk-share-documents');
        await familyHelpers.waitForToast('Documents shared successfully');
      });
    });
  });

  test.describe('Service Coordination Workflow', () => {
    test('End-to-end service coordination', async () => {
      await test.step('Service planning and coordination', async () => {
        // Multi-party coordination test
        await familyHelpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        await directorHelpers.signIn('test-director@farewelly.test', 'TestPassword123!');
        await venueHelpers.signIn('test-venue@farewelly.test', 'TestPassword123!');
        
        // Create service plan
        await familyHelpers.navigateToSection('services');
        await familyHelpers.page.click('[data-testid="create-service-plan"]');
        
        await familyHelpers.fillForm({
          'service-type': 'memorial-celebration',
          'service-date': '2024-07-20',
          'service-time': '14:00',
          'expected-attendees': '85',
          'special-requirements': 'Audio visual presentation, live music, catering reception'
        });
        
        await familyHelpers.submitForm('create-service-plan');
        const serviceId = await familyHelpers.page.getAttribute('[data-testid="service-id"]', 'data-value');
        
        // Director coordinates service
        await directorHelpers.navigateToSection('services');
        await directorHelpers.page.click(`[data-testid="service-${serviceId}"]`);
        
        await directorHelpers.page.click('[data-testid="coordinate-service"]');
        await directorHelpers.fillForm({
          'coordinator': 'Maria Santos',
          'backup-coordinator': 'James Wilson',
          'setup-crew': '4',
          'estimated-duration': '180'
        });
        
        await directorHelpers.submitForm('save-coordination');
        
        // Venue prepares for service
        await venueHelpers.navigateToSection('services');
        await venueHelpers.page.click(`[data-testid="service-${serviceId}"]`);
        
        await venueHelpers.page.click('[data-testid="prepare-venue"]');
        await venueHelpers.fillForm({
          'setup-time': '12:00',
          'venue-coordinator': 'Lisa Chen',
          'special-setup': 'Stage for live music, projection screen, reception area',
          'vendor-coordination': 'Catering arrives at 13:30, musicians at 13:45'
        });
        
        await venueHelpers.submitForm('confirm-preparation');
      });
    });
  });
});