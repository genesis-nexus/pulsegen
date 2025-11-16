import nodemailer from 'nodemailer';
import logger from '../utils/logger';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  static async sendEmail(options: SendEmailOptions) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Email sending error:', error);
      throw new Error('Failed to send email');
    }
  }

  static async sendSurveyInvitation(
    email: string,
    surveyTitle: string,
    surveySlug: string,
    customMessage?: string
  ) {
    const surveyUrl = `${process.env.APP_URL}/surveys/${surveySlug}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #3B82F6;
              color: white !important;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>You're invited to take a survey</h2>
            <h3>${surveyTitle}</h3>
            ${customMessage ? `<p>${customMessage}</p>` : ''}
            <p>We'd love to hear your feedback. Please take a few minutes to complete this survey.</p>
            <a href="${surveyUrl}" class="button">Take Survey</a>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="${surveyUrl}">${surveyUrl}</a></p>
            <div class="footer">
              <p>This survey was created with PulseGen Survey Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
You're invited to take a survey: ${surveyTitle}

${customMessage || ''}

Take the survey here: ${surveyUrl}

This survey was created with PulseGen Survey Platform
    `;

    return this.sendEmail({
      to: email,
      subject: `Survey Invitation: ${surveyTitle}`,
      html,
      text,
    });
  }

  static async sendSurveyReminder(
    email: string,
    surveyTitle: string,
    surveySlug: string
  ) {
    const surveyUrl = `${process.env.APP_URL}/surveys/${surveySlug}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #3B82F6;
              color: white !important;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Reminder: Complete your survey</h2>
            <h3>${surveyTitle}</h3>
            <p>You haven't completed this survey yet. Your feedback is important to us!</p>
            <a href="${surveyUrl}" class="button">Complete Survey</a>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Reminder: ${surveyTitle}`,
      html,
    });
  }
}

export default EmailService;
