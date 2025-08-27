import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { SearchProvider } from '../context/SearchContext';
import { AuthProvider } from '../context/AuthContext';
import { PromotionProvider } from '../context/PromotionContext';
import { NotificationProvider } from '../context/NotificationContext';
import { QueryProvider } from '../providers/QueryProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'Mama Bloemetjes - Handgemaakte Vilt Bloemen',
  description:
    'Prachtige op maat gemaakte vilt bloemenarrangementen en boeketten. Gemaakt met liefde voor jouw speciale momenten.',
  keywords:
    'vilt bloemen, handgemaakte boeketten, custom arrangementen, bloemenshop, boutique bloemen',
  openGraph: {
    title: 'Mama Bloemetjes - Handgemaakte Vilt Bloemen',
    description:
      'Prachtige op maat gemaakte vilt bloemenarrangementen en boeketten. Gemaakt met liefde voor jouw speciale momenten.',
    type: 'website',
    locale: 'nl_NL',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mama Bloemetjes - Handgemaakte Vilt Bloemen',
    description:
      'Prachtige op maat gemaakte vilt bloemenarrangementen en boeketten. Gemaakt met liefde voor jouw speciale momenten.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={`${inter.variable}`}>
      <head>
        <link rel='icon' href='/favicon.ico' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <meta name='theme-color' content='#d4a574' />
      </head>
      <body className='min-h-screen flex flex-col bg-[#faf9f7] text-[#2d2820]'>
        <QueryProvider>
          <AuthProvider>
            <PromotionProvider>
              <NotificationProvider>
                <SearchProvider>
                  <Navigation />
                  <main className='flex-1'>{children}</main>
                  <Footer />
                </SearchProvider>
              </NotificationProvider>
            </PromotionProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
