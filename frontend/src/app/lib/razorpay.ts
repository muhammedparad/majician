type Options = Record<string, unknown>;
type FailedEvent = { error?: { description?: string; reason?: string } };
type Checkout = {
  open(): void;
  on?(event: 'payment.failed', callback: (response: FailedEvent) => void): void;
};
declare global {
  interface Window { Razorpay?: new (options: Options) => Checkout }
}

export type CheckoutResult = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };

export function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load the payment window. Check your connection and try again.'));
    document.head.appendChild(script);
  });
}

/** Opens Razorpay's checkout. Resolves with the signed result, null if dismissed, or rejects on payment.failed. */
export async function openCheckout(options: Options) {
  await loadCheckout();
  return new Promise<CheckoutResult | null>((resolve, reject) => {
    let settled = false;
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      action();
    };
    const checkout = new window.Razorpay!({
      ...options,
      handler: (result: CheckoutResult) => finish(() => resolve(result)),
      modal: { ondismiss: () => finish(() => resolve(null)) },
    });
    checkout.on?.('payment.failed', (response) => {
      const message = response?.error?.description || 'Payment failed. Please try again.';
      finish(() => reject(new Error(message)));
    });
    checkout.open();
  });
}
