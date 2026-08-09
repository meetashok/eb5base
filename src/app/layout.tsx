import type { Metadata } from 'next';
import Script from 'next/script';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Navbar from '@/components/Navbar';
import BetaBanner from '@/components/BetaBanner';
import TrustDisclaimerBar from '@/components/TrustDisclaimerBar';
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

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'EB5 Base',
  url: 'https://eb5base.com',
  email: 'hello@eb5base.com',
  description:
    'Investor-built information tools for the EB-5 community. Not legal or financial advice.',
};

export async function generateMetadata(): Promise<Metadata> {
  const publicMaintenance = isMaintenanceMode() && !hasMaintenanceBypass();
  const indexable = !publicMaintenance;

  return {
    title: {
      default: 'EB5 Base - Information for EB-5 investors',
      template: '%s | EB5 Base',
    },
    description: publicMaintenance
      ? 'EB5 Base offers information tools for EB-5 investors, including the NPRM comment guide. The project directory remains paused.'
      : 'Investor-built tools for EB-5: plain-English NPRM explainer (comments due Aug 31 2026), status update builder, and forthcoming case tracker. Not legal advice.',
    metadataBase: new URL('https://eb5base.com'),
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://eb5base.com',
      siteName: 'EB5 Base',
      title: 'EB5 Base - Information for EB-5 investors',
      description:
        'Investor-built tools for the EB-5 community: NPRM comment guide, status update, and case tracker.',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'EB5 Base - Information for EB-5 investors',
      description:
        'Investor-built tools for the EB-5 community: NPRM comment guide, status update, and case tracker.',
    },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
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
  return (
    <html lang="en" data-theme="eb5base">
      <body className={`${jakarta.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-base-100 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary focus:shadow-soft focus:outline focus:outline-2 focus:outline-secondary"
        >
          Skip to content
        </a>
        <ToastProvider>
          <AuthPromptProvider>
            <BetaBanner />
            <Navbar />
            <TrustDisclaimerBar />
            <main id="main-content" className="flex-1 page-enter" tabIndex={-1}>
              {children}
            </main>
            <Footer />
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
