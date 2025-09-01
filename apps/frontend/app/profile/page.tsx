'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { useProfileManagement, useOrderManagement } from '@/hooks/useProfile';
import {
  type UpdateProfileRequest,
  type ChangePasswordRequest,
  validateProfileUpdate,
  validatePasswordChange,
  formatCurrency,
  formatDate,
  formatOrderStatus,
  getOrderStatusColor,
} from '@/lib/profile';
import {
  FiUser,
  FiUsers,
  FiSettings,
  FiShoppingBag,
  FiEdit3,
  FiSave,
  FiX,
  FiEye,
  FiLogOut,
  FiMail,
  FiLock,
  FiCalendar,
  FiCheckCircle,
  FiHeart,
  FiAlertTriangle,
  FiTrash2,
  FiShield,
  FiXCircle,
} from 'react-icons/fi';

type ActiveTab = 'profile' | 'orders' | 'settings';

const ProfilePage: React.FC = () => {
  const { logout, isAuthenticated, isLoading } = useAuth();
  const {
    profile,
    isLoading: profileLoading,
    updateProfile,
    isUpdating,
    updateSuccess,
    changePassword,
    isChangingPassword: isChangingPasswordHook,
    passwordSuccess,
    deleteAccount,
    isDeletingAccount,
    deleteAccountSuccess,
    verifyEmail,
    isVerifyingEmail,
    verifyEmailSuccess,
    resetUpdateStatus,
    resetPasswordStatus,
    resetDeleteAccountStatus,
    resetVerifyEmailStatus,
  } = useProfileManagement();

  const {
    orders,
    isLoading: ordersLoading,
    getRecentOrders,
    getTotalSpent,
    getOrderCount,
  } = useOrderManagement();

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPasswordState, setIsChangingPasswordState] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Form states - initialize with profile data if available
  const [profileForm, setProfileForm] = useState<UpdateProfileRequest>(() => {
    if (profile) {
      return {
        first_name: profile.first_name || '',
        preposition: profile.preposition || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
      };
    }
    return {
      first_name: '',
      preposition: '',
      last_name: '',
      email: '',
    };
  });

  const [passwordForm, setPasswordForm] = useState<ChangePasswordRequest>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Initialize form when profile loads
  React.useEffect(() => {
    if (profile) {
      const newFormData = {
        first_name: profile.first_name || '',
        preposition: profile.preposition || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
      };
      setProfileForm(newFormData);
    }
  }, [profile, profileLoading, isAuthenticated]);

  // Handle successful account deletion
  React.useEffect(() => {
    if (deleteAccountSuccess) {
      logout();
    }
  }, [deleteAccountSuccess, logout]);

  // Handle tab changes
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    resetUpdateStatus();
    resetPasswordStatus();
    resetDeleteAccountStatus();
    resetVerifyEmailStatus();
    setIsEditingProfile(false);
    setIsChangingPasswordState(false);
    setShowDeleteConfirmation(false);
    setFormErrors({});
  };

  // Profile update handlers
  const handleProfileEdit = () => {
    if (profile) {
      const formData = {
        first_name: profile.first_name || '',
        preposition: profile.preposition || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
      };
      setProfileForm(formData);
    }
    setIsEditingProfile(true);
    resetUpdateStatus();
    setFormErrors({});
  };

  const handleProfileCancel = () => {
    setIsEditingProfile(false);
    if (profile) {
      setProfileForm({
        first_name: profile.first_name || '',
        preposition: profile.preposition || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
      });
    }
    setFormErrors({});
  };

  const handleProfileSave = () => {
    const errors = validateProfileUpdate(profileForm);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    updateProfile(profileForm, {
      onSuccess: () => {
        setIsEditingProfile(false);
        setFormErrors({});
      },
      onError: (error) => {
        setFormErrors({ general: error.message });
      },
    });
  };

  // Password change handlers
  const handlePasswordChangeToggle = () => {
    setIsChangingPasswordState(!isChangingPasswordState);
    setPasswordForm({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
    setFormErrors({});
    resetPasswordStatus();
  };

  const handlePasswordSave = () => {
    const errors = validatePasswordChange(passwordForm);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    changePassword(passwordForm, {
      onSuccess: () => {
        setIsChangingPasswordState(false);
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
        setFormErrors({});
      },
      onError: (error) => {
        setFormErrors({ general: error.message });
      },
    });
  };

  // Email verification handler
  const handleVerifyEmail = () => {
    verifyEmail(undefined, {
      onSuccess: () => {
        resetVerifyEmailStatus();
      },
      onError: (error) => {
        setFormErrors({ general: error.message });
      },
    });
  };

  // Account deletion handlers
  const handleDeleteAccount = () => {
    deleteAccount(undefined, {
      onSuccess: () => {
        // The useEffect will handle logout
      },
      onError: (error) => {
        setFormErrors({ general: error.message });
        setShowDeleteConfirmation(false);
      },
    });
  };

  // Redirect if not authenticated
  if (!isAuthenticated && !isLoading) {
    return (
      <div className='min-h-screen bg-[#faf9f7] flex items-center justify-center px-4'>
        <div className='text-center'>
          <FiUser className='w-16 h-16 text-[#d4a574] mx-auto mb-4' />
          <h1 className='text-2xl font-medium text-[#2d2820] mb-4'>
            Inloggen vereist
          </h1>
          <p className='text-[#7d6b55] mb-6'>
            Je moet ingelogd zijn om je profiel te bekijken.
          </p>
          <Link href='/login'>
            <Button variant='primary'>Inloggen</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show loading state while fetching profile
  if (profileLoading || !profile) {
    return (
      <div className='min-h-screen bg-[#faf9f7] flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-[#d4a574] border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-[#7d6b55]'>Profiel laden...</p>
        </div>
      </div>
    );
  }

  const recentOrders = getRecentOrders(3);

  return (
    <div className='min-h-screen bg-[#faf9f7] py-8'>
      <div className='container mx-auto px-4 max-w-7xl'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl md:text-4xl font-semibold text-[#2d2820] font-family-serif mb-2'>
            Mijn Account
          </h1>
          <p className='text-[#7d6b55]'>
            Beheer je profiel, bekijk je bestellingen en pas je instellingen
            aan.
          </p>
        </div>

        {/* Email Verification Banner */}
        {profile.email_verified === false && (
          <div className='mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <FiAlertTriangle className='w-5 h-5 text-yellow-600 mr-3' />
                <div>
                  <h3 className='text-sm font-medium text-yellow-800'>
                    E-mailadres niet geverifieerd
                  </h3>
                  <p className='text-sm text-yellow-700'>
                    Verifieer je e-mailadres om alle functies te kunnen
                    gebruiken.
                  </p>
                </div>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleVerifyEmail}
                loading={isVerifyingEmail}
                className='text-yellow-700 hover:text-yellow-800'
              >
                Verifiëren
              </Button>
            </div>
          </div>
        )}

        {/* Success Messages */}
        {verifyEmailSuccess && (
          <div className='mb-8 bg-green-50 border border-green-200 rounded-xl p-4'>
            <div className='flex items-center'>
              <FiCheckCircle className='w-5 h-5 text-green-600 mr-3' />
              <p className='text-sm text-green-800'>
                Verificatie-e-mail verzonden! Controleer je inbox.
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className='mb-8'>
          <div className='border-b border-[#e8e2d9]'>
            <nav className='flex space-x-8'>
              {[
                { id: 'profile', label: 'Profiel', icon: FiUser },
                { id: 'orders', label: 'Bestellingen', icon: FiShoppingBag },
                { id: 'settings', label: 'Instellingen', icon: FiSettings },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleTabChange(id as ActiveTab)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2 ${
                    activeTab === id
                      ? 'border-[#d4a574] text-[#d4a574]'
                      : 'border-transparent text-[#7d6b55] hover:text-[#2d2820] hover:border-[#e8e2d9]'
                  }`}
                >
                  <Icon className='w-4 h-4' />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Content */}
          <div className='lg:col-span-2'>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className='space-y-6'>
                {/* Profile Information Card */}
                <div className='bg-white rounded-2xl shadow-soft border border-[#e8e2d9] p-6'>
                  <div className='flex items-center justify-between mb-6'>
                    <h2 className='text-xl font-medium text-[#2d2820] font-family-serif'>
                      Persoonlijke Informatie
                    </h2>
                    {!isEditingProfile && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={handleProfileEdit}
                        leftIcon={<FiEdit3 className='w-4 h-4' />}
                      >
                        Bewerken
                      </Button>
                    )}
                  </div>

                  {/* Success/Error Messages */}
                  {updateSuccess && (
                    <div className='mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm'>
                      Profiel succesvol bijgewerkt!
                    </div>
                  )}
                  {formErrors.general && (
                    <div className='mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm'>
                      {formErrors.general}
                    </div>
                  )}

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {/* First Name */}
                    <div>
                      <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
                        Voornaam
                      </label>
                      {isEditingProfile ? (
                        <div>
                          <input
                            type='text'
                            value={profileForm.first_name}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                first_name: e.target.value,
                              })
                            }
                            className='input-field'
                            placeholder='Voornaam'
                          />
                          {formErrors.first_name && (
                            <p className='mt-1 text-sm text-red-600'>
                              {formErrors.first_name}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className='text-[#2d2820]'>{profile?.first_name}</p>
                      )}
                    </div>

                    {/* Preposition */}
                    <div>
                      <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
                        Tussenvoegsel
                      </label>
                      {isEditingProfile ? (
                        <div>
                          <input
                            type='text'
                            value={profileForm.preposition}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                preposition: e.target.value,
                              })
                            }
                            className='input-field'
                            placeholder='van, de, etc.'
                          />
                          {formErrors.preposition && (
                            <p className='mt-1 text-sm text-red-600'>
                              {formErrors.preposition}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className='text-[#2d2820]'>
                          {profile?.preposition || '-'}
                        </p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
                        Achternaam
                      </label>
                      {isEditingProfile ? (
                        <div>
                          <input
                            type='text'
                            value={profileForm.last_name}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                last_name: e.target.value,
                              })
                            }
                            className='input-field'
                            placeholder='Achternaam'
                          />
                          {formErrors.last_name && (
                            <p className='mt-1 text-sm text-red-600'>
                              {formErrors.last_name}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className='text-[#2d2820]'>{profile?.last_name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
                        E-mailadres
                      </label>
                      {isEditingProfile ? (
                        <div>
                          <input
                            type='email'
                            value={profileForm.email}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                email: e.target.value,
                              })
                            }
                            className='input-field'
                            placeholder='E-mailadres'
                          />
                          {formErrors.email && (
                            <p className='mt-1 text-sm text-red-600'>
                              {formErrors.email}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className='flex items-center justify-between'>
                          <p className='text-[#2d2820] flex items-center'>
                            <FiMail className='w-4 h-4 mr-2 text-[#7d6b55]' />
                            {profile?.email}
                          </p>
                          {profile.email_verified === true ? (
                            <FiCheckCircle
                              className='w-4 h-4 text-green-500'
                              title='Geverifieerd'
                            />
                          ) : (
                            <FiXCircle
                              className='w-4 h-4 text-red-500'
                              title='Niet geverifieerd'
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit Actions */}
                  {isEditingProfile && (
                    <div className='flex space-x-3 pt-6 border-t border-[#e8e2d9] mt-6'>
                      <Button
                        variant='primary'
                        onClick={handleProfileSave}
                        loading={isUpdating}
                        leftIcon={<FiSave className='w-4 h-4' />}
                      >
                        Opslaan
                      </Button>
                      <Button
                        variant='ghost'
                        onClick={handleProfileCancel}
                        leftIcon={<FiX className='w-4 h-4' />}
                      >
                        Annuleren
                      </Button>
                    </div>
                  )}
                </div>

                {/* Account Details */}
                <div className='bg-white rounded-2xl shadow-soft border border-[#e8e2d9] p-6'>
                  <h2 className='text-xl font-medium text-[#2d2820] font-family-serif mb-6'>
                    Account Details
                  </h2>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between py-3 border-b border-[#e8e2d9]'>
                      <div className='flex items-center'>
                        <FiCalendar className='w-4 h-4 text-[#7d6b55] mr-3' />
                        <span className='text-[#7d6b55]'>Lid sinds</span>
                      </div>
                      <span className='text-[#2d2820]'>
                        {profile?.created_at
                          ? formatDate(profile.created_at)
                          : '-'}
                      </span>
                    </div>
                    <div className='flex items-center justify-between py-3 border-b border-[#e8e2d9]'>
                      <div className='flex items-center'>
                        <FiShoppingBag className='w-4 h-4 text-[#7d6b55] mr-3' />
                        <span className='text-[#7d6b55]'>
                          Totaal bestellingen
                        </span>
                      </div>
                      <span className='text-[#2d2820]'>{getOrderCount()}</span>
                    </div>
                    <div className='flex items-center justify-between py-3 border-b border-[#e8e2d9]'>
                      <div className='flex items-center'>
                        <FiShield className='w-4 h-4 text-[#7d6b55] mr-3' />
                        <span className='text-[#7d6b55]'>Account rol</span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          profile.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {profile.role === 'admin'
                          ? 'Administrator'
                          : 'Gebruiker'}
                      </span>
                    </div>
                    <div className='flex items-center justify-between py-3'>
                      <div className='flex items-center'>
                        <FiHeart className='w-4 h-4 text-[#7d6b55] mr-3' />
                        <span className='text-[#7d6b55]'>
                          Totaal uitgegeven
                        </span>
                      </div>
                      <span className='text-[#2d2820] font-medium'>
                        {formatCurrency(getTotalSpent())}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className='space-y-6'>
                <div className='bg-white rounded-2xl shadow-soft border border-[#e8e2d9] p-6'>
                  <h2 className='text-xl font-medium text-[#2d2820] font-family-serif mb-6'>
                    Mijn Bestellingen
                  </h2>

                  {ordersLoading ? (
                    <div className='text-center py-8'>
                      <div className='w-8 h-8 border-4 border-[#d4a574] border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
                      <p className='text-[#7d6b55]'>Bestellingen laden...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className='text-center py-12'>
                      <FiShoppingBag className='w-16 h-16 text-[#d4a574] mx-auto mb-4' />
                      <h3 className='text-lg font-medium text-[#2d2820] mb-2'>
                        Nog geen bestellingen
                      </h3>
                      <p className='text-[#7d6b55] mb-6'>
                        Ontdek onze prachtige collectie vilt bloemen!
                      </p>
                      <Link href='/shop'>
                        <Button variant='primary'>Begin met Winkelen</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className='border border-[#e8e2d9] rounded-xl p-4 hover:shadow-soft transition-shadow'
                        >
                          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
                            <div className='flex-1'>
                              <div className='flex items-center space-x-3 mb-2'>
                                <h3 className='font-medium text-[#2d2820]'>
                                  Bestelling #{order.order_number}
                                </h3>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(
                                    order.status,
                                  )}`}
                                >
                                  {formatOrderStatus(order.status)}
                                </span>
                              </div>
                              <div className='flex items-center space-x-4 text-sm text-[#7d6b55]'>
                                <span>{formatDate(order.created_at)}</span>
                                <span>
                                  {formatCurrency(order.total_amount)}
                                </span>
                              </div>
                            </div>
                            <div className='mt-3 sm:mt-0'>
                              <Button
                                variant='ghost'
                                size='sm'
                                rightIcon={<FiEye className='w-4 h-4' />}
                              >
                                Bekijken
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className='space-y-6'>
                {/* Password Change */}
                <div className='bg-white rounded-2xl shadow-soft border border-[#e8e2d9] p-6'>
                  <div className='flex items-center justify-between mb-6'>
                    <h2 className='text-xl font-medium text-[#2d2820] font-family-serif'>
                      Wachtwoord Wijzigen
                    </h2>
                    {!isChangingPasswordState && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={handlePasswordChangeToggle}
                        leftIcon={<FiLock className='w-4 h-4' />}
                      >
                        Wijzigen
                      </Button>
                    )}
                  </div>

                  {passwordSuccess && (
                    <div className='mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm'>
                      Wachtwoord succesvol gewijzigd!
                    </div>
                  )}

                  {isChangingPasswordState && (
                    <div className='space-y-4'>
                      {formErrors.general && (
                        <div className='p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm'>
                          {formErrors.general}
                        </div>
                      )}

                      <div>
                        <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
                          Huidig Wachtwoord
                        </label>
                        <input
                          type='password'
                          value={passwordForm.current_password}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              current_password: e.target.value,
                            })
                          }
                          className='input-field'
                          placeholder='Voer je huidige wachtwoord in'
                        />
                        {formErrors.current_password && (
                          <p className='mt-1 text-sm text-red-600'>
                            {formErrors.current_password}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
                          Nieuw Wachtwoord
                        </label>
                        <input
                          type='password'
                          value={passwordForm.new_password}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              new_password: e.target.value,
                            })
                          }
                          className='input-field'
                          placeholder='Voer je nieuwe wachtwoord in'
                        />
                        {formErrors.new_password && (
                          <p className='mt-1 text-sm text-red-600'>
                            {formErrors.new_password}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
                          Bevestig Nieuw Wachtwoord
                        </label>
                        <input
                          type='password'
                          value={passwordForm.confirm_password}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              confirm_password: e.target.value,
                            })
                          }
                          className='input-field'
                          placeholder='Bevestig je nieuwe wachtwoord'
                        />
                        {formErrors.confirm_password && (
                          <p className='mt-1 text-sm text-red-600'>
                            {formErrors.confirm_password}
                          </p>
                        )}
                      </div>

                      <div className='flex space-x-3 pt-4'>
                        <Button
                          variant='primary'
                          onClick={handlePasswordSave}
                          loading={isChangingPasswordHook}
                          leftIcon={<FiSave className='w-4 h-4' />}
                        >
                          Wachtwoord Opslaan
                        </Button>
                        <Button
                          variant='ghost'
                          onClick={handlePasswordChangeToggle}
                          leftIcon={<FiX className='w-4 h-4' />}
                        >
                          Annuleren
                        </Button>
                      </div>
                    </div>
                  )}

                  {!isChangingPasswordState && (
                    <p className='text-[#7d6b55] text-sm'>
                      Klik op &qout;Wijzigen&qout; om je wachtwoord te
                      veranderen. Zorg ervoor dat je nieuwe wachtwoord veilig
                      is.
                    </p>
                  )}
                </div>

                {/* Account Deletion */}
                <div className='bg-white rounded-2xl shadow-soft border border-red-200 p-6'>
                  <div className='flex items-center mb-4'>
                    <FiAlertTriangle className='w-5 h-5 text-red-500 mr-3' />
                    <h2 className='text-xl font-medium text-red-700 font-family-serif'>
                      Account Verwijderen
                    </h2>
                  </div>

                  <p className='text-[#7d6b55] text-sm mb-6'>
                    Het verwijderen van je account is permanent en kan niet
                    ongedaan worden gemaakt. Al je gegevens, bestellingen en
                    voorkeuren worden definitief verwijderd.
                  </p>

                  {!showDeleteConfirmation ? (
                    <Button
                      variant='ghost'
                      onClick={() => setShowDeleteConfirmation(true)}
                      leftIcon={<FiTrash2 className='w-4 h-4' />}
                      className='text-red-600 hover:text-red-700 hover:bg-red-50'
                    >
                      Account Verwijderen
                    </Button>
                  ) : (
                    <div className='space-y-4'>
                      <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
                        <h3 className='font-medium text-red-800 mb-2'>
                          Weet je het zeker?
                        </h3>
                        <p className='text-red-700 text-sm mb-4'>
                          Deze actie kan niet ongedaan worden gemaakt. Je
                          account en alle gegevens worden permanent verwijderd.
                        </p>
                        <div className='flex space-x-3'>
                          <Button
                            variant='ghost'
                            onClick={handleDeleteAccount}
                            loading={isDeletingAccount}
                            leftIcon={<FiTrash2 className='w-4 h-4' />}
                            className='text-red-600 hover:text-red-700 hover:bg-red-100'
                          >
                            Ja, Verwijder Account
                          </Button>
                          <Button
                            variant='ghost'
                            onClick={() => setShowDeleteConfirmation(false)}
                            leftIcon={<FiX className='w-4 h-4' />}
                          >
                            Annuleren
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Quick Actions */}
            <div className='bg-white rounded-2xl shadow-soft border border-[#e8e2d9] p-6'>
              <h3 className='text-lg font-medium text-[#2d2820] font-family-serif mb-4'>
                Snelle Acties
              </h3>
              <div className='space-y-3'>
                {profile.role === 'admin' && (
                  <Link href='/admin/users' className='block'>
                    <Button
                      variant='ghost'
                      className='w-full justify-start'
                      leftIcon={<FiUsers className='w-4 h-4' />}
                    >
                      Gebruikersbeheer
                    </Button>
                  </Link>
                )}
                <Link href='/shop' className='block'>
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    leftIcon={<FiShoppingBag className='w-4 h-4' />}
                  >
                    Verder Winkelen
                  </Button>
                </Link>
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={logout}
                  leftIcon={<FiLogOut className='w-4 h-4' />}
                >
                  Uitloggen
                </Button>
              </div>
            </div>

            {/* Recent Orders */}
            {recentOrders.length > 0 && (
              <div className='bg-white rounded-2xl shadow-soft border border-[#e8e2d9] p-6'>
                <h3 className='text-lg font-medium text-[#2d2820] font-family-serif mb-4'>
                  Recente Bestellingen
                </h3>
                <div className='space-y-3'>
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className='border border-[#e8e2d9] rounded-lg p-3'
                    >
                      <div className='flex items-center justify-between mb-1'>
                        <span className='text-sm font-medium text-[#2d2820]'>
                          #{order.order_number}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(
                            order.status,
                          )}`}
                        >
                          {formatOrderStatus(order.status)}
                        </span>
                      </div>
                      <div className='flex items-center justify-between text-sm text-[#7d6b55]'>
                        <span>{formatDate(order.created_at)}</span>
                        <span>{formatCurrency(order.total_amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  className='w-full mt-4'
                  onClick={() => setActiveTab('orders')}
                >
                  Alle Bestellingen
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
