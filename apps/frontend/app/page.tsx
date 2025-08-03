import Image from 'next/image';
import Link from 'next/link';
import FloatingElements from '@/components/FloatingElements';
import { Button } from '@/components/Button';
import { FaArrowRight, FaQuestion } from 'react-icons/fa6';

export default function Home() {
  return (
    <main className='min-h-screen relative overflow-hidden'>
      {/* Enhanced background with multiple gradients */}
      <div className='absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5'></div>
      <div className='absolute inset-0 bg-gradient-to-tr from-transparent via-accent-peach/5 to-accent-coral/10'></div>

      {/* Subtle grid pattern overlay */}
      <div className='absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,_var(--foreground)_1px,_transparent_0)] bg-[length:24px_24px]'></div>

      <FloatingElements />

      {/* Hero Section */}
      <section className='relative z-10 py-20 px-4'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex flex-col lg:grid lg:grid-cols-2 gap-12 px-2 items-center'>
            {/* Image section - first on mobile, left on desktop */}
            <div className='relative group order-1 lg:order-none flex justify-center'>
              <div className='absolute -inset-4 bg-gradient-sunset rounded-2xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500'></div>
              <div className='relative'>
                <div className='absolute inset-0 bg-gradient-bloom rounded-xl opacity-10'></div>
                <Image
                  src='/file.jpg'
                  alt='Mama Bloemetjes Hero Image'
                  width={500}
                  height={500}
                  className='w-[25em] h-auto rounded-xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.02] glass border-2 border-glass-border'
                />
                {/* Decorative corner accents */}
                <div className='absolute -top-3 -left-3 w-6 h-6 bg-gradient-sunset rounded-full animate-pulse-subtle'></div>
                <div className='absolute -bottom-3 -right-3 w-8 h-8 bg-gradient-bloom rounded-full animate-float'></div>
              </div>
            </div>

            {/* Content section - second on mobile, right on desktop */}
            <div className='relative order-2 lg:order-none w-full flex justify-center'>
              {/* Background glow effect */}
              <div className='absolute -inset-8 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 rounded-3xl blur-3xl'></div>

              <header className='relative glass rounded-2xl p-10 border border-glass-border shadow-2xl backdrop-blur-xl max-w-lg lg:max-w-none'>
                {/* Decorative top accent */}
                <div className='absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
                  <div className='w-16 h-1 bg-gradient-sunset rounded-full'></div>
                </div>

                <div className='text-center space-y-6'>
                  <div className='space-y-4'>
                    <h1 className='text-4xl lg:text-5xl font-bold gradient-text animate-fadeInUp leading-tight'>
                      Mama Bloemetjes
                    </h1>

                    {/* Subtitle */}
                    <div className='relative'>
                      <p className='text-xl inline lg:text-2xl text-foreground/70 leading-relaxed animate-slideInRight font-light max-w-md mx-auto'>
                        Zelf gemaakte bloemen van stof en papier,
                        <span className='block text-secondary font-medium'>
                          met liefde en zorg
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Button section */}
                  <div className='pt-6'>
                    <div className='flex flex-col sm:flex-row justify-center gap-4 sm:gap-6'>
                      <Button variant='default' size='lg'>
                        <span className='relative z-10'>
                          <Link
                            href='/shop'
                            className='flex items-center gap-2'
                          >
                            Bekijk assortiment
                            <FaArrowRight className='w-4 h-4' />
                          </Link>
                        </span>
                      </Button>

                      <Button variant='primaryOutline' size='lg'>
                        <Link href='/about' className='flex items-center gap-2'>
                          Lees meer
                          <FaQuestion className='w-4 h-4' />
                        </Link>
                      </Button>
                    </div>

                    {/* Small decorative elements */}
                    <div className='flex justify-center mt-8 space-x-2'>
                      <div className='w-2 h-2 bg-primary rounded-full animate-pulse'></div>
                      <div className='w-2 h-2 bg-secondary rounded-full animate-pulse delay-100'></div>
                      <div className='w-2 h-2 bg-accent-coral rounded-full animate-pulse delay-200'></div>
                    </div>
                  </div>
                </div>

                {/* Bottom decorative accent */}
                <div className='absolute bottom-0 right-6 transform translate-y-1/2'>
                  <div className='w-12 h-12 bg-gradient-peach rounded-full opacity-20 animate-float'></div>
                </div>
              </header>
            </div>
          </div>
        </div>
      </section>

      {/* Additional decorative elements */}
      <div className='absolute top-1/4 right-10 w-20 h-20 bg-gradient-to-br from-accent-lavender/20 to-accent-rose/20 rounded-full blur-xl animate-pulse-subtle' />
      <div className='absolute bottom-1/3 left-10 w-16 h-16 bg-gradient-to-tr from-accent-sunset/20 to-accent-peach/20 rounded-full blur-lg animate-float' />
    </main>
  );
}
