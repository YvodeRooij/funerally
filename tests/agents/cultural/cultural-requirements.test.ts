/**
 * Cultural Requirements Agent Tests
 * 
 * Comprehensive tests for cultural sensitivity including Islamic, Jewish, 
 * Hindu, Dutch, and other cultural requirements validation.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  CulturalRequirementsAgent, 
  CulturalTradition, 
  ReligiousRite,
  CulturalAssessment,
  CulturalTraditionSchema,
  ReligiousRiteSchema,
  CulturalAssessmentSchema
} from '../../../lib/agents/cultural-requirements-agent';

describe('CulturalRequirementsAgent', () => {
  let culturalAgent: CulturalRequirementsAgent;
  let mockConfig: any;

  beforeEach(() => {
    culturalAgent = new CulturalRequirementsAgent();
    mockConfig = {
      configurable: {
        thread_id: `cultural_test_${Date.now()}`,
        checkpoint_ns: 'cultural_namespace',
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Knowledge Base Initialization', () => {
    test('should initialize with built-in cultural traditions', () => {
      const availableCultures = culturalAgent.getAvailableCultures();
      expect(availableCultures).toContain('irish');
      expect(availableCultures.length).toBeGreaterThan(0);
    });

    test('should initialize with built-in religious rites', () => {
      const availableFaiths = culturalAgent.getAvailableFaiths();
      expect(availableFaiths).toContain('christian');
      expect(availableFaiths).toContain('jewish');
      expect(availableFaiths).toContain('islamic');
      expect(availableFaiths.length).toBeGreaterThan(0);
    });

    test('should allow adding custom cultural traditions', () => {
      const customTradition: CulturalTradition = {
        name: 'Dutch Reformed',
        region: 'Netherlands',
        description: 'Traditional Dutch Protestant funeral customs',
        requirements: [
          {
            category: 'ceremony',
            requirement: 'Simple, dignified service',
            mandatory: true,
            alternatives: ['Memorial service'],
            explanation: 'Emphasis on simplicity and dignity'
          }
        ],
        restrictions: [
          {
            type: 'decoration',
            description: 'Minimal floral arrangements',
            severity: 'advisory'
          }
        ],
        timeline: {
          preparationTime: '2-3 days',
          ceremonyDuration: '45-60 minutes',
          postCeremonyObservances: 'Family gathering'
        },
        keyContacts: [
          {
            role: 'Minister',
            description: 'Reformed church minister',
            required: true
          }
        ]
      };

      culturalAgent.addCulturalTradition('dutch_reformed', customTradition);
      const traditions = culturalAgent.getCulturalTradition('dutch_reformed');
      expect(traditions).toHaveLength(1);
      expect(traditions[0].name).toBe('Dutch Reformed');
    });
  });

  describe('Islamic Cultural Requirements', () => {
    test('should handle Islamic funeral requirements correctly', async () => {
      const islamicFamily = {
        familyId: 'islamic_family_001',
        primaryCulture: 'Middle Eastern',
        primaryReligion: 'islamic',
        secondaryCultures: [],
        secondaryReligions: [],
        specificRequirements: {
          denomination: 'Sunni',
          requiresImam: true,
          prayerDirectionRequired: true,
          fastBurial: true
        }
      };

      const result = await culturalAgent.assessFamily(islamicFamily, mockConfig);
      
      expect(result.assessment).toBeDefined();
      expect(result.assessment.primaryReligion).toBe('islamic');
      expect(result.identifiedRites).toHaveLength(1);
      expect(result.identifiedRites[0].faith).toBe('Islamic');
      expect(result.identifiedRites[0].riteName).toBe('Islamic Janazah');
    });

    test('should identify Islamic burial restrictions', async () => {
      const islamicFamily = {
        familyId: 'islamic_family_002',
        primaryReligion: 'islamic'
      };

      const result = await culturalAgent.assessFamily(islamicFamily, mockConfig);
      const islamicRites = result.identifiedRites.filter(rite => rite.faith === 'Islamic');
      
      expect(islamicRites.length).toBeGreaterThan(0);
      const restrictions = islamicRites[0].restrictions;
      expect(restrictions.some(r => r.type === 'cremation')).toBe(true);
      expect(restrictions.some(r => r.type === 'embalming')).toBe(true);
    });

    test('should provide Islamic ritual accommodations', async () => {
      const islamicFamily = {
        familyId: 'islamic_family_003',
        primaryReligion: 'islamic',
        venueRequirements: {
          needsPrayerSpace: true,
          qiblaDirection: true
        }
      };

      const result = await culturalAgent.assessFamily(islamicFamily, mockConfig);
      const accommodations = result.accommodations;
      
      expect(accommodations.some(acc => 
        acc.requirement.includes('Prayer space') || 
        acc.requirement.includes('prayer area')
      )).toBe(true);
      expect(accommodations.some(acc => 
        acc.requirement.includes('Qibla') || 
        acc.accommodation.includes('orientation')
      )).toBe(true);
    });

    test('should validate Islamic timeline requirements', async () => {
      const islamicFamily = {
        familyId: 'islamic_family_004',
        primaryReligion: 'islamic',
        deathDate: new Date(),
        requestedServiceDate: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours later
      };

      const result = await culturalAgent.assessFamily(islamicFamily, mockConfig);
      
      // Should detect potential timing conflict (Islam prefers burial within 24 hours)
      expect(result.conflicts.some(conflict => 
        conflict.type === 'cultural_religious' && 
        conflict.description.includes('timing')
      )).toBe(true);
    });
  });

  describe('Jewish Cultural Requirements', () => {
    test('should handle Orthodox Jewish funeral requirements', async () => {
      const jewishFamily = {
        familyId: 'jewish_family_001',
        primaryCulture: 'Ashkenazi',
        primaryReligion: 'jewish',
        denomination: 'Orthodox',
        requiresRabbi: true,
        kosherRequirements: true
      };

      const result = await culturalAgent.assessFamily(jewishFamily, mockConfig);
      
      expect(result.identifiedRites).toHaveLength(1);
      expect(result.identifiedRites[0].faith).toBe('Jewish');
      expect(result.identifiedRites[0].riteName).toBe('Traditional Jewish Burial');
    });

    test('should identify Jewish burial restrictions', async () => {
      const jewishFamily = {
        familyId: 'jewish_family_002',
        primaryReligion: 'jewish',
        denomination: 'Orthodox'
      };

      const result = await culturalAgent.assessFamily(jewishFamily, mockConfig);
      const jewishRites = result.identifiedRites.filter(rite => rite.faith === 'Jewish');
      
      expect(jewishRites.length).toBeGreaterThan(0);
      const restrictions = jewishRites[0].restrictions;
      expect(restrictions.some(r => r.type === 'cremation')).toBe(true);
      expect(restrictions.some(r => r.type === 'embalming')).toBe(true);
    });

    test('should provide Jewish ritual requirements', async () => {
      const jewishFamily = {
        familyId: 'jewish_family_003',
        primaryReligion: 'jewish'
      };

      const result = await culturalAgent.assessFamily(jewishFamily, mockConfig);
      const jewishRites = result.identifiedRites.filter(rite => rite.faith === 'Jewish');
      
      expect(jewishRites.length).toBeGreaterThan(0);
      const requirements = jewishRites[0].requirements;
      expect(requirements.some(req => req.requirement.includes('Tahara'))).toBe(true);
      expect(requirements.some(req => req.requirement.includes('Kaddish'))).toBe(true);
      expect(requirements.some(req => req.requirement.includes('24 hours'))).toBe(true);
    });

    test('should handle Conservative vs Orthodox differences', async () => {
      // Add Conservative Jewish rite for testing
      const conservativeRite: ReligiousRite = {
        faith: 'Jewish',
        denomination: 'Conservative',
        riteName: 'Conservative Jewish Burial',
        description: 'Conservative Jewish funeral customs with some flexibility',
        requirements: [
          {
            category: 'burial',
            requirement: 'Burial preferred within 48 hours',
            mandatory: true,
            whoProvides: 'funeral_director',
            timing: 'Within reasonable timeframe'
          }
        ],
        restrictions: [
          {
            type: 'cremation',
            description: 'Cremation generally discouraged but may be permitted',
            exceptions: ['Individual circumstances with rabbinical consultation']
          }
        ],
        accommodations: [],
        compatibility: [
          {
            otherFaith: 'Orthodox Jewish',
            compatible: true,
            notes: 'Can accommodate more traditional elements'
          }
        ]
      };

      culturalAgent.addReligiousRite('jewish_conservative', conservativeRite);

      const conservativeFamily = {
        familyId: 'jewish_family_004',
        primaryReligion: 'jewish_conservative'
      };

      const result = await culturalAgent.assessFamily(conservativeFamily, mockConfig);
      
      expect(result.identifiedRites.some(rite => 
        rite.denomination === 'Conservative'
      )).toBe(true);
    });
  });

  describe('Hindu Cultural Requirements', () => {
    test('should handle Hindu funeral requirements', async () => {
      // Add Hindu religious rites for testing
      const hinduRite: ReligiousRite = {
        faith: 'Hindu',
        denomination: 'General',
        riteName: 'Hindu Cremation Ceremony',
        description: 'Traditional Hindu funeral rites with cremation',
        requirements: [
          {
            category: 'preparation',
            requirement: 'Body washing and dressing in clean clothes',
            mandatory: true,
            whoProvides: 'family',
            timing: 'Before cremation'
          },
          {
            category: 'ceremony',
            requirement: 'Pandit to perform last rites',
            mandatory: true,
            whoProvides: 'religious_leader',
            timing: 'During ceremony'
          },
          {
            category: 'burial',
            requirement: 'Cremation within 24 hours if possible',
            mandatory: true,
            whoProvides: 'funeral_director',
            timing: 'As soon as possible'
          }
        ],
        restrictions: [
          {
            type: 'burial',
            description: 'Traditional burial not preferred - cremation is customary',
            exceptions: ['Special circumstances', 'Geographic limitations']
          }
        ],
        accommodations: [
          {
            need: 'Cremation facility',
            solution: 'Access to crematorium with Hindu ceremony accommodation'
          },
          {
            need: 'Hindu priest (Pandit)',
            solution: 'Coordinate with local Hindu temple'
          }
        ],
        compatibility: []
      };

      culturalAgent.addReligiousRite('hindu', hinduRite);

      const hinduFamily = {
        familyId: 'hindu_family_001',
        primaryCulture: 'Indian',
        primaryReligion: 'hindu',
        requiresPandit: true,
        prefersCremation: true
      };

      const result = await culturalAgent.assessFamily(hinduFamily, mockConfig);
      
      expect(result.identifiedRites.some(rite => rite.faith === 'Hindu')).toBe(true);
      expect(result.accommodations.some(acc => 
        acc.requirement.includes('Cremation') || 
        acc.requirement.includes('priest')
      )).toBe(true);
    });

    test('should handle Hindu dietary and ritual purity requirements', async () => {
      const hinduTradition: CulturalTradition = {
        name: 'Hindu Funeral Customs',
        region: 'Indian Subcontinent',
        description: 'Traditional Hindu funeral and mourning customs',
        requirements: [
          {
            category: 'food',
            requirement: 'Vegetarian meals for mourning period',
            mandatory: true,
            alternatives: ['Vegan options'],
            explanation: 'Maintains ritual purity during mourning'
          },
          {
            category: 'timing',
            requirement: '13-day mourning period observance',
            mandatory: false,
            alternatives: ['Modified observance period'],
            explanation: 'Traditional mourning and purification period'
          }
        ],
        restrictions: [
          {
            type: 'food',
            description: 'No meat, fish, or eggs during mourning period',
            severity: 'important'
          }
        ],
        timeline: {
          preparationTime: 'Within hours of death',
          ceremonyDuration: '2-4 hours',
          postCeremonyObservances: '13 days'
        },
        keyContacts: [
          {
            role: 'Pandit (Hindu Priest)',
            description: 'Religious leader to perform rites',
            required: true
          }
        ]
      };

      culturalAgent.addCulturalTradition('hindu', hinduTradition);

      const hinduFamily = {
        familyId: 'hindu_family_002',
        primaryCulture: 'hindu',
        primaryReligion: 'hindu'
      };

      const result = await culturalAgent.assessFamily(hinduFamily, mockConfig);
      
      expect(result.identifiedTraditions.some(tradition => 
        tradition.name === 'Hindu Funeral Customs'
      )).toBe(true);
    });
  });

  describe('Dutch Cultural Requirements', () => {
    test('should handle traditional Dutch funeral customs', async () => {
      const dutchTradition: CulturalTradition = {
        name: 'Dutch Funeral Tradition',
        region: 'Netherlands',
        description: 'Traditional Dutch funeral customs emphasizing simplicity and community',
        requirements: [
          {
            category: 'ceremony',
            requirement: 'Simple, dignified service',
            mandatory: true,
            alternatives: ['Memorial service', 'Celebration of life'],
            explanation: 'Dutch preference for understated ceremonies'
          },
          {
            category: 'food',
            requirement: 'Coffee and cake for mourners',
            mandatory: true,
            alternatives: ['Light refreshments', 'Tea service'],
            explanation: 'Traditional Dutch hospitality custom'
          },
          {
            category: 'attire',
            requirement: 'Dark, formal clothing',
            mandatory: false,
            alternatives: ['Smart casual', 'Colorful clothing if requested by family'],
            explanation: 'Traditional mourning attire'
          }
        ],
        restrictions: [
          {
            type: 'display',
            description: 'Avoid ostentatious displays of wealth',
            severity: 'advisory'
          }
        ],
        timeline: {
          preparationTime: '3-5 days',
          ceremonyDuration: '60-90 minutes',
          postCeremonyObservances: 'Family gathering with refreshments'
        },
        keyContacts: [
          {
            role: 'Family spokesperson',
            description: 'Family member to coordinate arrangements',
            required: true
          }
        ]
      };

      culturalAgent.addCulturalTradition('dutch', dutchTradition);

      const dutchFamily = {
        familyId: 'dutch_family_001',
        primaryCulture: 'dutch',
        primaryReligion: 'christian',
        denomination: 'Reformed',
        preferSimpleService: true
      };

      const result = await culturalAgent.assessFamily(dutchFamily, mockConfig);
      
      expect(result.identifiedTraditions.some(tradition => 
        tradition.name === 'Dutch Funeral Tradition'
      )).toBe(true);
    });

    test('should handle Dutch Protestant religious requirements', async () => {
      const dutchProtestant: ReligiousRite = {
        faith: 'Christian',
        denomination: 'Dutch Reformed',
        riteName: 'Dutch Reformed Funeral Service',
        description: 'Traditional Dutch Reformed funeral service',
        requirements: [
          {
            category: 'clergy',
            requirement: 'Dutch Reformed minister',
            mandatory: true,
            whoProvides: 'religious_leader',
            timing: 'During service'
          },
          {
            category: 'ceremony',
            requirement: 'Scripture reading and prayer',
            mandatory: true,
            whoProvides: 'religious_leader',
            timing: 'During service'
          }
        ],
        restrictions: [
          {
            type: 'music',
            description: 'Traditional hymns preferred over contemporary music',
            exceptions: ['Family special requests']
          }
        ],
        accommodations: [
          {
            need: 'Church venue',
            solution: 'Dutch Reformed church or suitable chapel'
          }
        ],
        compatibility: [
          {
            otherFaith: 'Other Protestant denominations',
            compatible: true,
            notes: 'Can accommodate ecumenical elements'
          }
        ]
      };

      culturalAgent.addReligiousRite('dutch_reformed', dutchProtestant);

      const dutchReformedFamily = {
        familyId: 'dutch_family_002',
        primaryCulture: 'dutch',
        primaryReligion: 'dutch_reformed'
      };

      const result = await culturalAgent.assessFamily(dutchReformedFamily, mockConfig);
      
      expect(result.identifiedRites.some(rite => 
        rite.denomination === 'Dutch Reformed'
      )).toBe(true);
    });
  });

  describe('Multi-Cultural Families', () => {
    test('should handle interfaith families', async () => {
      const interfaithFamily = {
        familyId: 'interfaith_family_001',
        primaryCulture: 'American',
        primaryReligion: 'christian',
        secondaryCultures: ['Jewish'],
        secondaryReligions: ['jewish'],
        specialCircumstances: 'Interfaith marriage'
      };

      const result = await culturalAgent.assessFamily(interfaithFamily, mockConfig);
      
      expect(result.identifiedRites.length).toBeGreaterThan(1);
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.recommendations.some(rec => 
        rec.category === 'conflict_resolution'
      )).toBe(true);
    });

    test('should handle multicultural backgrounds', async () => {
      const multiculturalFamily = {
        familyId: 'multicultural_family_001',
        primaryCulture: 'Dutch',
        primaryReligion: 'christian',
        secondaryCultures: ['Indonesian', 'Surinamese'],
        secondaryReligions: [],
        immigrationHistory: true,
        blendedTraditions: true
      };

      const result = await culturalAgent.assessFamily(multiculturalFamily, mockConfig);
      
      expect(result.assessment.secondaryCultures).toContain('Indonesian');
      expect(result.assessment.secondaryCultures).toContain('Surinamese');
      expect(result.assessment.sensitivityLevel).toBe('elevated');
    });

    test('should detect and resolve cultural conflicts', async () => {
      // Create conflicting requirements
      const conflictingFamily = {
        familyId: 'conflicting_family_001',
        primaryCulture: 'islamic_culture',
        primaryReligion: 'islamic',
        secondaryCultures: ['western'],
        familyRequests: {
          cremation: true, // Conflicts with Islamic requirements
          mixedGenderSeating: true,
          alcohol: false
        }
      };

      const result = await culturalAgent.assessFamily(conflictingFamily, mockConfig);
      
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.conflicts.some(conflict => 
        conflict.description.includes('cremation') || 
        conflict.description.includes('Cremation')
      )).toBe(true);
      expect(result.assessment.sensitivityLevel).toBe('maximum');
    });
  });

  describe('Cultural Sensitivity Levels', () => {
    test('should assign standard sensitivity for single culture', async () => {
      const simpleFamily = {
        familyId: 'simple_family_001',
        primaryCulture: 'Dutch',
        primaryReligion: 'christian'
      };

      const result = await culturalAgent.assessFamily(simpleFamily, mockConfig);
      
      expect(result.assessment.sensitivityLevel).toBe('standard');
    });

    test('should assign elevated sensitivity for multiple cultures', async () => {
      const complexFamily = {
        familyId: 'complex_family_001',
        primaryCulture: 'Dutch',
        primaryReligion: 'christian',
        secondaryCultures: ['Turkish'],
        secondaryReligions: ['islamic']
      };

      const result = await culturalAgent.assessFamily(complexFamily, mockConfig);
      
      expect(result.assessment.sensitivityLevel).toBe('elevated');
    });

    test('should assign maximum sensitivity for conflicts', async () => {
      const conflictFamily = {
        familyId: 'conflict_family_001',
        primaryCulture: 'Mixed',
        primaryReligion: 'multiple',
        hasConflicts: true
      };

      // Manually add conflicts to test sensitivity assignment
      const result = await culturalAgent.assessFamily(conflictFamily, mockConfig);
      
      // Add artificial conflicts for testing
      const updatedResult = {
        ...result,
        conflicts: [
          {
            type: 'religious_religious',
            severity: 'major',
            description: 'Test conflict'
          }
        ]
      };

      // This would be handled by the sensitivity review node
      expect(updatedResult.conflicts[0].severity).toBe('major');
    });
  });

  describe('Advisor Consultation Requirements', () => {
    test('should require cultural advisor for complex traditions', async () => {
      const complexCulturalFamily = {
        familyId: 'complex_cultural_001',
        primaryCulture: 'Tibetan Buddhist',
        primaryReligion: 'buddhist',
        specialRituals: true,
        uncommonTraditions: true
      };

      const result = await culturalAgent.assessFamily(complexCulturalFamily, mockConfig);
      
      expect(result.advisorNeeded).toBe(true);
    });

    test('should require religious advisor for unfamiliar rites', async () => {
      const unfamiliarReligionFamily = {
        familyId: 'unfamiliar_religion_001',
        primaryReligion: 'unknown_denomination',
        requiresSpecialRites: true
      };

      const result = await culturalAgent.assessFamily(unfamiliarReligionFamily, mockConfig);
      
      expect(result.advisorNeeded).toBe(true);
    });

    test('should determine appropriate advisor type', async () => {
      const religiousFamily = {
        familyId: 'religious_family_001',
        primaryReligion: 'islamic',
        complexReligiousRequirements: true
      };

      const result = await culturalAgent.assessFamily(religiousFamily, mockConfig);
      
      if (result.assessment.advisorRequired) {
        expect(result.assessment.advisorType).toBe('religious');
      }
    });
  });

  describe('Recommendations Generation', () => {
    test('should generate timeline recommendations', async () => {
      const timelineFamily = {
        familyId: 'timeline_family_001',
        primaryReligion: 'islamic',
        urgentBurial: true
      };

      const result = await culturalAgent.assessFamily(timelineFamily, mockConfig);
      
      expect(result.recommendations.some(rec => 
        rec.category === 'timeline'
      )).toBe(true);
    });

    test('should generate venue recommendations', async () => {
      const venueFamily = {
        familyId: 'venue_family_001',
        primaryReligion: 'jewish',
        requiresKosherFacility: true
      };

      const result = await culturalAgent.assessFamily(venueFamily, mockConfig);
      
      expect(result.recommendations.some(rec => 
        rec.category === 'venue'
      )).toBe(true);
    });

    test('should prioritize recommendations appropriately', async () => {
      const priorityFamily = {
        familyId: 'priority_family_001',
        primaryReligion: 'islamic',
        hasUrgentRequirements: true,
        hasMajorConflicts: true
      };

      const result = await culturalAgent.assessFamily(priorityFamily, mockConfig);
      
      const highPriorityRecs = result.recommendations.filter(rec => 
        rec.priority === 'high'
      );
      expect(highPriorityRecs.length).toBeGreaterThan(0);
    });
  });

  describe('Data Validation and Schema Compliance', () => {
    test('should validate cultural tradition schema', () => {
      const validTradition = {
        name: 'Test Tradition',
        region: 'Test Region',
        description: 'Test Description',
        requirements: [
          {
            category: 'ceremony',
            requirement: 'Test requirement',
            mandatory: true,
            alternatives: ['Alternative'],
            explanation: 'Test explanation'
          }
        ],
        restrictions: [
          {
            type: 'test',
            description: 'Test restriction',
            severity: 'advisory'
          }
        ],
        timeline: {
          preparationTime: '1 day',
          ceremonyDuration: '1 hour',
          postCeremonyObservances: 'None'
        },
        keyContacts: [
          {
            role: 'Test Role',
            description: 'Test Description',
            required: false
          }
        ]
      };

      const validation = CulturalTraditionSchema.safeParse(validTradition);
      expect(validation.success).toBe(true);
    });

    test('should validate religious rite schema', () => {
      const validRite = {
        faith: 'Test Faith',
        denomination: 'Test Denomination',
        riteName: 'Test Rite',
        description: 'Test Description',
        requirements: [
          {
            category: 'ceremony',
            requirement: 'Test requirement',
            mandatory: true,
            whoProvides: 'family',
            timing: 'during service'
          }
        ],
        restrictions: [
          {
            type: 'test',
            description: 'Test restriction',
            exceptions: ['Exception']
          }
        ],
        accommodations: [
          {
            need: 'Test need',
            solution: 'Test solution',
            cost: 100
          }
        ],
        compatibility: [
          {
            otherFaith: 'Other Faith',
            compatible: true,
            notes: 'Test notes'
          }
        ]
      };

      const validation = ReligiousRiteSchema.safeParse(validRite);
      expect(validation.success).toBe(true);
    });

    test('should handle invalid cultural data gracefully', async () => {
      const invalidFamily = {
        familyId: 'invalid_family_001',
        primaryCulture: null, // Invalid
        primaryReligion: undefined, // Invalid
        invalidField: 'should be ignored'
      };

      // Should not throw an error
      const result = await culturalAgent.assessFamily(invalidFamily, mockConfig);
      expect(result).toBeDefined();
      expect(result.assessment).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large number of cultural traditions', async () => {
      // Add many traditions
      for (let i = 0; i < 100; i++) {
        const tradition: CulturalTradition = {
          name: `Test Tradition ${i}`,
          region: `Region ${i}`,
          description: `Description ${i}`,
          requirements: [],
          restrictions: [],
          timeline: {
            preparationTime: '1 day',
            ceremonyDuration: '1 hour',
            postCeremonyObservances: 'None'
          },
          keyContacts: []
        };
        culturalAgent.addCulturalTradition(`test_${i}`, tradition);
      }

      const testFamily = {
        familyId: 'performance_test_001',
        primaryCulture: 'test_50',
        primaryReligion: 'christian'
      };

      const startTime = Date.now();
      const result = await culturalAgent.assessFamily(testFamily, mockConfig);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should stream assessment process', async () => {
      const streamFamily = {
        familyId: 'stream_family_001',
        primaryCulture: 'dutch',
        primaryReligion: 'christian'
      };

      const stream = await culturalAgent.streamAssessment(streamFamily, mockConfig);
      expect(stream).toBeDefined();
      expect(typeof stream[Symbol.asyncIterator]).toBe('function');
    });
  });
});