/**
 * Provider Integration Layer
 * Handles email-based workflows and provider coordination
 */

import { supabase } from '@/lib/supabase';
import { DirectorProfile, VenueProfile, FamilyProfile } from '@/lib/supabase';
import nodemailer from 'nodemailer';

export interface ProviderIntegration {
  id: string;
  name: string;
  type: 'email' | 'webhook' | 'api';
  config: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailWorkflow {
  id: string;
  name: string;
  trigger: EmailTrigger;
  conditions: EmailCondition[];
  actions: EmailAction[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTrigger {
  type: 'family_inquiry' | 'booking_request' | 'document_shared' | 'event_reminder' | 'status_update';
  conditions: Record<string, any>;
}

export interface EmailCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: any;
}

export interface EmailAction {
  type: 'send_email' | 'create_task' | 'update_status' | 'notify_provider';
  config: Record<string, any>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  category: 'notification' | 'reminder' | 'confirmation' | 'update';
  language: 'nl' | 'en';
}

export class ProviderIntegrationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Family Inquiry Workflow
   * Triggered when a family submits an inquiry
   */
  async handleFamilyInquiry(inquiry: {
    familyId: string;
    serviceType: 'burial' | 'cremation' | 'memorial';
    preferredDate: string;
    attendeeCount: number;
    budget?: number;
    specialRequirements?: string;
    urgency: 'low' | 'medium' | 'high';
  }) {
    try {
      // Find matching providers
      const matchingProviders = await this.findMatchingProviders(inquiry);
      
      // Create coordination record
      const coordinationId = await this.createCoordination(inquiry);
      
      // Send notifications to providers
      await this.notifyProviders(matchingProviders, inquiry, coordinationId);
      
      // Send confirmation to family
      await this.sendFamilyConfirmation(inquiry.familyId, coordinationId);
      
      return { success: true, coordinationId };
    } catch (error) {
      console.error('Family inquiry workflow error:', error);
      throw error;
    }
  }

  /**
   * Booking Request Workflow
   * Handles venue booking requests
   */
  async handleBookingRequest(request: {
    familyId: string;
    venueId: string;
    directorId?: string;
    requestedDate: string;
    duration: number;
    serviceType: string;
    attendeeCount: number;
    specialRequirements?: string;
  }) {
    try {
      // Verify venue availability
      const isAvailable = await this.checkVenueAvailability(
        request.venueId,
        request.requestedDate,
        request.duration
      );

      if (!isAvailable) {
        throw new Error('Venue not available for requested date/time');
      }

      // Create booking record
      const bookingId = await this.createBooking(request);
      
      // Send booking confirmation to venue
      await this.sendVenueBookingNotification(request.venueId, bookingId, request);
      
      // Notify director if assigned
      if (request.directorId) {
        await this.sendDirectorBookingNotification(request.directorId, bookingId, request);
      }
      
      // Send confirmation to family
      await this.sendBookingConfirmation(request.familyId, bookingId);
      
      return { success: true, bookingId };
    } catch (error) {
      console.error('Booking request workflow error:', error);
      throw error;
    }
  }

  /**
   * Document Sharing Workflow
   * Handles secure document sharing between parties
   */
  async handleDocumentSharing(sharing: {
    documentId: string;
    fromUserId: string;
    toUserIds: string[];
    permissions: 'read' | 'download';
    expiresAt?: Date;
    message?: string;
  }) {
    try {
      // Create share tokens
      const shareTokens = await this.createShareTokens(sharing);
      
      // Send notifications to recipients
      for (const userId of sharing.toUserIds) {
        await this.sendDocumentShareNotification(userId, sharing, shareTokens[userId]);
      }
      
      return { success: true, shareTokens };
    } catch (error) {
      console.error('Document sharing workflow error:', error);
      throw error;
    }
  }

  /**
   * Status Update Workflow
   * Keeps all parties informed of progress
   */
  async handleStatusUpdate(update: {
    coordinationId: string;
    newStatus: string;
    message: string;
    updateBy: string;
    notifyRoles: ('family' | 'director' | 'venue')[];
  }) {
    try {
      // Update coordination record
      await this.updateCoordinationStatus(update.coordinationId, update.newStatus);
      
      // Get coordination details
      const coordination = await this.getCoordination(update.coordinationId);
      
      // Send notifications
      for (const role of update.notifyRoles) {
        await this.sendStatusUpdateNotification(coordination, update, role);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Status update workflow error:', error);
      throw error;
    }
  }

  /**
   * Find matching providers based on inquiry
   */
  private async findMatchingProviders(inquiry: any) {
    const { data: directors } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_type', 'director')
      .eq('is_active', true);

    const { data: venues } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_type', 'venue')
      .eq('is_active', true);

    // Match directors based on specialization and availability
    const matchingDirectors = directors?.filter(director => {
      // Add matching logic here
      return true;
    }) || [];

    // Match venues based on capacity and availability
    const matchingVenues = venues?.filter(venue => {
      // Add matching logic here
      return true;
    }) || [];

    return { directors: matchingDirectors, venues: matchingVenues };
  }

  /**
   * Create coordination record
   */
  private async createCoordination(inquiry: any) {
    const { data, error } = await supabase
      .from('coordinations')
      .insert({
        family_id: inquiry.familyId,
        service_type: inquiry.serviceType,
        preferred_date: inquiry.preferredDate,
        attendee_count: inquiry.attendeeCount,
        budget: inquiry.budget,
        special_requirements: inquiry.specialRequirements,
        urgency: inquiry.urgency,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Notify providers about new inquiry
   */
  private async notifyProviders(providers: any, inquiry: any, coordinationId: string) {
    const emailPromises = [];

    // Notify directors
    for (const director of providers.directors) {
      emailPromises.push(
        this.sendEmail({
          to: director.email,
          subject: 'Nieuwe uitvaart aanvraag - Farewelly',
          template: 'director_inquiry_notification',
          variables: {
            directorName: director.name,
            serviceType: inquiry.serviceType,
            preferredDate: inquiry.preferredDate,
            attendeeCount: inquiry.attendeeCount,
            coordinationId,
          },
        })
      );
    }

    // Notify venues
    for (const venue of providers.venues) {
      emailPromises.push(
        this.sendEmail({
          to: venue.email,
          subject: 'Nieuwe locatie aanvraag - Farewelly',
          template: 'venue_inquiry_notification',
          variables: {
            venueName: venue.venue_name,
            serviceType: inquiry.serviceType,
            preferredDate: inquiry.preferredDate,
            attendeeCount: inquiry.attendeeCount,
            coordinationId,
          },
        })
      );
    }

    await Promise.all(emailPromises);
  }

  /**
   * Send confirmation to family
   */
  private async sendFamilyConfirmation(familyId: string, coordinationId: string) {
    const { data: family } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', familyId)
      .single();

    if (!family) throw new Error('Family not found');

    await this.sendEmail({
      to: family.email,
      subject: 'Uw aanvraag is ontvangen - Farewelly',
      template: 'family_inquiry_confirmation',
      variables: {
        familyName: family.name,
        coordinationId,
      },
    });
  }

  /**
   * Check venue availability
   */
  private async checkVenueAvailability(venueId: string, date: string, duration: number) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('venue_id', venueId)
      .eq('date', date)
      .eq('status', 'confirmed');

    // Add availability logic here
    return !bookings || bookings.length === 0;
  }

  /**
   * Create booking record
   */
  private async createBooking(request: any) {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        family_id: request.familyId,
        venue_id: request.venueId,
        director_id: request.directorId,
        date: request.requestedDate,
        duration: request.duration,
        service_type: request.serviceType,
        attendee_count: request.attendeeCount,
        special_requirements: request.specialRequirements,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Send venue booking notification
   */
  private async sendVenueBookingNotification(venueId: string, bookingId: string, request: any) {
    const { data: venue } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', venueId)
      .single();

    if (!venue) throw new Error('Venue not found');

    await this.sendEmail({
      to: venue.email,
      subject: 'Nieuwe boeking aanvraag - Farewelly',
      template: 'venue_booking_notification',
      variables: {
        venueName: venue.venue_name,
        bookingId,
        requestedDate: request.requestedDate,
        duration: request.duration,
        attendeeCount: request.attendeeCount,
      },
    });
  }

  /**
   * Send director booking notification
   */
  private async sendDirectorBookingNotification(directorId: string, bookingId: string, request: any) {
    const { data: director } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', directorId)
      .single();

    if (!director) throw new Error('Director not found');

    await this.sendEmail({
      to: director.email,
      subject: 'Boeking bevestiging - Farewelly',
      template: 'director_booking_notification',
      variables: {
        directorName: director.name,
        bookingId,
        requestedDate: request.requestedDate,
        duration: request.duration,
        attendeeCount: request.attendeeCount,
      },
    });
  }

  /**
   * Send booking confirmation to family
   */
  private async sendBookingConfirmation(familyId: string, bookingId: string) {
    const { data: family } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', familyId)
      .single();

    if (!family) throw new Error('Family not found');

    await this.sendEmail({
      to: family.email,
      subject: 'Boeking bevestiging - Farewelly',
      template: 'family_booking_confirmation',
      variables: {
        familyName: family.name,
        bookingId,
      },
    });
  }

  /**
   * Create share tokens for document sharing
   */
  private async createShareTokens(sharing: any) {
    const tokens: Record<string, string> = {};
    
    for (const userId of sharing.toUserIds) {
      const token = crypto.randomUUID();
      tokens[userId] = token;
      
      // Store token in database
      await supabase
        .from('document_share_tokens')
        .insert({
          document_id: sharing.documentId,
          token,
          user_id: userId,
          permissions: sharing.permissions,
          expires_at: sharing.expiresAt?.toISOString(),
          created_by: sharing.fromUserId,
          created_at: new Date().toISOString(),
        });
    }
    
    return tokens;
  }

  /**
   * Send document share notification
   */
  private async sendDocumentShareNotification(userId: string, sharing: any, token: string) {
    const { data: user } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) throw new Error('User not found');

    await this.sendEmail({
      to: user.email,
      subject: 'Document gedeeld - Farewelly',
      template: 'document_share_notification',
      variables: {
        userName: user.name,
        shareToken: token,
        message: sharing.message,
      },
    });
  }

  /**
   * Update coordination status
   */
  private async updateCoordinationStatus(coordinationId: string, status: string) {
    const { error } = await supabase
      .from('coordinations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', coordinationId);

    if (error) throw error;
  }

  /**
   * Get coordination details
   */
  private async getCoordination(coordinationId: string) {
    const { data, error } = await supabase
      .from('coordinations')
      .select('*')
      .eq('id', coordinationId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Send status update notification
   */
  private async sendStatusUpdateNotification(coordination: any, update: any, role: string) {
    // Get users by role
    let users: any[] = [];
    
    if (role === 'family') {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', coordination.family_id);
      users = data || [];
    } else if (role === 'director') {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', coordination.director_id);
      users = data || [];
    } else if (role === 'venue') {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', coordination.venue_id);
      users = data || [];
    }

    // Send notifications
    for (const user of users) {
      await this.sendEmail({
        to: user.email,
        subject: 'Status update - Farewelly',
        template: 'status_update_notification',
        variables: {
          userName: user.name,
          newStatus: update.newStatus,
          message: update.message,
          coordinationId: coordination.id,
        },
      });
    }
  }

  /**
   * Send email using template
   */
  private async sendEmail(params: {
    to: string;
    subject: string;
    template: string;
    variables: Record<string, any>;
  }) {
    try {
      // Load template
      const template = await this.loadEmailTemplate(params.template);
      
      // Replace variables
      let htmlContent = template.htmlContent;
      let textContent = template.textContent;
      
      for (const [key, value] of Object.entries(params.variables)) {
        const placeholder = `{{${key}}}`;
        htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), String(value));
        textContent = textContent.replace(new RegExp(placeholder, 'g'), String(value));
      }
      
      // Send email
      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@farewelly.nl',
        to: params.to,
        subject: params.subject,
        html: htmlContent,
        text: textContent,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  }

  /**
   * Load email template
   */
  private async loadEmailTemplate(templateName: string): Promise<EmailTemplate> {
    // Default templates
    const templates: Record<string, EmailTemplate> = {
      director_inquiry_notification: {
        id: 'director_inquiry_notification',
        name: 'Director Inquiry Notification',
        subject: 'Nieuwe uitvaart aanvraag - Farewelly',
        htmlContent: `
          <h2>Beste {{directorName}},</h2>
          <p>Er is een nieuwe uitvaart aanvraag binnengekomen:</p>
          <ul>
            <li>Type: {{serviceType}}</li>
            <li>Datum: {{preferredDate}}</li>
            <li>Aantal gasten: {{attendeeCount}}</li>
          </ul>
          <p>Referentie: {{coordinationId}}</p>
          <p>Log in op Farewelly om meer details te bekijken.</p>
        `,
        textContent: `
          Beste {{directorName}},
          
          Er is een nieuwe uitvaart aanvraag binnengekomen:
          - Type: {{serviceType}}
          - Datum: {{preferredDate}}
          - Aantal gasten: {{attendeeCount}}
          
          Referentie: {{coordinationId}}
          
          Log in op Farewelly om meer details te bekijken.
        `,
        variables: ['directorName', 'serviceType', 'preferredDate', 'attendeeCount', 'coordinationId'],
        category: 'notification',
        language: 'nl',
      },
      venue_inquiry_notification: {
        id: 'venue_inquiry_notification',
        name: 'Venue Inquiry Notification',
        subject: 'Nieuwe locatie aanvraag - Farewelly',
        htmlContent: `
          <h2>Beste {{venueName}},</h2>
          <p>Er is een nieuwe locatie aanvraag binnengekomen:</p>
          <ul>
            <li>Type: {{serviceType}}</li>
            <li>Datum: {{preferredDate}}</li>
            <li>Aantal gasten: {{attendeeCount}}</li>
          </ul>
          <p>Referentie: {{coordinationId}}</p>
          <p>Log in op Farewelly om meer details te bekijken.</p>
        `,
        textContent: `
          Beste {{venueName}},
          
          Er is een nieuwe locatie aanvraag binnengekomen:
          - Type: {{serviceType}}
          - Datum: {{preferredDate}}
          - Aantal gasten: {{attendeeCount}}
          
          Referentie: {{coordinationId}}
          
          Log in op Farewelly om meer details te bekijken.
        `,
        variables: ['venueName', 'serviceType', 'preferredDate', 'attendeeCount', 'coordinationId'],
        category: 'notification',
        language: 'nl',
      },
      family_inquiry_confirmation: {
        id: 'family_inquiry_confirmation',
        name: 'Family Inquiry Confirmation',
        subject: 'Uw aanvraag is ontvangen - Farewelly',
        htmlContent: `
          <h2>Beste {{familyName}},</h2>
          <p>Uw aanvraag is ontvangen en wordt verwerkt.</p>
          <p>Referentie: {{coordinationId}}</p>
          <p>U ontvangt binnen 24 uur een reactie van onze partners.</p>
          <p>Met vriendelijke groet,<br>Het Farewelly team</p>
        `,
        textContent: `
          Beste {{familyName}},
          
          Uw aanvraag is ontvangen en wordt verwerkt.
          
          Referentie: {{coordinationId}}
          
          U ontvangt binnen 24 uur een reactie van onze partners.
          
          Met vriendelijke groet,
          Het Farewelly team
        `,
        variables: ['familyName', 'coordinationId'],
        category: 'confirmation',
        language: 'nl',
      },
    };
    
    return templates[templateName] || templates.family_inquiry_confirmation;
  }
}

export const providerIntegration = new ProviderIntegrationService();