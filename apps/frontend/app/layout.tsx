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
  title: 'Mama Bloemetjes - Maatwerk Bruidsbouquets & Memorial Arrangementen',
  description:
    'Ik maak handgemaakte vilt bruidsbouquets en memorial arrangementen, volledig op maat voor jullie belangrijkste momenten. Gratis consultatie.',
  keywords:
    'bruidsbouquet, wedding bouquet, memorial arrangementen, vilt bloemen, maatwerk bloemen, handgemaakte boeketten, bruiloft decoratie, condoleance bloemen, custom wedding flowers',
  openGraph: {
    title: 'Mama Bloemetjes - Maatwerk Bruidsbouquets & Memorial Arrangementen',
    description:
      'Ik maak handgemaakte vilt bruidsbouquets en memorial arrangementen, volledig op maat voor jullie belangrijkste momenten. Gratis consultatie.',
    type: 'website',
    locale: 'nl_NL',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mama Bloemetjes - Maatwerk Bruidsbouquets & Memorial Arrangementen',
    description:
      'Ik maak handgemaakte vilt bruidsbouquets en memorial arrangementen, volledig op maat voor jullie belangrijkste momenten. Gratis consultatie.',
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
