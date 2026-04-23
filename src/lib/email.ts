import nodemailer from 'nodemailer';
import type { Agreement } from '@/types';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(price);
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' });
}

function billingLabel(agreement: Agreement): string {
  if (agreement.billing_type === 'once-off') return 'Once-off payment';
  const freq = agreement.billing_frequency ?? 'recurring';
  return `${freq.charAt(0).toUpperCase() + freq.slice(1)} — ${formatPrice(agreement.price)} AUD`;
}

// Sent immediately when client signs the agreement
export async function sendSignedClientEmail(agreement: Agreement, pdfBuffer: Buffer): Promise<void> {
  const products = agreement.products.join(', ');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #2C3275; padding: 32px 40px; text-align: center; }
    .header h1 { color: #FAA63A; font-size: 24px; margin: 0 0 4px; letter-spacing: 1px; }
    .header p { color: #a0a8d0; font-size: 13px; margin: 0; }
    .hero { background: linear-gradient(135deg, #2C3275 0%, #3D4494 100%); padding: 24px 40px; }
    .hero h2 { color: #fff; font-size: 20px; margin: 0; }
    .body { padding: 32px 40px; }
    .greeting { font-size: 16px; color: #1A1D36; margin-bottom: 16px; }
    .summary { background: #f8f9ff; border-left: 4px solid #F47B20; border-radius: 4px; padding: 20px 24px; margin: 24px 0; }
    .summary table { width: 100%; border-collapse: collapse; }
    .summary td { padding: 6px 0; font-size: 14px; color: #333; vertical-align: top; }
    .summary td:first-child { color: #666; width: 140px; font-weight: 600; }
    .callout { background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px; padding: 16px 20px; margin: 20px 0; font-size: 14px; color: #5d4037; }
    .footer { background: #1A1D36; padding: 24px 40px; text-align: center; }
    .footer p { color: #6b7194; font-size: 12px; margin: 4px 0; }
    .footer a { color: #FAA63A; text-decoration: none; }
    .note { font-size: 13px; color: #666; margin-top: 24px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>NexIT Solutions</h1>
      <p>Melbourne's Digital Growth Partner</p>
    </div>
    <div class="hero">
      <h2>Your Agreement is Signed ✓</h2>
    </div>
    <div class="body">
      <p class="greeting">Hi ${agreement.customer_name},</p>
      <p>Thank you for signing your service agreement with NexIT Solutions. A copy of your signed agreement is attached to this email for your records.</p>
      <div class="summary">
        <table>
          <tr><td>Business:</td><td>${agreement.business_name}</td></tr>
          <tr><td>Services:</td><td>${products}</td></tr>
          <tr><td>Investment:</td><td>${formatPrice(agreement.price)} AUD (incl. GST)</td></tr>
          <tr><td>Billing:</td><td>${billingLabel(agreement)}</td></tr>
          <tr><td>Signed:</td><td>${formatDate(agreement.signed_at)}</td></tr>
        </table>
      </div>
      ${agreement.billing_type === 'recurring' ? `
      <div class="callout">
        📧 <strong>Next step:</strong> You will shortly receive a separate email from Pay Advantage to authorise your direct debit. Please check your inbox (and spam folder) and follow the link to complete your payment setup.
      </div>` : ''}
      <p class="note">If you have any questions, please reach out to our team at <a href="mailto:hello@nexit.com.au">hello@nexit.com.au</a>.</p>
      <p class="note">We look forward to working with you and helping ${agreement.business_name} grow online.</p>
    </div>
    <div class="footer">
      <p><strong style="color:#FAA63A;">NexIT Solutions</strong></p>
      <p>Melbourne, VIC, Australia</p>
      <p><a href="mailto:hello@nexit.com.au">hello@nexit.com.au</a> &nbsp;·&nbsp; <a href="${baseUrl}">${baseUrl?.replace('https://', '')}</a></p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"NexIT Solutions" <${process.env.GMAIL_USER}>`,
    to: agreement.customer_email,
    subject: `Your NexIT Solutions Agreement — ${agreement.business_name} ✓`,
    html,
    attachments: [
      {
        filename: `NexIT-Agreement-${agreement.business_name.replace(/[^a-z0-9]/gi, '-')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}

// Sent immediately when client signs the agreement
export async function sendSignedStaffEmail(agreement: Agreement): Promise<void> {
  const products = agreement.products.join(', ');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const dashboardUrl = `${baseUrl}/admin/dashboard/${agreement.id}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #2C3275; padding: 32px 40px; }
    .header h1 { color: #FAA63A; font-size: 22px; margin: 0 0 4px; }
    .header p { color: #a0a8d0; font-size: 13px; margin: 0; }
    .body { padding: 32px 40px; }
    .alert { background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; }
    .alert h2 { color: #2e7d32; margin: 0 0 4px; font-size: 18px; }
    .alert p { color: #388e3c; margin: 0; font-size: 14px; }
    .details { background: #f8f9ff; border-radius: 8px; padding: 20px 24px; margin: 20px 0; }
    .details table { width: 100%; border-collapse: collapse; }
    .details td { padding: 8px 0; font-size: 14px; border-bottom: 1px solid #eee; vertical-align: top; }
    .details tr:last-child td { border-bottom: none; }
    .details td:first-child { color: #666; width: 160px; font-weight: 600; }
    .btn { display: inline-block; background: #F47B20; color: #fff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 700; font-size: 14px; margin-top: 16px; }
    .footer { background: #1A1D36; padding: 20px 40px; text-align: center; }
    .footer p { color: #6b7194; font-size: 12px; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>NexIT Solutions — Staff Notification</h1>
      <p>Internal agreement update</p>
    </div>
    <div class="body">
      <div class="alert">
        <h2>✅ ${agreement.customer_name} has signed their agreement</h2>
        <p>${agreement.business_name} — awaiting payment authorisation</p>
      </div>
      <div class="details">
        <table>
          <tr><td>Business:</td><td>${agreement.business_name}</td></tr>
          <tr><td>Client:</td><td>${agreement.customer_name}</td></tr>
          <tr><td>Email:</td><td>${agreement.customer_email}</td></tr>
          <tr><td>Phone:</td><td>${agreement.customer_phone}</td></tr>
          <tr><td>Services:</td><td>${products}</td></tr>
          <tr><td>Price:</td><td>${formatPrice(agreement.price)} AUD (incl. GST)</td></tr>
          <tr><td>Billing:</td><td>${billingLabel(agreement)}</td></tr>
          <tr><td>Signed:</td><td>${formatDate(agreement.signed_at)}</td></tr>
        </table>
      </div>
      <a href="${dashboardUrl}" class="btn">View in Admin Dashboard →</a>
    </div>
    <div class="footer">
      <p>NexIT Solutions Internal System — ${baseUrl?.replace('https://', '')}</p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"NexIT Solutions" <${process.env.GMAIL_USER}>`,
    to: agreement.staff_email,
    subject: `✅ Agreement Signed — ${agreement.customer_name} (${agreement.business_name})`,
    html,
  });
}

// Sent when payment is confirmed via webhook
export async function sendClientEmail(agreement: Agreement, pdfBuffer: Buffer): Promise<void> {
  const products = agreement.products.join(', ');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #2C3275; padding: 32px 40px; text-align: center; }
    .header h1 { color: #FAA63A; font-size: 24px; margin: 0 0 4px; }
    .header p { color: #a0a8d0; font-size: 13px; margin: 0; }
    .hero { background: linear-gradient(135deg, #2C3275 0%, #3D4494 100%); padding: 24px 40px; }
    .hero h2 { color: #fff; font-size: 20px; margin: 0; }
    .body { padding: 32px 40px; }
    .summary { background: #f8f9ff; border-left: 4px solid #F47B20; border-radius: 4px; padding: 20px 24px; margin: 24px 0; }
    .summary table { width: 100%; border-collapse: collapse; }
    .summary td { padding: 6px 0; font-size: 14px; color: #333; vertical-align: top; }
    .summary td:first-child { color: #666; width: 140px; font-weight: 600; }
    .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; border-radius: 20px; padding: 2px 12px; font-size: 12px; font-weight: 700; }
    .footer { background: #1A1D36; padding: 24px 40px; text-align: center; }
    .footer p { color: #6b7194; font-size: 12px; margin: 4px 0; }
    .footer a { color: #FAA63A; text-decoration: none; }
    .note { font-size: 13px; color: #666; margin-top: 24px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>NexIT Solutions</h1>
      <p>Melbourne's Digital Growth Partner</p>
    </div>
    <div class="hero">
      <h2>Payment Confirmed — You're All Set!</h2>
    </div>
    <div class="body">
      <p>Hi ${agreement.customer_name},</p>
      <p>Your payment has been successfully processed and your services are now active.</p>
      <div class="summary">
        <table>
          <tr><td>Business:</td><td>${agreement.business_name}</td></tr>
          <tr><td>Services:</td><td>${products}</td></tr>
          <tr><td>Investment:</td><td>${formatPrice(agreement.price)} AUD (incl. GST)</td></tr>
          <tr><td>Billing:</td><td>${billingLabel(agreement)}</td></tr>
          <tr><td>Status:</td><td><span class="badge">✓ Active</span></td></tr>
        </table>
      </div>
      <p class="note">If you have any questions, please reach out at <a href="mailto:hello@nexit.com.au">hello@nexit.com.au</a>.</p>
    </div>
    <div class="footer">
      <p><strong style="color:#FAA63A;">NexIT Solutions</strong></p>
      <p>Melbourne, VIC, Australia</p>
      <p><a href="mailto:hello@nexit.com.au">hello@nexit.com.au</a> &nbsp;·&nbsp; <a href="${baseUrl}">${baseUrl?.replace('https://', '')}</a></p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"NexIT Solutions" <${process.env.GMAIL_USER}>`,
    to: agreement.customer_email,
    subject: `Payment Confirmed — ${agreement.business_name}`,
    html,
    attachments: [
      {
        filename: `NexIT-Agreement-${agreement.business_name.replace(/[^a-z0-9]/gi, '-')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}

// Sent when payment is confirmed via webhook
export async function sendStaffEmail(agreement: Agreement): Promise<void> {
  const products = agreement.products.join(', ');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const dashboardUrl = `${baseUrl}/admin/dashboard/${agreement.id}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #2C3275; padding: 32px 40px; }
    .header h1 { color: #FAA63A; font-size: 22px; margin: 0 0 4px; }
    .body { padding: 32px 40px; }
    .alert { background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; }
    .alert h2 { color: #2e7d32; margin: 0 0 4px; font-size: 18px; }
    .details { background: #f8f9ff; border-radius: 8px; padding: 20px 24px; margin: 20px 0; }
    .details table { width: 100%; border-collapse: collapse; }
    .details td { padding: 8px 0; font-size: 14px; border-bottom: 1px solid #eee; vertical-align: top; }
    .details tr:last-child td { border-bottom: none; }
    .details td:first-child { color: #666; width: 160px; font-weight: 600; }
    .btn { display: inline-block; background: #F47B20; color: #fff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 700; font-size: 14px; margin-top: 16px; }
    .footer { background: #1A1D36; padding: 20px 40px; text-align: center; }
    .footer p { color: #6b7194; font-size: 12px; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>NexIT Solutions — Payment Received</h1>
    </div>
    <div class="body">
      <div class="alert">
        <h2>💰 Payment received — ${agreement.customer_name}</h2>
        <p>${agreement.business_name} is now fully active</p>
      </div>
      <div class="details">
        <table>
          <tr><td>Business:</td><td>${agreement.business_name}</td></tr>
          <tr><td>Client:</td><td>${agreement.customer_name}</td></tr>
          <tr><td>Email:</td><td>${agreement.customer_email}</td></tr>
          <tr><td>Phone:</td><td>${agreement.customer_phone}</td></tr>
          <tr><td>Services:</td><td>${products}</td></tr>
          <tr><td>Price:</td><td>${formatPrice(agreement.price)} AUD (incl. GST)</td></tr>
          <tr><td>Billing:</td><td>${billingLabel(agreement)}</td></tr>
          <tr><td>Signed:</td><td>${formatDate(agreement.signed_at)}</td></tr>
          <tr><td>Paid:</td><td>${formatDate(agreement.paid_at)}</td></tr>
        </table>
      </div>
      <a href="${dashboardUrl}" class="btn">View in Admin Dashboard →</a>
    </div>
    <div class="footer">
      <p>NexIT Solutions Internal System</p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"NexIT Solutions" <${process.env.GMAIL_USER}>`,
    to: agreement.staff_email,
    subject: `💰 Payment Received — ${agreement.customer_name} (${agreement.business_name})`,
    html,
  });
}
