import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Only allow logged-in admins to initiate the PA OAuth flow
  const token = req.cookies.get('admin_token')?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  const clientId = process.env.PAY_ADVANTAGE_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const authorizeUrl =
    process.env.PAY_ADVANTAGE_AUTHORIZE_URL ??
    'https://api.payadvantage.com.au/oauth/authorize';

  if (!clientId || !baseUrl) {
    return NextResponse.json(
      { error: 'PAY_ADVANTAGE_CLIENT_ID or NEXT_PUBLIC_BASE_URL env var not set' },
      { status: 500 }
    );
  }

  const redirectUri = `${baseUrl}/api/auth/payadvantage/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
  });

  return NextResponse.redirect(`${authorizeUrl}?${params.toString()}`);
}
