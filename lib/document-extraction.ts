// Document AI extraction utilities
export interface DocumentExtractionResult {
  confidence: number
  extractedData: Record<string, any>
  documentType: string
  processingTime: number
}

export class DocumentProcessor {
  static async extractFromKvK(file: File): Promise<DocumentExtractionResult> {
    // Simulate OCR + AI extraction from KvK document
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          confidence: 96,
          extractedData: {
            companyName: "Uitvaartzorg De Boer B.V.",
            kvkNumber: "12345678",
            address: "Hoofdstraat 123",
            city: "Amsterdam",
            postalCode: "1012 AB",
            contactPerson: "Jan de Boer",
            businessActivity: "Uitvaartonderneming",
            establishedDate: "2010-03-15",
          },
          documentType: "kvk-extract",
          processingTime: 2.3,
        })
      }, 2000)
    })
  }

  static async extractFromInsurance(file: File): Promise<DocumentExtractionResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          confidence: 92,
          extractedData: {
            insuranceProvider: "DELA Verzekeringen",
            policyNumber: "POL-2024-001234",
            coverageAmount: "€2.500.000",
            validUntil: "2025-12-31",
            coverageType: "Beroepsaansprakelijkheid",
          },
          documentType: "insurance-certificate",
          processingTime: 1.8,
        })
      }, 1500)
    })
  }

  static async extractFromBusinessCard(file: File): Promise<DocumentExtractionResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          confidence: 89,
          extractedData: {
            phone: "020-1234567",
            email: "info@deboer-uitvaart.nl",
            website: "www.deboer-uitvaart.nl",
            services: ["Begrafenis", "Crematie", "Uitvaart thuis", "Rouwverwerking"],
            socialMedia: {
              facebook: "facebook.com/deboeruitvaart",
              instagram: "@deboeruitvaart",
            },
          },
          documentType: "business-card",
          processingTime: 1.2,
        })
      }, 1200)
    })
  }

  static async extractFromCertificate(file: File): Promise<DocumentExtractionResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          confidence: 94,
          extractedData: {
            certifications: [
              "Uitvaartondernemer Diploma (NOVU)",
              "DELA Gecertificeerd Partner",
              "Rouwbegeleiding Certificaat",
              "Natuurbegrafenis Specialist",
            ],
            issuedBy: "Nederlandse Organisatie van Uitvaartondernemers",
            validUntil: "2026-06-30",
            specializations: ["Natuurbegrafenis", "Rouwbegeleiding", "Multiculturele uitvaarten"],
          },
          documentType: "certificates",
          processingTime: 2.1,
        })
      }, 2100)
    })
  }

  static getProcessingInstructions(documentType: string): string {
    const instructions = {
      "kvk-extract": "Zorg dat alle tekst goed leesbaar is. Het KvK nummer en bedrijfsnaam zijn het belangrijkst.",
      "insurance-certificate": "Fotografeer de volledige eerste pagina met alle polisgegevens.",
      "business-card": "Leg de kaart plat neer en fotografeer van bovenaf met goede belichting.",
      certificates: "Scan of fotografeer elk certificaat afzonderlijk voor beste resultaten.",
    }
    return instructions[documentType] || "Zorg voor goede belichting en scherpe foto's."
  }
}

export const supportedDocuments = [
  {
    type: "kvk-extract",
    name: "KvK Uittreksel",
    required: true,
    priority: 1,
    autoFills: ["companyName", "kvkNumber", "address", "city", "postalCode", "contactPerson"],
    timeToProcess: "2-3 seconden",
    accuracy: "96%",
  },
  {
    type: "insurance-certificate",
    name: "Verzekeringscertificaat",
    required: true,
    priority: 2,
    autoFills: ["insuranceProvider", "policyNumber", "coverageAmount"],
    timeToProcess: "1-2 seconden",
    accuracy: "92%",
  },
  {
    type: "business-card",
    name: "Visitekaartje/Brochure",
    required: false,
    priority: 3,
    autoFills: ["phone", "email", "website", "services"],
    timeToProcess: "1 seconde",
    accuracy: "89%",
  },
  {
    type: "certificates",
    name: "Certificaten/Diploma's",
    required: false,
    priority: 4,
    autoFills: ["certifications", "specializations"],
    timeToProcess: "2 seconden",
    accuracy: "94%",
  },
]
