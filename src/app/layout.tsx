import type { Metadata } from 'next';
import Script from 'next/script';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Navbar from '@/components/Navbar';
import BetaBanner from '@/components/BetaBanner';
import Footer from '@/components/Footer';
import AddProjectHint from '@/components/AddProjectHint';
import { AuthPromptProvider } from '@/components/AuthPromptProvider';
import { ToastProvider } from '@/components/Toast';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'EB5 Base - EB-5 Project Directory',
    template: '%s | EB5 Base',
  },
  description:
    'Community-built EB-5 project directory. Browse regional center projects, confirm subscription status, and help fellow investors stay informed.',
  metadataBase: new URL('https://eb5base.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://eb5base.com',
    siteName: 'EB5 Base',
    title: 'EB5 Base — The EB-5 Project Directory',
    description:
      'Browse regional center projects, confirm subscription status, and keep fellow investors informed. Free, community-built.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EB5 Base — The EB-5 Project Directory',
    description:
      'Browse regional center projects, confirm subscription status, and keep fellow investors informed. Free, community-built.',
  },
  robots: { index: false, follow: false },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="eb5base">
      <body className={`${jakarta.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ToastProvider>
          <AuthPromptProvider>
            <BetaBanner />
            <Navbar />
            <main className="flex-1 page-enter">{children}</main>
            <Footer />
            <AddProjectHint />
          </AuthPromptProvider>
        </ToastProvider>
        <Script
          data-goatcounter="https://eb5base.goatcounter.com/count"
          src="https://gc.zgo.at/count.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
