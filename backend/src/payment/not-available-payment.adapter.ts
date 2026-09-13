import { PaymentGatewayAdapter, CreatePaymentResult } from './payment-gateway-adapter.interface';

export class NotAvailablePaymentAdapter implements PaymentGatewayAdapter {
  async createPayment(): Promise<CreatePaymentResult> {
    return { available: false, message: 'Metode pembayaran belum tersedia' };
  }
}