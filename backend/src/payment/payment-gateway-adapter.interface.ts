export interface CreatePaymentResult {
    available: boolean;
    qrisRef?: string;
    qrImageUrl?: string;
    message?: string;
  }
  
  export interface PaymentGatewayAdapter {
    createPayment(transactionId: string, amount: number): Promise<CreatePaymentResult>;
  }