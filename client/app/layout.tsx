import React from 'react';
import type { Metadata } from 'next';
import { Providers } from './providers';
import { AppLayout } from '../src/layouts/AppLayout';
import '../src/index.css';

const inter = { className: '' };

export const metadata: Metadata = {
  metadataBase: new URL('https://othrhalff.in'),
  title: 'OthrHalff',
  description: 'Where anonymous meets destiny.',
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
