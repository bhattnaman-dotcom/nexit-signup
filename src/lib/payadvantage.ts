import type { Agreement } from '@/types';

interface PATokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

interface PACustomerResponse {
  id: string;
  iframeUrl?: string;
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
