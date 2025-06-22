import { test, expect } from '@playwright/test';
import { TestHelpers, FamilyUserData, DirectorData, VenueData } from '../utils/test-helpers';

/**
 * Full System Integration Tests
 * Tests complete workflows across all user types with data consistency validation
 */

test.describe('Full System Integration - Cross-User Workflows', () => {
  let familyHelpers: TestHelpers;
  let directorHelpers: TestHelpers;
  let venueHelpers: TestHelpers;
  
  let familyUserData: FamilyUserData;
  let directorData: DirectorData;
  let venueData: VenueData;

  test.beforeEach(async ({ browser }) => {
    // Create separate contexts for each user type to simulate real-world usage
    const familyContext = await browser.newContext();
    const directorContext = await browser.newContext();
    const venueContext = await browser.newContext();

    const familyPage = await familyContext.newPage();
    const directorPage = await directorContext.newPage();
    const venuePage = await venueContext.newPage();

    familyHelpers = new TestHelpers(familyPage);
    directorHelpers = new TestHelpers(directorPage);
    venueHelpers = new TestHelpers(venuePage);

    familyUserData = TestHelpers.generateFamilyUser();
    directorData = TestHelpers.generateDirectorData();
    venueData = TestHelpers.generateVenueData();
  });

  test('Complete end-to-end integration - Family inquiry to service completion', async () => {
    let sharedServiceId: string;
    let sharedBookingId: string;

    // Step 1: Family user initiates funeral planning
    await test.step('Family user creates funeral planning request', async () => {
      // Register family user
      familyUserData.email = `integration-family-${Date.now()}@test.com`;
      await familyHelpers.registerFamilyUser(familyUserData);
      
      // Create funeral planning request
      await familyHelpers.navigateToSection('planning');
      await familyHelpers.waitForElement('[data-testid="planning-wizard"]');
      
      await familyHelpers.fillForm({
        'service-type': 'traditional-burial',
        'preferred-date': '2024-07-15',
        'budget': '15000',
        'location': 'amsterdam',
        'guest-count': '75',
        'special-requirements': 'Religious ceremony, vegetarian catering'
      });
      
      await familyHelpers.submitForm('create-planning-request');
      await familyHelpers.waitForToast('Planning request created successfully');
      
      // Extract service ID for cross-user validation
      sharedServiceId = await familyHelpers.page.getAttribute('[data-testid="service-id"]', 'data-value') || '';
      expect(sharedServiceId).toBeTruthy();
    });

    // Step 2: Director receives and responds to inquiry
    await test.step('Director receives inquiry and creates service plan', async () => {
      // Login as director
      await directorHelpers.signIn('test-director@farewelly.test', 'TestPassword123!');
      
      // Check for new inquiries
      await directorHelpers.navigateToSection('inquiries');
      await directorHelpers.waitForElement('[data-testid="inquiry-list"]');
      
      // Find the specific inquiry created by family user
      await directorHelpers.page.click(`[data-testid="inquiry-${sharedServiceId}"]`);
      await directorHelpers.waitForElement('[data-testid="inquiry-details"]');
      
      // Validate inquiry data matches family input
      await expect(directorHelpers.page.locator('[data-testid="inquiry-service-type"]')).toContainText('traditional-burial');
      await expect(directorHelpers.page.locator('[data-testid="inquiry-budget"]')).toContainText('15000');
      await expect(directorHelpers.page.locator('[data-testid="inquiry-location"]')).toContainText('amsterdam');
      
      // Accept inquiry and create service plan
      await directorHelpers.page.click('[data-testid="accept-inquiry"]');
      await directorHelpers.waitForElement('[data-testid="service-plan-form"]');
      
      await directorHelpers.fillForm({
        'service-date': '2024-07-15',
        'service-time': '11:00',
        'service-location': 'amsterdam-community-center',
        'burial-location': 'westerveld-cemetery',
        'estimated-cost': '14500',
        'director-notes': 'Traditional service with religious elements, vegetarian reception'
      });
      
      await directorHelpers.submitForm('create-service-plan');
      await directorHelpers.waitForToast('Service plan created successfully');
    });

    // Step 3: Venue receives booking request
    await test.step('Venue receives and processes booking request', async () => {
      // Login as venue
      await venueHelpers.signIn('test-venue@farewelly.test', 'TestPassword123!');
      
      // Check for new booking requests
      await venueHelpers.navigateToSection('bookings');
      await venueHelpers.waitForElement('[data-testid="booking-requests"]');
      
      // Find booking request related to the service
      await venueHelpers.page.click(`[data-testid="booking-request-${sharedServiceId}"]`);
      await venueHelpers.waitForElement('[data-testid="booking-details"]');
      
      // Validate booking details match director's plan
      await expect(venueHelpers.page.locator('[data-testid="booking-date"]')).toContainText('2024-07-15');
      await expect(venueHelpers.page.locator('[data-testid="booking-time"]')).toContainText('11:00');
      await expect(venueHelpers.page.locator('[data-testid="booking-guest-count"]')).toContainText('75');
      
      // Check availability and approve booking
      await venueHelpers.page.click('[data-testid="check-availability"]');
      await venueHelpers.waitForElement('[data-testid="availability-confirmed"]');
      
      await venueHelpers.page.click('[data-testid="approve-booking"]');
      await venueHelpers.fillForm({
        'venue-rate': '2000',
        'setup-fee': '150',
        'cleanup-fee': '100',
        'total-venue-cost': '2250'
      });
      
      await venueHelpers.submitForm('confirm-booking');
      await venueHelpers.waitForToast('Booking confirmed successfully');
      
      // Extract booking ID for validation
      sharedBookingId = await venueHelpers.page.getAttribute('[data-testid="booking-id"]', 'data-value') || '';
      expect(sharedBookingId).toBeTruthy();
    });

    // Step 4: Director updates service plan with venue confirmation
    await test.step('Director updates service plan with venue details', async () => {
      // Refresh director view to see venue confirmation
      await directorHelpers.page.reload();
      await directorHelpers.navigateToSection('services');
      
      // Find active service
      await directorHelpers.page.click(`[data-testid="service-${sharedServiceId}"]`);
      await directorHelpers.waitForElement('[data-testid="service-details"]');
      
      // Verify venue confirmation is reflected
      await expect(directorHelpers.page.locator('[data-testid="venue-status"]')).toContainText('confirmed');
      await expect(directorHelpers.page.locator('[data-testid="venue-cost"]')).toContainText('2250');
      
      // Update final service plan
      await directorHelpers.page.click('[data-testid="update-service-plan"]');
      await directorHelpers.fillForm({
        'final-service-cost': '16750',
        'payment-terms': 'Net 15 days',
        'service-coordinator': 'John Smith',
        'final-notes': 'All arrangements confirmed. Venue and catering secured.'
      });
      
      await directorHelpers.submitForm('finalize-service-plan');
      await directorHelpers.waitForToast('Service plan finalized');
    });

    // Step 5: Family user reviews and approves final arrangements
    await test.step('Family user reviews and approves final arrangements', async () => {
      // Refresh family view to see updated service plan
      await familyHelpers.page.reload();
      await familyHelpers.navigateToSection('arrangements');
      
      // Review finalized arrangements
      await familyHelpers.waitForElement('[data-testid="finalized-arrangements"]');
      
      // Validate all details are consistent
      await expect(familyHelpers.page.locator('[data-testid="service-date"]')).toContainText('2024-07-15');
      await expect(familyHelpers.page.locator('[data-testid="service-time"]')).toContainText('11:00');
      await expect(familyHelpers.page.locator('[data-testid="venue-name"]')).toContainText('amsterdam-community-center');
      await expect(familyHelpers.page.locator('[data-testid="total-cost"]')).toContainText('16750');
      
      // Approve arrangements
      await familyHelpers.page.click('[data-testid="approve-arrangements"]');
      await familyHelpers.waitForElement('[data-testid="approval-confirmation"]');
      
      await familyHelpers.page.check('[data-testid="terms-accepted"]');
      await familyHelpers.page.fill('[data-testid="approval-signature"]', `${familyUserData.firstName} ${familyUserData.lastName}`);
      
      await familyHelpers.submitForm('confirm-approval');
      await familyHelpers.waitForToast('Arrangements approved successfully');
    });

    // Step 6: Process payment integration
    await test.step('Process payment across the system', async () => {
      // Family initiates payment
      await familyHelpers.navigateToSection('payment');
      await familyHelpers.waitForElement('[data-testid="payment-summary"]');
      
      // Validate payment breakdown
      await expect(familyHelpers.page.locator('[data-testid="director-fee"]')).toContainText('14500');
      await expect(familyHelpers.page.locator('[data-testid="venue-fee"]')).toContainText('2250');
      await expect(familyHelpers.page.locator('[data-testid="total-due"]')).toContainText('16750');
      
      // Process payment
      await familyHelpers.page.click('[data-testid="pay-now"]');
      await familyHelpers.waitForElement('[data-testid="payment-form"]');
      
      await familyHelpers.fillForm({
        'card-number': '4111111111111111',
        'expiry': '12/25',
        'cvv': '123',
        'cardholder-name': `${familyUserData.firstName} ${familyUserData.lastName}`
      });
      
      await familyHelpers.submitForm('process-payment');
      await familyHelpers.waitForToast('Payment processed successfully');
      
      // Verify payment confirmation across all user types
      const paymentId = await familyHelpers.page.getAttribute('[data-testid="payment-id"]', 'data-value');
      
      // Director should see payment confirmation
      await directorHelpers.page.reload();
      await directorHelpers.navigateToSection('payments');
      await expect(directorHelpers.page.locator(`[data-testid="payment-${paymentId}"]`)).toBeVisible();
      
      // Venue should see payment confirmation
      await venueHelpers.page.reload();
      await venueHelpers.navigateToSection('payments');
      await expect(venueHelpers.page.locator(`[data-testid="payment-${paymentId}"]`)).toBeVisible();
    });

    // Step 7: Real-time communication integration
    await test.step('Test real-time communication between all parties', async () => {
      // Family sends message to director
      await familyHelpers.navigateToSection('messages');
      await familyHelpers.page.click('[data-testid="message-director"]');
      
      const familyMessage = 'Thank you for all the arrangements. We have one last request about the music selection.';
      await familyHelpers.page.fill('[data-testid="message-input"]', familyMessage);
      await familyHelpers.page.click('[data-testid="send-message"]');
      
      // Director should receive message in real-time
      await directorHelpers.navigateToSection('messages');
      await directorHelpers.waitForElement(`[data-testid="message"]:has-text("${familyMessage}")`);
      
      // Director forwards venue-related question to venue
      await directorHelpers.page.click('[data-testid="forward-to-venue"]');
      const directorMessage = 'Family has a question about music setup. Please coordinate directly with them.';
      await directorHelpers.page.fill('[data-testid="forward-message"]', directorMessage);
      await directorHelpers.page.click('[data-testid="send-forward"]');
      
      // Venue should receive forwarded message
      await venueHelpers.navigateToSection('messages');
      await venueHelpers.waitForElement(`[data-testid="message"]:has-text("${directorMessage}")`);
    });

    // Step 8: Document sharing integration
    await test.step('Test document sharing across user types', async () => {
      // Family uploads important document
      await familyHelpers.navigateToSection('documents');
      await familyHelpers.page.click('[data-testid="upload-document"]');
      
      await familyHelpers.page.selectOption('[data-testid="document-type"]', 'special-instructions');
      await familyHelpers.uploadFile('[data-testid="file-input"]', 'tests/e2e/fixtures/special-instructions.pdf');
      
      // Share with director and venue
      await familyHelpers.page.check('[data-testid="share-with-director"]');
      await familyHelpers.page.check('[data-testid="share-with-venue"]');
      
      await familyHelpers.submitForm('upload-and-share');
      await familyHelpers.waitForToast('Document shared successfully');
      
      // Director should see shared document
      await directorHelpers.navigateToSection('documents');
      await directorHelpers.waitForElement('[data-testid="shared-document-special-instructions"]');
      
      // Venue should see shared document
      await venueHelpers.navigateToSection('documents');
      await venueHelpers.waitForElement('[data-testid="shared-document-special-instructions"]');
    });

    // Step 9: Service day coordination
    await test.step('Test service day coordination and updates', async () => {
      // Venue updates service status
      await venueHelpers.navigateToSection('operations');
      await venueHelpers.page.click('[data-testid="update-service-status"]');
      
      await venueHelpers.fillForm({
        'status': 'in-progress',
        'status-message': 'Service commenced on time, everything proceeding smoothly'
      });
      
      await venueHelpers.submitForm('update-status');
      
      // Director should see real-time status update
      await directorHelpers.page.reload();
      await directorHelpers.navigateToSection('services');
      await expect(directorHelpers.page.locator('[data-testid="service-status"]')).toContainText('in-progress');
      
      // Family should see status update
      await familyHelpers.page.reload();
      await familyHelpers.navigateToSection('service-tracker');
      await expect(familyHelpers.page.locator('[data-testid="service-status"]')).toContainText('in-progress');
    });

    // Step 10: Post-service completion and feedback
    await test.step('Complete service and collect feedback', async () => {
      // Venue marks service as completed
      await venueHelpers.page.click('[data-testid="complete-service"]');
      await venueHelpers.fillForm({
        'completion-notes': 'Service completed successfully, venue cleaned and restored',
        'satisfaction-rating': '5'
      });
      
      await venueHelpers.submitForm('mark-completed');
      
      // Director marks service as completed
      await directorHelpers.page.reload();
      await directorHelpers.navigateToSection('services');
      await directorHelpers.page.click('[data-testid="complete-service"]');
      
      await directorHelpers.fillForm({
        'service-outcome': 'successful',
        'client-satisfaction': 'high',
        'follow-up-required': 'false'
      });
      
      await directorHelpers.submitForm('complete-service');
      
      // Family provides feedback
      await familyHelpers.page.reload();
      await familyHelpers.navigateToSection('feedback');
      await familyHelpers.waitForElement('[data-testid="feedback-form"]');
      
      await familyHelpers.fillForm({
        'overall-rating': '5',
        'director-rating': '5',
        'venue-rating': '5',
        'feedback-comments': 'Exceptional service during our difficult time. Everything was handled professionally and compassionately.',
        'recommend-to-others': 'yes'
      });
      
      await familyHelpers.submitForm('submit-feedback');
      await familyHelpers.waitForToast('Feedback submitted successfully');
      
      // Verify feedback is visible to director and venue
      await directorHelpers.navigateToSection('feedback');
      await expect(directorHelpers.page.locator('[data-testid="recent-feedback"]')).toContainText('Exceptional service');
      
      await venueHelpers.navigateToSection('feedback');
      await expect(venueHelpers.page.locator('[data-testid="recent-feedback"]')).toContainText('Exceptional service');
    });

    // Take final screenshot
    await familyHelpers.takeScreenshot('full-integration-complete');
  });

  test('API-to-UI data consistency validation', async () => {
    await test.step('Validate API responses match UI display', async () => {
      await familyHelpers.signIn('test-family@farewelly.test', 'TestPassword123!');
      
      // Intercept API calls and validate responses
      await familyHelpers.page.route('**/api/family/dashboard', async route => {
        const response = await route.fetch();
        const data = await response.json();
        
        // Validate API response structure
        expect(data).toHaveProperty('activeServices');
        expect(data).toHaveProperty('upcomingAppointments');
        expect(data).toHaveProperty('documents');
        
        route.fulfill({ response });
      });
      
      await familyHelpers.navigateToSection('dashboard');
      
      // Validate UI elements match API data
      await familyHelpers.waitForElement('[data-testid="dashboard-data"]');
      
      // Cross-reference API data with UI display
      const apiResponse = await familyHelpers.makeAPICall('/api/family/dashboard');
      const apiData = await apiResponse.json();
      
      // Validate dashboard metrics
      const uiServiceCount = await familyHelpers.page.textContent('[data-testid="active-services-count"]');
      expect(uiServiceCount).toBe(apiData.activeServices.length.toString());
    });

    await test.step('Test real-time data synchronization', async () => {
      // Create data in one context
      await familyHelpers.navigateToSection('documents');
      await familyHelpers.page.click('[data-testid="upload-document"]');
      
      // Upload document
      await familyHelpers.page.selectOption('[data-testid="document-type"]', 'identification');
      await familyHelpers.uploadFile('[data-testid="file-input"]', 'tests/e2e/fixtures/test-document.pdf');
      await familyHelpers.submitForm('upload-document');
      
      // Verify document appears in director context immediately
      await directorHelpers.signIn('test-director@farewelly.test', 'TestPassword123!');
      await directorHelpers.navigateToSection('clients');
      await directorHelpers.page.click('[data-testid="family-client"]');
      await directorHelpers.navigateToSubsection('client', 'documents');
      
      // Should see the newly uploaded document
      await directorHelpers.waitForElement('[data-testid="document-identification"]');
    });
  });

  test('Cross-platform data consistency', async () => {
    await test.step('Test data consistency across different devices', async () => {
      // Desktop workflow
      await familyHelpers.testDesktopView();
      await familyHelpers.signIn('test-family@farewelly.test', 'TestPassword123!');
      
      // Create appointment on desktop
      await familyHelpers.navigateToSection('appointments');
      await familyHelpers.page.click('[data-testid="schedule-appointment"]');
      
      await familyHelpers.fillForm({
        'appointment-type': 'consultation',
        'appointment-date': '2024-07-10',
        'appointment-time': '14:00',
        'appointment-notes': 'Discussion about ceremony details'
      });
      
      await familyHelpers.submitForm('schedule-appointment');
      const appointmentId = await familyHelpers.page.getAttribute('[data-testid="appointment-id"]', 'data-value');
      
      // Switch to mobile view and verify appointment exists
      await familyHelpers.testMobileView();
      await familyHelpers.page.reload();
      
      await familyHelpers.navigateToSection('appointments');
      await expect(familyHelpers.page.locator(`[data-testid="appointment-${appointmentId}"]`)).toBeVisible();
      
      // Modify appointment on mobile
      await familyHelpers.page.click(`[data-testid="appointment-${appointmentId}"]`);
      await familyHelpers.page.click('[data-testid="edit-appointment"]');
      
      await familyHelpers.page.fill('[data-testid="appointment-notes"]', 'Updated notes from mobile device');
      await familyHelpers.submitForm('update-appointment');
      
      // Switch back to desktop and verify changes
      await familyHelpers.testDesktopView();
      await familyHelpers.page.reload();
      
      await familyHelpers.navigateToSection('appointments');
      await familyHelpers.page.click(`[data-testid="appointment-${appointmentId}"]`);
      
      await expect(familyHelpers.page.locator('[data-testid="appointment-notes"]')).toContainText('Updated notes from mobile device');
    });
  });

  test('Multi-tenant data isolation', async () => {
    await test.step('Verify data isolation between different families', async () => {
      // Create first family user
      const family1Data = TestHelpers.generateFamilyUser();
      family1Data.email = `family1-${Date.now()}@test.com`;
      await familyHelpers.registerFamilyUser(family1Data);
      
      // Upload document for family 1
      await familyHelpers.navigateToSection('documents');
      await familyHelpers.page.click('[data-testid="upload-document"]');
      await familyHelpers.uploadFile('[data-testid="file-input"]', 'tests/e2e/fixtures/family1-document.pdf');
      await familyHelpers.submitForm('upload-document');
      
      const family1DocumentId = await familyHelpers.page.getAttribute('[data-testid="document-id"]', 'data-value');
      
      // Create second family user in new context
      const newContext = await familyHelpers.page.context().browser()!.newContext();
      const newPage = await newContext.newPage();
      const family2Helpers = new TestHelpers(newPage);
      
      const family2Data = TestHelpers.generateFamilyUser();
      family2Data.email = `family2-${Date.now()}@test.com`;
      await family2Helpers.registerFamilyUser(family2Data);
      
      // Verify family 2 cannot see family 1's documents
      await family2Helpers.navigateToSection('documents');
      await expect(family2Helpers.page.locator(`[data-testid="document-${family1DocumentId}"]`)).not.toBeVisible();
      
      // Verify family 2 cannot access family 1's document directly via URL
      await family2Helpers.page.goto(`/documents/${family1DocumentId}`);
      await expect(family2Helpers.page.locator('[data-testid="access-denied"]')).toBeVisible();
    });
  });
});