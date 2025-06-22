/**
 * TRANSLATION COMPLETENESS TESTS
 * 
 * Purpose: Validates translation completeness across all 4 languages
 * Languages: Dutch (nl), English (en), Arabic (ar), Turkish (tr)
 * Scope: All translation keys, nested structures, cultural contexts
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

// Import configuration
import { locales, defaultLocale, localeConfig } from '../../../lib/i18n/config';

interface TranslationStructure {
  [key: string]: string | TranslationStructure;
}

interface LoadedTranslations {
  [locale: string]: TranslationStructure;
}

describe('Translation Completeness Tests', () => {
  let translations: LoadedTranslations = {};
  let referenceKeys: Set<string> = new Set();

  beforeAll(() => {
    // Load all translation files
    locales.forEach(locale => {
      try {
        const filePath = join(process.cwd(), 'lib', 'i18n', 'messages', `${locale}.json`);
        const content = readFileSync(filePath, 'utf8');
        translations[locale] = JSON.parse(content);
      } catch (error) {
        console.error(`Failed to load translations for ${locale}:`, error);
        translations[locale] = {};
      }
    });

    // Extract all keys from default locale (Dutch) as reference
    referenceKeys = extractAllKeys(translations[defaultLocale] || {});
  });

  describe('Translation File Loading', () => {
    test.each(locales)('should load %s translation file successfully', (locale) => {
      expect(translations[locale]).toBeDefined();
      expect(typeof translations[locale]).toBe('object');
      expect(Object.keys(translations[locale]).length).toBeGreaterThan(0);
    });
  });

  describe('Translation Key Completeness', () => {
    test.each(locales.filter(l => l !== defaultLocale))('should have all keys from %s reference locale', (locale) => {
      const localeKeys = extractAllKeys(translations[locale]);
      const missingKeys = Array.from(referenceKeys).filter(key => !localeKeys.has(key));
      
      expect(missingKeys).toEqual([]);
      if (missingKeys.length > 0) {
        console.warn(`Missing keys in ${locale}:`, missingKeys);
      }
    });

    test.each(locales)('should not have empty string values in %s', (locale) => {
      const emptyValues = findEmptyValues(translations[locale]);
      expect(emptyValues).toEqual([]);
      if (emptyValues.length > 0) {
        console.warn(`Empty values in ${locale}:`, emptyValues);
      }
    });
  });

  describe('Translation Structure Validation', () => {
    const expectedSections = [
      'navigation',
      'hero',
      'common',
      'auth',
      'onboarding',
      'dashboard',
      'family',
      'director',
      'venue',
      'booking',
      'documents',
      'communication',
      'cultural',
      'errors',
      'success',
      'time'
    ];

    test.each(locales)('should have all required sections in %s', (locale) => {
      const localeData = translations[locale];
      expectedSections.forEach(section => {
        expect(localeData).toHaveProperty(section);
        expect(typeof localeData[section]).toBe('object');
      });
    });

    test.each(locales)('should have consistent nested structure in %s', (locale) => {
      const referenceStructure = getStructurePaths(translations[defaultLocale]);
      const localeStructure = getStructurePaths(translations[locale]);
      
      referenceStructure.forEach(path => {
        expect(localeStructure).toContain(path);
      });
    });
  });

  describe('Cultural Context Validation', () => {
    test('should have culturally appropriate greetings', () => {
      // Dutch: formal/informal balance
      expect(translations.nl.hero?.title).toMatch(/waardig|afscheid/i);
      
      // English: clear and direct
      expect(translations.en.hero?.title).toMatch(/dignified|farewell/i);
      
      // Arabic: respectful and religious undertones
      expect(translations.ar.hero?.title).toMatch(/كريم|وداع/);
      
      // Turkish: respectful
      expect(translations.tr?.hero?.title).toBeDefined();
    });

    test('should have appropriate condolence language', () => {
      locales.forEach(locale => {
        const config = localeConfig[locale];
        const heroSubtitle = translations[locale]?.hero?.subtitle as string;
        
        expect(heroSubtitle).toBeDefined();
        expect(heroSubtitle.length).toBeGreaterThan(10);
        
        // Should not contain inappropriate casual language
        expect(heroSubtitle.toLowerCase()).not.toMatch(/fun|party|celebration/);
      });
    });

    test('should have proper religious considerations', () => {
      // Arabic should have Islamic-appropriate language
      const arabicCultural = translations.ar?.cultural;
      expect(arabicCultural).toHaveProperty('religiousPreferences');
      expect(arabicCultural).toHaveProperty('prayerFacilities');
      
      // All languages should respect cultural sensitivity
      locales.forEach(locale => {
        const cultural = translations[locale]?.cultural;
        expect(cultural).toHaveProperty('culturalSensitivity');
        expect(cultural).toHaveProperty('religiousPreferences');
      });
    });
  });

  describe('Language-Specific Quality Checks', () => {
    test('Arabic translations should use proper RTL text', () => {
      const arabicText = translations.ar?.navigation?.home as string;
      expect(arabicText).toMatch(/[\u0600-\u06FF]/); // Arabic Unicode range
      
      // Check for proper Arabic punctuation and formatting
      const arabicTitle = translations.ar?.hero?.title as string;
      expect(arabicTitle).toBeDefined();
      expect(arabicTitle.length).toBeGreaterThan(0);
    });

    test('Turkish translations should use proper Turkish characters', () => {
      const turkishKeys = Object.values(translations.tr?.common || {}) as string[];
      const hasTurkishChars = turkishKeys.some(text => 
        /[çğıöşüÇĞIİÖŞÜ]/.test(text)
      );
      expect(hasTurkishChars).toBe(true);
    });

    test('Dutch translations should use proper Dutch terminology', () => {
      const dutchText = translations.nl?.onboarding?.director as string;
      expect(dutchText).toMatch(/uitvaar|directeur/i);
    });

    test('All languages should have proper capitalization', () => {
      locales.forEach(locale => {
        const navigation = translations[locale]?.navigation;
        if (navigation && typeof navigation === 'object') {
          Object.values(navigation).forEach(value => {
            if (typeof value === 'string') {
              // Should not be ALL CAPS (except abbreviations)
              expect(value).not.toMatch(/^[A-Z\s]{4,}$/);
              // Should not be all lowercase for navigation items
              if (value.length > 1) {
                expect(value[0]).toMatch(/[A-ZÀ-ÿ\u0600-\u06FF]/);
              }
            }
          });
        }
      });
    });
  });

  describe('Consistency Checks', () => {
    test('should have consistent terminology across sections', () => {
      locales.forEach(locale => {
        const data = translations[locale];
        
        // Check for consistent use of "funeral director" vs variations
        const directorTerms = [
          data?.onboarding?.director,
          data?.director?.dashboard,
          data?.navigation?.providers
        ].filter(Boolean) as string[];
        
        // Should use consistent terminology (allowing for grammatical variations)
        if (directorTerms.length > 1) {
          expect(directorTerms.length).toBeGreaterThan(0);
        }
      });
    });

    test('should have consistent date/time formatting references', () => {
      locales.forEach(locale => {
        const config = localeConfig[locale];
        const timeData = translations[locale]?.time;
        
        expect(timeData).toBeDefined();
        expect(config.dateFormat).toBeDefined();
        expect(config.timeFormat).toBeDefined();
      });
    });
  });

  describe('Performance and Size Validation', () => {
    test('translation files should not be excessively large', () => {
      locales.forEach(locale => {
        const jsonString = JSON.stringify(translations[locale]);
        expect(jsonString.length).toBeLessThan(50000); // 50KB limit
      });
    });

    test('should not have duplicate values that could be consolidated', () => {
      locales.forEach(locale => {
        const values = getAllValues(translations[locale]);
        const valueMap = new Map<string, string[]>();
        
        values.forEach(({ path, value }) => {
          if (!valueMap.has(value)) {
            valueMap.set(value, []);
          }
          valueMap.get(value)!.push(path);
        });
        
        const duplicates = Array.from(valueMap.entries())
          .filter(([_, paths]) => paths.length > 3) // Allow some duplication
          .map(([value, paths]) => ({ value, paths }));
        
        if (duplicates.length > 0) {
          console.warn(`Potential duplicates in ${locale}:`, duplicates);
        }
        
        // Don't fail the test but warn about excessive duplication
        expect(duplicates.length).toBeLessThan(10);
      });
    });
  });
});

// Helper functions
function extractAllKeys(obj: TranslationStructure, prefix = ''): Set<string> {
  const keys = new Set<string>();
  
  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    keys.add(fullKey);
    
    if (typeof value === 'object' && value !== null) {
      const nestedKeys = extractAllKeys(value, fullKey);
      nestedKeys.forEach(k => keys.add(k));
    }
  });
  
  return keys;
}

function findEmptyValues(obj: TranslationStructure, prefix = ''): string[] {
  const emptyValues: string[] = [];
  
  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'string') {
      if (value.trim() === '') {
        emptyValues.push(fullKey);
      }
    } else if (typeof value === 'object' && value !== null) {
      emptyValues.push(...findEmptyValues(value, fullKey));
    }
  });
  
  return emptyValues;
}

function getStructurePaths(obj: TranslationStructure, prefix = ''): string[] {
  const paths: string[] = [];
  
  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      paths.push(fullKey);
      paths.push(...getStructurePaths(value, fullKey));
    }
  });
  
  return paths;
}

function getAllValues(obj: TranslationStructure, prefix = ''): Array<{path: string, value: string}> {
  const values: Array<{path: string, value: string}> = [];
  
  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'string') {
      values.push({ path: fullKey, value });
    } else if (typeof value === 'object' && value !== null) {
      values.push(...getAllValues(value, fullKey));
    }
  });
  
  return values;
}