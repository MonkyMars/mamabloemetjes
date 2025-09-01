'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  verifyEmail,
  getUserById,
  getUsers,
  updateUserRole,
  adminUpdateUser,
  adminDeleteUser,
  getUserOrders,
  getOrderById,
  getOrderWithLines,
  Order,
  UserProfile,
  UserListQuery,
} from '@/lib/profile';

// Profile hooks
export const useProfile = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser: UserProfile) => {
      // Update the profile cache
      queryClient.setQueryData(['profile'], updatedUser);

      // Update auth context cache if available
      if (user) {
        queryClient.setQueryData(['auth'], { ...user, ...updatedUser });
      }
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: changePassword,
    onError: (error) => {
      console.error('Password change failed:', error);
    },
  });
};

// New account management hooks
export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: deleteAccount,
    onError: (error) => {
      console.error('Account deletion failed:', error);
    },
  });
};

export const useVerifyEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => {
      // Invalidate profile to refresh email verification status
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      console.error('Email verification failed:', error);
    },
  });
};

// Admin hooks
export const useUser = (userId: string) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId),
    enabled: isAdmin && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useUsers = (query: UserListQuery = {}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return useQuery({
    queryKey: ['users', query],
    queryFn: () => getUsers(query),
    enabled: isAdmin,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: 'user' | 'admin';
    }) => updateUserRole(userId, role),
    onSuccess: (_, { userId }) => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('User role update failed:', error);
    },
  });
};

export const useAdminUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      updates,
    }: {
      userId: string;
      updates: Parameters<typeof adminUpdateUser>[1];
    }) => adminUpdateUser(userId, updates),
    onSuccess: (updatedUser, { userId }) => {
      // Update specific user cache
      queryClient.setQueryData(['user', userId], updatedUser);
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Admin user update failed:', error);
    },
  });
};

export const useAdminDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminDeleteUser,
    onSuccess: (_, userId) => {
      // Remove user from cache
      queryClient.removeQueries({ queryKey: ['user', userId] });
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Admin user deletion failed:', error);
    },
  });
};

// Orders hooks
export const useUserOrders = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['orders'],
    queryFn: getUserOrders,
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
};

export const useOrder = (orderId: string) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId),
    enabled: isAuthenticated && !!orderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useOrderWithLines = (orderId: string) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['order', orderId, 'lines'],
    queryFn: () => getOrderWithLines(orderId),
    enabled: isAuthenticated && !!orderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Combined hook for profile management
export const useProfileManagement = () => {
  const profileQuery = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const deleteAccountMutation = useDeleteAccount();
  const verifyEmailMutation = useVerifyEmail();

  return {
    // Profile data
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,

    // Update profile
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    updateError: updateProfileMutation.error,
    updateSuccess: updateProfileMutation.isSuccess,

    // Change password
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
    passwordError: changePasswordMutation.error,
    passwordSuccess: changePasswordMutation.isSuccess,

    // Delete account
    deleteAccount: deleteAccountMutation.mutate,
    isDeletingAccount: deleteAccountMutation.isPending,
    deleteAccountError: deleteAccountMutation.error,
    deleteAccountSuccess: deleteAccountMutation.isSuccess,

    // Verify email
    verifyEmail: verifyEmailMutation.mutate,
    isVerifyingEmail: verifyEmailMutation.isPending,
    verifyEmailError: verifyEmailMutation.error,
    verifyEmailSuccess: verifyEmailMutation.isSuccess,

    // Reset functions
    resetUpdateStatus: () => updateProfileMutation.reset(),
    resetPasswordStatus: () => changePasswordMutation.reset(),
    resetDeleteAccountStatus: () => deleteAccountMutation.reset(),
    resetVerifyEmailStatus: () => verifyEmailMutation.reset(),
  };
};

// Combined hook for admin user management
export const useAdminUserManagement = () => {
  const updateUserRoleMutation = useUpdateUserRole();
  const adminUpdateUserMutation = useAdminUpdateUser();
  const adminDeleteUserMutation = useAdminDeleteUser();

  return {
    // Update user role
    updateUserRole: updateUserRoleMutation.mutate,
    isUpdatingUserRole: updateUserRoleMutation.isPending,
    updateUserRoleError: updateUserRoleMutation.error,
    updateUserRoleSuccess: updateUserRoleMutation.isSuccess,

    // Update user
    updateUser: adminUpdateUserMutation.mutate,
    isUpdatingUser: adminUpdateUserMutation.isPending,
    updateUserError: adminUpdateUserMutation.error,
    updateUserSuccess: adminUpdateUserMutation.isSuccess,

    // Delete user
    deleteUser: adminDeleteUserMutation.mutate,
    isDeletingUser: adminDeleteUserMutation.isPending,
    deleteUserError: adminDeleteUserMutation.error,
    deleteUserSuccess: adminDeleteUserMutation.isSuccess,

    // Reset functions
    resetUpdateUserRoleStatus: () => updateUserRoleMutation.reset(),
    resetUpdateUserStatus: () => adminUpdateUserMutation.reset(),
    resetDeleteUserStatus: () => adminDeleteUserMutation.reset(),
  };
};

// Combined hook for order management
export const useOrderManagement = () => {
  const ordersQuery = useUserOrders();

  const getRecentOrders = (limit: number = 5): Order[] => {
    if (!ordersQuery.data) return [];
    return ordersQuery.data
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, limit);
  };

  const getOrdersByStatus = (status: Order['status']): Order[] => {
    if (!ordersQuery.data) return [];
    return ordersQuery.data.filter((order) => order.status === status);
  };

  const getTotalSpent = (): number => {
    if (!ordersQuery.data) return 0;
    return ordersQuery.data
      .filter((order) => order.status !== 'cancelled')
      .reduce((total, order) => total + order.total_amount, 0);
  };

  const getOrderCount = (): number => {
    return ordersQuery.data?.length || 0;
  };

  return {
    // Orders data
    orders: ordersQuery.data || [],
    isLoading: ordersQuery.isLoading,
    isError: ordersQuery.isError,
    error: ordersQuery.error,

    // Utility functions
    getRecentOrders,
    getOrdersByStatus,
    getTotalSpent,
    getOrderCount,

    // Refetch
    refetch: ordersQuery.refetch,
  };
};
