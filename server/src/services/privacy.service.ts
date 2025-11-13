/**
 * Privacy Service
 * Implements GDPR compliance: data export, right to be forgotten, data retention
 */

import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { db } from '../database/connection';
import { logger } from '../utils/logger';
import { EmailService } from './email.service';
import { StorageService } from './storage.service';

interface ExportRequest {
  id: string;
  userId: string;
  format: 'json' | 'csv';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
  estimatedCompletionTime: Date;
}

interface DeletionRequest {
  id: string;
  userId: string;
  reason?: string;
  status: 'pending' | 'cancelled' | 'completed';
  createdAt: Date;
  scheduledDate: Date;
  cancellationDeadline: Date;
  completedAt?: Date;
}

interface PrivacySettings {
  userId: string;
  profileVisibility: 'public' | 'friends' | 'private';
  showOnlineStatus: boolean;
  allowFriendRequests: boolean;
  allowMessages: 'everyone' | 'friends' | 'none';
  dataSharing: boolean;
  marketingEmails: boolean;
  analyticsTracking: boolean;
  updatedAt: Date;
}

interface ConsentRecord {
  id: string;
  userId: string;
  consentType: string;
  granted: boolean;
  grantedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class PrivacyService {
  private emailService: EmailService;
  private storageService: StorageService;

  constructor() {
    this.emailService = new EmailService();
    this.storageService = new StorageService();
  }

  /**
   * Create data export request
   */
  public async createExportRequest(userId: string, format: 'json' | 'csv'): Promise<ExportRequest> {
    const requestId = uuidv4();
    const estimatedCompletionTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const exportRequest: ExportRequest = {
      id: requestId,
      userId,
      format,
      status: 'pending',
      createdAt: new Date(),
      estimatedCompletionTime,
    };

    // Store request in database
    await db.query(
      `INSERT INTO export_requests (id, user_id, format, status, created_at, estimated_completion_time)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [requestId, userId, format, 'pending', exportRequest.createdAt, estimatedCompletionTime]
    );

    // Queue export job for background processing
    await this.queueExportJob(requestId);

    // Send confirmation email
    await this.emailService.sendExportRequestConfirmation(userId, requestId);

    return exportRequest;
  }

  /**
   * Process data export (background job)
   */
  private async queueExportJob(requestId: string): Promise<void> {
    // In production, use a job queue like Bull or AWS SQS
    // For now, process in background
    setImmediate(async () => {
      try {
        await this.processExport(requestId);
      } catch (error) {
        logger.error(`Error processing export ${requestId}:`, error);
      }
    });
  }

  /**
   * Process export request
   */
  private async processExport(requestId: string): Promise<void> {
    try {
      // Update status to processing
      await db.query(
        `UPDATE export_requests SET status = 'processing' WHERE id = $1`,
        [requestId]
      );

      // Get request details
      const result = await db.query(
        `SELECT user_id, format FROM export_requests WHERE id = $1`,
        [requestId]
      );

      if (result.rows.length === 0) {
        throw new Error('Export request not found');
      }

      const { user_id: userId, format } = result.rows[0];

      // Gather all user data
      const userData = await this.gatherUserData(userId);

      // Generate export file
      let exportData: Buffer;
      let filename: string;
      let contentType: string;

      if (format === 'json') {
        exportData = Buffer.from(JSON.stringify(userData, null, 2));
        filename = `silenttalk-data-${userId}-${Date.now()}.json`;
        contentType = 'application/json';
      } else {
        exportData = await this.convertToCSV(userData);
        filename = `silenttalk-data-${userId}-${Date.now()}.zip`;
        contentType = 'application/zip';
      }

      // Upload to storage (S3 or Azure Blob)
      const downloadUrl = await this.storageService.uploadExport(filename, exportData);

      // Set expiration (7 days)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Update request
      await db.query(
        `UPDATE export_requests
         SET status = 'completed', completed_at = $1, download_url = $2, expires_at = $3
         WHERE id = $4`,
        [new Date(), downloadUrl, expiresAt, requestId]
      );

      // Send completion email
      await this.emailService.sendExportReadyNotification(userId, downloadUrl, expiresAt);

      logger.info(`Export completed for request ${requestId}`);
    } catch (error) {
      logger.error(`Export processing failed for ${requestId}:`, error);

      // Update status to failed
      await db.query(
        `UPDATE export_requests SET status = 'failed' WHERE id = $1`,
        [requestId]
      );

      throw error;
    }
  }

  /**
   * Gather all user data for export
   */
  private async gatherUserData(userId: string): Promise<any> {
    const userData: any = {
      exportDate: new Date().toISOString(),
      dataSubject: {},
      profile: {},
      sessions: [],
      messages: [],
      interpretations: [],
      bookings: [],
      friends: [],
      settings: {},
      consents: [],
      activityLogs: [],
    };

    // User account data
    const userResult = await db.query(
      `SELECT id, email, username, created_at, last_login, email_verified
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length > 0) {
      userData.dataSubject = userResult.rows[0];
    }

    // Profile data
    const profileResult = await db.query(
      `SELECT * FROM user_profiles WHERE user_id = $1`,
      [userId]
    );

    if (profileResult.rows.length > 0) {
      userData.profile = profileResult.rows[0];
    }

    // Practice sessions
    const sessionsResult = await db.query(
      `SELECT id, session_type, duration, created_at, accuracy_score
       FROM practice_sessions WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    userData.sessions = sessionsResult.rows;

    // Messages
    const messagesResult = await db.query(
      `SELECT id, content, created_at, is_encrypted
       FROM messages WHERE sender_id = $1 OR recipient_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    userData.messages = messagesResult.rows;

    // Live interpretation bookings
    const bookingsResult = await db.query(
      `SELECT id, interpreter_id, scheduled_time, duration, status, created_at
       FROM interpretation_bookings WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    userData.bookings = bookingsResult.rows;

    // Friends/connections
    const friendsResult = await db.query(
      `SELECT friend_id, status, created_at
       FROM friendships WHERE user_id = $1`,
      [userId]
    );
    userData.friends = friendsResult.rows;

    // Privacy settings
    const settingsResult = await db.query(
      `SELECT * FROM privacy_settings WHERE user_id = $1`,
      [userId]
    );

    if (settingsResult.rows.length > 0) {
      userData.settings = settingsResult.rows[0];
    }

    // Consent records
    const consentsResult = await db.query(
      `SELECT consent_type, granted, granted_at FROM consents WHERE user_id = $1`,
      [userId]
    );
    userData.consents = consentsResult.rows;

    // Activity logs (last 90 days)
    const logsResult = await db.query(
      `SELECT action, timestamp, ip_address
       FROM activity_logs
       WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '90 days'
       ORDER BY timestamp DESC`,
      [userId]
    );
    userData.activityLogs = logsResult.rows;

    return userData;
  }

  /**
   * Convert user data to CSV format (multiple CSV files in a ZIP)
   */
  private async convertToCSV(userData: any): Promise<Buffer> {
    const archiver = require('archiver');
    const { Readable } = require('stream');

    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      archive.on('data', (chunk: Buffer) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);

      // Convert each data type to CSV
      const csvFiles: any = {
        'account.csv': this.objectToCSV([userData.dataSubject]),
        'profile.csv': this.objectToCSV([userData.profile]),
        'sessions.csv': this.objectToCSV(userData.sessions),
        'messages.csv': this.objectToCSV(userData.messages),
        'bookings.csv': this.objectToCSV(userData.bookings),
        'friends.csv': this.objectToCSV(userData.friends),
        'settings.csv': this.objectToCSV([userData.settings]),
        'consents.csv': this.objectToCSV(userData.consents),
        'activity_logs.csv': this.objectToCSV(userData.activityLogs),
      };

      // Add each CSV to archive
      for (const [filename, csvContent] of Object.entries(csvFiles)) {
        archive.append(csvContent as string, { name: filename });
      }

      archive.finalize();
    });
  }

  /**
   * Convert object array to CSV string
   */
  private objectToCSV(data: any[]): string {
    if (data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        const escaped = ('' + value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Get export request status
   */
  public async getExportRequest(requestId: string, userId: string): Promise<ExportRequest | null> {
    const result = await db.query(
      `SELECT * FROM export_requests WHERE id = $1 AND user_id = $2`,
      [requestId, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Get export data for download
   */
  public async getExportData(requestId: string, userId: string): Promise<any> {
    const request = await this.getExportRequest(requestId, userId);

    if (!request || request.status !== 'completed') {
      return null;
    }

    // Check expiration
    if (request.expiresAt && new Date() > request.expiresAt) {
      return null;
    }

    // Download from storage
    const data = await this.storageService.downloadExport(request.downloadUrl!);

    return {
      data,
      filename: `silenttalk-export-${requestId}.${request.format}`,
      contentType: request.format === 'json' ? 'application/json' : 'application/zip',
      size: data.length,
    };
  }

  /**
   * Create account deletion request
   */
  public async createDeletionRequest(userId: string, reason?: string): Promise<DeletionRequest> {
    const requestId = uuidv4();
    const scheduledDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days grace period
    const cancellationDeadline = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000); // 29 days

    const deletionRequest: DeletionRequest = {
      id: requestId,
      userId,
      reason,
      status: 'pending',
      createdAt: new Date(),
      scheduledDate,
      cancellationDeadline,
    };

    await db.query(
      `INSERT INTO deletion_requests
       (id, user_id, reason, status, created_at, scheduled_date, cancellation_deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [requestId, userId, reason, 'pending', deletionRequest.createdAt, scheduledDate, cancellationDeadline]
    );

    // Send confirmation email
    await this.emailService.sendDeletionRequestConfirmation(userId, scheduledDate, cancellationDeadline);

    logger.info(`Deletion request created for user ${userId}, scheduled for ${scheduledDate}`);

    return deletionRequest;
  }

  /**
   * Cancel deletion request
   */
  public async cancelDeletionRequest(requestId: string, userId: string): Promise<boolean> {
    const result = await db.query(
      `UPDATE deletion_requests
       SET status = 'cancelled'
       WHERE id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING id`,
      [requestId, userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    await this.emailService.sendDeletionCancellationConfirmation(userId);

    logger.info(`Deletion request cancelled for user ${userId}`);

    return true;
  }

  /**
   * Process account deletion (called by scheduled job)
   */
  public async processAccountDeletion(userId: string): Promise<void> {
    try {
      logger.info(`Processing account deletion for user ${userId}`);

      // Anonymize or delete data based on retention policies
      await this.anonymizeUserData(userId);

      // Delete user account
      await db.query(`DELETE FROM users WHERE id = $1`, [userId]);

      // Update deletion request
      await db.query(
        `UPDATE deletion_requests
         SET status = 'completed', completed_at = $1
         WHERE user_id = $2 AND status = 'pending'`,
        [new Date(), userId]
      );

      logger.info(`Account deletion completed for user ${userId}`);
    } catch (error) {
      logger.error(`Error deleting account for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Anonymize user data (for retention compliance)
   */
  private async anonymizeUserData(userId: string): Promise<void> {
    // Anonymize personal data but keep aggregated/anonymized data for legal/business purposes
    await db.query(`UPDATE users SET email = $1, username = $2 WHERE id = $3`, [
      `deleted-${userId}@anonymized.local`,
      `deleted-${userId}`,
      userId,
    ]);

    await db.query(`DELETE FROM user_profiles WHERE user_id = $1`, [userId]);
    await db.query(`DELETE FROM privacy_settings WHERE user_id = $1`, [userId]);
    await db.query(`DELETE FROM consents WHERE user_id = $1`, [userId]);

    // Anonymize messages (keep for legal compliance but remove PII)
    await db.query(
      `UPDATE messages SET content = '[deleted]', sender_id = NULL WHERE sender_id = $1`,
      [userId]
    );
  }

  /**
   * Verify user password
   */
  public async verifyPassword(userId: string, password: string): Promise<boolean> {
    const result = await db.query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);

    if (result.rows.length === 0) {
      return false;
    }

    return bcrypt.compare(password, result.rows[0].password_hash);
  }

  /**
   * Get privacy settings
   */
  public async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    const result = await db.query(`SELECT * FROM privacy_settings WHERE user_id = $1`, [userId]);

    if (result.rows.length === 0) {
      // Return defaults
      return {
        userId,
        profileVisibility: 'friends',
        showOnlineStatus: true,
        allowFriendRequests: true,
        allowMessages: 'friends',
        dataSharing: false,
        marketingEmails: false,
        analyticsTracking: true,
        updatedAt: new Date(),
      };
    }

    return result.rows[0];
  }

  /**
   * Update privacy settings
   */
  public async updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    const currentSettings = await this.getPrivacySettings(userId);
    const updatedSettings = { ...currentSettings, ...settings, updatedAt: new Date() };

    await db.query(
      `INSERT INTO privacy_settings (user_id, profile_visibility, show_online_status,
       allow_friend_requests, allow_messages, data_sharing, marketing_emails,
       analytics_tracking, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id)
       DO UPDATE SET
         profile_visibility = $2, show_online_status = $3, allow_friend_requests = $4,
         allow_messages = $5, data_sharing = $6, marketing_emails = $7,
         analytics_tracking = $8, updated_at = $9`,
      [
        userId,
        updatedSettings.profileVisibility,
        updatedSettings.showOnlineStatus,
        updatedSettings.allowFriendRequests,
        updatedSettings.allowMessages,
        updatedSettings.dataSharing,
        updatedSettings.marketingEmails,
        updatedSettings.analyticsTracking,
        updatedSettings.updatedAt,
      ]
    );

    return updatedSettings;
  }

  /**
   * Get consent records
   */
  public async getConsents(userId: string): Promise<ConsentRecord[]> {
    const result = await db.query(
      `SELECT * FROM consents WHERE user_id = $1 ORDER BY granted_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Update consent
   */
  public async updateConsent(userId: string, consentType: string, granted: boolean): Promise<ConsentRecord> {
    const consentId = uuidv4();
    const grantedAt = new Date();

    await db.query(
      `INSERT INTO consents (id, user_id, consent_type, granted, granted_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, consent_type)
       DO UPDATE SET granted = $4, granted_at = $5`,
      [consentId, userId, consentType, granted, grantedAt]
    );

    return {
      id: consentId,
      userId,
      consentType,
      granted,
      grantedAt,
    };
  }

  /**
   * Get data retention information
   */
  public async getRetentionInfo(userId: string): Promise<any> {
    return {
      accountData: {
        retentionPeriod: 'Active account: retained indefinitely',
        deletionPolicy: 'Deleted 30 days after account deletion request',
      },
      messages: {
        retentionPeriod: '2 years after send date',
        deletionPolicy: 'Automatically deleted after retention period',
      },
      sessions: {
        retentionPeriod: '1 year after session date',
        deletionPolicy: 'Automatically deleted after retention period',
      },
      activityLogs: {
        retentionPeriod: '90 days',
        deletionPolicy: 'Automatically deleted after retention period',
      },
      backups: {
        retentionPeriod: '30 days',
        deletionPolicy: 'Overwritten after retention period',
      },
    };
  }
}
