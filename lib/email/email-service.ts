import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.AUTH_EMAIL_SMTP_HOST,
      port: Number(process.env.AUTH_EMAIL_SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.AUTH_EMAIL_SMTP_USER,
        pass: process.env.AUTH_EMAIL_SMTP_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.AUTH_EMAIL_FROM,
        to,
        subject,
        html,
      });
      console.log(`[EmailService] 邮件发送成功: ${to}`);
    } catch (error) {
      console.error('[EmailService] 邮件发送失败:', error);
      throw new Error('邮件发送失败');
    }
  }
}

export const emailService = new EmailService();
