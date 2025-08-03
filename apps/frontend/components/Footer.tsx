import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer>
      <div className='container mx-auto px-4 py-8 text-center'>
        <p className='text-sm text-gray-600'>
          &copy; {new Date().getFullYear()} Mama Bloemetjes. All rights
          reserved.
        </p>
        <p className='text-sm text-gray-500 mt-2'>
          Made with ❤️ by{' '}
          <Link
            href={'https://github.com/MonkyMars'}
            className='underline text-primary'
          >
            Levi Noppers
          </Link>
          .
        </p>
      </div>
    </footer>
  );
};

export default Footer;
