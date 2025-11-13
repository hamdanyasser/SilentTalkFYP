/**
 * Privacy Controller
 * Handles GDPR compliance endpoints: data export, right to be forgotten
 */

import { Request, Response } from 'express';
import { PrivacyService } from '../services/privacy.service';
import { logger } from '../utils/logger';

export class PrivacyController {
  private privacyService: PrivacyService;

  constructor() {
    this.privacyService = new PrivacyService();
  }

  /**
   * Request data export (GDPR Article 20 - Right to data portability)
   * POST /api/privacy/export
   */
  public requestDataExport = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { format = 'json' } = req.body;

      // Validate format
      if (!['json', 'csv'].includes(format)) {
        res.status(400).json({ error: 'Invalid format. Supported: json, csv' });
        return;
      }

      logger.info(`Data export requested by user ${userId}, format: ${format}`);

      // Create export request (asynchronous processing)
      const exportRequest = await this.privacyService.createExportRequest(userId, format);

      res.status(202).json({
        message: 'Data export request created. You will receive an email when ready.',
        requestId: exportRequest.id,
        status: exportRequest.status,
        estimatedCompletionTime: exportRequest.estimatedCompletionTime,
      });
    } catch (error) {
      logger.error('Error requesting data export:', error);
      res.status(500).json({ error: 'Failed to create data export request' });
    }
  };

  /**
   * Get export request status
   * GET /api/privacy/export/:requestId
   */
  public getExportStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { requestId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const exportRequest = await this.privacyService.getExportRequest(requestId, userId);

      if (!exportRequest) {
        res.status(404).json({ error: 'Export request not found' });
        return;
      }

      res.json({
        id: exportRequest.id,
        status: exportRequest.status,
        format: exportRequest.format,
        createdAt: exportRequest.createdAt,
        completedAt: exportRequest.completedAt,
        downloadUrl: exportRequest.downloadUrl,
        expiresAt: exportRequest.expiresAt,
      });
    } catch (error) {
      logger.error('Error getting export status:', error);
      res.status(500).json({ error: 'Failed to get export status' });
    }
  };

  /**
   * Download exported data
   * GET /api/privacy/export/:requestId/download
   */
  public downloadExport = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { requestId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const exportData = await this.privacyService.getExportData(requestId, userId);

      if (!exportData) {
        res.status(404).json({ error: 'Export not found or expired' });
        return;
      }

      // Set headers for file download
      res.setHeader('Content-Type', exportData.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
      res.setHeader('Content-Length', exportData.size);

      // Send file
      res.send(exportData.data);

      logger.info(`Data export downloaded by user ${userId}, request ${requestId}`);
    } catch (error) {
      logger.error('Error downloading export:', error);
      res.status(500).json({ error: 'Failed to download export' });
    }
  };

  /**
   * Request account deletion (GDPR Article 17 - Right to erasure)
   * POST /api/privacy/delete-account
   */
  public requestAccountDeletion = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { password, reason } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify password before deletion
      const isPasswordValid = await this.privacyService.verifyPassword(userId, password);

      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid password' });
        return;
      }

      logger.info(`Account deletion requested by user ${userId}, reason: ${reason || 'not provided'}`);

      // Create deletion request (with grace period)
      const deletionRequest = await this.privacyService.createDeletionRequest(userId, reason);

      res.json({
        message: 'Account deletion scheduled. You have 30 days to cancel.',
        requestId: deletionRequest.id,
        scheduledDeletionDate: deletionRequest.scheduledDate,
        cancellationDeadline: deletionRequest.cancellationDeadline,
      });
    } catch (error) {
      logger.error('Error requesting account deletion:', error);
      res.status(500).json({ error: 'Failed to create deletion request' });
    }
  };

  /**
   * Cancel account deletion request
   * POST /api/privacy/delete-account/cancel
   */
  public cancelAccountDeletion = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { requestId } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const cancelled = await this.privacyService.cancelDeletionRequest(requestId, userId);

      if (!cancelled) {
        res.status(404).json({ error: 'Deletion request not found or already processed' });
        return;
      }

      logger.info(`Account deletion cancelled by user ${userId}`);

      res.json({ message: 'Account deletion cancelled successfully' });
    } catch (error) {
      logger.error('Error cancelling account deletion:', error);
      res.status(500).json({ error: 'Failed to cancel deletion request' });
    }
  };

  /**
   * Get user's privacy settings
   * GET /api/privacy/settings
   */
  public getPrivacySettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const settings = await this.privacyService.getPrivacySettings(userId);

      res.json(settings);
    } catch (error) {
      logger.error('Error getting privacy settings:', error);
      res.status(500).json({ error: 'Failed to get privacy settings' });
    }
  };

  /**
   * Update user's privacy settings
   * PUT /api/privacy/settings
   */
  public updatePrivacySettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const settings = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const updatedSettings = await this.privacyService.updatePrivacySettings(userId, settings);

      logger.info(`Privacy settings updated for user ${userId}`);

      res.json(updatedSettings);
    } catch (error) {
      logger.error('Error updating privacy settings:', error);
      res.status(500).json({ error: 'Failed to update privacy settings' });
    }
  };

  /**
   * Get user's consent records
   * GET /api/privacy/consents
   */
  public getConsents = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const consents = await this.privacyService.getConsents(userId);

      res.json(consents);
    } catch (error) {
      logger.error('Error getting consents:', error);
      res.status(500).json({ error: 'Failed to get consents' });
    }
  };

  /**
   * Update user's consent
   * POST /api/privacy/consents
   */
  public updateConsent = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { consentType, granted } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!consentType || typeof granted !== 'boolean') {
        res.status(400).json({ error: 'Invalid consent data' });
        return;
      }

      const consent = await this.privacyService.updateConsent(userId, consentType, granted);

      logger.info(`Consent updated for user ${userId}: ${consentType} = ${granted}`);

      res.json(consent);
    } catch (error) {
      logger.error('Error updating consent:', error);
      res.status(500).json({ error: 'Failed to update consent' });
    }
  };

  /**
   * Get data retention information
   * GET /api/privacy/retention
   */
  public getRetentionInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const retentionInfo = await this.privacyService.getRetentionInfo(userId);

      res.json(retentionInfo);
    } catch (error) {
      logger.error('Error getting retention info:', error);
      res.status(500).json({ error: 'Failed to get retention information' });
    }
  };
}
