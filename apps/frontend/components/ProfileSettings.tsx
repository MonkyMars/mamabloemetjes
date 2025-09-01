'use client';

import React, { useState } from 'react';
import { Button } from '@/components/Button';
import {
  type UpdateProfileRequest,
  type ChangePasswordRequest,
  validateProfileUpdate,
  validatePasswordChange,
} from '@/lib/profile';
import { User } from '@/types/auth';
import {
  FiUser,
  FiMail,
  FiLock,
  FiSave,
  FiX,
  FiEdit3,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';

interface ProfileFormProps {
  user: User;
  onUpdate: (data: UpdateProfileRequest) => void;
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
}

interface PasswordChangeFormProps {
  onChangePassword: (data: ChangePasswordRequest) => void;
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
}

// Profile Information Form Component
export const ProfileForm: React.FC<ProfileFormProps> = ({
  user,
  onUpdate,
  isLoading = false,
  error = null,
  success = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    first_name: user.first_name,
    preposition: user.preposition || '',
    last_name: user.last_name,
    email: user.email,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleEdit = () => {
    setIsEditing(true);
    setFormErrors({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      first_name: user.first_name,
      preposition: user.preposition || '',
      last_name: user.last_name,
      email: user.email,
    });
    setFormErrors({});
  };

  const handleSave = () => {
    const errors = validateProfileUpdate(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onUpdate(formData);
    setIsEditing(false);
    setFormErrors({});
  };

  const handleInputChange = (field: keyof UpdateProfileRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className='bg-white rounded-2xl shadow-soft border border-[#e8e2d9] p-6'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-xl font-medium text-[#2d2820] font-family-serif flex items-center'>
          <FiUser className='w-5 h-5 mr-3 text-[#d4a574]' />
          Persoonlijke Informatie
        </h2>
        {!isEditing && (
          <Button
            variant='ghost'
            size='sm'
            onClick={handleEdit}
            leftIcon={<FiEdit3 className='w-4 h-4' />}
          >
            Bewerken
          </Button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className='mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm'>
          Profiel succesvol bijgewerkt!
        </div>
      )}
      {error && (
        <div className='mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm'>
          {error}
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* First Name */}
        <div>
          <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
            Voornaam *
          </label>
          {isEditing ? (
            <div>
              <input
                type='text'
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className={`input-field ${formErrors.first_name ? 'border-red-300 focus:border-red-500' : ''}`}
                placeholder='Voornaam'
              />
              {formErrors.first_name && (
                <p className='mt-1 text-sm text-red-600'>{formErrors.first_name}</p>
              )}
            </div>
          ) : (
            <p className='text-[#2d2820] py-2'>{user.first_name}</p>
          )}
        </div>

        {/* Preposition */}
        <div>
          <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
            Tussenvoegsel
          </label>
          {isEditing ? (
            <div>
              <input
                type='text'
                value={formData.preposition}
                onChange={(e) => handleInputChange('preposition', e.target.value)}
                className={`input-field ${formErrors.preposition ? 'border-red-300 focus:border-red-500' : ''}`}
                placeholder='van, de, etc.'
              />
              {formErrors.preposition && (
                <p className='mt-1 text-sm text-red-600'>{formErrors.preposition}</p>
              )}
            </div>
          ) : (
            <p className='text-[#2d2820] py-2'>{user.preposition || '-'}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
            Achternaam *
          </label>
          {isEditing ? (
            <div>
              <input
                type='text'
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                className={`input-field ${formErrors.last_name ? 'border-red-300 focus:border-red-500' : ''}`}
                placeholder='Achternaam'
              />
              {formErrors.last_name && (
                <p className='mt-1 text-sm text-red-600'>{formErrors.last_name}</p>
              )}
            </div>
          ) : (
            <p className='text-[#2d2820] py-2'>{user.last_name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
            E-mailadres *
          </label>
          {isEditing ? (
            <div>
              <input
                type='email'
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`input-field ${formErrors.email ? 'border-red-300 focus:border-red-500' : ''}`}
                placeholder='E-mailadres'
              />
              {formErrors.email && (
                <p className='mt-1 text-sm text-red-600'>{formErrors.email}</p>
              )}
            </div>
          ) : (
            <p className='text-[#2d2820] py-2 flex items-center'>
              <FiMail className='w-4 h-4 mr-2 text-[#7d6b55]' />
              {user.email}
            </p>
          )}
        </div>
      </div>

      {/* Edit Actions */}
      {isEditing && (
        <div className='flex flex-col sm:flex-row gap-3 pt-6 border-t border-[#e8e2d9] mt-6'>
          <Button
            variant='primary'
            onClick={handleSave}
            loading={isLoading}
            leftIcon={<FiSave className='w-4 h-4' />}
            disabled={isLoading}
          >
            Opslaan
          </Button>
          <Button
            variant='ghost'
            onClick={handleCancel}
            leftIcon={<FiX className='w-4 h-4' />}
            disabled={isLoading}
          >
            Annuleren
          </Button>
        </div>
      )}
    </div>
  );
};

// Password Change Form Component
export const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({
  onChangePassword,
  isLoading = false,
  error = null,
  success = false,
}) => {
  const [isChanging, setIsChanging] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState<ChangePasswordRequest>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleToggleChange = () => {
    setIsChanging(!isChanging);
    setFormData({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
    setFormErrors({});
    setShowPasswords({ current: false, new: false, confirm: false });
  };

  const handleSave = () => {
    const errors = validatePasswordChange(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onChangePassword(formData);
  };

  const handleInputChange = (field: keyof ChangePasswordRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className='bg-white rounded-2xl shadow-soft border border-[#e8e2d9] p-6'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-xl font-medium text-[#2d2820] font-family-serif flex items-center'>
          <FiLock className='w-5 h-5 mr-3 text-[#d4a574]' />
          Wachtwoord
        </h2>
        {!isChanging && (
          <Button
            variant='ghost'
            size='sm'
            onClick={handleToggleChange}
            leftIcon={<FiEdit3 className='w-4 h-4' />}
          >
            Wijzigen
          </Button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className='mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm'>
          Wachtwoord succesvol gewijzigd!
        </div>
      )}
      {error && (
        <div className='mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm'>
          {error}
        </div>
      )}

      {!isChanging ? (
        <p className='text-[#7d6b55]'>
          Klik op &quot;Wijzigen&quot; om je wachtwoord te veranderen.
        </p>
      ) : (
        <div className='space-y-4'>
          {/* Current Password */}
          <div>
            <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
              Huidig wachtwoord *
            </label>
            <div className='relative'>
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.current_password}
                onChange={(e) => handleInputChange('current_password', e.target.value)}
                className={`input-field pr-10 ${formErrors.current_password ? 'border-red-300 focus:border-red-500' : ''}`}
                placeholder='Voer je huidige wachtwoord in'
              />
              <button
                type='button'
                onClick={() => togglePasswordVisibility('current')}
                className='absolute inset-y-0 right-0 pr-3 flex items-center text-[#7d6b55] hover:text-[#2d2820]'
              >
                {showPasswords.current ? (
                  <FiEyeOff className='w-5 h-5' />
                ) : (
                  <FiEye className='w-5 h-5' />
                )}
              </button>
            </div>
            {formErrors.current_password && (
              <p className='mt-1 text-sm text-red-600'>{formErrors.current_password}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
              Nieuw wachtwoord *
            </label>
            <div className='relative'>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.new_password}
                onChange={(e) => handleInputChange('new_password', e.target.value)}
                className={`input-field pr-10 ${formErrors.new_password ? 'border-red-300 focus:border-red-500' : ''}`}
                placeholder='Voer je nieuwe wachtwoord in'
              />
              <button
                type='button'
                onClick={() => togglePasswordVisibility('new')}
                className='absolute inset-y-0 right-0 pr-3 flex items-center text-[#7d6b55] hover:text-[#2d2820]'
              >
                {showPasswords.new ? (
                  <FiEyeOff className='w-5 h-5' />
                ) : (
                  <FiEye className='w-5 h-5' />
                )}
              </button>
            </div>
            {formErrors.new_password && (
              <p className='mt-1 text-sm text-red-600'>{formErrors.new_password}</p>
            )}
            <div className='mt-2 text-xs text-[#7d6b55]'>
              <p>Het wachtwoord moet bevatten:</p>
              <ul className='list-disc list-inside mt-1 space-y-1'>
                <li>Minimaal 8 tekens</li>
                <li>Één hoofdletter en één kleine letter</li>
                <li>Minimaal één cijfer</li>
                <li>Minimaal één speciaal teken (!@#$%^&*()_+-=[]{}|;:,.&lt;&gt;?)</li>
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
              Bevestig nieuw wachtwoord *
            </label>
            <div className='relative'>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                className={`input-field pr-10 ${formErrors.confirm_password ? 'border-red-300 focus:border-red-500' : ''}`}
                placeholder='Bevestig je nieuwe wachtwoord'
              />
              <button
                type='button'
                onClick={() => togglePasswordVisibility('confirm')}
                className='absolute inset-y-0 right-0 pr-3 flex items-center text-[#7d6b55] hover:text-[#2d2820]'
              >
                {showPasswords.confirm ? (
                  <FiEyeOff className='w-5 h-5' />
                ) : (
                  <FiEye className='w-5 h-5' />
                )}
              </button>
            </div>
            {formErrors.confirm_password && (
              <p className='mt-1 text-sm text-red-600'>{formErrors.confirm_password}</p>
            )}
          </div>

          {/* Actions */}
          <div className='flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#e8e2d9]'>
            <Button
              variant='primary'
              onClick={handleSave}
              loading={isLoading}
              leftIcon={<FiSave className='w-4 h-4' />}
              disabled={isLoading}
            >
              Wachtwoord Wijzigen
            </Button>
            <Button
              variant='ghost'
              onClick={handleToggleChange}
              leftIcon={<FiX className='w-4 h-4' />}
              disabled={isLoading}
            >
              Annuleren
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
