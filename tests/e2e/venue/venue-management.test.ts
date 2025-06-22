import { test, expect } from '@playwright/test';
import { TestHelpers, VenueData } from '../utils/test-helpers';

/**
 * Comprehensive Venue Management Tests
 * Tests complete venue operations from availability management to booking completion
 */

test.describe('Venue Management - Complete Operations Workflow', () => {
  let helpers: TestHelpers;
  let venueData: VenueData;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    venueData = TestHelpers.generateVenueData();
  });

  test('Complete venue management workflow - Setup to booking completion', async ({ page }) => {
    // Step 1: Venue login and dashboard overview
    await test.step('Login as venue manager and review dashboard', async () => {
      await helpers.signIn('test-venue@farewelly.test', 'TestPassword123!');
      await helpers.assertPageURL('/dashboard');
      await helpers.assertElementVisible('[data-testid="venue-dashboard"]');
      
      // Review key metrics
      await helpers.assertElementVisible('[data-testid="booking-requests-count"]');
      await helpers.assertElementVisible('[data-testid="occupancy-rate"]');
      await helpers.assertElementVisible('[data-testid="revenue-metrics"]');
      await helpers.assertElementVisible('[data-testid="upcoming-events"]');
      await helpers.assertElementVisible('[data-testid="maintenance-schedule"]');
    });

    // Step 2: Manage venue availability calendar
    await test.step('Setup and manage venue availability', async () => {
      await helpers.navigateToSection('availability');
      await helpers.waitForElement('[data-testid="availability-calendar"]');
      
      // Set weekly availability patterns
      await page.click('[data-testid="setup-recurring-availability"]');
      await helpers.waitForElement('[data-testid="recurring-availability-form"]');
      
      // Configure weekday availability
      await page.check('[data-testid="weekday-monday"]');
      await page.check('[data-testid="weekday-tuesday"]');
      await page.check('[data-testid="weekday-wednesday"]');
      await page.check('[data-testid="weekday-thursday"]');
      await page.check('[data-testid="weekday-friday"]');
      await page.check('[data-testid="weekday-saturday"]');
      await page.check('[data-testid="weekday-sunday"]');
      
      // Set time slots
      await helpers.fillForm({
        'morning-start': '09:00',
        'morning-end': '12:00', 
        'afternoon-start': '13:00',
        'afternoon-end': '17:00',
        'evening-start': '18:00',
        'evening-end': '22:00'
      });
      
      await helpers.submitForm('save-recurring-availability');
      await helpers.waitForToast('Recurring availability set successfully');
      
      // Set special pricing for different time slots
      await page.click('[data-testid="pricing-management"]');
      await helpers.fillForm({
        'morning-rate': '150',
        'afternoon-rate': '200',
        'evening-rate': '250',
        'weekend-surcharge': '25',
        'holiday-surcharge': '50'
      });
      await helpers.submitForm('save-pricing');
      
      // Block unavailable dates
      await page.click('[data-testid="block-dates"]');
      await page.fill('[data-testid="block-start-date"]', '2024-07-01');
      await page.fill('[data-testid="block-end-date"]', '2024-07-03');
      await page.fill('[data-testid="block-reason"]', 'Scheduled maintenance and renovations');
      await helpers.submitForm('confirm-block');
    });

    // Step 3: Handle incoming booking requests
    await test.step('Process booking requests from directors', async () => {
      await helpers.navigateToSection('bookings');
      await helpers.waitForElement('[data-testid="booking-requests"]');
      
      // Review new booking request
      await page.click('[data-testid="pending-requests-tab"]');
      await helpers.waitForElement('[data-testid="request-list"]');
      await page.click('[data-testid="booking-request"]:first-child');
      
      // Review request details
      await helpers.waitForElement('[data-testid="request-details"]');
      await helpers.assertElementVisible('[data-testid="director-info"]');
      await helpers.assertElementVisible('[data-testid="service-details"]');
      await helpers.assertElementVisible('[data-testid="guest-count"]');
      await helpers.assertElementVisible('[data-testid="special-requirements"]');
      
      // Check availability for requested dates
      await page.click('[data-testid="check-availability"]');
      await helpers.waitForElement('[data-testid="availability-check-results"]');
      
      // Approve booking with conditions
      await page.click('[data-testid="approve-with-conditions"]');
      await helpers.waitForElement('[data-testid="approval-conditions-form"]');
      
      await helpers.fillForm({
        'setup-time-required': '60',
        'cleanup-time-required': '30',
        'additional-fees': '50',
        'additional-fees-reason': 'Extended setup time for special decorations',
        'terms-and-conditions': 'Venue must be returned to original condition. No smoking permitted. Maximum occupancy: 100 persons.'
      });
      
      await helpers.submitForm('approve-booking');
      await helpers.waitForToast('Booking approved with conditions');
    });

    // Step 4: Coordinate with funeral directors
    await test.step('Coordinate with funeral directors for upcoming services', async () => {
      await page.click('[data-testid="confirmed-bookings-tab"]');
      await helpers.waitForElement('[data-testid="confirmed-bookings-list"]');
      
      // Select upcoming booking
      await page.click('[data-testid="booking-item"]:first-child');
      await helpers.waitForElement('[data-testid="booking-coordination"]');
      
      // Communicate with director
      await page.click('[data-testid="contact-director"]');
      await helpers.waitForElement('[data-testid="director-communication"]');
      
      const coordinationMessage = 'Booking confirmed for July 15th. Please arrive 1 hour early for setup. Parking available in rear lot. Contact me at 30 minutes before service for any last-minute needs.';
      await page.fill('[data-testid="message-input"]', coordinationMessage);
      await page.click('[data-testid="send-message"]');
      
      // Share venue information package
      await page.click('[data-testid="share-venue-info"]');
      await helpers.waitForElement('[data-testid="venue-info-package"]');
      await page.check('[data-testid="include-floor-plan"]');
      await page.check('[data-testid="include-setup-instructions"]');
      await page.check('[data-testid="include-contact-info"]');
      await page.check('[data-testid="include-emergency-procedures"]');
      
      await helpers.submitForm('send-info-package');
      await helpers.waitForToast('Venue information package sent');
    });

    // Step 5: Manage venue amenities and services
    await test.step('Update venue amenities and service offerings', async () => {
      await helpers.navigateToSection('amenities');
      await helpers.waitForElement('[data-testid="amenities-management"]');
      
      // Update available amenities
      await page.click('[data-testid="edit-amenities"]');
      await helpers.waitForElement('[data-testid="amenities-form"]');
      
      // Core amenities
      await page.check('[data-testid="amenity-parking"]');
      await page.check('[data-testid="amenity-wheelchair-access"]');
      await page.check('[data-testid="amenity-av-equipment"]');
      await page.check('[data-testid="amenity-catering-kitchen"]');
      await page.check('[data-testid="amenity-sound-system"]');
      
      // Additional services
      await page.check('[data-testid="service-setup-assistance"]');
      await page.check('[data-testid="service-catering-coordination"]');
      await page.check('[data-testid="service-decoration-hanging"]');
      
      // Set amenity pricing
      await helpers.fillForm({
        'av-equipment-fee': '75',
        'setup-assistance-fee': '100',
        'catering-kitchen-fee': '50'
      });
      
      await helpers.submitForm('save-amenities');
      await helpers.waitForToast('Amenities updated successfully');
      
      // Upload venue photos
      await page.click('[data-testid="manage-photos"]');
      await helpers.uploadMultipleFiles('[data-testid="photo-upload"]', [
        'tests/e2e/fixtures/venue-interior-1.jpg',
        'tests/e2e/fixtures/venue-interior-2.jpg',
        'tests/e2e/fixtures/venue-exterior.jpg'
      ]);
      
      // Add photo descriptions
      await page.fill('[data-testid="photo-1-description"]', 'Main ceremony hall with seating for 100');
      await page.fill('[data-testid="photo-2-description"]', 'Reception area with catering facilities');
      await page.fill('[data-testid="photo-3-description"]', 'Building exterior with parking');
      
      await helpers.submitForm('save-photos');
    });

    // Step 6: Handle day-of-service operations
    await test.step('Manage day-of-service operations', async () => {
      await helpers.navigateToSection('operations');
      await helpers.waitForElement('[data-testid="daily-operations"]');
      
      // Pre-service checklist
      await page.click('[data-testid="pre-service-checklist"]');
      await helpers.waitForElement('[data-testid="checklist-form"]');
      
      const checklistItems = [
        'venue-cleaned',
        'seating-arranged',
        'av-equipment-tested',
        'temperature-controlled',
        'lighting-adjusted',
        'restrooms-stocked',
        'emergency-exits-clear',
        'parking-prepared'
      ];
      
      for (const item of checklistItems) {
        await page.check(`[data-testid="checklist-${item}"]`);
      }
      
      await page.fill('[data-testid="checklist-notes"]', 'All pre-service preparations completed. Venue ready for 11 AM service.');
      await helpers.submitForm('complete-checklist');
      
      // During service monitoring
      await page.click('[data-testid="service-monitoring"]');
      await helpers.waitForElement('[data-testid="monitoring-dashboard"]');
      
      // Log service events
      await page.click('[data-testid="add-service-log"]');
      await helpers.fillForm({
        'log-time': '11:00',
        'log-type': 'service-start',
        'log-description': 'Funeral service commenced on schedule'
      });
      await helpers.submitForm('add-log');
      
      await page.click('[data-testid="add-service-log"]');
      await helpers.fillForm({
        'log-time': '12:30',
        'log-type': 'service-complete',
        'log-description': 'Ceremony concluded, reception began'
      });
      await helpers.submitForm('add-log');
    });

    // Step 7: Post-service follow-up and cleanup
    await test.step('Handle post-service operations', async () => {
      // Post-service checklist
      await page.click('[data-testid="post-service-checklist"]');
      await helpers.waitForElement('[data-testid="post-checklist-form"]');
      
      const postChecklistItems = [
        'venue-cleaned',
        'furniture-restored',
        'av-equipment-stored',
        'lost-items-collected',
        'damage-assessment',
        'final-walkthrough'
      ];
      
      for (const item of postChecklistItems) {
        await page.check(`[data-testid="post-checklist-${item}"]`);
      }
      
      // Report any issues
      await page.fill('[data-testid="service-report"]', 'Service completed successfully. No damages or issues reported. Guest feedback was positive.');
      await helpers.submitForm('complete-post-service');
      
      // Generate service summary
      await page.click('[data-testid="generate-service-summary"]');
      await helpers.waitForElement('[data-testid="service-summary"]');
      
      // Send thank you and feedback request
      await page.click('[data-testid="send-followup"]');
      await helpers.fillForm({
        'followup-type': 'thank-you-feedback',
        'followup-message': 'Thank you for choosing our venue. We hope our services provided comfort during this difficult time. Please share your feedback to help us serve families better.'
      });
      await helpers.submitForm('send-followup');
    });

    // Step 8: Financial management and reporting
    await test.step('Manage financials and generate reports', async () => {
      await helpers.navigateToSection('finances');
      await helpers.waitForElement('[data-testid="financial-dashboard"]');
      
      // Generate invoice for completed service
      await page.click('[data-testid="generate-invoice"]');
      await helpers.waitForElement('[data-testid="invoice-generator"]');
      
      // Review invoice details
      await helpers.assertElementVisible('[data-testid="venue-rental-fee"]');
      await helpers.assertElementVisible('[data-testid="amenity-fees"]');
      await helpers.assertElementVisible('[data-testid="service-fees"]');
      
      // Add any additional charges
      await page.click('[data-testid="add-additional-charge"]');
      await helpers.fillForm({
        'charge-description': 'Extended cleanup due to decorations',
        'charge-amount': '25'
      });
      
      // Send invoice
      await helpers.submitForm('send-invoice');
      await helpers.waitForToast('Invoice sent successfully');
      
      // View financial reports
      await page.click('[data-testid="financial-reports"]');
      await helpers.waitForElement('[data-testid="reports-dashboard"]');
      
      // Generate monthly report
      await page.click('[data-testid="generate-monthly-report"]');
      await page.selectOption('[data-testid="report-month"]', '2024-07');
      await helpers.waitForElement('[data-testid="monthly-report"]');
      
      // Review key metrics
      await helpers.assertElementVisible('[data-testid="monthly-bookings"]');
      await helpers.assertElementVisible('[data-testid="monthly-revenue"]');
      await helpers.assertElementVisible('[data-testid="occupancy-rate"]');
      await helpers.assertElementVisible('[data-testid="average-booking-value"]');
    });

    // Take screenshot of completed workflow
    await helpers.takeScreenshot('venue-management-complete');
  });

  test('Venue - Emergency and special situation handling', async ({ page }) => {
    await test.step('Login as venue manager', async () => {
      await helpers.signIn('test-venue@farewelly.test', 'TestPassword123!');
    });

    await test.step('Handle emergency situation during service', async () => {
      await helpers.navigateToSection('operations');
      
      // Simulate emergency situation
      await page.click('[data-testid="emergency-procedures"]');
      await helpers.waitForElement('[data-testid="emergency-form"]');
      
      await helpers.fillForm({
        'emergency-type': 'medical',
        'emergency-description': 'Guest experiencing medical distress',
        'emergency-location': 'main-hall',
        'actions-taken': 'Called emergency services, provided first aid, cleared area for paramedics'
      });
      
      // Notify director and family
      await page.check('[data-testid="notify-director"]');
      await page.check('[data-testid="notify-family"]');
      
      await helpers.submitForm('log-emergency');
      await helpers.waitForToast('Emergency incident logged');
    });

    await test.step('Handle weather-related complications', async () => {
      await page.click('[data-testid="weather-contingency"]');
      await helpers.waitForElement('[data-testid="weather-plan"]');
      
      await helpers.fillForm({
        'weather-issue': 'heavy-rain',
        'contingency-plan': 'Moved outdoor memorial to covered pavilion, provided umbrellas for guests',
        'additional-setup': 'Extra heating units, rain protection for entrance'
      });
      
      await helpers.submitForm('implement-contingency');
    });
  });

  test('Venue - Multi-booking coordination and conflict resolution', async ({ page }) => {
    await test.step('Login as venue manager', async () => {
      await helpers.signIn('test-venue@farewelly.test', 'TestPassword123!');
    });

    await test.step('Handle overlapping booking requests', async () => {
      await helpers.navigateToSection('bookings');
      
      // Simulate conflict detection
      await page.click('[data-testid="booking-conflicts"]');
      await helpers.waitForElement('[data-testid="conflict-resolution"]');
      
      // Review conflicting requests
      await helpers.assertElementVisible('[data-testid="conflict-request-1"]');
      await helpers.assertElementVisible('[data-testid="conflict-request-2"]');
      
      // Propose alternative solutions
      await page.click('[data-testid="propose-alternatives"]');
      await helpers.fillForm({
        'alternative-date-1': '2024-07-16',
        'alternative-time-1': '14:00',
        'alternative-date-2': '2024-07-17',
        'alternative-time-2': '11:00',
        'discount-offer': '10',
        'additional-services': 'Free setup assistance'
      });
      
      await helpers.submitForm('send-alternatives');
    });

    await test.step('Coordinate simultaneous events in different spaces', async () => {
      await page.click('[data-testid="multi-space-coordination"]');
      await helpers.waitForElement('[data-testid="space-allocation"]');
      
      // Allocate different spaces
      await page.selectOption('[data-testid="event-1-space"]', 'main-hall');
      await page.selectOption('[data-testid="event-2-space"]', 'chapel');
      
      // Coordinate shared resources
      await helpers.fillForm({
        'parking-allocation': '50-50',
        'staff-allocation': 'dedicated-per-space',
        'av-equipment': 'separate-systems'
      });
      
      await helpers.submitForm('confirm-coordination');
    });
  });

  test('Venue - Maintenance and facility management', async ({ page }) => {
    await test.step('Login as venue manager', async () => {
      await helpers.signIn('test-venue@farewelly.test', 'TestPassword123!');
    });

    await test.step('Schedule and track maintenance', async () => {
      await helpers.navigateToSection('maintenance');
      await helpers.waitForElement('[data-testid="maintenance-dashboard"]');
      
      // Schedule routine maintenance
      await page.click('[data-testid="schedule-maintenance"]');
      await helpers.fillForm({
        'maintenance-type': 'hvac-inspection',
        'maintenance-date': '2024-07-20',
        'maintenance-duration': '4',
        'vendor-contact': 'HVAC Services Inc.',
        'special-requirements': 'Must complete before weekend bookings'
      });
      
      await helpers.submitForm('schedule-maintenance');
      
      // Log completed maintenance
      await page.click('[data-testid="log-completed-maintenance"]');
      await helpers.fillForm({
        'completed-task': 'Carpet cleaning in main hall',
        'completion-date': '2024-06-20',
        'vendor-used': 'Professional Cleaners Ltd',
        'cost': '350',
        'notes': 'Deep cleaning completed, carpets ready for use'
      });
      
      await helpers.submitForm('log-maintenance');
    });

    await test.step('Handle facility improvement projects', async () => {
      await page.click('[data-testid="improvement-projects"]');
      await helpers.waitForElement('[data-testid="projects-dashboard"]');
      
      // Plan improvement project
      await page.click('[data-testid="new-project"]');
      await helpers.fillForm({
        'project-name': 'Audio-Visual System Upgrade',
        'project-description': 'Install modern sound system and projection equipment',
        'estimated-cost': '15000',
        'timeline': '3-weeks',
        'impact-on-bookings': 'Minimal - work during non-booking hours'
      });
      
      await helpers.submitForm('create-project');
    });
  });

  test('Venue - Customer service and satisfaction tracking', async ({ page }) => {
    await test.step('Login as venue manager', async () => {
      await helpers.signIn('test-venue@farewelly.test', 'TestPassword123!');
    });

    await test.step('Collect and analyze customer feedback', async () => {
      await helpers.navigateToSection('feedback');
      await helpers.waitForElement('[data-testid="feedback-dashboard"]');
      
      // Review recent feedback
      await helpers.assertElementVisible('[data-testid="recent-feedback"]');
      await helpers.assertElementVisible('[data-testid="average-rating"]');
      
      // Respond to feedback
      await page.click('[data-testid="feedback-item"]:first-child');
      await page.click('[data-testid="respond-to-feedback"]');
      
      await page.fill('[data-testid="response-text"]', 'Thank you for your feedback. We are glad our venue could provide a peaceful setting for your loved one\'s service. We will continue to maintain the high standards you experienced.');
      
      await helpers.submitForm('send-response');
      
      // Implement improvement based on feedback
      await page.click('[data-testid="improvement-actions"]');
      await helpers.fillForm({
        'improvement-area': 'accessibility',
        'specific-action': 'Install additional handrails in entrance area',
        'timeline': '2-weeks',
        'budget-required': '500'
      });
      
      await helpers.submitForm('log-improvement');
    });
  });
});