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

// The OAuth token endpoint is at the root, not under /v3
function getTokenUrl(): string {
  const base = process.env.PAY_ADVANTAGE_BASE_URL!;
  // Strip /v3 or any version suffix to get the root URL
  const root = base.replace(/\/v\d+\/?$/, '');
  return `${root}/token`;
}

async function getBearerToken(): Promise<string> {
  const tokenUrl = getTokenUrl();
  const base = process.env.PAY_ADVANTAGE_BASE_URL!;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.PAY_ADVANTAGE_CLIENT_ID!,
    client_secret: process.env.PAY_ADVANTAGE_CLIENT_SECRET!,
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    let detail = '';
    try {
      const errBody = await res.text();
      detail = ` — ${errBody}`;
    } catch { /* ignore */ }
    throw new Error(
      `Pay Advantage token error: ${res.status}${detail} (url: ${tokenUrl}, base: ${base})`
    );
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
    try {
      const errBody = await res.text();
      detail = ` — ${errBody}`;
    } catch { /* ignore */ }
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
