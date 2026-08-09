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
        ? 'EB5 Base - Information for EB-5 investors'
        : 'EB5 Base - Information for EB-5 investors',
      template: '%s | EB5 Base',
    },
    description: publicMaintenance
      ? 'EB5 Base offers information tools for EB-5 investors, including the NPRM comment guide. The project directory remains paused.'
      : 'Information tools for the EB-5 community: case tracker (coming soon) and NPRM comment guide. Not legal advice.',
    metadataBase: new URL('https://eb5base.com'),
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://eb5base.com',
      siteName: 'EB5 Base',
      title: 'EB5 Base - Information for EB-5 investors',
      description:
        'Information tools for the EB-5 community: case tracker (coming soon) and NPRM comment guide.',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'EB5 Base - Information for EB-5 investors',
      description:
        'Information tools for the EB-5 community: case tracker (coming soon) and NPRM comment guide.',
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
  return (
    <html lang="en" data-theme="eb5base">
      <body className={`${jakarta.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ToastProvider>
          <AuthPromptProvider>
            <BetaBanner />
            <Navbar />
            <main className="flex-1 page-enter">{children}</main>
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
