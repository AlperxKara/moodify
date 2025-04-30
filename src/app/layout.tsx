import { Dancing_Script } from 'next/font/google';
import { Geist } from 'next/font/google';
import { Metadata } from 'next';
import './globals.css';
import ClientLayout from './ClientLayout';

const geistSans = Geist({
  subsets: ['latin'],
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-dancing-script',
});

export const metadata: Metadata = {
  title: 'Moodify',
  description: 'Ruh halinize göre müzik ve film önerileri',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${geistSans.className} ${dancingScript.variable} antialiased min-h-screen`}>
      <body className="bg-black">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
