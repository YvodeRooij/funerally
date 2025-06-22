import { Page, expect, Locator } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * Comprehensive test helpers for Farewelly E2E testing
 * Provides utilities for user interactions, data generation, and assertions
 */

export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  type: 'family' | 'director' | 'venue' | 'admin';
}

export interface FamilyUserData extends TestUser {
  deceasedName: string;
  relationship: string;
  dateOfDeath: string;
  preferredFuneralDate: string;
  budget: number;
  specialRequirements: string;
}

export interface DirectorData extends TestUser {
  companyName: string;
  license: string;
  serviceAreas: string[];
  specializations: string[];
  yearsOfExperience: number;
}

export interface VenueData extends TestUser {
  venueName: string;
  address: string;
  capacity: number;
  amenities: string[];
  hourlyRate: number;
  description: string;
}

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Generate test user data
   */
  static generateFamilyUser(): FamilyUserData {
    return {
      email: faker.internet.email(),
      password: 'TestPassword123!',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number(),
      type: 'family',
      deceasedName: faker.person.fullName(),
      relationship: faker.helpers.arrayElement(['Spouse', 'Child', 'Parent', 'Sibling', 'Friend']),
      dateOfDeath: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
      preferredFuneralDate: faker.date.future({ days: 14 }).toISOString().split('T')[0],
      budget: faker.number.int({ min: 5000, max: 25000 }),
      specialRequirements: faker.helpers.arrayElement([
        'Religious ceremony required',
        'Eco-friendly options preferred',
        'Wheelchair accessibility needed',
        'Large gathering expected',
        'Cremation preferred'
      ])
    };
  }

  static generateDirectorData(): DirectorData {
    return {
      email: faker.internet.email(),
      password: 'TestPassword123!',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number(),
      type: 'director',
      companyName: faker.company.name() + ' Funeral Services',
      license: 'FL-' + faker.string.alphanumeric(8).toUpperCase(),
      serviceAreas: faker.helpers.arrayElements(['Amsterdam', 'Rotterdam', 'Utrecht', 'Den Haag', 'Eindhoven'], 2),
      specializations: faker.helpers.arrayElements(['Traditional', 'Eco-friendly', 'Religious', 'Cremation', 'Memorial'], 3),
      yearsOfExperience: faker.number.int({ min: 5, max: 30 })
    };
  }

  static generateVenueData(): VenueData {
    return {
      email: faker.internet.email(),
      password: 'TestPassword123!',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number(),
      type: 'venue',
      venueName: faker.company.name() + ' Event Center',
      address: faker.location.streetAddress() + ', ' + faker.location.city(),
      capacity: faker.number.int({ min: 50, max: 500 }),
      amenities: faker.helpers.arrayElements(['Parking', 'Catering', 'A/V Equipment', 'Wheelchair Access', 'Garden'], 3),
      hourlyRate: faker.number.int({ min: 100, max: 1000 }),
      description: faker.lorem.paragraph()
    };
  }

  /**
   * Authentication helpers
   */
  async signIn(email: string, password: string) {
    await this.page.goto('/auth/signin');
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="signin-button"]');
    await this.page.waitForURL('/dashboard');
  }

  async signOut() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="signout-button"]');
    await this.page.waitForURL('/');
  }

  async registerFamilyUser(userData: FamilyUserData) {
    await this.page.goto('/auth/signin');
    await this.page.click('[data-testid="register-link"]');
    await this.page.click('[data-testid="family-user-type"]');
    
    // Basic information
    await this.page.fill('[data-testid="first-name"]', userData.firstName);
    await this.page.fill('[data-testid="last-name"]', userData.lastName);
    await this.page.fill('[data-testid="email"]', userData.email);
    await this.page.fill('[data-testid="phone"]', userData.phone);
    await this.page.fill('[data-testid="password"]', userData.password);
    await this.page.fill('[data-testid="confirm-password"]', userData.password);
    
    await this.page.click('[data-testid="next-step"]');
    
    // Funeral details
    await this.page.fill('[data-testid="deceased-name"]', userData.deceasedName);
    await this.page.selectOption('[data-testid="relationship"]', userData.relationship);
    await this.page.fill('[data-testid="date-of-death"]', userData.dateOfDeath);
    await this.page.fill('[data-testid="preferred-funeral-date"]', userData.preferredFuneralDate);
    await this.page.fill('[data-testid="budget"]', userData.budget.toString());
    await this.page.fill('[data-testid="special-requirements"]', userData.specialRequirements);
    
    await this.page.click('[data-testid="complete-registration"]');
    await this.page.waitForURL('/dashboard');
  }

  async registerDirector(userData: DirectorData) {
    await this.page.goto('/auth/signin');
    await this.page.click('[data-testid="register-link"]');
    await this.page.click('[data-testid="director-user-type"]');
    
    // Basic information
    await this.page.fill('[data-testid="first-name"]', userData.firstName);
    await this.page.fill('[data-testid="last-name"]', userData.lastName);
    await this.page.fill('[data-testid="email"]', userData.email);
    await this.page.fill('[data-testid="phone"]', userData.phone);
    await this.page.fill('[data-testid="password"]', userData.password);
    await this.page.fill('[data-testid="confirm-password"]', userData.password);
    
    await this.page.click('[data-testid="next-step"]');
    
    // Professional details
    await this.page.fill('[data-testid="company-name"]', userData.companyName);
    await this.page.fill('[data-testid="license"]', userData.license);
    await this.page.fill('[data-testid="years-experience"]', userData.yearsOfExperience.toString());
    
    // Service areas
    for (const area of userData.serviceAreas) {
      await this.page.check(`[data-testid="service-area-${area}"]`);
    }
    
    // Specializations
    for (const spec of userData.specializations) {
      await this.page.check(`[data-testid="specialization-${spec}"]`);
    }
    
    await this.page.click('[data-testid="complete-registration"]');
    await this.page.waitForURL('/dashboard');
  }

  async registerVenue(userData: VenueData) {
    await this.page.goto('/auth/signin');
    await this.page.click('[data-testid="register-link"]');
    await this.page.click('[data-testid="venue-user-type"]');
    
    // Basic information
    await this.page.fill('[data-testid="first-name"]', userData.firstName);
    await this.page.fill('[data-testid="last-name"]', userData.lastName);
    await this.page.fill('[data-testid="email"]', userData.email);
    await this.page.fill('[data-testid="phone"]', userData.phone);
    await this.page.fill('[data-testid="password"]', userData.password);
    await this.page.fill('[data-testid="confirm-password"]', userData.password);
    
    await this.page.click('[data-testid="next-step"]');
    
    // Venue details
    await this.page.fill('[data-testid="venue-name"]', userData.venueName);
    await this.page.fill('[data-testid="address"]', userData.address);
    await this.page.fill('[data-testid="capacity"]', userData.capacity.toString());
    await this.page.fill('[data-testid="hourly-rate"]', userData.hourlyRate.toString());
    await this.page.fill('[data-testid="description"]', userData.description);
    
    // Amenities
    for (const amenity of userData.amenities) {
      await this.page.check(`[data-testid="amenity-${amenity}"]`);
    }
    
    await this.page.click('[data-testid="complete-registration"]');
    await this.page.waitForURL('/dashboard');
  }

  /**
   * Navigation helpers
   */
  async navigateToSection(section: string) {
    await this.page.click(`[data-testid="nav-${section}"]`);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToSubsection(section: string, subsection: string) {
    await this.page.hover(`[data-testid="nav-${section}"]`);
    await this.page.click(`[data-testid="nav-${section}-${subsection}"]`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Form helpers
   */
  async fillForm(formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      await this.page.fill(`[data-testid="${field}"]`, value);
    }
  }

  async submitForm(formTestId: string = 'form-submit') {
    await this.page.click(`[data-testid="${formTestId}"]`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * File upload helpers
   */
  async uploadFile(inputSelector: string, filePath: string) {
    await this.page.setInputFiles(inputSelector, filePath);
    await this.page.waitForTimeout(1000); // Wait for upload to process
  }

  async uploadMultipleFiles(inputSelector: string, filePaths: string[]) {
    await this.page.setInputFiles(inputSelector, filePaths);
    await this.page.waitForTimeout(2000); // Wait for uploads to process
  }

  /**
   * Wait helpers
   */
  async waitForElement(selector: string, timeout: number = 30000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  async waitForText(text: string, timeout: number = 30000) {
    await this.page.waitForSelector(`text=${text}`, { timeout });
  }

  async waitForToast(message: string, timeout: number = 10000) {
    await this.page.waitForSelector(`[data-testid="toast"]:has-text("${message}")`, { timeout });
  }

  /**
   * Assertion helpers
   */
  async assertPageTitle(expectedTitle: string) {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  async assertPageURL(expectedURL: string) {
    await expect(this.page).toHaveURL(expectedURL);
  }

  async assertElementVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async assertElementHidden(selector: string) {
    await expect(this.page.locator(selector)).toBeHidden();
  }

  async assertElementText(selector: string, expectedText: string) {
    await expect(this.page.locator(selector)).toHaveText(expectedText);
  }

  async assertElementCount(selector: string, expectedCount: number) {
    await expect(this.page.locator(selector)).toHaveCount(expectedCount);
  }

  /**
   * API helpers
   */
  async makeAPICall(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any) {
    const response = await this.page.request[method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'](
      endpoint,
      data ? { data } : undefined
    );
    return response;
  }

  async interceptAPICall(url: string, responseData: any) {
    await this.page.route(url, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responseData)
      });
    });
  }

  async mockAPIError(url: string, statusCode: number = 500, errorMessage: string = 'Internal Server Error') {
    await this.page.route(url, route => {
      route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify({ error: errorMessage })
      });
    });
  }

  /**
   * Screenshot and debugging helpers
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `tests/e2e/reports/screenshots/${name}.png`, fullPage: true });
  }

  async savePageContent(name: string) {
    const content = await this.page.content();
    require('fs').writeFileSync(`tests/e2e/reports/html-dumps/${name}.html`, content);
  }

  /**
   * Performance helpers
   */
  async measurePageLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  }

  async measureActionTime(action: () => Promise<void>): Promise<number> {
    const startTime = Date.now();
    await action();
    return Date.now() - startTime;
  }

  /**
   * Responsive testing helpers
   */
  async testMobileView() {
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.waitForTimeout(1000);
  }

  async testTabletView() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.page.waitForTimeout(1000);
  }

  async testDesktopView() {
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.page.waitForTimeout(1000);
  }

  /**
   * Network condition simulation
   */
  async simulateSlowNetwork() {
    await this.page.context().setOffline(false);
    await this.page.context().setExtraHTTPHeaders({
      'Connection': 'slow'
    });
  }

  async simulateOfflineMode() {
    await this.page.context().setOffline(true);
  }

  async restoreNetworkConditions() {
    await this.page.context().setOffline(false);
  }
}

/**
 * Database helpers for test data setup and cleanup
 */
export class DatabaseHelpers {
  static async cleanupTestData() {
    // Implementation would connect to test database and clean up test data
    // This would typically use the same database connection as the main app
    console.log('Cleaning up test data...');
  }

  static async seedTestData() {
    // Implementation would seed necessary test data
    console.log('Seeding test data...');
  }

  static async createTestUser(userData: TestUser) {
    // Implementation would create a test user directly in the database
    console.log('Creating test user:', userData.email);
  }
}

/**
 * Date and time utilities
 */
export class DateTimeHelpers {
  static formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day);
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  static getNextBusinessDay(date: Date): Date {
    let nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    while (this.isWeekend(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  }
}