import { Request, Response } from 'express';
import { smtpService } from '../services/smtpService';

export const smtpController = {
  async getAll(req: Request, res: Response) {
    try {
      const configs = await smtpService.getAllConfigs();
      res.json({
        success: true,
        data: configs,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const config = await smtpService.createConfig(req.body);
      res.status(201).json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const config = await smtpService.updateConfig(id, req.body);
      res.json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await smtpService.deleteConfig(id);
      res.json({
        success: true,
        message: 'SMTP configuration deleted',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async testConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await smtpService.testConnection(id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async sendTestEmail(req: Request, res: Response) {
    try {
      const { to, subject, text } = req.body;

      if (!to || !subject) {
        return res.status(400).json({
          success: false,
          message: 'To and subject are required',
        });
      }

      await smtpService.sendEmail({
        to,
        subject,
        text: text || 'This is a test email from PulseGen.',
        html: `<p>${text || 'This is a test email from PulseGen.'}</p>`,
      });

      res.json({
        success: true,
        message: 'Test email sent successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
};
