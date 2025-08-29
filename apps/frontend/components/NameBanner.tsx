interface NameBannerProps {
  Parent: 'Navigation' | 'Footer';
  className?: string;
}

const NameBanner = ({ className, Parent }: NameBannerProps) => {
  const responsiveClass =
    Parent === 'Navigation' ? 'hidden sm:block' : 'space-x-4';
  return (
    <section className={className}>
      <div className='w-12 h-12 bg-gradient-to-br from-[#d4a574] to-[#ddb7ab] rounded-full flex items-center justify-center'>
        <span className='text-white font-family-serif font-bold text-xl'>
          M
        </span>
      </div>
      <div className={responsiveClass}>
        <h2 className='text-xl font-family-serif font-bold text-[#e8c4a0]'>
          Mama Bloemetjes
        </h2>
        <p className='text-sm text-[#9a8470] -mt-1'>
          Handgemaakte Fluwelen Bloemen
        </p>
      </div>
    </section>
  );
};

export default NameBanner;
