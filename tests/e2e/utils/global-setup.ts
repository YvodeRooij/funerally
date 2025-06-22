import { chromium, FullConfig } from '@playwright/test';
import { DatabaseHelpers, TestHelpers } from './test-helpers';

/**
 * Global setup for Farewelly E2E tests
 * Handles authentication, test data seeding, and environment preparation
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for Farewelly E2E tests...');

  // Ensure test environment variables are set
  if (!process.env.BASE_URL) {
    process.env.BASE_URL = 'http://localhost:3000';
  }

  try {
    // Clean up any existing test data
    await DatabaseHelpers.cleanupTestData();

    // Seed fresh test data
    await DatabaseHelpers.seedTestData();

    // Create test user accounts for different user types
    await setupTestUsers();

    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

/**
 * Setup test user accounts with authentication
 */
async function setupTestUsers() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const helpers = new TestHelpers(page);

  try {
    // Create and authenticate family user
    const familyUser = TestHelpers.generateFamilyUser();
    familyUser.email = 'test-family@farewelly.test';
    await helpers.registerFamilyUser(familyUser);
    await context.storageState({ path: 'tests/e2e/fixtures/family-auth.json' });

    // Create and authenticate director user
    await context.clearCookies();
    const directorUser = TestHelpers.generateDirectorData();
    directorUser.email = 'test-director@farewelly.test';
    await helpers.registerDirector(directorUser);
    await context.storageState({ path: 'tests/e2e/fixtures/director-auth.json' });

    // Create and authenticate venue user
    await context.clearCookies();
    const venueUser = TestHelpers.generateVenueData();
    venueUser.email = 'test-venue@farewelly.test';
    await helpers.registerVenue(venueUser);
    await context.storageState({ path: 'tests/e2e/fixtures/venue-auth.json' });

    // Create general authenticated state
    await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
    await context.storageState({ path: 'tests/e2e/fixtures/auth.json' });

    console.log('✅ Test user accounts created and authenticated');
  } catch (error) {
    console.error('❌ Failed to setup test users:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;