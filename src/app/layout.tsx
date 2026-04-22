import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NexIT Solutions — Client Onboarding',
  description: 'Digital marketing service agreements for NexIT Solutions clients.',
  icons: { icon: '/nexit-logo.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
