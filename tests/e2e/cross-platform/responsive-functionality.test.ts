import { test, expect, devices } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Cross-Platform Responsive Functionality Tests
 * Tests application functionality across desktop, tablet, and mobile devices
 */

test.describe('Cross-Platform Responsive Testing', () => {
  let helpers: TestHelpers;

  // Test configurations for different devices
  const deviceConfigs = [
    { name: 'Desktop', device: devices['Desktop Chrome'], category: 'desktop' },
    { name: 'Tablet Portrait', device: devices['iPad Pro'], category: 'tablet' },
    { name: 'Tablet Landscape', device: { ...devices['iPad Pro'], viewport: { width: 1366, height: 1024 } }, category: 'tablet' },
    { name: 'Mobile Portrait', device: devices['iPhone 12'], category: 'mobile' },
    { name: 'Mobile Landscape', device: { ...devices['iPhone 12'], viewport: { width: 844, height: 390 } }, category: 'mobile' },
    { name: 'Large Desktop', device: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } }, category: 'desktop' },
    { name: 'Small Mobile', device: devices['iPhone SE'], category: 'mobile' }
  ];

  deviceConfigs.forEach(({ name, device, category }) => {
    test.describe(`${name} - ${category.toUpperCase()}`, () => {
      test.beforeEach(async ({ page, context }) => {
        await context.addInitScript(() => {
          // Simulate touch events for mobile devices
          if (window.innerWidth < 768) {
            Object.defineProperty(navigator, 'maxTouchPoints', { value: 1 });
          }
        });
        
        helpers = new TestHelpers(page);
      });

      test(`${name} - Family user navigation and core functionality`, async ({ page }) => {
        // Test responsive navigation
        await test.step('Test responsive navigation', async () => {
          await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
          
          if (category === 'mobile') {
            // Mobile: Test hamburger menu
            await helpers.assertElementVisible('[data-testid="mobile-menu-trigger"]');
            await page.click('[data-testid="mobile-menu-trigger"]');
            await helpers.waitForElement('[data-testid="mobile-navigation"]');
            
            // Test navigation items in mobile menu
            await helpers.assertElementVisible('[data-testid="mobile-nav-dashboard"]');
            await helpers.assertElementVisible('[data-testid="mobile-nav-documents"]');
            await helpers.assertElementVisible('[data-testid="mobile-nav-messages"]');
            
            // Test navigation functionality
            await page.click('[data-testid="mobile-nav-documents"]');
            await helpers.assertPageURL('/dashboard/documents');
            
          } else {
            // Desktop/Tablet: Test standard navigation
            await helpers.assertElementVisible('[data-testid="desktop-navigation"]');
            await helpers.assertElementVisible('[data-testid="nav-dashboard"]');
            await helpers.assertElementVisible('[data-testid="nav-documents"]');
            
            // Test hover states on larger screens
            if (category === 'desktop') {
              await page.hover('[data-testid="nav-services"]');
              await helpers.waitForElement('[data-testid="services-submenu"]');
            }
          }
        });

        // Test responsive forms
        await test.step('Test responsive form interactions', async () => {
          await helpers.navigateToSection('profile');
          await helpers.waitForElement('[data-testid="profile-form"]');
          
          if (category === 'mobile') {
            // Mobile: Test form field focus and keyboard behavior
            await page.click('[data-testid="first-name-input"]');
            await expect(page.locator('[data-testid="first-name-input"]')).toBeFocused();
            
            // Test mobile-specific input behaviors
            await page.click('[data-testid="phone-input"]');
            await helpers.assertElementVisible('[data-testid="mobile-keyboard-helper"]');
            
          } else {
            // Desktop/Tablet: Test standard form interactions
            await page.fill('[data-testid="first-name-input"]', 'Updated Name');
            await page.fill('[data-testid="email-input"]', 'updated@email.com');
          }
          
          // Test form submission on all devices
          await helpers.submitForm('save-profile');
          await helpers.waitForToast('Profile updated successfully');
        });

        // Test responsive document management
        await test.step('Test responsive document management', async () => {
          await helpers.navigateToSection('documents');
          await helpers.waitForElement('[data-testid="document-vault"]');
          
          if (category === 'mobile') {
            // Mobile: Test touch interactions for document management
            await page.click('[data-testid="mobile-upload-button"]');
            await helpers.waitForElement('[data-testid="mobile-upload-modal"]');
            
            // Test mobile file selection
            await helpers.assertElementVisible('[data-testid="mobile-file-picker"]');
            await page.click('[data-testid="camera-upload-option"]');
            
          } else {
            // Desktop/Tablet: Test drag-and-drop functionality
            await helpers.assertElementVisible('[data-testid="drag-drop-zone"]');
            
            // Test file upload modal
            await page.click('[data-testid="upload-document"]');
            await helpers.waitForElement('[data-testid="upload-modal"]');
          }
        });

        // Test responsive calendar/scheduling
        await test.step('Test responsive calendar functionality', async () => {
          await helpers.navigateToSection('appointments');
          
          if (category === 'mobile') {
            // Mobile: Test mobile calendar view
            await helpers.waitForElement('[data-testid="mobile-calendar"]');
            await helpers.assertElementVisible('[data-testid="calendar-month-view"]');
            
            // Test swipe gestures for navigation
            const calendar = page.locator('[data-testid="mobile-calendar"]');
            await calendar.swipe({ dx: -100, dy: 0 }); // Swipe left for next month
            
            // Test touch interactions for date selection
            await page.click('[data-testid="available-date"]:first-child');
            await helpers.waitForElement('[data-testid="mobile-time-selector"]');
            
          } else {
            // Desktop/Tablet: Test full calendar functionality
            await helpers.waitForElement('[data-testid="desktop-calendar"]');
            await helpers.assertElementVisible('[data-testid="calendar-grid"]');
            
            // Test mouse interactions
            await page.click('[data-testid="calendar-date"]');
            await helpers.waitForElement('[data-testid="appointment-form"]');
          }
        });

        // Take device-specific screenshots
        await helpers.takeScreenshot(`family-functionality-${name.toLowerCase().replace(/\s+/g, '-')}`);
      });

      test(`${name} - Director workflow responsiveness`, async ({ page }) => {
        await test.step('Test director dashboard responsiveness', async () => {
          await helpers.signIn('test-director@farewelly.test', 'TestPassword123!');
          
          if (category === 'mobile') {
            // Mobile: Test compact dashboard layout
            await helpers.assertElementVisible('[data-testid="mobile-dashboard"]');
            await helpers.assertElementVisible('[data-testid="metrics-carousel"]');
            
            // Test swipe navigation through metrics
            const metricsCarousel = page.locator('[data-testid="metrics-carousel"]');
            await metricsCarousel.swipe({ dx: -200, dy: 0 });
            
          } else {
            // Desktop/Tablet: Test grid layout
            await helpers.assertElementVisible('[data-testid="desktop-dashboard"]');
            await helpers.assertElementVisible('[data-testid="metrics-grid"]');
            
            if (category === 'desktop') {
              // Test sidebar functionality on desktop
              await helpers.assertElementVisible('[data-testid="dashboard-sidebar"]');
            }
          }
        });

        await test.step('Test client management on different screen sizes', async () => {
          await helpers.navigateToSection('clients');
          
          if (category === 'mobile') {
            // Mobile: Test client list with pull-to-refresh
            await helpers.waitForElement('[data-testid="mobile-client-list"]');
            
            // Test pull-to-refresh gesture
            const clientList = page.locator('[data-testid="mobile-client-list"]');
            await clientList.swipe({ dx: 0, dy: 100 });
            await helpers.waitForElement('[data-testid="refresh-indicator"]');
            
            // Test mobile client detail view
            await page.click('[data-testid="client-item"]:first-child');
            await helpers.waitForElement('[data-testid="mobile-client-detail"]');
            
          } else {
            // Desktop/Tablet: Test data table functionality
            await helpers.waitForElement('[data-testid="client-data-table"]');
            
            // Test column sorting and filtering
            await page.click('[data-testid="sort-by-name"]');
            await helpers.waitForElement('[data-testid="sorted-results"]');
          }
        });

        await test.step('Test communication features responsiveness', async () => {
          await helpers.navigateToSection('messages');
          
          if (category === 'mobile') {
            // Mobile: Test mobile chat interface
            await helpers.waitForElement('[data-testid="mobile-chat"]');
            
            // Test mobile message composition
            await page.click('[data-testid="compose-message"]');
            await helpers.waitForElement('[data-testid="mobile-message-composer"]');
            
            // Test mobile keyboard and message sending
            await page.fill('[data-testid="message-input"]', 'Test message from mobile');
            await page.click('[data-testid="send-button"]');
            
          } else {
            // Desktop/Tablet: Test full chat interface
            await helpers.waitForElement('[data-testid="desktop-chat"]');
            await helpers.assertElementVisible('[data-testid="chat-sidebar"]');
            await helpers.assertElementVisible('[data-testid="message-area"]');
          }
        });
      });

      test(`${name} - Venue management interface`, async ({ page }) => {
        await test.step('Test venue dashboard across devices', async () => {
          await helpers.signIn('test-venue@farewelly.test', 'TestPassword123!');
          
          if (category === 'mobile') {
            // Mobile: Test compact venue dashboard
            await helpers.assertElementVisible('[data-testid="mobile-venue-dashboard"]');
            
            // Test booking requests in mobile view
            await page.click('[data-testid="mobile-bookings-button"]');
            await helpers.waitForElement('[data-testid="mobile-bookings-list"]');
            
          } else {
            // Desktop/Tablet: Test full venue dashboard
            await helpers.waitForElement('[data-testid="desktop-venue-dashboard"]');
            await helpers.assertElementVisible('[data-testid="booking-calendar"]');
            await helpers.assertElementVisible('[data-testid="venue-metrics"]');
          }
        });

        await test.step('Test availability management responsiveness', async () => {
          await helpers.navigateToSection('availability');
          
          if (category === 'mobile') {
            // Mobile: Test mobile availability calendar
            await helpers.waitForElement('[data-testid="mobile-availability"]');
            
            // Test mobile date picker
            await page.click('[data-testid="mobile-date-picker"]');
            await helpers.waitForElement('[data-testid="mobile-date-selector"]');
            
          } else {
            // Desktop/Tablet: Test full availability calendar
            await helpers.waitForElement('[data-testid="desktop-availability-calendar"]');
            
            // Test drag-and-drop availability setting
            if (category === 'desktop') {
              await helpers.assertElementVisible('[data-testid="drag-drop-availability"]');
            }
          }
        });
      });

      test(`${name} - Performance and accessibility`, async ({ page }) => {
        await test.step('Test performance metrics', async () => {
          await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
          
          // Measure page load performance
          const loadTime = await helpers.measurePageLoadTime();
          
          // Performance expectations by device category
          if (category === 'mobile') {
            expect(loadTime).toBeLessThan(5000); // 5 seconds for mobile
          } else {
            expect(loadTime).toBeLessThan(3000); // 3 seconds for desktop/tablet
          }
          
          // Test critical rendering path
          await helpers.assertElementVisible('[data-testid="above-fold-content"]');
        });

        await test.step('Test accessibility across devices', async () => {
          // Test keyboard navigation
          await page.keyboard.press('Tab');
          await expect(page.locator(':focus')).toBeVisible();
          
          // Test screen reader support
          await helpers.assertElementVisible('[data-testid="skip-navigation"]');
          
          if (category === 'mobile') {
            // Mobile: Test touch accessibility
            await helpers.assertElementVisible('[data-testid="touch-targets"]');
            
            // Verify minimum touch target sizes (44px)
            const touchTargets = page.locator('[data-testid="touch-targets"] button');
            const count = await touchTargets.count();
            
            for (let i = 0; i < count; i++) {
              const boundingBox = await touchTargets.nth(i).boundingBox();
              if (boundingBox) {
                expect(boundingBox.width).toBeGreaterThanOrEqual(44);
                expect(boundingBox.height).toBeGreaterThanOrEqual(44);
              }
            }
          }
        });

        await test.step('Test responsive images and media', async () => {
          await helpers.navigateToSection('venues');
          await helpers.waitForElement('[data-testid="venue-gallery"]');
          
          // Test image loading and optimization
          const images = page.locator('[data-testid="venue-gallery"] img');
          const imageCount = await images.count();
          
          for (let i = 0; i < imageCount; i++) {
            const image = images.nth(i);
            await expect(image).toBeVisible();
            
            // Check for responsive image attributes
            const srcset = await image.getAttribute('srcset');
            const sizes = await image.getAttribute('sizes');
            
            expect(srcset).toBeTruthy();
            expect(sizes).toBeTruthy();
          }
          
          if (category === 'mobile') {
            // Test image lazy loading on mobile
            await helpers.assertElementVisible('[data-testid="lazy-loading-images"]');
          }
        });
      });

      test(`${name} - Touch and gesture interactions`, async ({ page }) => {
        // Skip gesture tests for desktop
        test.skip(category === 'desktop', 'Gesture tests not applicable for desktop');
        
        await test.step('Test touch gestures and interactions', async () => {
          await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
          
          if (category === 'mobile') {
            // Test swipe gestures in document gallery
            await helpers.navigateToSection('documents');
            await page.click('[data-testid="document-item"]:first-child');
            
            const documentViewer = page.locator('[data-testid="document-viewer"]');
            
            // Test swipe left/right for document navigation
            await documentViewer.swipe({ dx: -100, dy: 0 });
            await helpers.waitForElement('[data-testid="next-document"]');
            
            // Test pinch-to-zoom gestures (simulated)
            await page.evaluate(() => {
              const element = document.querySelector('[data-testid="document-viewer"]');
              if (element) {
                const touchStart = new TouchEvent('touchstart', {
                  touches: [
                    new Touch({ identifier: 0, target: element, clientX: 100, clientY: 100 }),
                    new Touch({ identifier: 1, target: element, clientX: 200, clientY: 200 })
                  ]
                });
                element.dispatchEvent(touchStart);
              }
            });
            
          } else if (category === 'tablet') {
            // Test tablet-specific gestures
            await helpers.navigateToSection('calendar');
            
            const calendar = page.locator('[data-testid="tablet-calendar"]');
            
            // Test two-finger scroll on tablet
            await calendar.swipe({ dx: 0, dy: -100 });
            
            // Test long press for context menu
            await page.locator('[data-testid="calendar-event"]').first().tap({ timeout: 1000 });
            await helpers.waitForElement('[data-testid="context-menu"]');
          }
        });
      });

      test(`${name} - Cross-device data synchronization`, async ({ page }) => {
        await test.step('Test data consistency across device changes', async () => {
          await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
          
          // Create data on current device
          await helpers.navigateToSection('appointments');
          await page.click('[data-testid="new-appointment"]');
          
          const appointmentData = {
            'appointment-title': `${name} Test Appointment`,
            'appointment-date': '2024-07-15',
            'appointment-time': '14:00'
          };
          
          await helpers.fillForm(appointmentData);
          await helpers.submitForm('save-appointment');
          
          const appointmentId = await page.getAttribute('[data-testid="appointment-id"]', 'data-value');
          
          // Simulate device change by changing viewport
          if (category === 'mobile') {
            await helpers.testTabletView();
          } else if (category === 'tablet') {
            await helpers.testDesktopView();
          } else {
            await helpers.testMobileView();
          }
          
          // Refresh and verify data persistence
          await page.reload();
          await helpers.navigateToSection('appointments');
          
          await expect(page.locator(`[data-testid="appointment-${appointmentId}"]`)).toBeVisible();
          await expect(page.locator(`[data-testid="appointment-${appointmentId}"]`)).toContainText(appointmentData['appointment-title']);
        });
      });
    });
  });

  test.describe('Progressive Web App (PWA) Functionality', () => {
    test('PWA installation and offline functionality', async ({ page, context }) => {
      await test.step('Test PWA installation prompt', async () => {
        await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        // Simulate PWA installation conditions
        await context.addInitScript(() => {
          window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            (window as any).deferredPrompt = e;
          });
        });
        
        await helpers.navigateToSection('dashboard');
        
        // Check for PWA install prompt
        const installPrompt = page.locator('[data-testid="pwa-install-prompt"]');
        if (await installPrompt.isVisible()) {
          await installPrompt.click();
          await helpers.waitForElement('[data-testid="pwa-installation-dialog"]');
        }
      });

      await test.step('Test offline functionality', async () => {
        await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
        
        // Go online first and load content
        await helpers.navigateToSection('documents');
        await helpers.waitForElement('[data-testid="document-list"]');
        
        // Go offline
        await helpers.simulateOfflineMode();
        
        // Test offline indicators
        await helpers.assertElementVisible('[data-testid="offline-indicator"]');
        
        // Test cached content access
        await page.reload();
        await helpers.assertElementVisible('[data-testid="offline-cached-content"]');
        
        // Test offline functionality limitations
        await page.click('[data-testid="upload-document"]');
        await helpers.waitForElement('[data-testid="offline-limitation-message"]');
        
        // Restore online state
        await helpers.restoreNetworkConditions();
        await helpers.waitForElement('[data-testid="online-indicator"]');
      });
    });
  });

  test.describe('Browser Compatibility', () => {
    const browserTests = [
      { browser: 'chromium', name: 'Chrome' },
      { browser: 'firefox', name: 'Firefox' },
      { browser: 'webkit', name: 'Safari' }
    ];

    browserTests.forEach(({ browser, name }) => {
      test(`${name} - Core functionality verification`, async ({ page }) => {
        await test.step(`Test basic functionality in ${name}`, async () => {
          await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
          
          // Test basic navigation
          await helpers.navigateToSection('dashboard');
          await helpers.assertElementVisible('[data-testid="dashboard"]');
          
          // Test form submission
          await helpers.navigateToSection('profile');
          await page.fill('[data-testid="first-name-input"]', `${name} Test`);
          await helpers.submitForm('save-profile');
          await helpers.waitForToast('Profile updated successfully');
          
          // Test JavaScript functionality
          await page.click('[data-testid="interactive-element"]');
          await helpers.waitForElement('[data-testid="js-dependent-content"]');
        });
      });
    });
  });
});