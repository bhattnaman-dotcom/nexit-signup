import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return htmlPage('Authorization Failed', `
      <div class="card error">
        <h2>Pay Advantage returned an error</h2>
        <p><code>${error}</code></p>
        <p>${searchParams.get('error_description') ?? ''}</p>
      </div>
    `);
  }

  if (!code) {
    return htmlPage('Missing Code', `
      <div class="card error">
        <h2>No authorization code received</h2>
        <p>Pay Advantage did not return a code. Try authorizing again.</p>
      </div>
    `);
  }

  const clientId = process.env.PAY_ADVANTAGE_CLIENT_ID!;
  const clientSecret = process.env.PAY_ADVANTAGE_CLIENT_SECRET!;
  const base = process.env.PAY_ADVANTAGE_BASE_URL!;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const redirectUri = `${baseUrl}/api/auth/payadvantage/callback`;
  const tokenUrl = `${base}/token`;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  let tokenData: Record<string, string>;
  try {
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const body = await res.text();
    if (!res.ok) {
      return htmlPage('Token Exchange Failed', `
        <div class="card error">
          <h2>Pay Advantage token exchange failed (${res.status})</h2>
          <pre>${body}</pre>
          <p>Token URL: <code>${tokenUrl}</code></p>
        </div>
      `);
    }

    tokenData = JSON.parse(body);
  } catch (err) {
    return htmlPage('Token Exchange Error', `
      <div class="card error">
        <h2>Network error during token exchange</h2>
        <p>${err instanceof Error ? err.message : String(err)}</p>
      </div>
    `);
  }

  const refreshToken = tokenData.refresh_token ?? '';
  const accessToken = tokenData.access_token ?? '';
  const expiresIn = tokenData.expires_in ?? '';

  return htmlPage('Pay Advantage Connected ✓', `
    <div class="card success">
      <h2>✓ Pay Advantage authorized successfully</h2>
      <p>Copy the refresh token below and add it as a Vercel environment variable.</p>
    </div>

    <div class="card">
      <h3>1. Add this to Vercel Environment Variables</h3>
      <label>Variable name:</label>
      <div class="copy-row">
        <code>PAY_ADVANTAGE_REFRESH_TOKEN</code>
      </div>
      <label>Value (refresh token):</label>
      <div class="copy-row">
        <textarea readonly onclick="this.select()">${refreshToken}</textarea>
      </div>
      <p class="note">Vercel → Settings → Environment Variables → add the above → Redeploy</p>
    </div>

    <div class="card muted">
      <h3>Other token details (for reference)</h3>
      <p><strong>Access token</strong> (short-lived, expires in ${expiresIn}s — do NOT save this):</p>
      <textarea readonly onclick="this.select()" style="height:60px">${accessToken}</textarea>
    </div>
  `);
}

function htmlPage(title: string, body: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — NexIT</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#f5f5f5;color:#1a1d36;padding:40px 20px}
    h1{font-size:22px;margin-bottom:24px;color:#2C3275}
    h2{font-size:16px;margin-bottom:8px}
    h3{font-size:14px;margin-bottom:8px;color:#444}
    .card{background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;max-width:640px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
    .card.success{border-left:4px solid #22c55e}
    .card.error{border-left:4px solid #ef4444}
    .card.muted{opacity:.7}
    label{display:block;font-size:12px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:.05em;margin:12px 0 4px}
    textarea{width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-family:monospace;font-size:12px;resize:vertical;min-height:80px;background:#f9f9f9}
    code{font-family:monospace;font-size:13px;background:#f0f0f0;padding:2px 6px;border-radius:4px}
    .note{font-size:12px;color:#888;margin-top:10px}
    p{font-size:14px;line-height:1.6;margin-top:6px}
    pre{font-size:12px;background:#f0f0f0;padding:12px;border-radius:6px;overflow-x:auto;margin-top:8px;white-space:pre-wrap}
  </style>
</head>
<body>
  <h1>NexIT — Pay Advantage Setup</h1>
  ${body}
</body>
</html>`;
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
