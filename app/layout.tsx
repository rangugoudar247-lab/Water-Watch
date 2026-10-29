import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Water Watch Bengaluru | Smart Water Monitoring & Grievance Platform',
  description: 'Smart Water Telemetry, Early-Warning, and Citizen Grievance Management System for Bengaluru, Karnataka, India.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100">{children}</body>
    </html>
  );
}

