'use client';

import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { useUsers, useAdminUserManagement } from '@/hooks/useProfile';
import { UserProfile, UserListQuery } from '@/lib/profile';
import {
  FiUsers,
  FiEdit3,
  FiTrash2,
  FiShield,
  FiMail,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiAlertTriangle,
} from 'react-icons/fi';
import Link from 'next/link';
import { formatDate } from '@/lib/profile';

interface EditUserModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, updates: never) => void;
  isUpdating: boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
  isUpdating,
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    preposition: '',
    last_name: '',
    email: '',
    role: 'user' as 'user' | 'admin',
    email_verified: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        preposition: user.preposition || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role: user.role || 'user',
        email_verified: user.email_verified || false,
      });
    }
  }, [user]);

  const handleSave = () => {
    if (!user) return;

    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Voornaam is verplicht';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Achternaam is verplicht';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'E-mailadres is verplicht';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(user.id, formData as never);
  };

  if (!isOpen || !user) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-2xl p-6 w-full max-w-md'>
        <h2 className='text-xl font-medium text-[#2d2820] mb-6'>
          Gebruiker Bewerken
        </h2>

        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
              Voornaam
            </label>
            <input
              type='text'
              value={formData.first_name}
              onChange={(e) =>
                setFormData({ ...formData, first_name: e.target.value })
              }
              className='input-field'
              placeholder='Voornaam'
            />
            {errors.first_name && (
              <p className='mt-1 text-sm text-red-600'>{errors.first_name}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
              Tussenvoegsel
            </label>
            <input
              type='text'
              value={formData.preposition}
              onChange={(e) =>
                setFormData({ ...formData, preposition: e.target.value })
              }
              className='input-field'
              placeholder='van, de, etc.'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
              Achternaam
            </label>
            <input
              type='text'
              value={formData.last_name}
              onChange={(e) =>
                setFormData({ ...formData, last_name: e.target.value })
              }
              className='input-field'
              placeholder='Achternaam'
            />
            {errors.last_name && (
              <p className='mt-1 text-sm text-red-600'>{errors.last_name}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
              E-mailadres
            </label>
            <input
              type='email'
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className='input-field'
              placeholder='E-mailadres'
            />
            {errors.email && (
              <p className='mt-1 text-sm text-red-600'>{errors.email}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-[#7d6b55] mb-2'>
              Rol
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as 'user' | 'admin',
                })
              }
              className='input-field'
            >
              <option value='user'>Gebruiker</option>
              <option value='admin'>Administrator</option>
            </select>
          </div>

          <div className='flex items-center'>
            <input
              type='checkbox'
              id='email_verified'
              checked={formData.email_verified}
              onChange={(e) =>
                setFormData({ ...formData, email_verified: e.target.checked })
              }
              className='rounded border-[#e8e2d9] text-[#d4a574] focus:ring-[#d4a574]'
            />
            <label
              htmlFor='email_verified'
              className='ml-2 text-sm text-[#7d6b55]'
            >
              E-mailadres geverifieerd
            </label>
          </div>
        </div>

        <div className='flex space-x-3 mt-6'>
          <Button variant='primary' onClick={handleSave} loading={isUpdating}>
            Opslaan
          </Button>
          <Button variant='ghost' onClick={onClose}>
            Annuleren
          </Button>
        </div>
      </div>
    </div>
  );
};

const AdminUsersPage: React.FC = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState<UserListQuery>({
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<
    string | null
  >(null);

  const { data: usersData, isLoading, error } = useUsers(query);
  const {
    updateUser,
    isUpdatingUser,
    deleteUser,
    isDeletingUser,
    updateUserRole,
    isUpdatingUserRole,
  } = useAdminUserManagement();

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className='min-h-screen bg-[#faf9f7] flex items-center justify-center px-4'>
        <div className='text-center'>
          <FiShield className='w-16 h-16 text-[#d4a574] mx-auto mb-4' />
          <h1 className='text-2xl font-medium text-[#2d2820] mb-4'>
            Toegang Geweigerd
          </h1>
          <p className='text-[#7d6b55] mb-6'>
            Je hebt geen rechten om deze pagina te bekijken.
          </p>
          <Link href='/profile'>
            <Button variant='primary'>Terug naar Profiel</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleSaveUser = (userId: string, updates: never) => {
    updateUser(
      { userId, updates },
      {
        onSuccess: () => {
          setShowEditModal(false);
          setSelectedUser(null);
        },
      },
    );
  };

  const handleDeleteUser = (userId: string) => {
    deleteUser(userId, {
      onSuccess: () => {
        setShowDeleteConfirmation(null);
      },
    });
  };

  const handleRoleChange = (userId: string, newRole: 'user' | 'admin') => {
    updateUserRole({ userId, role: newRole });
  };

  const handlePageChange = (newPage: number) => {
    setQuery({ ...query, page: newPage });
  };

  return (
    <div className='min-h-screen bg-[#faf9f7] py-8'>
      <div className='container mx-auto px-4 max-w-7xl'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl md:text-4xl font-semibold text-[#2d2820] font-family-serif mb-2'>
                Gebruikersbeheer
              </h1>
              <p className='text-[#7d6b55]'>
                Beheer alle gebruikersaccounts en instellingen.
              </p>
            </div>
            <div className='flex items-center space-x-3'>
              <Link href='/profile'>
                <Button
                  variant='ghost'
                  leftIcon={<FiChevronLeft className='w-4 h-4' />}
                >
                  Terug naar Profiel
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className='bg-white rounded-2xl shadow-soft border border-[#e8e2d9] p-6 mb-8'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0'>
            <div className='flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3'>
              <div className='relative'>
                <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7d6b55] w-4 h-4' />
                <input
                  type='text'
                  placeholder='Zoek gebruikers...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10 input-field w-full sm:w-64'
                />
              </div>
              <select
                value={query.role || ''}
                onChange={(e) =>
                  setQuery({
                    ...query,
                    role: e.target.value as 'user' | 'admin' | undefined,
                    page: 1,
                  })
                }
                className='input-field'
              >
                <option value=''>Alle rollen</option>
                <option value='user'>Gebruiker</option>
                <option value='admin'>Administrator</option>
              </select>
            </div>
            <div className='text-sm text-[#7d6b55]'>
              {usersData?.pagination.total_count} gebruikers gevonden
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className='bg-white rounded-2xl shadow-soft border border-[#e8e2d9] overflow-hidden'>
          {isLoading ? (
            <div className='text-center py-12'>
              <div className='w-8 h-8 border-4 border-[#d4a574] border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
              <p className='text-[#7d6b55]'>Gebruikers laden...</p>
            </div>
          ) : error ? (
            <div className='text-center py-12'>
              <FiAlertTriangle className='w-16 h-16 text-red-500 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-[#2d2820] mb-2'>
                Fout bij laden
              </h3>
              <p className='text-[#7d6b55]'>
                Er is een fout opgetreden bij het laden van de gebruikers.
              </p>
            </div>
          ) : !usersData?.users.length ? (
            <div className='text-center py-12'>
              <FiUsers className='w-16 h-16 text-[#d4a574] mx-auto mb-4' />
              <h3 className='text-lg font-medium text-[#2d2820] mb-2'>
                Geen gebruikers gevonden
              </h3>
              <p className='text-[#7d6b55]'>
                Er zijn geen gebruikers die voldoen aan je zoekfilters.
              </p>
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-[#faf9f7] border-b border-[#e8e2d9]'>
                    <tr>
                      <th className='text-left py-4 px-6 text-sm font-medium text-[#7d6b55]'>
                        Gebruiker
                      </th>
                      <th className='text-left py-4 px-6 text-sm font-medium text-[#7d6b55]'>
                        E-mail Status
                      </th>
                      <th className='text-left py-4 px-6 text-sm font-medium text-[#7d6b55]'>
                        Rol
                      </th>
                      <th className='text-left py-4 px-6 text-sm font-medium text-[#7d6b55]'>
                        Lid sinds
                      </th>
                      <th className='text-right py-4 px-6 text-sm font-medium text-[#7d6b55]'>
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-[#e8e2d9]'>
                    {usersData.users.map((userData) => (
                      <tr
                        key={userData.id}
                        className='hover:bg-[#faf9f7] transition-colors'
                      >
                        <td className='py-4 px-6'>
                          <div className='flex items-center'>
                            <div className='w-10 h-10 bg-[#d4a574] rounded-full flex items-center justify-center text-white font-medium mr-3'>
                              {userData.first_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className='font-medium text-[#2d2820]'>
                                {userData.first_name}{' '}
                                {userData.preposition &&
                                  `${userData.preposition} `}
                                {userData.last_name}
                              </p>
                              <p className='text-sm text-[#7d6b55] flex items-center'>
                                <FiMail className='w-3 h-3 mr-1' />
                                {userData.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className='py-4 px-6'>
                          {userData.email_verified ? (
                            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                              <FiCheckCircle className='w-3 h-3 mr-1' />
                              Geverifieerd
                            </span>
                          ) : (
                            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                              <FiXCircle className='w-3 h-3 mr-1' />
                              Niet geverifieerd
                            </span>
                          )}
                        </td>
                        <td className='py-4 px-6'>
                          <select
                            value={userData.role}
                            onChange={(e) =>
                              handleRoleChange(
                                userData.id,
                                e.target.value as 'user' | 'admin',
                              )
                            }
                            disabled={
                              userData.id === user?.id || isUpdatingUserRole
                            }
                            className='text-sm border border-[#e8e2d9] rounded-lg px-2 py-1 bg-white'
                          >
                            <option value='user'>Gebruiker</option>
                            <option value='admin'>Administrator</option>
                          </select>
                        </td>
                        <td className='py-4 px-6'>
                          <span className='text-sm text-[#7d6b55] flex items-center'>
                            <FiCalendar className='w-3 h-3 mr-1' />
                            {formatDate(userData.created_at)}
                          </span>
                        </td>
                        <td className='py-4 px-6'>
                          <div className='flex items-center justify-end space-x-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleEditUser(userData)}
                              leftIcon={<FiEdit3 className='w-3 h-3' />}
                            >
                              Bewerken
                            </Button>
                            {userData.id !== user?.id && (
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() =>
                                  setShowDeleteConfirmation(userData.id)
                                }
                                leftIcon={<FiTrash2 className='w-3 h-3' />}
                                className='text-red-600 hover:text-red-700 hover:bg-red-50'
                              >
                                Verwijderen
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {usersData.pagination.total_pages > 1 && (
                <div className='border-t border-[#e8e2d9] px-6 py-4'>
                  <div className='flex items-center justify-between'>
                    <div className='text-sm text-[#7d6b55]'>
                      Pagina {usersData.pagination.page} van{' '}
                      {usersData.pagination.total_pages}
                    </div>
                    <div className='flex space-x-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          handlePageChange(usersData.pagination.page - 1)
                        }
                        disabled={usersData.pagination.page === 1}
                        leftIcon={<FiChevronLeft className='w-4 h-4' />}
                      >
                        Vorige
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          handlePageChange(usersData.pagination.page + 1)
                        }
                        disabled={
                          usersData.pagination.page ===
                          usersData.pagination.total_pages
                        }
                        rightIcon={<FiChevronRight className='w-4 h-4' />}
                      >
                        Volgende
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Edit User Modal */}
        <EditUserModal
          user={selectedUser}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSave={handleSaveUser}
          isUpdating={isUpdatingUser}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-2xl p-6 w-full max-w-md'>
              <div className='flex items-center mb-4'>
                <FiAlertTriangle className='w-6 h-6 text-red-500 mr-3' />
                <h2 className='text-xl font-medium text-[#2d2820]'>
                  Gebruiker Verwijderen
                </h2>
              </div>
              <p className='text-[#7d6b55] mb-6'>
                Weet je zeker dat je deze gebruiker wilt verwijderen? Deze actie
                kan niet ongedaan worden gemaakt.
              </p>
              <div className='flex space-x-3'>
                <Button
                  variant='ghost'
                  onClick={() => handleDeleteUser(showDeleteConfirmation)}
                  loading={isDeletingUser}
                  leftIcon={<FiTrash2 className='w-4 h-4' />}
                  className='text-red-600 hover:text-red-700 hover:bg-red-50'
                >
                  Ja, Verwijderen
                </Button>
                <Button
                  variant='ghost'
                  onClick={() => setShowDeleteConfirmation(null)}
                >
                  Annuleren
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
