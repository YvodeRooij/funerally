/**
 * Director Code Service
 * 
 * Handles generation and management of unique director codes for family connections
 */

interface DirectorCode {
  id: string
  code: string
  familyName: string
  primaryContact: string
  email: string
  phone: string
  municipality?: string
  expectedDate?: string
  personalNote?: string
  directorId: string
  status: 'pending' | 'connected' | 'completed' | 'expired'
  createdAt: string
  connectedAt?: string
  expiresAt: string
}

interface CreateCodeRequest {
  familyName: string
  primaryContact: string
  email: string
  phone: string
  municipality?: string
  expectedDate?: string
  personalNote?: string
  directorId: string
}

export class DirectorCodeService {
  
  /**
   * Generate unique director code in format: UFV-YYYY-XXXXXX
   * UFV = Uitvaart (Funeral)
   * YYYY = Current year
   * XXXXXX = 6-digit unique identifier
   */
  private async generateUniqueCode(): Promise<string> {
    const year = new Date().getFullYear()
    const baseCode = `UFV-${year}`
    
    // Generate 6-digit number based on timestamp + random
    const timestamp = Date.now().toString().slice(-4)
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
    const identifier = `${timestamp}${random}`
    
    const code = `${baseCode}-${identifier}`
    
    // In production, check database for uniqueness
    const isUnique = await this.checkCodeUniqueness(code)
    if (!isUnique) {
      // Retry with new random component
      return this.generateUniqueCode()
    }
    
    return code
  }

  /**
   * Check if code already exists in database
   */
  private async checkCodeUniqueness(code: string): Promise<boolean> {
    // Mock implementation - in production, query database
    const existingCodes = await this.getExistingCodes()
    return !existingCodes.includes(code)
  }

  /**
   * Create new director code for family invitation
   */
  async createDirectorCode(request: CreateCodeRequest): Promise<DirectorCode> {
    const code = await this.generateUniqueCode()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days

    const directorCode: DirectorCode = {
      id: this.generateId(),
      code,
      familyName: request.familyName,
      primaryContact: request.primaryContact,
      email: request.email,
      phone: request.phone,
      municipality: request.municipality,
      expectedDate: request.expectedDate,
      personalNote: request.personalNote,
      directorId: request.directorId,
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    }

    // In production, save to database
    await this.saveDirectorCode(directorCode)

    return directorCode
  }

  /**
   * Get pending invitations for a director
   */
  async getPendingInvitations(directorId: string): Promise<DirectorCode[]> {
    // Mock implementation - in production, query database
    const mockInvitations: DirectorCode[] = [
      {
        id: "inv-1",
        code: "UFV-2025-123456",
        familyName: "Familie Jansen",
        primaryContact: "Peter Jansen",
        email: "peter@jansen.nl",
        phone: "06-87654321",
        municipality: "Rotterdam",
        directorId: "dir-1",
        status: "connected",
        createdAt: "2025-06-30T15:20:00Z",
        connectedAt: "2025-06-30T16:00:00Z",
        expiresAt: "2025-07-30T15:20:00Z"
      }
    ]

    return mockInvitations.filter(inv => inv.directorId === directorId)
  }

  /**
   * Mark code as connected when family uses it
   */
  async markCodeAsConnected(code: string): Promise<boolean> {
    // In production, update database
    console.log(`Marking code ${code} as connected`)
    return true
  }

  /**
   * Generate invitation email content
   */
  generateInvitationEmail(directorCode: DirectorCode, directorName: string): EmailContent {
    const subject = `Uitvaart ${directorCode.familyName} - Digitale intake`
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Condoleances en digitale intake</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Voor familie ${directorCode.familyName}</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Beste ${directorCode.primaryContact},
          </p>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Allereerst wil ik u mijn oprechte deelneming betuigen met het verlies van uw dierbare. 
            In deze moeilijke tijd sta ik klaar om u te begeleiden bij het vormgeven van een waardige uitvaart.
          </p>

          ${directorCode.personalNote ? `
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="color: #374151; margin: 0; font-style: italic;">
              "${directorCode.personalNote}"
            </p>
          </div>
          ` : ''}

          <h2 style="color: #1f2937; font-size: 18px; margin: 30px 0 15px 0;">Digitale intake process</h2>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Om u optimaal te kunnen begeleiden, heb ik een digitale intake voorbereid. 
            Hiermee kunt u in uw eigen tempo uw wensen en situatie doorgeven.
          </p>

          <div style="background: #3b82f6; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px;">Uw persoonlijke code:</h3>
            <div style="font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 2px;">
              ${directorCode.code}
            </div>
          </div>

          <div style="margin: 25px 0;">
            <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 15px;">Zo werkt het:</h3>
            <ol style="color: #374151; line-height: 1.8; padding-left: 20px;">
              <li>Ga naar <a href="https://farewelly.nl/onboarding" style="color: #3b82f6;">farewelly.nl/onboarding</a></li>
              <li>Voer uw persoonlijke code in: <strong>${directorCode.code}</strong></li>
              <li>Vul de intake in uw eigen tempo in</li>
              <li>Ik neem binnen 24 uur contact met u op</li>
            </ol>
          </div>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 16px;">⏰ Belangrijk te weten:</h3>
            <ul style="color: #374151; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Nederlandse wetgeving vereist aanmelding binnen 6 werkdagen</li>
              <li>Deze intake helpt ons voorbereiden op ons gesprek</li>
              <li>Uw gegevens worden veilig en vertrouwelijk behandeld</li>
            </ul>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 25px; margin-top: 30px;">
            <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 10px;">Direct contact nodig?</h3>
            <p style="color: #374151; margin: 5px 0;">
              📞 <strong>Telefoon:</strong> <a href="tel:+31612345678" style="color: #3b82f6;">06-12345678</a>
            </p>
            <p style="color: #374151; margin: 5px 0;">
              ✉️ <strong>Email:</strong> <a href="mailto:director@farewelly.nl" style="color: #3b82f6;">director@farewelly.nl</a>
            </p>
            <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 14px;">
              Ik ben 24/7 bereikbaar voor spoedeisende zaken.
            </p>
          </div>

          <div style="margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Met warme groet,<br>
              <strong>${directorName}</strong><br>
              Uitvaartbegeleider
            </p>
          </div>
        </div>
      </div>
    `

    const textBody = `
Beste ${directorCode.primaryContact},

Allereerst wil ik u mijn oprechte deelneming betuigen met het verlies van uw dierbare.

Om u optimaal te kunnen begeleiden, heb ik een digitale intake voorbereid.

Uw persoonlijke code: ${directorCode.code}

Ga naar farewelly.nl/onboarding en voer deze code in.

Voor direct contact: 06-12345678 of director@farewelly.nl

Met warme groet,
${directorName}
Uitvaartbegeleider
    `

    return {
      subject,
      htmlBody,
      textBody,
      recipientEmail: directorCode.email,
      recipientName: directorCode.primaryContact
    }
  }

  // Helper methods
  private generateId(): string {
    return 'dir_code_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  private async getExistingCodes(): Promise<string[]> {
    // Mock implementation - in production, query database
    return ['UFV-2025-123456']
  }

  private async saveDirectorCode(directorCode: DirectorCode): Promise<void> {
    // Mock implementation - in production, save to database
    console.log('Saving director code:', directorCode.code)
  }
}

interface EmailContent {
  subject: string
  htmlBody: string
  textBody: string
  recipientEmail: string
  recipientName: string
}

export const directorCodeService = new DirectorCodeService()