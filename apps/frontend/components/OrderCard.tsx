'use client';

import React from 'react';
import { Button } from '@/components/Button';
import {
  type Order,
  formatCurrency,
  formatDate,
  formatOrderStatus,
  getOrderStatusColor,
} from '@/lib/profile';
import {
  FiEye,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiX,
} from 'react-icons/fi';

interface OrderCardProps {
  order: Order;
  showDetails?: boolean;
  className?: string;
  onViewDetails?: (orderId: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  showDetails = false,
  className = '',
  onViewDetails,
}) => {
  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <FiClock className='w-4 h-4' />;
      case 'processing':
        return <FiPackage className='w-4 h-4' />;
      case 'shipped':
        return <FiTruck className='w-4 h-4' />;
      case 'delivered':
        return <FiCheckCircle className='w-4 h-4' />;
      case 'cancelled':
        return <FiX className='w-4 h-4' />;
      default:
        return <FiClock className='w-4 h-4' />;
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(order.id);
    }
  };

  return (
    <div
      className={`bg-white border border-[#e8e2d9] rounded-xl p-4 sm:p-6 hover:shadow-soft transition-all duration-300 ${className}`}
    >
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4'>
        <div className='flex-1'>
          <div className='flex items-center gap-3 mb-2'>
            <h3 className='text-lg font-medium text-[#2d2820] font-family-serif'>
              Bestelling #{order.order_number}
            </h3>
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(
                order.status,
              )}`}
            >
              {getStatusIcon(order.status)}
              {formatOrderStatus(order.status)}
            </span>
          </div>

          <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-[#7d6b55]'>
            <span>{formatDate(order.created_at)}</span>
            <span className='hidden sm:inline'>•</span>
            <span className='font-medium text-[#2d2820]'>
              {formatCurrency(order.total_amount)}
            </span>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {onViewDetails && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleViewDetails}
              rightIcon={<FiEye className='w-4 h-4' />}
            >
              Details
            </Button>
          )}
        </div>
      </div>

      {/* Order Summary */}
      {showDetails && (
        <div className='border-t border-[#e8e2d9] pt-4'>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm'>
            <div>
              <span className='text-[#7d6b55] block'>Subtotaal</span>
              <span className='text-[#2d2820] font-medium'>
                {formatCurrency(order.subtotal)}
              </span>
            </div>

            {order.discount_amount > 0 && (
              <div>
                <span className='text-[#7d6b55] block'>Korting</span>
                <span className='text-green-600 font-medium'>
                  -{formatCurrency(order.discount_amount)}
                </span>
              </div>
            )}

            <div>
              <span className='text-[#7d6b55] block'>Verzending</span>
              <span className='text-[#2d2820] font-medium'>
                {order.shipping_cost > 0
                  ? formatCurrency(order.shipping_cost)
                  : 'Gratis'}
              </span>
            </div>

            <div>
              <span className='text-[#7d6b55] block'>BTW</span>
              <span className='text-[#2d2820] font-medium'>
                {formatCurrency(order.tax_amount)}
              </span>
            </div>
          </div>

          {/* Addresses */}
          {order.shipping_address && (
            <div className='mt-4 pt-4 border-t border-[#e8e2d9]'>
              <h4 className='text-sm font-medium text-[#2d2820] mb-2'>
                Verzendadres
              </h4>
              <div className='text-sm text-[#7d6b55]'>
                <div>
                  {order.shipping_address.street}{' '}
                  {order.shipping_address.house_number}
                </div>
                <div>
                  {order.shipping_address.postal_code}{' '}
                  {order.shipping_address.city}
                </div>
                <div>{order.shipping_address.country}</div>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className='mt-4 pt-4 border-t border-[#e8e2d9]'>
              <h4 className='text-sm font-medium text-[#2d2820] mb-2'>
                Opmerkingen
              </h4>
              <p className='text-sm text-[#7d6b55]'>{order.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
