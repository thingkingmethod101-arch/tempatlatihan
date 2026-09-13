import { ConfigService } from '@nestjs/config';
import { PaymentGatewayAdapter } from './payment-gateway-adapter.interface';
import { NotAvailablePaymentAdapter } from './not-available-payment.adapter';

export function paymentAdapterFactory(config: ConfigService): PaymentGatewayAdapter {
  const provider = config.get<string>('PAYMENT_PROVIDER');
  switch (provider) {
    // case 'midtrans': return new MidtransPaymentAdapter(config); // aktifkan begitu vendor diputuskan
    // case 'xendit':   return new XenditPaymentAdapter(config);
    default:
      return new NotAvailablePaymentAdapter();
  }
}