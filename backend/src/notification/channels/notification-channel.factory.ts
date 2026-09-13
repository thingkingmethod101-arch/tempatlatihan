import { ConfigService } from '@nestjs/config';
import { NotifChannel } from '@prisma/client';
import { NotificationChannelAdapter } from './notification-channel-adapter.interface';
import { NotAvailableChannelAdapter } from './not-available-channel.adapter';
import { ResendEmailAdapter } from './resend-email.adapter';

export function notificationChannelFactory(
  channel: NotifChannel,
  config: ConfigService,
): NotificationChannelAdapter {
  if (channel === NotifChannel.email) {
    const provider = config.get<string>('EMAIL_PROVIDER');
    if (provider === 'resend') {
      return new ResendEmailAdapter(config);
    }
  }
  // whatsapp & push: provider belum diputuskan tim -> selalu stub untuk sekarang
  return new NotAvailableChannelAdapter(channel);
}