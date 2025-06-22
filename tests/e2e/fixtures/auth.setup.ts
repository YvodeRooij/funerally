import { test as setup, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Authentication setup for Farewelly E2E tests
 * Creates authenticated sessions for different user types
 */

const FAMILY_AUTH_FILE = 'tests/e2e/fixtures/family-auth.json';
const DIRECTOR_AUTH_FILE = 'tests/e2e/fixtures/director-auth.json';
const VENUE_AUTH_FILE = 'tests/e2e/fixtures/venue-auth.json';
const GENERAL_AUTH_FILE = 'tests/e2e/fixtures/auth.json';

setup('authenticate as family user', async ({ page }) => {
  const helpers = new TestHelpers(page);
  
  // Try to sign in with existing test account first
  try {
    await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
    await expect(page).toHaveURL('/dashboard');
  } catch {
    // If sign-in fails, register new user
    const familyUser = TestHelpers.generateFamilyUser();
    familyUser.email = 'test-family@farewelly.test';
    await helpers.registerFamilyUser(familyUser);
  }

  // Save authentication state
  await page.context().storageState({ path: FAMILY_AUTH_FILE });
});

setup('authenticate as director user', async ({ page }) => {
  const helpers = new TestHelpers(page);
  
  // Try to sign in with existing test account first
  try {
    await helpers.signIn('test-director@farewelly.test', 'TestPassword123!');
    await expect(page).toHaveURL('/dashboard');
  } catch {
    // If sign-in fails, register new user
    const directorUser = TestHelpers.generateDirectorData();
    directorUser.email = 'test-director@farewelly.test';
    await helpers.registerDirector(directorUser);
  }

  // Save authentication state
  await page.context().storageState({ path: DIRECTOR_AUTH_FILE });
});

setup('authenticate as venue user', async ({ page }) => {
  const helpers = new TestHelpers(page);
  
  // Try to sign in with existing test account first
  try {
    await helpers.signIn('test-venue@farewelly.test', 'TestPassword123!');
    await expect(page).toHaveURL('/dashboard');
  } catch {
    // If sign-in fails, register new user
    const venueUser = TestHelpers.generateVenueData();
    venueUser.email = 'test-venue@farewelly.test';
    await helpers.registerVenue(venueUser);
  }

  // Save authentication state
  await page.context().storageState({ path: VENUE_AUTH_FILE });
});

setup('authenticate general user', async ({ page }) => {
  const helpers = new TestHelpers(page);
  
  // Use family user for general authentication
  await helpers.signIn('test-family@farewelly.test', 'TestPassword123!');
  await expect(page).toHaveURL('/dashboard');

  // Save authentication state
  await page.context().storageState({ path: GENERAL_AUTH_FILE });
});