/**
 * Cultural and Religious Requirements Agent
 * 
 * Handles cultural and religious considerations in funeral planning with
 * sensitivity, accuracy, and respect for diverse traditions.
 */

import { StateGraph, Annotation } from "@langchain/langgraph";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { z } from "zod";

// Cultural and religious requirement schemas
export const CulturalTraditionSchema = z.object({
  name: z.string(),
  region: z.string(),
  description: z.string(),
  requirements: z.array(z.object({
    category: z.enum(["ceremony", "preparation", "timing", "location", "attire", "food", "music", "rituals"]),
    requirement: z.string(),
    mandatory: z.boolean(),
    alternatives: z.array(z.string()),
    explanation: z.string(),
  })),
  restrictions: z.array(z.object({
    type: z.string(),
    description: z.string(),
    severity: z.enum(["advisory", "important", "mandatory"]),
  })),
  timeline: z.object({
    preparationTime: z.string(),
    ceremonyDuration: z.string(),
    postCeremonyObservances: z.string(),
  }),
  keyContacts: z.array(z.object({
    role: z.string(),
    description: z.string(),
    required: z.boolean(),
  })),
});

export const ReligiousRiteSchema = z.object({
  faith: z.string(),
  denomination: z.string().optional(),
  riteName: z.string(),
  description: z.string(),
  requirements: z.array(z.object({
    category: z.enum(["clergy", "preparation", "ceremony", "burial", "mourning", "memorial"]),
    requirement: z.string(),
    mandatory: z.boolean(),
    whoProvides: z.enum(["family", "religious_leader", "funeral_director", "venue"]),
    timing: z.string(),
  })),
  restrictions: z.array(z.object({
    type: z.string(),
    description: z.string(),
    exceptions: z.array(z.string()),
  })),
  accommodations: z.array(z.object({
    need: z.string(),
    solution: z.string(),
    cost: z.number().optional(),
  })),
  compatibility: z.array(z.object({
    otherFaith: z.string(),
    compatible: z.boolean(),
    notes: z.string(),
  })),
});

export const CulturalAssessmentSchema = z.object({
  familyId: z.string(),
  assessmentDate: z.date(),
  primaryCulture: z.string(),
  secondaryCultures: z.array(z.string()),
  primaryReligion: z.string(),
  secondaryReligions: z.array(z.string()),
  traditions: z.array(CulturalTraditionSchema),
  religiousRites: z.array(ReligiousRiteSchema),
  conflicts: z.array(z.object({
    type: z.enum(["cultural_cultural", "religious_religious", "cultural_religious"]),
    description: z.string(),
    severity: z.enum(["minor", "moderate", "major"]),
    resolution: z.string(),
  })),
  accommodations: z.array(z.object({
    requirement: z.string(),
    accommodation: z.string(),
    cost: z.number().optional(),
    provider: z.string(),
  })),
  sensitivityLevel: z.enum(["standard", "elevated", "maximum"]),
  advisorRequired: z.boolean(),
  advisorType: z.string().optional(),
});

export type CulturalTradition = z.infer<typeof CulturalTraditionSchema>;
export type ReligiousRite = z.infer<typeof ReligiousRiteSchema>;
export type CulturalAssessment = z.infer<typeof CulturalAssessmentSchema>;

// Cultural agent state
export const CulturalAgentState = Annotation.Root({
  assessment: Annotation<CulturalAssessment | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  familyBackground: Annotation<any>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  identifiedTraditions: Annotation<CulturalTradition[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  identifiedRites: Annotation<ReligiousRite[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  conflicts: Annotation<any[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  recommendations: Annotation<any[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  advisorNeeded: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  currentStage: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "initial",
  }),
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

/**
 * Cultural Requirements Agent
 */
export class CulturalRequirementsAgent {
  private graph: StateGraph<typeof CulturalAgentState>;
  private culturalDatabase: Map<string, CulturalTradition[]> = new Map();
  private religiousDatabase: Map<string, ReligiousRite[]> = new Map();

  constructor() {
    this.graph = new StateGraph(CulturalAgentState);
    this.initializeKnowledgeBase();
    this.buildWorkflow();
  }

  /**
   * Initialize cultural and religious knowledge base
   */
  private initializeKnowledgeBase() {
    // Christian traditions
    this.religiousDatabase.set("christian", [
      {
        faith: "Christian",
        denomination: "Catholic",
        riteName: "Catholic Funeral Mass",
        description: "Traditional Catholic funeral service with Mass",
        requirements: [
          {
            category: "clergy",
            requirement: "Catholic priest to celebrate Mass",
            mandatory: true,
            whoProvides: "religious_leader",
            timing: "During funeral service",
          },
          {
            category: "preparation",
            requirement: "Body prepared for viewing",
            mandatory: false,
            whoProvides: "funeral_director",
            timing: "Before service",
          },
          {
            category: "ceremony",
            requirement: "Eucharist celebration",
            mandatory: true,
            whoProvides: "religious_leader",
            timing: "During Mass",
          },
        ],
        restrictions: [
          {
            type: "cremation_timing",
            description: "If cremation, Mass should occur before cremation when possible",
            exceptions: ["Exceptional circumstances with bishop approval"],
          },
        ],
        accommodations: [
          {
            need: "Church venue",
            solution: "Catholic church or funeral home chapel",
            cost: 200,
          },
        ],
        compatibility: [
          {
            otherFaith: "Protestant",
            compatible: true,
            notes: "Can accommodate ecumenical elements",
          },
        ],
      },
    ]);

    // Jewish traditions
    this.religiousDatabase.set("jewish", [
      {
        faith: "Jewish",
        denomination: "Orthodox",
        riteName: "Traditional Jewish Burial",
        description: "Orthodox Jewish burial customs and traditions",
        requirements: [
          {
            category: "preparation",
            requirement: "Tahara (ritual washing and dressing)",
            mandatory: true,
            whoProvides: "religious_leader",
            timing: "Before burial",
          },
          {
            category: "ceremony",
            requirement: "Kaddish recitation",
            mandatory: true,
            whoProvides: "family",
            timing: "At graveside",
          },
          {
            category: "burial",
            requirement: "Burial within 24 hours if possible",
            mandatory: true,
            whoProvides: "funeral_director",
            timing: "As soon as possible",
          },
        ],
        restrictions: [
          {
            type: "cremation",
            description: "Cremation not permitted in Orthodox tradition",
            exceptions: [],
          },
          {
            type: "embalming",
            description: "Embalming generally not permitted unless required by law",
            exceptions: ["Legal requirements for transport"],
          },
        ],
        accommodations: [
          {
            need: "Kosher meal for mourners",
            solution: "Arrange kosher catering",
            cost: 500,
          },
        ],
        compatibility: [
          {
            otherFaith: "Conservative Jewish",
            compatible: true,
            notes: "Some flexibility in interpretations",
          },
        ],
      },
    ]);

    // Islamic traditions
    this.religiousDatabase.set("islamic", [
      {
        faith: "Islamic",
        denomination: "Sunni",
        riteName: "Islamic Janazah",
        description: "Traditional Islamic funeral prayer and burial",
        requirements: [
          {
            category: "preparation",
            requirement: "Ghusl (ritual washing)",
            mandatory: true,
            whoProvides: "religious_leader",
            timing: "Before burial",
          },
          {
            category: "ceremony",
            requirement: "Salat al-Janazah (funeral prayer)",
            mandatory: true,
            whoProvides: "religious_leader",
            timing: "Before burial",
          },
          {
            category: "burial",
            requirement: "Burial facing Mecca (Qibla)",
            mandatory: true,
            whoProvides: "funeral_director",
            timing: "During burial",
          },
        ],
        restrictions: [
          {
            type: "cremation",
            description: "Cremation is not permitted in Islam",
            exceptions: [],
          },
          {
            type: "embalming",
            description: "Embalming generally not preferred unless required",
            exceptions: ["Legal requirements for international transport"],
          },
        ],
        accommodations: [
          {
            need: "Prayer space for janazah",
            solution: "Mosque or large prayer area",
          },
          {
            need: "Qibla direction identification",
            solution: "Compass or GPS for proper orientation",
          },
        ],
        compatibility: [
          {
            otherFaith: "Other Islamic denominations",
            compatible: true,
            notes: "Minor variations in practice",
          },
        ],
      },
    ]);

    // Cultural traditions
    this.culturalDatabase.set("irish", [
      {
        name: "Irish Wake",
        region: "Ireland/Irish-American",
        description: "Traditional Irish funeral custom with wake and celebration of life",
        requirements: [
          {
            category: "ceremony",
            requirement: "Wake with open casket",
            mandatory: false,
            alternatives: ["Memorial service", "Celebration of life"],
            explanation: "Traditional viewing and gathering to honor the deceased",
          },
          {
            category: "food",
            requirement: "Food and drink for mourners",
            mandatory: true,
            alternatives: ["Catered meal", "Potluck style", "Light refreshments"],
            explanation: "Hospitality for those paying respects",
          },
          {
            category: "music",
            requirement: "Traditional Irish music",
            mandatory: false,
            alternatives: ["Live musicians", "Recorded music", "No music"],
            explanation: "Celtic music to honor heritage",
          },
        ],
        restrictions: [
          {
            type: "timing",
            description: "Wake typically lasts 1-3 days",
            severity: "advisory",
          },
        ],
        timeline: {
          preparationTime: "1-2 days",
          ceremonyDuration: "2-4 hours",
          postCeremonyObservances: "Ongoing remembrance",
        },
        keyContacts: [
          {
            role: "Cultural advisor",
            description: "Someone familiar with Irish traditions",
            required: false,
          },
        ],
      },
    ]);
  }

  /**
   * Build the cultural assessment workflow
   */
  private buildWorkflow() {
    this.graph.addNode("intake_assessment", this.intakeAssessmentNode.bind(this));
    this.graph.addNode("tradition_identification", this.traditionIdentificationNode.bind(this));
    this.graph.addNode("religious_analysis", this.religiousAnalysisNode.bind(this));
    this.graph.addNode("conflict_detection", this.conflictDetectionNode.bind(this));
    this.graph.addNode("accommodation_planning", this.accommodationPlanningNode.bind(this));
    this.graph.addNode("advisor_consultation", this.advisorConsultationNode.bind(this));
    this.graph.addNode("recommendation_generation", this.recommendationGenerationNode.bind(this));
    this.graph.addNode("sensitivity_review", this.sensitivityReviewNode.bind(this));

    // Define workflow edges
    this.graph.addEdge("intake_assessment", "tradition_identification");
    this.graph.addEdge("tradition_identification", "religious_analysis");
    this.graph.addEdge("religious_analysis", "conflict_detection");
    this.graph.addEdge("conflict_detection", "accommodation_planning");
    
    this.graph.addConditionalEdges(
      "accommodation_planning",
      this.routeFromAccommodation.bind(this),
      {
        "advisor": "advisor_consultation",
        "recommendations": "recommendation_generation",
      }
    );

    this.graph.addEdge("advisor_consultation", "recommendation_generation");
    this.graph.addEdge("recommendation_generation", "sensitivity_review");
    this.graph.addEdge("sensitivity_review", "__end__");

    // Compile the graph
    this.graph = this.graph.compile();
  }

  /**
   * Initial assessment and intake of family cultural background
   */
  private async intakeAssessmentNode(state: typeof CulturalAgentState.State) {
    console.log("[Cultural Agent] Starting intake assessment");

    const familyBackground = state.familyBackground || {};
    
    // Create initial assessment structure
    const assessment: Partial<CulturalAssessment> = {
      familyId: familyBackground.familyId || `family_${Date.now()}`,
      assessmentDate: new Date(),
      primaryCulture: familyBackground.primaryCulture || "",
      secondaryCultures: familyBackground.secondaryCultures || [],
      primaryReligion: familyBackground.primaryReligion || "",
      secondaryReligions: familyBackground.secondaryReligions || [],
      traditions: [],
      religiousRites: [],
      conflicts: [],
      accommodations: [],
      sensitivityLevel: "standard",
      advisorRequired: false,
    };

    return {
      assessment: assessment as CulturalAssessment,
      currentStage: "tradition_identification",
      messages: [
        new AIMessage({
          content: `Cultural intake assessment completed for family ${assessment.familyId}. Primary culture: ${assessment.primaryCulture}, Primary religion: ${assessment.primaryReligion}`,
        }),
      ],
    };
  }

  /**
   * Identify relevant cultural traditions
   */
  private async traditionIdentificationNode(state: typeof CulturalAgentState.State) {
    console.log("[Cultural Agent] Identifying cultural traditions");

    const assessment = state.assessment;
    if (!assessment) return {};

    const identifiedTraditions: CulturalTradition[] = [];

    // Look up primary culture traditions
    if (assessment.primaryCulture) {
      const cultureTraditions = this.culturalDatabase.get(assessment.primaryCulture.toLowerCase());
      if (cultureTraditions) {
        identifiedTraditions.push(...cultureTraditions);
      }
    }

    // Look up secondary culture traditions
    for (const culture of assessment.secondaryCultures || []) {
      const traditions = this.culturalDatabase.get(culture.toLowerCase());
      if (traditions) {
        identifiedTraditions.push(...traditions);
      }
    }

    return {
      identifiedTraditions,
      currentStage: "religious_analysis",
      messages: [
        new AIMessage({
          content: `Identified ${identifiedTraditions.length} cultural traditions for assessment`,
        }),
      ],
    };
  }

  /**
   * Analyze religious requirements
   */
  private async religiousAnalysisNode(state: typeof CulturalAgentState.State) {
    console.log("[Cultural Agent] Analyzing religious requirements");

    const assessment = state.assessment;
    if (!assessment) return {};

    const identifiedRites: ReligiousRite[] = [];

    // Look up primary religion rites
    if (assessment.primaryReligion) {
      const religiousRites = this.religiousDatabase.get(assessment.primaryReligion.toLowerCase());
      if (religiousRites) {
        identifiedRites.push(...religiousRites);
      }
    }

    // Look up secondary religion rites
    for (const religion of assessment.secondaryReligions || []) {
      const rites = this.religiousDatabase.get(religion.toLowerCase());
      if (rites) {
        identifiedRites.push(...rites);
      }
    }

    return {
      identifiedRites,
      currentStage: "conflict_detection",
      messages: [
        new AIMessage({
          content: `Analyzed ${identifiedRites.length} religious rites for requirements`,
        }),
      ],
    };
  }

  /**
   * Detect conflicts between traditions and requirements
   */
  private async conflictDetectionNode(state: typeof CulturalAgentState.State) {
    console.log("[Cultural Agent] Detecting cultural and religious conflicts");

    const traditions = state.identifiedTraditions || [];
    const rites = state.identifiedRites || [];
    const conflicts: any[] = [];

    // Check for religious conflicts
    for (let i = 0; i < rites.length; i++) {
      for (let j = i + 1; j < rites.length; j++) {
        const rite1 = rites[i];
        const rite2 = rites[j];

        // Check compatibility
        const compatibility = rite1.compatibility.find(c => c.otherFaith === rite2.faith);
        if (compatibility && !compatibility.compatible) {
          conflicts.push({
            type: "religious_religious",
            description: `Conflict between ${rite1.faith} and ${rite2.faith} practices`,
            severity: "major",
            resolution: `Prioritize primary faith (${rite1.faith}) or seek interfaith accommodation`,
          });
        }
      }
    }

    // Check for cultural-religious conflicts
    for (const tradition of traditions) {
      for (const rite of rites) {
        // Example: Check if cultural timing conflicts with religious timing
        if (tradition.timeline.preparationTime !== rite.requirements.find(r => r.category === "preparation")?.timing) {
          conflicts.push({
            type: "cultural_religious",
            description: `Timing conflict between ${tradition.name} and ${rite.riteName}`,
            severity: "moderate",
            resolution: "Adjust timing to accommodate both traditions",
          });
        }
      }
    }

    return {
      conflicts,
      currentStage: "accommodation_planning", 
      messages: [
        new AIMessage({
          content: `Detected ${conflicts.length} potential conflicts requiring resolution`,
        }),
      ],
    };
  }

  /**
   * Plan accommodations for requirements
   */
  private async accommodationPlanningNode(state: typeof CulturalAgentState.State) {
    console.log("[Cultural Agent] Planning cultural and religious accommodations");

    const traditions = state.identifiedTraditions || [];
    const rites = state.identifiedRites || [];
    const accommodations: any[] = [];

    // Plan accommodations for traditions
    for (const tradition of traditions) {
      for (const requirement of tradition.requirements) {
        if (requirement.mandatory) {
          accommodations.push({
            requirement: `${tradition.name}: ${requirement.requirement}`,
            accommodation: `Ensure ${requirement.category} accommodates ${requirement.requirement}`,
            provider: "funeral_director",
          });
        }
      }
    }

    // Plan accommodations for religious rites
    for (const rite of rites) {
      for (const accommodation of rite.accommodations) {
        accommodations.push({
          requirement: accommodation.need,
          accommodation: accommodation.solution,
          cost: accommodation.cost,
          provider: "venue",
        });
      }
    }

    // Determine if advisor is needed
    const needsAdvisor = traditions.some(t => t.keyContacts.some(k => k.required)) ||
                        rites.some(r => r.requirements.some(req => req.whoProvides === "religious_leader")) ||
                        state.conflicts.length > 0;

    return {
      accommodations,
      advisorNeeded: needsAdvisor,
      currentStage: needsAdvisor ? "advisor_consultation" : "recommendation_generation",
      messages: [
        new AIMessage({
          content: `Planned ${accommodations.length} accommodations. Advisor needed: ${needsAdvisor}`,
        }),
      ],
    };
  }

  /**
   * Route from accommodation planning
   */
  private routeFromAccommodation(state: typeof CulturalAgentState.State): string {
    return state.advisorNeeded ? "advisor" : "recommendations";
  }

  /**
   * Consult with cultural/religious advisor
   */
  private async advisorConsultationNode(state: typeof CulturalAgentState.State) {
    console.log("[Cultural Agent] Arranging advisor consultation");

    const assessment = state.assessment;
    const traditions = state.identifiedTraditions || [];
    const rites = state.identifiedRites || [];

    // Determine type of advisor needed
    let advisorType = "general";
    if (rites.length > 0) {
      advisorType = "religious";
    }
    if (traditions.length > 0) {
      advisorType = traditions.length > rites.length ? "cultural" : "interfaith";
    }

    // Update assessment with advisor requirement
    const updatedAssessment = {
      ...assessment,
      advisorRequired: true,
      advisorType,
    };

    return {
      assessment: updatedAssessment,
      currentStage: "recommendation_generation",
      messages: [
        new AIMessage({
          content: `${advisorType} advisor consultation arranged. Proceeding to recommendations.`,
        }),
      ],
    };
  }

  /**
   * Generate comprehensive recommendations
   */
  private async recommendationGenerationNode(state: typeof CulturalAgentState.State) {
    console.log("[Cultural Agent] Generating cultural recommendations");

    const traditions = state.identifiedTraditions || [];
    const rites = state.identifiedRites || [];
    const conflicts = state.conflicts || [];
    const accommodations = state.accommodations || [];

    const recommendations: any[] = [];

    // Timeline recommendations
    recommendations.push({
      category: "timeline",
      priority: "high",
      recommendation: "Follow religious timing requirements for preparation and ceremony",
      justification: "Religious observances often have strict timing requirements",
      implementation: "Coordinate with religious leader for proper scheduling",
    });

    // Venue recommendations
    if (rites.length > 0) {
      recommendations.push({
        category: "venue",
        priority: "high",
        recommendation: "Select venue appropriate for religious services",
        justification: "Religious rites require appropriate sacred or respectful space",
        implementation: "Coordinate with religious institution or multi-faith chapel",
      });
    }

    // Cultural sensitivity recommendations
    if (traditions.length > 0) {
      recommendations.push({
        category: "cultural_sensitivity",
        priority: "medium",
        recommendation: "Incorporate cultural elements respectfully",
        justification: "Cultural traditions honor heritage and provide comfort",
        implementation: "Work with cultural advisor to ensure appropriate implementation",
      });
    }

    // Conflict resolution recommendations
    for (const conflict of conflicts) {
      recommendations.push({
        category: "conflict_resolution",
        priority: "high",
        recommendation: conflict.resolution,
        justification: `Addresses ${conflict.type} conflict: ${conflict.description}`,
        implementation: "Requires family discussion and possibly religious/cultural advisor input",
      });
    }

    return {
      recommendations,
      currentStage: "sensitivity_review",
      messages: [
        new AIMessage({
          content: `Generated ${recommendations.length} cultural and religious recommendations`,
        }),
      ],
    };
  }

  /**
   * Final sensitivity review
   */
  private async sensitivityReviewNode(state: typeof CulturalAgentState.State) {
    console.log("[Cultural Agent] Conducting final sensitivity review");

    const assessment = state.assessment;
    const conflicts = state.conflicts || [];
    const recommendations = state.recommendations || [];

    // Determine final sensitivity level
    let sensitivityLevel: "standard" | "elevated" | "maximum" = "standard";

    if (conflicts.some(c => c.severity === "major")) {
      sensitivityLevel = "maximum";
    } else if (conflicts.length > 0 || state.identifiedRites.length > 1) {
      sensitivityLevel = "elevated";
    }

    // Final assessment update
    const finalAssessment = {
      ...assessment,
      sensitivityLevel,
      traditions: state.identifiedTraditions,
      religiousRites: state.identifiedRites,
      conflicts: state.conflicts,
      accommodations: state.accommodations,
    };

    return {
      assessment: finalAssessment,
      currentStage: "completed",
      messages: [
        new AIMessage({
          content: `Cultural sensitivity review completed. Sensitivity level: ${sensitivityLevel}. Assessment finalized with ${recommendations.length} recommendations.`,
        }),
      ],
    };
  }

  /**
   * Public method to perform cultural assessment
   */
  public async assessFamily(familyBackground: any, config?: any) {
    return await this.graph.invoke({ familyBackground }, config);
  }

  /**
   * Get cultural tradition by name
   */
  public getCulturalTradition(culture: string): CulturalTradition[] {
    return this.culturalDatabase.get(culture.toLowerCase()) || [];
  }

  /**
   * Get religious rites by faith
   */
  public getReligiousRites(faith: string): ReligiousRite[] {
    return this.religiousDatabase.get(faith.toLowerCase()) || [];
  }

  /**
   * Add custom cultural tradition
   */
  public addCulturalTradition(culture: string, tradition: CulturalTradition) {
    const existing = this.culturalDatabase.get(culture.toLowerCase()) || [];
    existing.push(tradition);
    this.culturalDatabase.set(culture.toLowerCase(), existing);
  }

  /**
   * Add custom religious rite
   */
  public addReligiousRite(faith: string, rite: ReligiousRite) {
    const existing = this.religiousDatabase.get(faith.toLowerCase()) || [];
    existing.push(rite);
    this.religiousDatabase.set(faith.toLowerCase(), existing);
  }

  /**
   * Get available cultures
   */
  public getAvailableCultures(): string[] {
    return Array.from(this.culturalDatabase.keys());
  }

  /**
   * Get available faiths
   */
  public getAvailableFaiths(): string[] {
    return Array.from(this.religiousDatabase.keys());
  }

  /**
   * Stream assessment process
   */
  public async streamAssessment(familyBackground: any, config?: any) {
    return this.graph.stream({ familyBackground }, config);
  }

  /**
   * Get the graph for external use
   */
  public getGraph() {
    return this.graph;
  }
}

// Export default instance
export const culturalRequirementsAgent = new CulturalRequirementsAgent();