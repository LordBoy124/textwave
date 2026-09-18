import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TextWave',
  description: 'A simple chat app for messaging, groups, and sharing files.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
