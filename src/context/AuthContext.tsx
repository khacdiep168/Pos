'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserAccount, UserRole } from '@/types';
import { authService, AppModule, ROLE_LABELS } from '@/services/authService';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: UserAccount | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  canAccess: (module: AppModule) => boolean;
  allowedModules: AppModule[];
  roleLabel: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage on mount (hydration safe)
  useEffect(() => {
    try {
      const current = authService.getCurrentUser();
      setUser(current);
    } catch (e) {
      console.error('Error loading current user:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
      const res = authService.login(username, password);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      }
      return { success: false, message: res.message || 'Đăng nhập không thành công' };
    },
    []
  );

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    router.push('/login');
  }, [router]);

  const canAccess = useCallback(
    (module: AppModule): boolean => {
      if (!user) return false;
      return authService.canAccessModule(user.role, module);
    },
    [user]
  );

  const allowedModules = user ? authService.getAllowedModules(user.role) : [];
  const roleLabel = user ? ROLE_LABELS[user.role] || user.role : '';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        canAccess,
        allowedModules,
        roleLabel,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
