import type { Agreement } from '@/types';

interface PATokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PACustomerResponse {
  Code?: string;
  id?: string;
  customerId?: string;
  customer_id?: string;
}

async function getBearerToken(): Promise<string> {
  const base = process.env.PAY_ADVANTAGE_BASE_URL!;
  const username = process.env.PAY_ADVANTAGE_USERNAME;
  const password = process.env.PAY_ADVANTAGE_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'PAY_ADVANTAGE_USERNAME or PAY_ADVANTAGE_PASSWORD is not set. ' +
      'Add the API user credentials from Pay Advantage portal (Setup → Credentials).'
    );
  }

  const res = await fetch(`${base}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'password', username, password }),
  });

  if (!res.ok) {
    let detail = '';
    try { detail = ` — ${await res.text()}`; } catch { /* ignore */ }
    throw new Error(`Pay Advantage token error: ${res.status}${detail}`);
  }

  const data: PATokenResponse = await res.json();
  return data.access_token;
}

async function createCustomer(token: string, agreement: Agreement): Promise<string> {
  const base = process.env.PAY_ADVANTAGE_BASE_URL!;

  const res = await fetch(`${base}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: agreement.customer_name.trim(),
      email: agreement.customer_email,
      mobile: agreement.customer_phone,
      phone: agreement.customer_phone,
      reference: agreement.id,
    }),
  });

  if (!res.ok) {
    let detail = '';
    try { detail = ` — ${await res.text()}`; } catch { /* ignore */ }
    throw new Error(`Pay Advantage customer creation error: ${res.status}${detail}`);
  }

  const customer: PACustomerResponse = await res.json();
  const customerId = customer.Code ?? customer.id ?? customer.customerId ?? customer.customer_id;
  if (!customerId) {
    throw new Error(`Pay Advantage customer creation returned no ID. Response: ${JSON.stringify(customer)}`);
  }
  return customerId;
}

export async function setupPayAdvantagePayment(
  agreement: Agreement
): Promise<{ customerId: string; paymentUrl: string; useIframe: boolean }> {
  const token = await getBearerToken();
  const base = process.env.PAY_ADVANTAGE_BASE_URL!;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const returnUrl = `${baseUrl}/agreement/${agreement.id}/payment-return`;

  const customerId = await createCustomer(token, agreement);

  if (agreement.billing_type === 'recurring') {
    // Direct debit — PA's branded DDR page handles both credit card and bank account
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const ddrRes = await fetch(`${base}/direct_debits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        Customer: { Code: customerId },
        Description: `NexIT — ${agreement.business_name}`,
        Frequency: agreement.billing_frequency ?? 'monthly',
        RecurringAmount: agreement.price,
        RecurringDateStart: today,
        ReminderDays: 3,
        OnchargedFees: [],
        FailureOption: 'next',
        ReturnUrl: returnUrl,
      }),
    });

    if (!ddrRes.ok) {
      let detail = '';
      try { detail = ` — ${await ddrRes.text()}`; } catch { /* ignore */ }
      throw new Error(`Pay Advantage direct debit error: ${ddrRes.status}${detail}`);
    }

    const ddrData = await ddrRes.json();
    console.log('PA direct debit response:', JSON.stringify(ddrData));

    const paymentUrl =
      ddrData.AuthorisationUrl ??
      ddrData.authorisationUrl ??
      ddrData.AuthorizationUrl ??
      ddrData.authorizationUrl ??
      ddrData.SigningUrl ??
      ddrData.signingUrl ??
      ddrData.Url ??
      ddrData.url ??
      ddrData.PaymentUrl ??
      ddrData.paymentUrl;

    if (!paymentUrl) {
      throw new Error(`Pay Advantage direct debit returned no authorization URL. Response: ${JSON.stringify(ddrData)}`);
    }

    return { customerId, paymentUrl, useIframe: false };
  }

  // Once-off — credit card via hosted payment iframe
  const iframeRes = await fetch(`${base}/payment_iframes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      Customer: { Code: customerId },
      Amount: agreement.price,
      Description: `NexIT — ${agreement.business_name}`,
      PaymentOptions: ['creditcard'],
      ReturnUrl: returnUrl,
    }),
  });

  if (!iframeRes.ok) {
    let detail = '';
    try { detail = ` — ${await iframeRes.text()}`; } catch { /* ignore */ }
    throw new Error(`Pay Advantage payment page error: ${iframeRes.status}${detail}`);
  }

  const iframeData = await iframeRes.json();
  const paymentUrl = iframeData.IFrameUrl ?? iframeData.iframeUrl ?? iframeData.Url ?? iframeData.url;
  if (!paymentUrl) {
    throw new Error(`Pay Advantage returned no payment URL. Response: ${JSON.stringify(iframeData)}`);
  }

  return { customerId, paymentUrl, useIframe: true };
}

export function verifyWebhookSignature(
  body: string,
  signature: string | null
): boolean {
  if (!signature || !process.env.PAY_ADVANTAGE_WEBHOOK_SECRET) return false;
  return signature === process.env.PAY_ADVANTAGE_WEBHOOK_SECRET;
}
