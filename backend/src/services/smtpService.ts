import { PrismaClient } from '@prisma/client';
import nodemailer, { Transporter } from 'nodemailer';
import { encrypt, decrypt } from '../utils/encryption';

const prisma = new PrismaClient();

export interface SMTPConfigInput {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

let transporterCache: Transporter | null = null;

export const smtpService = {
  async getAllConfigs() {
    const configs = await prisma.sMTPConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Don't expose passwords
    return configs.map(config => ({
      ...config,
      password: '***ENCRYPTED***',
    }));
  },

  async getActiveConfig() {
    const config = await prisma.sMTPConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      return null;
    }

    return {
      ...config,
      password: decrypt(config.password),
    };
  },

  async getDefaultConfig() {
    const config = await prisma.sMTPConfig.findFirst({
      where: { isDefault: true, isActive: true },
    });

    if (!config) {
      return null;
    }

    return {
      ...config,
      password: decrypt(config.password),
    };
  },

  async createConfig(data: SMTPConfigInput) {
    // If setting as default or active, unset other configs
    if (data.isDefault) {
      await prisma.sMTPConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    if (data.isActive) {
      await prisma.sMTPConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    // Encrypt password
    const encryptedPassword = encrypt(data.password);

    const config = await prisma.sMTPConfig.create({
      data: {
        ...data,
        password: encryptedPassword,
      },
    });

    // Clear transporter cache
    transporterCache = null;

    return {
      ...config,
      password: '***ENCRYPTED***',
    };
  },

  async updateConfig(id: string, data: Partial<SMTPConfigInput>) {
    const existing = await prisma.sMTPConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('SMTP configuration not found');
    }

    // If setting as default or active, unset other configs
    if (data.isDefault) {
      await prisma.sMTPConfig.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    if (data.isActive) {
      await prisma.sMTPConfig.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }

    // Encrypt new password if provided
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = encrypt(data.password);
    }

    const config = await prisma.sMTPConfig.update({
      where: { id },
      data: updateData,
    });

    // Clear transporter cache
    transporterCache = null;

    return {
      ...config,
      password: '***ENCRYPTED***',
    };
  },

  async deleteConfig(id: string) {
    await prisma.sMTPConfig.delete({
      where: { id },
    });

    // Clear transporter cache
    transporterCache = null;

    return { message: 'SMTP configuration deleted successfully' };
  },

  async testConnection(id: string) {
    const config = await prisma.sMTPConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new Error('SMTP configuration not found');
    }

    const decryptedPassword = decrypt(config.password);

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: decryptedPassword,
      },
    });

    try {
      await transporter.verify();
      return { success: true, message: 'SMTP connection successful' };
    } catch (error: any) {
      throw new Error(`SMTP connection failed: ${error.message}`);
    }
  },

  async getTransporter(): Promise<Transporter | null> {
    if (transporterCache) {
      return transporterCache;
    }

    const config = await this.getActiveConfig();
    if (!config) {
      return null;
    }

    transporterCache = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password,
      },
    });

    return transporterCache;
  },

  async sendEmail(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: any[];
  }) {
    const transporter = await this.getTransporter();
    if (!transporter) {
      throw new Error('No active SMTP configuration found');
    }

    const config = await this.getActiveConfig();
    if (!config) {
      throw new Error('No active SMTP configuration found');
    }

    const mailOptions = {
      from: config.fromName
        ? `"${config.fromName}" <${config.fromEmail}>`
        : config.fromEmail,
      replyTo: config.replyTo || config.fromEmail,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    };

    return await transporter.sendMail(mailOptions);
  },
};
