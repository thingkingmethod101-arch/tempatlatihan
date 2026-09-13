import { NotificationChannelAdapter, SendResult } from './notification-channel-adapter.interface';

export class NotAvailableChannelAdapter implements NotificationChannelAdapter {
  constructor(private channelName: string) {}

  async send(): Promise<SendResult> {
    return { ok: false, errorMessage: `Channel ${this.channelName} belum dikonfigurasi` };
  }
}