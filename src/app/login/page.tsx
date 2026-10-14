'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Shield,
  CreditCard,
  ChefHat,
  Wine,
  Utensils,
  Eye,
  EyeOff,
  Lock,
  User,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { adminService } from '@/services/adminService';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const isDemoMode = adminService.getSettings().is_demo_mode !== false;

  const [username, setUsername] = useState(isDemoMode ? 'admin' : '');
  const [password, setPassword] = useState(isDemoMode ? '123456' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const demoAccounts = [
    {
      role: 'Quản Trị / Admin',
      username: 'admin',
      name: 'Nguyễn Quản Trị',
      icon: Shield,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      activeColor: 'ring-2 ring-purple-500 bg-purple-500 text-white',
      badge: 'Toàn quyền',
    },
    {
      role: 'Thu Ngân',
      username: 'cashier',
      name: 'Trần Thị Mai',
      icon: CreditCard,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      activeColor: 'ring-2 ring-emerald-500 bg-emerald-600 text-white',
      badge: 'FOH + Thu Ngân',
    },
    {
      role: 'Bếp Trưởng',
      username: 'chef',
      name: 'Lê Văn Hùng',
      icon: ChefHat,
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      activeColor: 'ring-2 ring-orange-500 bg-orange-500 text-white',
      badge: 'KDS Bếp',
    },
    {
      role: 'Pha Chế (Bar)',
      username: 'bartender',
      name: 'Phạm Minh Tuấn',
      icon: Wine,
      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      activeColor: 'ring-2 ring-cyan-500 bg-cyan-600 text-white',
      badge: 'KDS Quầy Bar',
    },
    {
      role: 'Phục Vụ (Waiter)',
      username: 'waiter',
      name: 'Nguyễn Văn An',
      icon: Utensils,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      activeColor: 'ring-2 ring-amber-500 bg-amber-500 text-white',
      badge: 'Chỉ FOH Gọi Món',
    },
  ];

  const handleSelectDemo = (accUsername: string) => {
    setUsername(accUsername);
    setPassword('123456');
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await login(username, password);
      if (result.success) {
        // Redirect to main POS hub
        router.push('/');
      } else {
        setErrorMessage(result.message || 'Đăng nhập không thành công.');
      }
    } catch {
      setErrorMessage('Đã xảy ra lỗi trong quá trình xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center p-4 bg-stone-100 dark:bg-stone-950 font-sans selection:bg-amber-500 selection:text-white">
      {/* Background Ambient Glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-5 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-white font-black text-2xl shadow-xl shadow-amber-500/25 mb-1">
            V
          </div>
          <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-white">
            VIBE POS SYSTEM
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
            Hệ thống Bán hàng, Điều phối Bếp Real-time & Quản trị Nhà hàng
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 shadow-xl border border-stone-200/80 dark:border-stone-800 space-y-5">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-stone-900 dark:text-white">
                Đăng Nhập Nhân Viên
              </h2>
              <p className="text-[11px] text-stone-400">
                {isDemoMode ? 'Chọn tài khoản mẫu hoặc nhập thủ công' : 'Vui lòng nhập tài khoản và mật khẩu được cấp'}
              </p>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              {isDemoMode ? 'Chế độ Demo' : 'Production'}
            </span>
          </div>

          {/* Quick Demo Switcher Pills (Hidden when isDemoMode === false) */}
          {isDemoMode && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                1-Chạm Chọn Vai Trò Thử Nghiệm:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {demoAccounts.map((acc) => {
                  const Icon = acc.icon;
                  const isSelected = username === acc.username;
                  return (
                    <button
                      key={acc.username}
                      type="button"
                      onClick={() => handleSelectDemo(acc.username)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all border text-xs ${
                        isSelected
                          ? `${acc.activeColor} shadow-xs font-bold`
                          : `${acc.color} hover:bg-stone-50 dark:hover:bg-stone-800`
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{acc.role}</div>
                        <div className="text-[10px] opacity-75 truncate">{acc.badge}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>Tên đăng nhập (Username):</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin, cashier, chef..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Mật khẩu:</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu (mặc định: 123456)"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-98 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>ĐĂNG NHẬP VÀO HỆ THỐNG</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-center text-stone-400">
            💡 <em>Mẹo: Nút Đăng Nhập sẽ tự động mở khóa Web Audio Alerts cho trình duyệt.</em>
          </p>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-stone-400 space-y-1">
          <p>© 2026 Vibe POS • Real-time Restaurant Suite</p>
        </div>
      </div>
    </div>
  );
}
