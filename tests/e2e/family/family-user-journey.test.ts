import { test, expect } from '@playwright/test';
import { TestHelpers, FamilyUserData } from '../utils/test-helpers';

/**
 * Comprehensive Family User Journey Tests
 * Tests the complete funeral planning workflow from registration to completion
 */

test.describe('Family User Journey - Complete Funeral Planning Workflow', () => {
  let helpers: TestHelpers;
  let familyUserData: FamilyUserData;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    familyUserData = TestHelpers.generateFamilyUser();
  });

  test('Complete new family user journey - Registration to funeral completion', async ({ page }) => {
    // Step 1: Registration and Onboarding
    await test.step('Register new family user', async () => {
      await helpers.registerFamilyUser(familyUserData);
      await helpers.assertPageURL('/dashboard');
      await helpers.assertElementVisible('[data-testid="family-dashboard"]');
    });

    // Step 2: Complete onboarding process
    await test.step('Complete onboarding process', async () => {
      await helpers.waitForElement('[data-testid="onboarding-wizard"]');
      
      // Fill out initial information
      await helpers.fillForm({
        'preferred-service-type': 'Traditional Burial',
        'budget-range': '15000',
        'preferred-location': 'Amsterdam',
        'special-requirements': 'Religious ceremony required'
      });
      
      await helpers.submitForm('onboarding-next');
      
      // Select preferred date and time
      await helpers.waitForElement('[data-testid="date-picker"]');
      await page.click('[data-testid="date-picker"]');
      await page.click('[data-testid="available-date"]:first-child');
      await page.click('[data-testid="time-slot"]:first-child');
      
      await helpers.submitForm('complete-onboarding');
      await helpers.waitForToast('Onboarding completed successfully');
    });

    // Step 3: Browse and select funeral director
    await test.step('Browse and select funeral director', async () => {
      await helpers.navigateToSection('directors');
      await helpers.waitForElement('[data-testid="director-list"]');
      
      // Apply filters
      await page.click('[data-testid="filter-location"]');
      await page.click('[data-testid="location-amsterdam"]');
      await page.click('[data-testid="filter-specialization"]');
      await page.click('[data-testid="specialization-traditional"]');
      
      // Select first available director
      await page.click('[data-testid="director-card"]:first-child [data-testid="view-profile"]');
      await helpers.waitForElement('[data-testid="director-profile"]');
      
      // Review director details and select
      await helpers.assertElementVisible('[data-testid="director-rating"]');
      await helpers.assertElementVisible('[data-testid="director-reviews"]');
      await page.click('[data-testid="select-director"]');
      await helpers.waitForToast('Director selected successfully');
    });

    // Step 4: Browse and book venue
    await test.step('Browse and book venue', async () => {
      await helpers.navigateToSection('venues');
      await helpers.waitForElement('[data-testid="venue-list"]');
      
      // Apply venue filters
      await page.click('[data-testid="filter-capacity"]');
      await page.selectOption('[data-testid="capacity-select"]', '100');
      await page.click('[data-testid="filter-amenities"]');
      await page.check('[data-testid="amenity-parking"]');
      await page.check('[data-testid="amenity-catering"]');
      
      // Select venue
      await page.click('[data-testid="venue-card"]:first-child [data-testid="view-venue"]');
      await helpers.waitForElement('[data-testid="venue-details"]');
      
      // Check availability and book
      await page.click('[data-testid="check-availability"]');
      await helpers.waitForElement('[data-testid="availability-calendar"]');
      await page.click('[data-testid="available-slot"]:first-child');
      await page.click('[data-testid="book-venue"]');
      
      // Confirm booking details
      await helpers.waitForElement('[data-testid="booking-confirmation"]');
      await helpers.fillForm({
        'guest-count': '75',
        'special-requests': 'Need wheelchair accessibility'
      });
      await helpers.submitForm('confirm-booking');
      await helpers.waitForToast('Venue booked successfully');
    });

    // Step 5: Upload and manage documents
    await test.step('Upload and manage documents', async () => {
      await helpers.navigateToSection('documents');
      await helpers.waitForElement('[data-testid="document-vault"]');
      
      // Upload death certificate
      await page.click('[data-testid="upload-document"]');
      await page.selectOption('[data-testid="document-type"]', 'death-certificate');
      await helpers.uploadFile('[data-testid="file-input"]', 'tests/e2e/fixtures/sample-death-certificate.pdf');
      await helpers.submitForm('upload-confirm');
      await helpers.waitForToast('Document uploaded successfully');
      
      // Upload identification documents
      await page.click('[data-testid="upload-document"]');
      await page.selectOption('[data-testid="document-type"]', 'identification');
      await helpers.uploadFile('[data-testid="file-input"]', 'tests/e2e/fixtures/sample-id.pdf');
      await helpers.submitForm('upload-confirm');
      
      // Verify documents are listed
      await helpers.assertElementVisible('[data-testid="document-list"]');
      await helpers.assertElementCount('[data-testid="document-item"]', 2);
    });

    // Step 6: Communicate with director
    await test.step('Communicate with director through chat', async () => {
      await helpers.navigateToSection('chat');
      await helpers.waitForElement('[data-testid="chat-interface"]');
      
      // Start conversation with director
      await page.click('[data-testid="director-chat"]');
      await helpers.waitForElement('[data-testid="chat-messages"]');
      
      // Send message
      const messageText = 'Hello, I wanted to discuss the ceremony details and timeline.';
      await page.fill('[data-testid="message-input"]', messageText);
      await page.click('[data-testid="send-message"]');
      
      // Verify message was sent
      await helpers.waitForText(messageText);
      await helpers.assertElementVisible(`[data-testid="message"]:has-text("${messageText}")`);
    });

    // Step 7: Review and finalize arrangements
    await test.step('Review and finalize funeral arrangements', async () => {
      await helpers.navigateToSection('arrangements');
      await helpers.waitForElement('[data-testid="arrangements-summary"]');
      
      // Review all selections
      await helpers.assertElementVisible('[data-testid="selected-director"]');
      await helpers.assertElementVisible('[data-testid="selected-venue"]');
      await helpers.assertElementVisible('[data-testid="ceremony-details"]');
      
      // Make final adjustments
      await page.click('[data-testid="edit-ceremony-details"]');
      await helpers.fillForm({
        'ceremony-duration': '90',
        'music-preference': 'Traditional hymns',
        'flower-arrangement': 'White lilies and roses'
      });
      await helpers.submitForm('save-changes');
      
      // Finalize arrangements
      await page.click('[data-testid="finalize-arrangements"]');
      await helpers.waitForElement('[data-testid="finalization-confirmation"]'); 
      await page.check('[data-testid="terms-agreement"]');
      await helpers.submitForm('confirm-finalization');
      await helpers.waitForToast('Arrangements finalized successfully');
    });

    // Step 8: Process payment
    await test.step('Process payment for services', async () => {
      await helpers.navigateToSection('payments');
      await helpers.waitForElement('[data-testid="payment-summary"]');
      
      // Review payment breakdown
      await helpers.assertElementVisible('[data-testid="director-fee"]');
      await helpers.assertElementVisible('[data-testid="venue-fee"]');
      await helpers.assertElementVisible('[data-testid="total-amount"]');
      
      // Process payment
      await page.click('[data-testid="proceed-payment"]');
      await helpers.waitForElement('[data-testid="payment-form"]');
      
      // Fill payment details (test data)
      await helpers.fillForm({
        'card-number': '4111111111111111',
        'expiry-date': '12/25',
        'cvv': '123',
        'cardholder-name': `${familyUserData.firstName} ${familyUserData.lastName}`
      });
      
      await helpers.submitForm('process-payment');
      await helpers.waitForToast('Payment processed successfully');
      
      // Verify payment confirmation
      await helpers.waitForElement('[data-testid="payment-confirmation"]');
      await helpers.assertElementVisible('[data-testid="receipt-number"]');
    });

    // Step 9: Monitor funeral progress
    await test.step('Monitor funeral planning progress', async () => {
      await helpers.navigateToSection('dashboard');
      await helpers.waitForElement('[data-testid="progress-tracker"]');
      
      // Verify all major steps are completed
      await helpers.assertElementVisible('[data-testid="step-completed"][data-step="registration"]');
      await helpers.assertElementVisible('[data-testid="step-completed"][data-step="director-selection"]');
      await helpers.assertElementVisible('[data-testid="step-completed"][data-step="venue-booking"]');
      await helpers.assertElementVisible('[data-testid="step-completed"][data-step="arrangements"]');
      await helpers.assertElementVisible('[data-testid="step-completed"][data-step="payment"]');
      
      // Check upcoming milestones
      await helpers.assertElementVisible('[data-testid="upcoming-milestones"]');
      await helpers.assertElementVisible('[data-testid="ceremony-countdown"]');
    });

    // Take final screenshot for documentation
    await helpers.takeScreenshot('family-user-journey-complete');
  });

  test('Family user - Document sharing with director', async ({ page }) => {
    await test.step('Login as family user', async () => {
      await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
    });

    await test.step('Share document with director', async () => {
      await helpers.navigateToSection('documents');
      
      // Select document to share
      await page.click('[data-testid="document-item"]:first-child');
      await page.click('[data-testid="share-document"]');
      
      // Select director to share with
      await helpers.waitForElement('[data-testid="share-modal"]');
      await page.click('[data-testid="share-with-director"]');
      await page.fill('[data-testid="share-message"]', 'Please review this document for our upcoming meeting.');
      
      await helpers.submitForm('send-share');
      await helpers.waitForToast('Document shared successfully');
      
      // Verify sharing confirmation
      await helpers.assertElementVisible('[data-testid="shared-indicator"]');
    });
  });

  test('Family user - Emergency contact and urgent communication', async ({ page }) => {
    await test.step('Login as family user', async () => {
      await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
    });

    await test.step('Use emergency contact feature', async () => {
      await helpers.navigateToSection('support');
      
      // Access emergency contact
      await page.click('[data-testid="emergency-contact"]');
      await helpers.waitForElement('[data-testid="emergency-form"]');
      
      // Fill urgent request
      await helpers.fillForm({
        'urgency-level': 'high',
        'issue-type': 'ceremony-change',
        'description': 'Need to postpone ceremony due to family emergency',
        'contact-method': 'phone'
      });
      
      await helpers.submitForm('submit-urgent-request');
      await helpers.waitForToast('Urgent request submitted successfully');
      
      // Verify confirmation and expected response time
      await helpers.assertElementVisible('[data-testid="urgent-request-confirmation"]');
      await helpers.assertElementVisible('[data-testid="response-time-estimate"]');
    });
  });

  test('Family user - Mobile experience optimization', async ({ page }) => {
    await test.step('Switch to mobile view', async () => {
      await helpers.testMobileView();
    });

    await test.step('Login on mobile', async () => {
      await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
    });

    await test.step('Navigate mobile interface', async () => {
      // Test mobile navigation
      await page.click('[data-testid="mobile-menu-toggle"]');
      await helpers.waitForElement('[data-testid="mobile-menu"]');
      
      // Test touch interactions
      await page.click('[data-testid="mobile-nav-documents"]');
      await helpers.waitForElement('[data-testid="document-vault"]');
      
      // Test mobile document upload
      await page.click('[data-testid="mobile-upload-btn"]');
      await helpers.waitForElement('[data-testid="mobile-upload-modal"]');
      
      // Verify mobile-optimized layout
      await helpers.assertElementVisible('[data-testid="mobile-optimized-layout"]');
    });
  });

  test('Family user - Multi-language support', async ({ page }) => {
    await test.step('Login as family user', async () => {
      await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
    });

    await test.step('Test language switching', async () => {
      // Switch to Dutch
      await page.click('[data-testid="language-selector"]');
      await page.click('[data-testid="language-nl"]');
      
      // Verify Dutch interface
      await helpers.waitForText('Dashboard'); // Should change to Dutch equivalent
      await helpers.assertElementVisible('[data-testid="nl-interface"]');
      
      // Switch to Arabic (RTL test)
      await page.click('[data-testid="language-selector"]');
      await page.click('[data-testid="language-ar"]');
      
      // Verify RTL layout
      await helpers.assertElementVisible('[data-testid="rtl-layout"]');
      
      // Switch back to English
      await page.click('[data-testid="language-selector"]');
      await page.click('[data-testid="language-en"]');
    });
  });
});