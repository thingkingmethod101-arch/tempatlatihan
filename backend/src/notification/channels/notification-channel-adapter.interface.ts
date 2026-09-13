export interface SendResult {
    ok: boolean;
    errorMessage?: string;
  }
  
  export interface NotificationChannelAdapter {
    send(destination: string, message: string, subject?: string): Promise<SendResult>;
  }