/**
 * Data Retention Job
 * Implements automated data retention policies (GDPR Article 5)
 * Runs daily to clean up data past retention period
 */

import { CronJob } from 'cron';
import { db } from '../database/connection';
import { logger } from '../utils/logger';
import { PrivacyService } from '../services/privacy.service';

export class DataRetentionJob {
  private privacyService: PrivacyService;
  private job: CronJob | null = null;

  constructor() {
    this.privacyService = new PrivacyService();
  }

  /**
   * Start the data retention job
   * Runs daily at 2:00 AM
   */
  public start(): void {
    // Run every day at 2:00 AM
    this.job = new CronJob('0 2 * * *', async () => {
      logger.info('Starting data retention job');

      try {
        await this.runRetentionPolicies();
        logger.info('Data retention job completed successfully');
      } catch (error) {
        logger.error('Error running data retention job:', error);
      }
    });

    this.job.start();
    logger.info('Data retention job scheduled (daily at 2:00 AM)');
  }

  /**
   * Stop the job
   */
  public stop(): void {
    if (this.job) {
      this.job.stop();
      logger.info('Data retention job stopped');
    }
  }

  /**
   * Run all retention policies
   */
  private async runRetentionPolicies(): Promise<void> {
    await this.cleanupOldMessages();
    await this.cleanupOldSessions();
    await this.cleanupOldActivityLogs();
    await this.cleanupExpiredExports();
    await this.processScheduledDeletions();
    await this.cleanupAnonymizedAccounts();
    await this.cleanupUnverifiedAccounts();
  }

  /**
   * Delete messages older than 2 years
   * Retention policy: Messages are kept for 2 years
   */
  private async cleanupOldMessages(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 2); // 2 years ago

      const result = await db.query(
        `DELETE FROM messages WHERE created_at < $1`,
        [cutoffDate]
      );

      const deletedCount = result.rowCount || 0;

      if (deletedCount > 0) {
        logger.info(`Deleted ${deletedCount} messages older than 2 years`);
      }
    } catch (error) {
      logger.error('Error cleaning up old messages:', error);
      throw error;
    }
  }

  /**
   * Delete practice sessions older than 1 year
   * Retention policy: Sessions are kept for 1 year for analytics
   */
  private async cleanupOldSessions(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1); // 1 year ago

      const result = await db.query(
        `DELETE FROM practice_sessions WHERE created_at < $1`,
        [cutoffDate]
      );

      const deletedCount = result.rowCount || 0;

      if (deletedCount > 0) {
        logger.info(`Deleted ${deletedCount} practice sessions older than 1 year`);
      }
    } catch (error) {
      logger.error('Error cleaning up old sessions:', error);
      throw error;
    }
  }

  /**
   * Delete activity logs older than 90 days
   * Retention policy: Activity logs kept for 90 days for security auditing
   */
  private async cleanupOldActivityLogs(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days ago

      const result = await db.query(
        `DELETE FROM activity_logs WHERE timestamp < $1`,
        [cutoffDate]
      );

      const deletedCount = result.rowCount || 0;

      if (deletedCount > 0) {
        logger.info(`Deleted ${deletedCount} activity logs older than 90 days`);
      }
    } catch (error) {
      logger.error('Error cleaning up old activity logs:', error);
      throw error;
    }
  }

  /**
   * Delete expired data exports
   * Exports are available for 7 days after completion
   */
  private async cleanupExpiredExports(): Promise<void> {
    try {
      const now = new Date();

      const result = await db.query(
        `SELECT id, download_url FROM export_requests
         WHERE status = 'completed' AND expires_at < $1`,
        [now]
      );

      for (const row of result.rows) {
        // Delete file from storage
        // await this.storageService.deleteExport(row.download_url);

        // Delete from database
        await db.query(`DELETE FROM export_requests WHERE id = $1`, [row.id]);
      }

      const deletedCount = result.rows.length;

      if (deletedCount > 0) {
        logger.info(`Deleted ${deletedCount} expired data exports`);
      }
    } catch (error) {
      logger.error('Error cleaning up expired exports:', error);
      throw error;
    }
  }

  /**
   * Process scheduled account deletions
   * Accounts are deleted 30 days after deletion request
   */
  private async processScheduledDeletions(): Promise<void> {
    try {
      const now = new Date();

      const result = await db.query(
        `SELECT user_id FROM deletion_requests
         WHERE status = 'pending' AND scheduled_date <= $1`,
        [now]
      );

      for (const row of result.rows) {
        try {
          await this.privacyService.processAccountDeletion(row.user_id);
          logger.info(`Processed scheduled deletion for user ${row.user_id}`);
        } catch (error) {
          logger.error(`Failed to delete user ${row.user_id}:`, error);
        }
      }

      if (result.rows.length > 0) {
        logger.info(`Processed ${result.rows.length} scheduled deletions`);
      }
    } catch (error) {
      logger.error('Error processing scheduled deletions:', error);
      throw error;
    }
  }

  /**
   * Clean up fully anonymized accounts after 1 year
   * After anonymization, keep for 1 year for legal compliance
   */
  private async cleanupAnonymizedAccounts(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

      const result = await db.query(
        `DELETE FROM users
         WHERE email LIKE 'deleted-%@anonymized.local'
         AND updated_at < $1`,
        [cutoffDate]
      );

      const deletedCount = result.rowCount || 0;

      if (deletedCount > 0) {
        logger.info(`Permanently deleted ${deletedCount} anonymized accounts`);
      }
    } catch (error) {
      logger.error('Error cleaning up anonymized accounts:', error);
      throw error;
    }
  }

  /**
   * Delete unverified accounts older than 30 days
   * Users who never verified their email are deleted after 30 days
   */
  private async cleanupUnverifiedAccounts(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      const result = await db.query(
        `DELETE FROM users
         WHERE email_verified = false
         AND created_at < $1`,
        [cutoffDate]
      );

      const deletedCount = result.rowCount || 0;

      if (deletedCount > 0) {
        logger.info(`Deleted ${deletedCount} unverified accounts older than 30 days`);
      }
    } catch (error) {
      logger.error('Error cleaning up unverified accounts:', error);
      throw error;
    }
  }

  /**
   * Get retention statistics
   */
  public async getRetentionStats(): Promise<any> {
    try {
      const stats = {
        messagesToDelete: 0,
        sessionsToDelete: 0,
        logsToDelete: 0,
        exportsToDelete: 0,
        accountsToDelete: 0,
      };

      // Messages older than 2 years
      const messagesResult = await db.query(
        `SELECT COUNT(*) FROM messages WHERE created_at < NOW() - INTERVAL '2 years'`
      );
      stats.messagesToDelete = parseInt(messagesResult.rows[0].count, 10);

      // Sessions older than 1 year
      const sessionsResult = await db.query(
        `SELECT COUNT(*) FROM practice_sessions WHERE created_at < NOW() - INTERVAL '1 year'`
      );
      stats.sessionsToDelete = parseInt(sessionsResult.rows[0].count, 10);

      // Logs older than 90 days
      const logsResult = await db.query(
        `SELECT COUNT(*) FROM activity_logs WHERE timestamp < NOW() - INTERVAL '90 days'`
      );
      stats.logsToDelete = parseInt(logsResult.rows[0].count, 10);

      // Expired exports
      const exportsResult = await db.query(
        `SELECT COUNT(*) FROM export_requests WHERE status = 'completed' AND expires_at < NOW()`
      );
      stats.exportsToDelete = parseInt(exportsResult.rows[0].count, 10);

      // Scheduled deletions
      const deletionsResult = await db.query(
        `SELECT COUNT(*) FROM deletion_requests WHERE status = 'pending' AND scheduled_date <= NOW()`
      );
      stats.accountsToDelete = parseInt(deletionsResult.rows[0].count, 10);

      return stats;
    } catch (error) {
      logger.error('Error getting retention stats:', error);
      throw error;
    }
  }
}

// Singleton instance
export const dataRetentionJob = new DataRetentionJob();
