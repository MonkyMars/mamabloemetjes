'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import {
  getProfile,
  updateProfile,
  changePassword,
  getUserOrders,
  getOrderById,
  getOrderWithLines,
  Order,
} from '@/lib/profile';
import { User } from '@/types/auth';

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
    onSuccess: (updatedUser: User) => {
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

    // Reset functions
    resetUpdateStatus: () => updateProfileMutation.reset(),
    resetPasswordStatus: () => changePasswordMutation.reset(),
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
