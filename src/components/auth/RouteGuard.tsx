'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AppModule } from '@/services/authService';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredModule?: AppModule;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children, requiredModule }) => {
  const { user, isLoading, canAccess } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (requiredModule && !canAccess(requiredModule)) {
        router.push('/');
      }
    }
  }, [user, isLoading, requiredModule, canAccess, router]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-stone-900 text-white gap-3 font-sans">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-stone-400 font-medium tracking-wide">
          Đang xác thực thông tin tài khoản...
        </span>
      </div>
    );
  }

  if (!user || (requiredModule && !canAccess(requiredModule))) {
    return null;
  }

  return <>{children}</>;
};
