import React from 'react';
import type { Metadata } from 'next';
import { Providers } from './providers';
import { AppLayout } from '../src/layouts/AppLayout';
import { Inter } from 'next/font/google';
import '../src/index.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OthrHalff',
  description: 'Where anonymous meets destiny.',
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
