import type { Agreement } from '@/types';

interface PATokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PACustomerResponse {
  id: string;
  iframeUrl?: string;
}

async function getBearerToken(): Promise<string> {
  const base = process.env.PAY_ADVANTAGE_BASE_URL!;
  const clientId = process.env.PAY_ADVANTAGE_CLIENT_ID!;
  const clientSecret = process.env.PAY_ADVANTAGE_CLIENT_SECRET!;
  const tokenUrl = `${base}/token`;

  // Standard OAuth2: credentials in Basic Auth header, grant_type in body
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });

  if (!res.ok) {
    let detail = '';
    try { detail = ` — ${await res.text()}`; } catch { /* ignore */ }
    throw new Error(`Pay Advantage token error: ${res.status}${detail} (url: ${tokenUrl})`);
  }

  const data: PATokenResponse = await res.json();
  return data.access_token;
}

export async function createPayAdvantageCustomer(
  agreement: Agreement
): Promise<{ customerId: string; iframeUrl: string }> {
  const token = await getBearerToken();
  const base = process.env.PAY_ADVANTAGE_BASE_URL!;

  const nameParts = agreement.customer_name.trim().split(' ');
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ') || firstName;

  const res = await fetch(`${base}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      firstName,
      lastName,
      email: agreement.customer_email,
      phone: agreement.customer_phone,
      reference: agreement.id,
    }),
  });

  if (!res.ok) {
    let detail = '';
    try { detail = ` — ${await res.text()}`; } catch { /* ignore */ }
    throw new Error(`Pay Advantage customer creation error: ${res.status}${detail}`);
  }

  const data: PACustomerResponse = await res.json();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const returnUrl = encodeURIComponent(`${baseUrl}/agreement/${agreement.id}/signed`);
  const iframeUrl =
    data.iframeUrl ??
    `${base}/embed/payment/${data.id}?reference=${agreement.id}&returnUrl=${returnUrl}`;

  return { customerId: data.id, iframeUrl };
}

export function verifyWebhookSignature(
  body: string,
  signature: string | null
): boolean {
  if (!signature || !process.env.PAY_ADVANTAGE_WEBHOOK_SECRET) return false;
  return signature === process.env.PAY_ADVANTAGE_WEBHOOK_SECRET;
}
