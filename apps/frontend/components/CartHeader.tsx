import React from 'react';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { Button, buttonVariants } from '@/components/Button';
import Decimal from 'decimal.js';

type OrderSummary = {
  orderSummary: {
    subtotal: Decimal;
    tax: Decimal;
    shipping: Decimal;
    total: Decimal;
    itemCount: number;
    priceTotal: Decimal;
  };
  clearEntireCart: () => void;
  hasItems: boolean;
};

const CartHeader = ({
  orderSummary,
  clearEntireCart,
  hasItems,
}: OrderSummary) => {
  // Safely handle undefined orderSummary to prevent hydration issues
  const itemCount = orderSummary?.itemCount ?? 0;

  return (
    <div className='mb-6 sm:mb-8'>
      {/* Back Button */}
      <div className='mb-3 sm:mb-4'>
        <Link
          href='/shop'
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <FiArrowLeft />
          <span className='hidden sm:inline ml-2'>Verder Winkelen</span>
          <span className='sm:hidden ml-2'>Terug</span>
        </Link>
      </div>

      {/* Title Row - Mobile responsive */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0'>
        <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3'>
          <h1 className='text-2xl sm:text-3xl md:text-4xl text-[#2d2820] font-family-serif'>
            Winkelwagen
          </h1>
          <span className='text-xs sm:text-sm text-neutral-500'>
            ({itemCount} {itemCount === 1 ? 'artikel' : 'artikelen'})
          </span>
        </div>
        {hasItems && (
          <Button
            variant='ghost'
            size='sm'
            onClick={clearEntireCart}
            className='text-red-600 hover:text-red-700 self-start sm:self-auto text-xs sm:text-sm'
          >
            <span className='hidden sm:inline'>Wis Winkelwagen</span>
            <span className='sm:hidden'>Wis Alles</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default CartHeader;
