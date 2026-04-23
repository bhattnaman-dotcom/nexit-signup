import type { Agreement } from '@/types';

interface PATokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

interface PACustomerResponse {
  Code?: string;
  id?: string;
  customerId?: string;
  customer_id?: string;
  iframeUrl?: string;
  embedUrl?: string;
  paymentUrl?: string;
}

async function getBearerToken(): Promise<string> {
  const base = process.env.PAY_ADVANTAGE_BASE_URL!;
  const username = process.env.PAY_ADVANTAGE_USERNAME;
  const password = process.env.PAY_ADVANTAGE_PASSWORD;
  const tokenUrl = `${base}/token`;

  if (!username || !password) {
    throw new Error(
      'PAY_ADVANTAGE_USERNAME or PAY_ADVANTAGE_PASSWORD is not set. ' +
      'Add the API user credentials from the Pay Advantage portal (Setup → Credentials) as Vercel environment variables.'
    );
  }

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'password',
      username,
      password,
    }),
  });

  if (!res.ok) {
    let detail = '';
    try { detail = ` — ${await res.text()}`; } catch { /* ignore */ }
    throw new Error(`Pay Advantage token error: ${res.status}${detail}`);
  }

  const data: PATokenResponse = await res.json();
  return data.access_token;
}

export async function createPayAdvantageCustomer(
  agreement: Agreement
): Promise<{ customerId: string; iframeUrl: string }> {
  const token = await getBearerToken();
  const base = process.env.PAY_ADVANTAGE_BASE_URL!;

  // Step 1: create customer
  const customerRes = await fetch(`${base}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: agreement.customer_name.trim(),
      email: agreement.customer_email,
      phone: agreement.customer_phone,
      reference: agreement.id,
    }),
  });

  if (!customerRes.ok) {
    let detail = '';
    try { detail = ` — ${await customerRes.text()}`; } catch { /* ignore */ }
    throw new Error(`Pay Advantage customer creation error: ${customerRes.status}${detail}`);
  }

  const customer: PACustomerResponse = await customerRes.json();
  const customerId = customer.Code ?? customer.id ?? customer.customerId ?? customer.customer_id;
  if (!customerId) {
    throw new Error(`Pay Advantage customer creation returned no ID. Response: ${JSON.stringify(customer)}`);
  }

  // Step 2: create payment iframe (nonce-based URL)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const returnUrl = `${baseUrl}/agreement/${agreement.id}/signed`;

  const iframeRes = await fetch(`${base}/payment_iframes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      Customer: { Code: customerId },
      Amount: agreement.price,
      Description: agreement.billing_type === 'recurring'
        ? `NexIT retainer — ${agreement.business_name}`
        : `NexIT services — ${agreement.business_name}`,
      PaymentOptions: ['creditcard'],
      ReturnUrl: returnUrl,
    }),
  });

  if (!iframeRes.ok) {
    let detail = '';
    try { detail = ` — ${await iframeRes.text()}`; } catch { /* ignore */ }
    throw new Error(`Pay Advantage iframe creation error: ${iframeRes.status}${detail}`);
  }

  const iframeData = await iframeRes.json();
  console.log('PA iframe response:', JSON.stringify(iframeData));

  const iframeUrl = iframeData.IFrameUrl ?? iframeData.iframeUrl ?? iframeData.Url ?? iframeData.url;
  if (!iframeUrl) {
    throw new Error(`Pay Advantage iframe creation returned no URL. Response: ${JSON.stringify(iframeData)}`);
  }

  return { customerId, iframeUrl };
}

export function verifyWebhookSignature(
  body: string,
  signature: string | null
): boolean {
  if (!signature || !process.env.PAY_ADVANTAGE_WEBHOOK_SECRET) return false;
  return signature === process.env.PAY_ADVANTAGE_WEBHOOK_SECRET;
}
