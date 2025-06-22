import { test, expect } from '@playwright/test';
import { TestHelpers, DirectorData } from '../utils/test-helpers';

/**
 * Comprehensive Director Workflow Tests
 * Tests complete funeral director operations from client onboarding to service completion
 */

test.describe('Director Workflow - Complete Client Management', () => {
  let helpers: TestHelpers;
  let directorData: DirectorData;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    directorData = TestHelpers.generateDirectorData();
  });

  test('Complete director workflow - Client onboarding to service completion', async ({ page }) => {
    // Step 1: Director login and dashboard overview
    await test.step('Login as director and review dashboard', async () => {
      await helpers.signIn('test-director@farewelly.test', 'TestPassword123!');
      await helpers.assertPageURL('/dashboard');
      await helpers.assertElementVisible('[data-testid="director-dashboard"]');
      
      // Review key metrics
      await helpers.assertElementVisible('[data-testid="active-clients-count"]');
      await helpers.assertElementVisible('[data-testid="upcoming-services-count"]');
      await helpers.assertElementVisible('[data-testid="revenue-metrics"]');
      await helpers.assertElementVisible('[data-testid="pending-tasks"]');
    });

    // Step 2: Accept new client inquiry
    await test.step('Accept and onboard new client', async () => {
      await helpers.navigateToSection('clients');
      await helpers.waitForElement('[data-testid="client-list"]');
      
      // Check for new inquiries
      await page.click('[data-testid="new-inquiries-tab"]');
      await helpers.waitForElement('[data-testid="inquiry-list"]');
      
      // Review inquiry details
      await page.click('[data-testid="inquiry-item"]:first-child');
      await helpers.waitForElement('[data-testid="inquiry-details"]');
      
      // Accept the inquiry
      await page.click('[data-testid="accept-inquiry"]');
      await helpers.waitForElement('[data-testid="acceptance-form"]');
      
      await helpers.fillForm({
        'initial-consultation-date': '2024-07-01',
        'initial-consultation-time': '14:00',
        'estimated-service-date': '2024-07-15',
        'preliminary-quote': '12500'
      });
      
      await helpers.submitForm('confirm-acceptance');
      await helpers.waitForToast('Client inquiry accepted successfully');
    });

    // Step 3: Conduct initial consultation
    await test.step('Conduct initial consultation with client', async () => {
      await helpers.navigateToSection('calendar');
      await helpers.waitForElement('[data-testid="calendar-view"]');
      
      // Find consultation appointment
      await page.click('[data-testid="consultation-appointment"]');
      await helpers.waitForElement('[data-testid="appointment-details"]');
      
      // Start consultation
      await page.click('[data-testid="start-consultation"]');
      await helpers.waitForElement('[data-testid="consultation-form"]');
      
      // Fill consultation details
      await helpers.fillForm({
        'service-type': 'traditional-burial',
        'location-preference': 'amsterdam',
        'budget-discussed': '15000',
        'family-size': '50',
        'special-requirements': 'Religious ceremony, flower arrangements',
        'consultation-notes': 'Family prefers Saturday service, needs kosher catering options'
      });
      
      // Add consultation outcomes
      await page.click('[data-testid="add-outcome"]');
      await helpers.fillForm({
        'outcome-type': 'quote-provided',
        'outcome-details': 'Provided detailed quote for traditional burial service',
        'follow-up-required': 'true',
        'follow-up-date': '2024-06-25'
      });
      
      await helpers.submitForm('complete-consultation');
      await helpers.waitForToast('Consultation completed successfully');
    });

    // Step 4: Create detailed service plan
    await test.step('Create comprehensive service plan', async () => {
      await helpers.navigateToSubsection('clients', 'active');
      await page.click('[data-testid="client-item"]:first-child');
      await helpers.waitForElement('[data-testid="client-profile"]');
      
      // Navigate to service planning
      await page.click('[data-testid="create-service-plan"]');
      await helpers.waitForElement('[data-testid="service-planning-wizard"]');
      
      // Step 1: Service details
      await helpers.fillForm({
        'service-date': '2024-07-15',
        'service-time': '11:00',
        'service-duration': '120',
        'service-location': 'synagogue',
        'burial-location': 'city-cemetery'
      });
      await helpers.submitForm('next-step');
      
      // Step 2: Venue coordination
      await helpers.waitForElement('[data-testid="venue-selection"]');
      await page.click('[data-testid="search-venues"]');
      await helpers.waitForElement('[data-testid="venue-results"]');
      
      // Filter and select venue
      await page.fill('[data-testid="venue-search"]', 'Amsterdam Synagogue');
      await page.click('[data-testid="venue-capacity-filter"]');
      await page.selectOption('[data-testid="capacity-select"]', '75');
      
      await page.click('[data-testid="venue-option"]:first-child');
      await page.click('[data-testid="check-venue-availability"]');
      await helpers.waitForElement('[data-testid="availability-results"]');
      await page.click('[data-testid="book-venue"]');
      await helpers.submitForm('confirm-venue-booking');
      
      // Step 3: Service providers
      await helpers.waitForElement('[data-testid="service-providers"]');
      await page.check('[data-testid="provider-catering"]');
      await page.check('[data-testid="provider-flowers"]');
      await page.check('[data-testid="provider-music"]');
      
      // Configure each provider
      await page.click('[data-testid="configure-catering"]');
      await helpers.fillForm({
        'catering-type': 'kosher',
        'guest-count': '50',
        'meal-type': 'reception'
      });
      await helpers.submitForm('save-catering');
      
      await helpers.submitForm('complete-service-plan');
      await helpers.waitForToast('Service plan created successfully');
    });

    // Step 5: Coordinate with venues and vendors
    await test.step('Coordinate with venues and vendors', async () => {
      await helpers.navigateToSection('coordination');
      await helpers.waitForElement('[data-testid="coordination-dashboard"]');
      
      // Send venue confirmation
      await page.click('[data-testid="venue-coordination"]');
      await helpers.waitForElement('[data-testid="venue-messages"]');
      
      const venueMessage = 'Confirming booking for July 15th, 11:00 AM. Please confirm setup time and access details.';
      await page.fill('[data-testid="message-input"]', venueMessage);
      await page.click('[data-testid="send-message"]');
      
      // Coordinate with catering
      await page.click('[data-testid="catering-coordination"]');
      await helpers.waitForElement('[data-testid="catering-messages"]');
      
      const cateringMessage = 'Please confirm kosher menu for 50 guests. Service starts at 11 AM, reception at 1 PM.';
      await page.fill('[data-testid="message-input"]', cateringMessage);
      await page.click('[data-testid="send-message"]');
      
      // Update coordination status
      await page.click('[data-testid="update-coordination-status"]');
      await helpers.fillForm({
        'venue-status': 'confirmed',
        'catering-status': 'pending-confirmation',
        'flowers-status': 'confirmed',
        'music-status': 'confirmed'
      });
      await helpers.submitForm('save-status');
    });

    // Step 6: Document management and client communication
    await test.step('Manage documents and communicate with client', async () => {
      await helpers.navigateToSubsection('clients', 'documents');
      await helpers.waitForElement('[data-testid="client-documents"]');
      
      // Review client-uploaded documents
      await helpers.assertElementVisible('[data-testid="death-certificate"]');
      await helpers.assertElementVisible('[data-testid="identification-docs"]');
      
      // Upload director documents
      await page.click('[data-testid="upload-director-document"]');
      await page.selectOption('[data-testid="document-type"]', 'service-contract');
      await helpers.uploadFile('[data-testid="file-input"]', 'tests/e2e/fixtures/sample-contract.pdf');
      await helpers.fillForm({
        'document-description': 'Service agreement and terms',
        'requires-signature': 'true'
      });
      await helpers.submitForm('upload-document');
      
      // Send document to client for signing
      await page.click('[data-testid="send-for-signature"]');
      await helpers.waitForToast('Document sent for client signature');
      
      // Communicate with client via chat
      await page.click('[data-testid="client-chat"]');
      await helpers.waitForElement('[data-testid="chat-interface"]');
      
      const clientMessage = 'I\'ve uploaded the service contract for your review and signature. Please let me know if you have any questions about the arrangements.';
      await page.fill('[data-testid="message-input"]', clientMessage);
      await page.click('[data-testid="send-message"]');
      
      await helpers.waitForText(clientMessage);
    });

    // Step 7: Calendar and scheduling management
    await test.step('Manage calendar and scheduling', async () => {
      await helpers.navigateToSection('calendar');
      await helpers.waitForElement('[data-testid="calendar-view"]');
      
      // Switch to week view for detailed planning
      await page.click('[data-testid="week-view"]');
      
      // Add preparation tasks
      await page.click('[data-testid="add-calendar-event"]');
      await helpers.waitForElement('[data-testid="event-form"]');
      
      await helpers.fillForm({
        'event-type': 'preparation-task',
        'event-title': 'Venue setup and final preparations',
        'event-date': '2024-07-15',
        'event-time': '08:00',
        'event-duration': '180',
        'event-description': 'Coordinate venue setup, flower arrangements, and final checks'
      });
      await helpers.submitForm('save-event');
      
      // Add service event
      await page.click('[data-testid="add-calendar-event"]');
      await helpers.fillForm({
        'event-type': 'funeral-service',
        'event-title': 'Memorial Service - Smith Family',
        'event-date': '2024-07-15',
        'event-time': '11:00',
        'event-duration': '120',
        'attendees': '50',
        'location': 'Amsterdam Synagogue'
      });
      await helpers.submitForm('save-event');
      
      // Set reminders
      await page.click('[data-testid="set-reminder"]');
      await helpers.fillForm({
        'reminder-type': 'preparation-checklist',
        'reminder-time': '24-hours-before'
      });
      await helpers.submitForm('save-reminder');
    });

    // Step 8: Financial management and invoicing
    await test.step('Handle financial aspects and invoicing', async () => {
      await helpers.navigateToSection('finances');
      await helpers.waitForElement('[data-testid="financial-dashboard"]');
      
      // Generate invoice
      await page.click('[data-testid="generate-invoice"]');
      await helpers.waitForElement('[data-testid="invoice-form"]');
      
      // Add service items
      await page.click('[data-testid="add-service-item"]');
      await helpers.fillForm({
        'service-item': 'Traditional Burial Service',
        'service-amount': '8500'
      });
      
      await page.click('[data-testid="add-service-item"]');
      await helpers.fillForm({
        'service-item': 'Venue Rental',
        'service-amount': '2500'
      });
      
      await page.click('[data-testid="add-service-item"]');
      await helpers.fillForm({
        'service-item': 'Catering Services',
        'service-amount': '1800'
      });
      
      await page.click('[data-testid="add-service-item"]');
      await helpers.fillForm({
        'service-item': 'Flower Arrangements',
        'service-amount': '700'
      });
      
      // Review total and send invoice
      await helpers.assertElementVisible('[data-testid="invoice-total"]');
      await page.fill('[data-testid="payment-terms"]', 'Net 15 days');
      await page.fill('[data-testid="invoice-notes"]', 'Thank you for choosing our services during this difficult time.');
      
      await helpers.submitForm('send-invoice');
      await helpers.waitForToast('Invoice sent successfully');
    });

    // Step 9: Final service coordination and execution
    await test.step('Execute final service coordination', async () => {
      // Final checklist review
      await helpers.navigateToSection('checklist');
      await helpers.waitForElement('[data-testid="service-checklist"]');
      
      // Complete pre-service tasks
      const checklistItems = [
        'venue-confirmed',
        'catering-confirmed',
        'flowers-delivered',
        'music-setup',
        'program-printed',
        'family-contacted',
        'documents-signed'
      ];
      
      for (const item of checklistItems) {
        await page.check(`[data-testid="checklist-${item}"]`);
      }
      
      // Add final notes
      await page.fill('[data-testid="final-notes"]', 'All arrangements confirmed. Service ready to proceed as planned.');
      
      await helpers.submitForm('mark-service-ready');
      await helpers.waitForToast('Service marked as ready');
      
      // Post-service follow up
      await page.click('[data-testid="schedule-followup"]');
      await helpers.fillForm({
        'followup-type': 'satisfaction-survey',
        'followup-date': '2024-07-17',
        'followup-method': 'email'
      });
      await helpers.submitForm('schedule-followup');
    });

    // Take screenshot of completed workflow
    await helpers.takeScreenshot('director-workflow-complete');
  });

  test('Director - Multi-client management and scheduling conflicts', async ({ page }) => {
    await test.step('Login as director', async () => {
      await helpers.signIn('test-director@farewelly.test', 'TestPassword123!');
    });

    await test.step('Handle scheduling conflicts', async () => {
      await helpers.navigateToSection('calendar');
      
      // Try to book overlapping appointments
      await page.click('[data-testid="add-calendar-event"]');
      await helpers.fillForm({
        'event-type': 'consultation',
        'event-date': '2024-07-15',
        'event-time': '11:30',
        'event-duration': '90'
      });
      
      // Should detect conflict
      await helpers.submitForm('save-event');
      await helpers.waitForElement('[data-testid="conflict-warning"]');
      
      // Resolve conflict by suggesting alternative times
      await page.click('[data-testid="suggest-alternatives"]');
      await helpers.waitForElement('[data-testid="alternative-times"]');
      await page.click('[data-testid="alternative-time"]:first-child');
      await helpers.submitForm('confirm-alternative');
    });

    await test.step('Manage multiple client priorities', async () => {
      await helpers.navigateToSection('clients');
      
      // View urgent client needs
      await page.click('[data-testid="urgent-clients-filter"]');
      await helpers.assertElementVisible('[data-testid="urgent-client-list"]');
      
      // Prioritize urgent client
      await page.click('[data-testid="urgent-client"]:first-child');
      await page.click('[data-testid="mark-high-priority"]');
      await helpers.waitForToast('Client marked as high priority');
    });
  });

  test('Director - Vendor network management', async ({ page }) => {
    await test.step('Login as director', async () => {
      await helpers.signIn('test-director@farewelly.test', 'TestPassword123!');
    });

    await test.step('Manage preferred vendor network', async () => {
      await helpers.navigateToSection('vendors');
      await helpers.waitForElement('[data-testid="vendor-network"]');
      
      // Add new vendor
      await page.click('[data-testid="add-vendor"]');
      await helpers.fillForm({
        'vendor-name': 'Amsterdam Flowers & More',
        'vendor-type': 'florist',
        'contact-person': 'Maria van der Berg',
        'phone': '+31 20 123 4567',
        'email': 'maria@amsterdamflowers.nl',
        'services-offered': 'Funeral arrangements, sympathy flowers, memorial wreaths',
        'pricing-tier': 'mid-range',
        'rating': '4.5'
      });
      await helpers.submitForm('add-vendor');
      
      // Set vendor preferences
      await page.click('[data-testid="vendor-preferences"]');
      await page.check('[data-testid="preferred-vendor"]');
      await page.check('[data-testid="auto-quote-request"]');
      await helpers.submitForm('save-preferences');
    });

    await test.step('Coordinate with multiple vendors for single service', async () => {
      await helpers.navigateToSubsection('clients', 'active');
      await page.click('[data-testid="client-item"]:first-child');
      
      // Request quotes from multiple vendors
      await page.click('[data-testid="request-vendor-quotes"]');
      await page.check('[data-testid="vendor-florist-1"]');
      await page.check('[data-testid="vendor-florist-2"]');
      await page.check('[data-testid="vendor-catering-1"]');
      
      await helpers.fillForm({
        'service-date': '2024-07-15',
        'guest-count': '75',
        'special-requirements': 'Kosher catering, white flower arrangements'
      });
      
      await helpers.submitForm('send-quote-requests');
      await helpers.waitForToast('Quote requests sent to vendors');
    });
  });

  test('Director - Performance analytics and business insights', async ({ page }) => {
    await test.step('Login as director', async () => {
      await helpers.signIn('test-director@farewelly.test', 'TestPassword123!');
    });

    await test.step('Review business analytics', async () => {
      await helpers.navigateToSection('analytics');
      await helpers.waitForElement('[data-testid="analytics-dashboard"]');
      
      // Review key metrics
      await helpers.assertElementVisible('[data-testid="services-completed-metric"]');
      await helpers.assertElementVisible('[data-testid="client-satisfaction-metric"]');
      await helpers.assertElementVisible('[data-testid="revenue-trend"]');
      await helpers.assertElementVisible('[data-testid="average-service-value"]');
      
      // Filter by date range
      await page.click('[data-testid="date-range-filter"]');
      await page.click('[data-testid="last-quarter"]');
      await helpers.waitForElement('[data-testid="filtered-metrics"]');
      
      // Export analytics report
      await page.click('[data-testid="export-analytics"]');
      await page.selectOption('[data-testid="export-format"]', 'pdf');
      await helpers.submitForm('download-report');
    });

    await test.step('Review client feedback and ratings', async () => {
      await page.click('[data-testid="client-feedback-tab"]');
      await helpers.waitForElement('[data-testid="feedback-list"]');
      
      // Review individual feedback
      await page.click('[data-testid="feedback-item"]:first-child');
      await helpers.assertElementVisible('[data-testid="feedback-details"]');
      
      // Respond to feedback
      await page.click('[data-testid="respond-to-feedback"]');
      await page.fill('[data-testid="response-text"]', 'Thank you for your feedback. We are glad we could provide comfort during this difficult time.');
      await helpers.submitForm('send-response');
    });
  });
});