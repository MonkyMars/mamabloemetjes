import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

export const metadata = {
  title: 'Mama Bloemetjes - Handcrafted Velvet Flowers',
  description:
    'Beautiful custom-made velvet flower arrangements and bouquets. Crafted with love for your special moments.',
  keywords:
    'velvet flowers, handmade bouquets, custom arrangements, flower shop, boutique flowers',
  openGraph: {
    title: 'Mama Bloemetjes - Handcrafted Velvet Flowers',
    description:
      'Beautiful custom-made velvet flower arrangements and bouquets. Crafted with love for your special moments.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mama Bloemetjes - Handcrafted Velvet Flowers',
    description:
      'Beautiful custom-made velvet flower arrangements and bouquets. Crafted with love for your special moments.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel='icon' href='/favicon.ico' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <meta name='theme-color' content='#d4a574' />
      </head>
      <body className='min-h-screen flex flex-col bg-[#faf9f7] text-[#2d2820]'>
        <Navigation />
        <main className='flex-1'>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
