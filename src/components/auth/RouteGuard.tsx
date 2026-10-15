'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AppModule, MODULE_LABELS } from '@/services/authService';
import { ShieldAlert, ArrowLeft, LogOut, Lock, User, AlertTriangle } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredModule?: AppModule;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children, requiredModule }) => {
  const { user, isLoading, canAccess, allowedModules, roleLabel, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Loading State
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-stone-950 text-white gap-3 font-sans">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-stone-400 font-medium tracking-wide">
          Đang xác thực thông tin tài khoản...
        </span>
      </div>
    );
  }

  // Unauthenticated State (Middleware will redirect, but fallback gracefully)
  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-stone-950 text-white gap-3 font-sans">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-stone-400 font-medium tracking-wide">
          Chưa đăng nhập. Đang chuyển hướng tới trang Đăng nhập...
        </span>
      </div>
    );
  }

  // Access Denied State (403 Forbidden - Role unauthorized for this module)
  if (requiredModule && !canAccess(requiredModule)) {
    const targetModuleInfo = MODULE_LABELS[requiredModule] || {
      name: requiredModule.toUpperCase(),
      description: 'Phân hệ chức năng bị giới hạn quyền truy cập.',
    };

    return (
      <div className="min-h-screen w-screen bg-stone-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden select-none">
        {/* Background Ambient Security Aura */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="w-full max-w-lg bg-stone-900/90 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6 animate-fade-in">
          {/* Header Banner */}
          <div className="flex items-center gap-4 border-b border-stone-800 pb-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0 shadow-lg shadow-rose-500/10">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-wider mb-1">
                <Lock className="w-3 h-3" />
                <span>403 Forbidden • Access Denied</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Không Đủ Quyền Hạn Truy Cập
              </h1>
              <p className="text-xs text-stone-400 mt-0.5">
                Tài khoản của bạn không được phân quyền để vào phân hệ này.
              </p>
            </div>
          </div>

          {/* User Role & Permission Card */}
          <div className="space-y-3 bg-stone-950/60 border border-stone-800/80 rounded-2xl p-4 text-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-stone-800/60">
              <span className="text-stone-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-stone-500" />
                <span>Tài khoản hiện tại:</span>
              </span>
              <span className="font-bold text-white">
                {user.full_name} <span className="text-stone-400 font-mono text-[11px]">(@{user.username})</span>
              </span>
            </div>

            <div className="flex items-center justify-between pb-2.5 border-b border-stone-800/60">
              <span className="text-stone-400">Vai trò trong hệ thống:</span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-[11px]">
                {roleLabel}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2.5 border-b border-stone-800/60">
              <span className="text-stone-400">Phân hệ đang yêu cầu:</span>
              <span className="font-bold text-rose-400 text-right">
                {targetModuleInfo.name}
              </span>
            </div>

            <div>
              <span className="text-stone-400 block mb-1.5">Các phân hệ được phép truy cập:</span>
              <div className="flex flex-wrap gap-1.5">
                {allowedModules.map((mod) => (
                  <span
                    key={mod}
                    className="px-2 py-0.5 rounded-md bg-stone-800 border border-stone-700 text-stone-300 font-mono text-[10px] uppercase font-bold"
                  >
                    {MODULE_LABELS[mod]?.name?.split(' ')[0] || mod}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Security Audit Notice */}
          <div className="flex items-start gap-2.5 p-3 bg-rose-500/5 border border-rose-500/15 rounded-xl text-[11px] text-stone-400 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>
              Hành động truy cập URL trái phép này đã được ghi nhận vào nhật ký bảo mật của hệ thống POS Enterprise. Vui lòng liên hệ Quản trị viên nếu bạn cần nâng cấp quyền hạn.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full sm:flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] text-white font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay Lại Trang Chính POS</span>
            </button>

            <button
              type="button"
              onClick={() => logout()}
              className="w-full sm:w-auto py-2.5 px-4 bg-stone-800 hover:bg-stone-700 active:scale-[0.98] text-stone-300 hover:text-white font-bold text-xs rounded-xl border border-stone-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng Xuất</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
