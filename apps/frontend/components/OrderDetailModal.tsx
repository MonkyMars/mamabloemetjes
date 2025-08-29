'use client';

import React from 'react';
import { Button } from '@/components/Button';
import {
  type OrderWithLines,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatOrderStatus,
  getOrderStatusColor,
} from '@/lib/profile';
import {
  FiX,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiFileText,
  FiShoppingBag,
} from 'react-icons/fi';
import Image from 'next/image';

interface OrderDetailModalProps {
  order: OrderWithLines | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getStatusIcon = (status: OrderWithLines['status']) => {
    switch (status) {
      case 'pending':
        return <FiClock className='w-5 h-5' />;
      case 'processing':
        return <FiPackage className='w-5 h-5' />;
      case 'shipped':
        return <FiTruck className='w-5 h-5' />;
      case 'delivered':
        return <FiCheckCircle className='w-5 h-5' />;
      case 'cancelled':
        return <FiX className='w-5 h-5' />;
      default:
        return <FiClock className='w-5 h-5' />;
    }
  };

  const getStatusSteps = (currentStatus: OrderWithLines['status']) => {
    const statuses = [
      { key: 'pending', label: 'Ontvangen', icon: FiCheckCircle },
      { key: 'processing', label: 'Wordt verwerkt', icon: FiPackage },
      { key: 'shipped', label: 'Verzonden', icon: FiTruck },
      { key: 'delivered', label: 'Afgeleverd', icon: FiCheckCircle },
    ];

    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return statuses.map((status, index) => ({
      ...status,
      isActive: index <= currentIndex,
      isCurrent: status.key === currentStatus,
    }));
  };

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow-strong max-w-4xl w-full max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-[#e8e2d9]'>
          <div>
            <h2 className='text-2xl font-medium text-[#2d2820] font-family-serif'>
              {order
                ? `Bestelling #${order.order_number}`
                : 'Bestelling laden...'}
            </h2>
            {order && (
              <p className='text-[#7d6b55] mt-1'>
                Geplaatst op {formatDate(order.created_at)}
              </p>
            )}
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={onClose}
            leftIcon={<FiX className='w-5 h-5' />}
          >
            Sluiten
          </Button>
        </div>

        {/* Content */}
        <div className='overflow-y-auto max-h-[calc(90vh-200px)]'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='w-8 h-8 border-4 border-[#d4a574] border-t-transparent rounded-full animate-spin'></div>
              <p className='ml-3 text-[#7d6b55]'>Bestellingdetails laden...</p>
            </div>
          ) : order ? (
            <div className='p-6 space-y-6'>
              {/* Status and Progress */}
              <div className='bg-[#f5f2ee] rounded-xl p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-medium text-[#2d2820] font-family-serif'>
                    Bestelstatus
                  </h3>
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${getOrderStatusColor(
                      order.status,
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    {formatOrderStatus(order.status)}
                  </span>
                </div>

                {/* Progress Steps */}
                {order.status !== 'cancelled' && (
                  <div className='flex items-center justify-between'>
                    {getStatusSteps(order.status).map((step, index, array) => (
                      <div key={step.key} className='flex items-center flex-1'>
                        <div className='flex flex-col items-center'>
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                              step.isActive
                                ? 'bg-[#d4a574] border-[#d4a574] text-white'
                                : 'bg-white border-[#e8e2d9] text-[#7d6b55]'
                            }`}
                          >
                            <step.icon className='w-5 h-5' />
                          </div>
                          <span
                            className={`text-xs mt-2 text-center ${
                              step.isActive
                                ? 'text-[#2d2820] font-medium'
                                : 'text-[#7d6b55]'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                        {index < array.length - 1 && (
                          <div
                            className={`flex-1 h-0.5 mx-4 transition-colors ${
                              step.isActive ? 'bg-[#d4a574]' : 'bg-[#e8e2d9]'
                            }`}
                          ></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className='mt-4 text-sm text-[#7d6b55]'>
                  Laatst bijgewerkt: {formatDateTime(order.updated_at)}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className='text-lg font-medium text-[#2d2820] font-family-serif mb-4 flex items-center'>
                  <FiShoppingBag className='w-5 h-5 mr-2 text-[#d4a574]' />
                  Bestelde items ({order.order_lines.length})
                </h3>
                <div className='space-y-4'>
                  {order.order_lines.map((item) => (
                    <div
                      key={item.id}
                      className='flex items-center space-x-4 p-4 bg-white border border-[#e8e2d9] rounded-xl'
                    >
                      {item.product_image_url && (
                        <div className='w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#f5f2ee]'>
                          <Image
                            src={item.product_image_url}
                            alt={item.product_name}
                            className='w-full h-full object-cover'
                            width={64}
                            height={64}
                          />
                        </div>
                      )}
                      <div className='flex-1'>
                        <h4 className='font-medium text-[#2d2820]'>
                          {item.product_name}
                        </h4>
                        <div className='flex items-center space-x-4 mt-1 text-sm text-[#7d6b55]'>
                          <span>Aantal: {item.quantity}</span>
                          <span>
                            Per stuk: {formatCurrency(item.unit_price)}
                          </span>
                          {item.discount_amount > 0 && (
                            <span className='text-green-600'>
                              Korting: -{formatCurrency(item.discount_amount)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='font-medium text-[#2d2820]'>
                          {formatCurrency(item.total_price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className='bg-[#f5f2ee] rounded-xl p-6'>
                <h3 className='text-lg font-medium text-[#2d2820] font-family-serif mb-4'>
                  Overzicht
                </h3>
                <div className='space-y-3'>
                  <div className='flex justify-between text-[#7d6b55]'>
                    <span>Subtotaal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className='flex justify-between text-green-600'>
                      <span>Korting</span>
                      <span>-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}
                  <div className='flex justify-between text-[#7d6b55]'>
                    <span>Verzendkosten</span>
                    <span>
                      {order.shipping_cost > 0
                        ? formatCurrency(order.shipping_cost)
                        : 'Gratis'}
                    </span>
                  </div>
                  <div className='flex justify-between text-[#7d6b55]'>
                    <span>BTW</span>
                    <span>{formatCurrency(order.tax_amount)}</span>
                  </div>
                  <div className='border-t border-[#e8e2d9] pt-3'>
                    <div className='flex justify-between text-lg font-medium text-[#2d2820]'>
                      <span>Totaal</span>
                      <span>{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Shipping Address */}
                <div>
                  <h3 className='text-lg font-medium text-[#2d2820] font-family-serif mb-3 flex items-center'>
                    <FiMapPin className='w-5 h-5 mr-2 text-[#d4a574]' />
                    Verzendadres
                  </h3>
                  <div className='bg-white border border-[#e8e2d9] rounded-xl p-4 text-sm text-[#7d6b55]'>
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

                {/* Billing Address */}
                <div>
                  <h3 className='text-lg font-medium text-[#2d2820] font-family-serif mb-3 flex items-center'>
                    <FiFileText className='w-5 h-5 mr-2 text-[#d4a574]' />
                    Factuuradres
                  </h3>
                  <div className='bg-white border border-[#e8e2d9] rounded-xl p-4 text-sm text-[#7d6b55]'>
                    <div>
                      {order.billing_address.street}{' '}
                      {order.billing_address.house_number}
                    </div>
                    <div>
                      {order.billing_address.postal_code}{' '}
                      {order.billing_address.city}
                    </div>
                    <div>{order.billing_address.country}</div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div>
                  <h3 className='text-lg font-medium text-[#2d2820] font-family-serif mb-3 flex items-center'>
                    <FiFileText className='w-5 h-5 mr-2 text-[#d4a574]' />
                    Opmerkingen
                  </h3>
                  <div className='bg-white border border-[#e8e2d9] rounded-xl p-4 text-sm text-[#7d6b55]'>
                    {order.notes}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <FiX className='w-16 h-16 text-[#d4a574] mx-auto mb-4' />
                <h3 className='text-lg font-medium text-[#2d2820] mb-2'>
                  Bestelling niet gevonden
                </h3>
                <p className='text-[#7d6b55]'>
                  Deze bestelling kon niet worden geladen.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-end p-6 border-t border-[#e8e2d9] bg-[#faf9f7]'>
          <Button variant='primary' onClick={onClose}>
            Sluiten
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
