import type { Metadata } from 'next';
import Script from 'next/script';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Navbar from '@/components/Navbar';
import BetaBanner from '@/components/BetaBanner';
import Footer from '@/components/Footer';
import { AuthPromptProvider } from '@/components/AuthPromptProvider';
import { ToastProvider } from '@/components/Toast';
import { hasMaintenanceBypass, isMaintenanceMode } from '@/lib/maintenance';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const publicMaintenance = isMaintenanceMode() && !hasMaintenanceBypass();

  return {
    title: {
      default: publicMaintenance
        ? 'EB5 Base - Temporarily unavailable'
        : 'EB5 Base - EB-5 Case Status Tracker',
      template: '%s | EB5 Base',
    },
    description: publicMaintenance
      ? 'EB5 Base is temporarily unavailable while we review legal and compliance questions.'
      : 'Track your EB-5 USCIS cases with encrypted receipt storage, status notifications, and community insights.',
    metadataBase: new URL('https://eb5base.com'),
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://eb5base.com',
      siteName: 'EB5 Base',
      title: publicMaintenance
        ? 'EB5 Base - Temporarily unavailable'
        : 'EB5 Base - EB-5 Case Status Tracker',
      description: publicMaintenance
        ? 'EB5 Base is temporarily unavailable while we review legal and compliance questions.'
        : 'Encrypted receipt tracking, email alerts on status changes, and anonymized cohort insights for EB-5 investors.',
    },
    twitter: {
      card: 'summary_large_image',
      title: publicMaintenance
        ? 'EB5 Base - Temporarily unavailable'
        : 'EB5 Base - EB-5 Case Status Tracker',
      description: publicMaintenance
        ? 'EB5 Base is temporarily unavailable while we review legal and compliance questions.'
        : 'Encrypted receipt tracking, email alerts on status changes, and anonymized cohort insights for EB-5 investors.',
    },
    robots: { index: false, follow: false },
    icons: {
      icon: '/logo.png',
      apple: '/logo.png',
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const showPublicMaintenanceShell = isMaintenanceMode() && !hasMaintenanceBypass();

  return (
    <html lang="en" data-theme="eb5base">
      <body className={`${jakarta.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ToastProvider>
          <AuthPromptProvider>
            {showPublicMaintenanceShell ? (
              <main className="flex-1">{children}</main>
            ) : (
              <>
                <BetaBanner />
                <Navbar />
                <main className="flex-1 page-enter">{children}</main>
                <Footer />
              </>
            )}
          </AuthPromptProvider>
        </ToastProvider>
        {!showPublicMaintenanceShell && (
          <Script
            data-goatcounter="https://eb5base.goatcounter.com/count"
            src="https://gc.zgo.at/count.js"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
