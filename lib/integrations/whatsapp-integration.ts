/**
 * WhatsApp Business Integration
 * Handles WhatsApp Business API integration for Farewelly
 */

import { supabase } from '@/lib/supabase';

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  apiUrl: string;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  type: 'text' | 'image' | 'document' | 'template';
  content: any;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  conversationId: string;
}

export interface WhatsAppConversation {
  id: string;
  participantPhone: string;
  participantName?: string;
  participantRole: 'family' | 'director' | 'venue';
  coordinationId?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  isActive: boolean;
  metadata: Record<string, any>;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  components: WhatsAppTemplateComponent[];
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}

export interface WhatsAppTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
  text?: string;
  buttons?: WhatsAppButton[];
  example?: any;
}

export interface WhatsAppButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  payload?: string;
  url?: string;
  phone_number?: string;
}

export class WhatsAppIntegrationService {
  private config: WhatsAppConfig;

  constructor(config?: WhatsAppConfig) {
    this.config = config || {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!,
      apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
    };
  }

  /**
   * Send text message
   */
  async sendTextMessage(to: string, text: string, conversationId?: string): Promise<WhatsAppMessage> {
    try {
      const response = await fetch(
        `${this.config.apiUrl}/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${result.error?.message || 'Unknown error'}`);
      }

      // Save message to database
      const message: WhatsAppMessage = {
        id: result.messages[0].id,
        from: this.config.phoneNumberId,
        to,
        type: 'text',
        content: { text },
        timestamp: new Date(),
        status: 'sent',
        conversationId: conversationId || await this.getOrCreateConversation(to),
      };

      await this.saveMessage(message);
      return message;

    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Send template message
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'nl',
    parameters: any[] = []
  ): Promise<WhatsAppMessage> {
    try {
      const response = await fetch(
        `${this.config.apiUrl}/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: {
              name: templateName,
              language: { code: languageCode },
              components: parameters.length > 0 ? [
                {
                  type: 'body',
                  parameters: parameters.map(param => ({ type: 'text', text: param })),
                }
              ] : [],
            },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${result.error?.message || 'Unknown error'}`);
      }

      // Save message to database
      const message: WhatsAppMessage = {
        id: result.messages[0].id,
        from: this.config.phoneNumberId,
        to,
        type: 'template',
        content: { templateName, languageCode, parameters },
        timestamp: new Date(),
        status: 'sent',
        conversationId: await this.getOrCreateConversation(to),
      };

      await this.saveMessage(message);
      return message;

    } catch (error) {
      console.error('Error sending WhatsApp template:', error);
      throw error;
    }
  }

  /**
   * Send document
   */
  async sendDocument(
    to: string,
    documentUrl: string,
    caption?: string,
    filename?: string
  ): Promise<WhatsAppMessage> {
    try {
      const response = await fetch(
        `${this.config.apiUrl}/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'document',
            document: {
              link: documentUrl,
              caption,
              filename,
            },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${result.error?.message || 'Unknown error'}`);
      }

      // Save message to database
      const message: WhatsAppMessage = {
        id: result.messages[0].id,
        from: this.config.phoneNumberId,
        to,
        type: 'document',
        content: { documentUrl, caption, filename },
        timestamp: new Date(),
        status: 'sent',
        conversationId: await this.getOrCreateConversation(to),
      };

      await this.saveMessage(message);
      return message;

    } catch (error) {
      console.error('Error sending WhatsApp document:', error);
      throw error;
    }
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(body: any): Promise<void> {
    try {
      if (body.object !== 'whatsapp_business_account') {
        return;
      }

      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            await this.processMessageChange(change.value);
          }
        }
      }
    } catch (error) {
      console.error('Error handling WhatsApp webhook:', error);
      throw error;
    }
  }

  /**
   * Process message changes from webhook
   */
  private async processMessageChange(value: any): Promise<void> {
    // Handle incoming messages
    if (value.messages) {
      for (const message of value.messages) {
        await this.handleIncomingMessage(message, value.contacts?.[0]);
      }
    }

    // Handle message status updates
    if (value.statuses) {
      for (const status of value.statuses) {
        await this.handleMessageStatus(status);
      }
    }
  }

  /**
   * Handle incoming message
   */
  private async handleIncomingMessage(message: any, contact?: any): Promise<void> {
    try {
      const conversationId = await this.getOrCreateConversation(message.from, contact);
      
      const whatsappMessage: WhatsAppMessage = {
        id: message.id,
        from: message.from,
        to: this.config.phoneNumberId,
        type: message.type,
        content: this.extractMessageContent(message),
        timestamp: new Date(parseInt(message.timestamp) * 1000),
        status: 'delivered',
        conversationId,
      };

      await this.saveMessage(whatsappMessage);

      // Process message based on type and content
      await this.processIncomingMessage(whatsappMessage, conversationId);

    } catch (error) {
      console.error('Error handling incoming message:', error);
      throw error;
    }
  }

  /**
   * Extract message content based on type
   */
  private extractMessageContent(message: any): any {
    switch (message.type) {
      case 'text':
        return { text: message.text.body };
      case 'image':
        return { imageId: message.image.id, caption: message.image.caption };
      case 'document':
        return { 
          documentId: message.document.id, 
          filename: message.document.filename,
          caption: message.document.caption 
        };
      case 'button':
        return { text: message.button.text, payload: message.button.payload };
      case 'interactive':
        return message.interactive;
      default:
        return message;
    }
  }

  /**
   * Process incoming message for business logic
   */
  private async processIncomingMessage(message: WhatsAppMessage, conversationId: string): Promise<void> {
    try {
      // Get conversation context
      const conversation = await this.getConversation(conversationId);
      
      if (!conversation) {
        console.error('Conversation not found:', conversationId);
        return;
      }

      // Handle different message types and contexts
      if (message.type === 'text') {
        const text = message.content.text.toLowerCase();
        
        // Handle common responses
        if (text.includes('ja') || text.includes('yes')) {
          await this.handlePositiveResponse(conversation, message);
        } else if (text.includes('nee') || text.includes('no')) {
          await this.handleNegativeResponse(conversation, message);
        } else if (text.includes('help') || text.includes('hulp')) {
          await this.sendHelpMessage(message.from);
        } else {
          // Forward to appropriate handler based on user role
          await this.forwardToRoleHandler(conversation, message);
        }
      } else if (message.type === 'button') {
        await this.handleButtonResponse(conversation, message);
      }

    } catch (error) {
      console.error('Error processing incoming message:', error);
    }
  }

  /**
   * Handle positive response
   */
  private async handlePositiveResponse(conversation: WhatsAppConversation, message: WhatsAppMessage): Promise<void> {
    // Implementation depends on conversation context
    await this.sendTextMessage(
      message.from,
      'Dank je wel voor je bevestiging. We gaan verder met de volgende stappen.',
      conversation.id
    );
  }

  /**
   * Handle negative response
   */
  private async handleNegativeResponse(conversation: WhatsAppConversation, message: WhatsAppMessage): Promise<void> {
    await this.sendTextMessage(
      message.from,
      'Geen probleem. Laat me weten als je andere vragen hebt.',
      conversation.id
    );
  }

  /**
   * Send help message
   */
  private async sendHelpMessage(to: string): Promise<void> {
    const helpText = `
Ik kan je helpen met:
• Informatie over uitvaartdiensten
• Status van je aanvraag
• Contact met uitvaartondernemers
• Documentbeheer

Typ je vraag of gebruik de knoppen hieronder.
    `;

    await this.sendTextMessage(to, helpText.trim());
  }

  /**
   * Forward to role-specific handler
   */
  private async forwardToRoleHandler(conversation: WhatsAppConversation, message: WhatsAppMessage): Promise<void> {
    switch (conversation.participantRole) {
      case 'family':
        await this.handleFamilyMessage(conversation, message);
        break;
      case 'director':
        await this.handleDirectorMessage(conversation, message);
        break;
      case 'venue':
        await this.handleVenueMessage(conversation, message);
        break;
    }
  }

  /**
   * Handle family messages
   */
  private async handleFamilyMessage(conversation: WhatsAppConversation, message: WhatsAppMessage): Promise<void> {
    // Implement family-specific message handling
    await this.sendTextMessage(
      message.from,
      'Ik heb je bericht ontvangen. Een van onze medewerkers neemt contact met je op.',
      conversation.id
    );
  }

  /**
   * Handle director messages
   */
  private async handleDirectorMessage(conversation: WhatsAppConversation, message: WhatsAppMessage): Promise<void> {
    // Implement director-specific message handling
    await this.sendTextMessage(
      message.from,
      'Bericht ontvangen. We verwerken je reactie.',
      conversation.id
    );
  }

  /**
   * Handle venue messages
   */
  private async handleVenueMessage(conversation: WhatsAppConversation, message: WhatsAppMessage): Promise<void> {
    // Implement venue-specific message handling
    await this.sendTextMessage(
      message.from,
      'Bedankt voor je bericht. We nemen dit mee in de planning.',
      conversation.id
    );
  }

  /**
   * Handle button responses
   */
  private async handleButtonResponse(conversation: WhatsAppConversation, message: WhatsAppMessage): Promise<void> {
    const payload = message.content.payload;
    
    switch (payload) {
      case 'confirm_appointment':
        await this.handleAppointmentConfirmation(conversation, message);
        break;
      case 'reschedule_appointment':
        await this.handleAppointmentReschedule(conversation, message);
        break;
      case 'view_documents':
        await this.handleDocumentRequest(conversation, message);
        break;
      default:
        await this.sendTextMessage(
          message.from,
          'Ik begrijp je keuze niet. Probeer het opnieuw.',
          conversation.id
        );
    }
  }

  /**
   * Handle appointment confirmation
   */
  private async handleAppointmentConfirmation(conversation: WhatsAppConversation, message: WhatsAppMessage): Promise<void> {
    await this.sendTextMessage(
      message.from,
      'Je afspraak is bevestigd. Je ontvangt een bevestiging per email.',
      conversation.id
    );
  }

  /**
   * Handle appointment reschedule
   */
  private async handleAppointmentReschedule(conversation: WhatsAppConversation, message: WhatsAppMessage): Promise<void> {
    await this.sendTextMessage(
      message.from,
      'Ik help je met het verplaatsen van je afspraak. Welke datum en tijd zou je beter uitkomen?',
      conversation.id
    );
  }

  /**
   * Handle document request
   */
  private async handleDocumentRequest(conversation: WhatsAppConversation, message: WhatsAppMessage): Promise<void> {
    await this.sendTextMessage(
      message.from,
      'Ik stuur je een veilige link om je documenten te bekijken.',
      conversation.id
    );
  }

  /**
   * Handle message status updates
   */
  private async handleMessageStatus(status: any): Promise<void> {
    try {
      await supabase
        .from('whatsapp_messages')
        .update({ status: status.status })
        .eq('id', status.id);
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }

  /**
   * Get or create conversation
   */
  private async getOrCreateConversation(phone: string, contact?: any): Promise<string> {
    try {
      // Try to find existing conversation
      const { data: existing } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('participant_phone', phone)
        .eq('is_active', true)
        .single();

      if (existing) {
        return existing.id;
      }

      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from('whatsapp_conversations')
        .insert({
          participant_phone: phone,
          participant_name: contact?.profile?.name || contact?.wa_id,
          participant_role: 'family', // Default, can be updated later
          is_active: true,
          metadata: { contact },
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return newConversation.id;

    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }
  }

  /**
   * Get conversation
   */
  private async getConversation(conversationId: string): Promise<WhatsAppConversation | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error getting conversation:', error);
      return null;
    }
  }

  /**
   * Save message to database
   */
  private async saveMessage(message: WhatsAppMessage): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_messages')
        .insert({
          id: message.id,
          from_phone: message.from,
          to_phone: message.to,
          type: message.type,
          content: message.content,
          timestamp: message.timestamp.toISOString(),
          status: message.status,
          conversation_id: message.conversationId,
        });

      if (error) throw error;

      // Update conversation last message
      await supabase
        .from('whatsapp_conversations')
        .update({
          last_message: this.getMessagePreview(message),
          last_message_at: message.timestamp.toISOString(),
        })
        .eq('id', message.conversationId);

    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  /**
   * Get message preview for conversation list
   */
  private getMessagePreview(message: WhatsAppMessage): string {
    switch (message.type) {
      case 'text':
        return message.content.text;
      case 'image':
        return 'Afbeelding verzonden';
      case 'document':
        return `Document: ${message.content.filename || 'Bestand'}`;
      case 'template':
        return 'Template bericht verzonden';
      default:
        return 'Bericht verzonden';
    }
  }

  /**
   * Verify webhook
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Send family inquiry notification via WhatsApp
   */
  async sendFamilyInquiryNotification(phone: string, coordinationId: string): Promise<void> {
    await this.sendTemplateMessage(
      phone,
      'family_inquiry_received',
      'nl',
      [coordinationId]
    );
  }

  /**
   * Send booking confirmation via WhatsApp
   */
  async sendBookingConfirmation(phone: string, bookingDetails: any): Promise<void> {
    await this.sendTemplateMessage(
      phone,
      'booking_confirmed',
      'nl',
      [bookingDetails.date, bookingDetails.venue, bookingDetails.time]
    );
  }

  /**
   * Send document share notification via WhatsApp
   */
  async sendDocumentShareNotification(phone: string, documentName: string, shareLink: string): Promise<void> {
    await this.sendTextMessage(
      phone,
      `Een document is met je gedeeld: ${documentName}\n\nBekijk hier: ${shareLink}`
    );
  }

  /**
   * Send reminder notification via WhatsApp
   */
  async sendReminderNotification(phone: string, reminderText: string): Promise<void> {
    await this.sendTextMessage(phone, reminderText);
  }
}

export const whatsappIntegration = new WhatsAppIntegrationService();