export interface MarketIntelligence {
  gemeente_data: {
    deaths_per_year: number
    current_directors: number
    market_saturation: number
    growth_trend: number
  }
  opportunity_scoring: {
    underserved_areas: Array<{ lat: number; lng: number; radius: number }>
    high_demand_times: Array<{ start: string; end: string }>
    unmet_specializations: string[]
  }
  competitive_insights: {
    average_response_time: number
    price_range: { min: number; max: number }
    common_strengths: string[]
  }
}

export class MarketAnalyzer {
  static async analyzeLocation(location: { lat: number; lng: number }): Promise<MarketIntelligence> {
    // Simulate market analysis
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          gemeente_data: {
            deaths_per_year: 450,
            current_directors: 8,
            market_saturation: 0.65,
            growth_trend: 0.12,
          },
          opportunity_scoring: {
            underserved_areas: [
              { lat: 52.3876, lng: 4.9241, radius: 5 },
              { lat: 52.3476, lng: 4.8641, radius: 3 },
            ],
            high_demand_times: [
              { start: "09:00", end: "17:00" },
              { start: "19:00", end: "21:00" },
            ],
            unmet_specializations: ["Islamitische uitvaarten", "Natuurbegrafenis", "Uitvaart thuis"],
          },
          competitive_insights: {
            average_response_time: 2.5,
            price_range: { min: 2500, max: 8500 },
            common_strengths: ["Begrafenis", "Crematie", "Rouwbegeleiding"],
          },
        })
      }, 1000)
    })
  }

  static calculateOpportunity(
    serviceArea: { radius: number; center: { lat: number; lng: number } },
    marketData: MarketIntelligence,
  ): {
    potentialFunerals: number
    competitionLevel: "low" | "medium" | "high"
    recommendations: string[]
  } {
    const potentialFunerals = Math.round(
      (marketData.gemeente_data.deaths_per_year * (serviceArea.radius / 25)) /
        marketData.gemeente_data.current_directors,
    )

    const competitionLevel =
      marketData.gemeente_data.market_saturation < 0.5
        ? "low"
        : marketData.gemeente_data.market_saturation < 0.8
          ? "medium"
          : "high"

    const recommendations = [
      competitionLevel === "low"
        ? "Uitstekende kans - weinig concurrentie"
        : competitionLevel === "medium"
          ? "Goede kans - specialiseer om op te vallen"
          : "Drukke markt - focus op unieke diensten",
      `Specialiseer in: ${marketData.opportunity_scoring.unmet_specializations.slice(0, 2).join(", ")}`,
      `Optimale responstijd: onder ${marketData.competitive_insights.average_response_time} uur`,
    ]

    return {
      potentialFunerals,
      competitionLevel,
      recommendations,
    }
  }
}

export const mockDirectorsData = [
  {
    id: "1",
    name: "Uitvaart Centrum Noord",
    location: { lat: 52.3876, lng: 4.9041, address: "Noord Amsterdam" },
    specializations: ["Begrafenis", "Crematie", "Rouwbegeleiding"],
    yearsActive: 15,
    status: "active" as const,
    responseTime: 1.5,
    completedFunerals: 1200,
  },
  {
    id: "2",
    name: "De Laatste Eer",
    location: { lat: 52.3476, lng: 4.8841, address: "West Amsterdam" },
    specializations: ["Natuurbegrafenis", "Uitvaart thuis", "Groene uitvaart"],
    yearsActive: 8,
    status: "busy" as const,
    responseTime: 3.2,
    completedFunerals: 650,
  },
  {
    id: "3",
    name: "Rouwzorg Amsterdam",
    location: { lat: 52.3576, lng: 4.9241, address: "Oost Amsterdam" },
    specializations: ["Multicultureel", "Islamitisch", "Joods"],
    yearsActive: 20,
    status: "active" as const,
    responseTime: 2.1,
    completedFunerals: 2100,
  },
  {
    id: "4",
    name: "Uitvaart & Zo",
    location: { lat: 52.3376, lng: 4.9141, address: "Zuid Amsterdam" },
    specializations: ["Persoonlijke uitvaart", "Creatieve ceremonies"],
    yearsActive: 5,
    status: "unavailable" as const,
    responseTime: 4.0,
    completedFunerals: 280,
  },
]
