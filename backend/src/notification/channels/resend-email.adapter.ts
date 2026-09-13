import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import { NotificationChannelAdapter, SendResult } from './notification-channel-adapter.interface';

export class ResendEmailAdapter implements NotificationChannelAdapter {
  private client: Resend;
  private from: string;

  constructor(config: ConfigService) {
    this.client = new Resend(config.get<string>('RESEND_API_KEY'));
    this.from = config.get<string>('EMAIL_FROM') || 'onboarding@resend.dev';
  }

  async send(destination: string, message: string, subject?: string): Promise<SendResult> {
    try {
      const result = await this.client.emails.send({
        from: this.from,
        to: destination,
        subject: subject ?? 'Notifikasi Olympiad Platform',
        text: message,
      });
      if (result.error) {
        return { ok: false, errorMessage: result.error.message };
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, errorMessage: err.message };
    }
  }
}