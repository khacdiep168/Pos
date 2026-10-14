'use client';

import React, { useState, useEffect } from 'react';
import { FOHView } from '@/components/foh/FOHView';
import { KDSView } from '@/components/kds/KDSView';
import { CashierView } from '@/components/cashier/CashierView';
import { ERPView } from '@/components/erp/ERPView';
import { AdminView } from '@/components/admin/AdminView';
import { E2ESimulationModal } from '@/components/ui/E2ESimulationModal';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Utensils,
  ChefHat,
  CreditCard,
  Boxes,
  Shield,
  LogOut,
  User,
  Search,
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { realtimeEngine } from '@/services/realtimeEngine';

export default function Home() {
  const { user, isLoading, logout, canAccess, allowedModules, roleLabel } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'foh' | 'kds' | 'cashier' | 'erp' | 'admin'>('foh');
  const [isE2EModalOpen, setIsE2EModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => adminService.getSettings().is_demo_mode !== false);

  // Global Keyboard Shortcut: Ctrl + K or Cmd + K for Linear Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const unsub = realtimeEngine.subscribe('ORDER_UPDATED', () => {
      setIsDemoMode(adminService.getSettings().is_demo_mode !== false);
    });
    return () => unsub();
  }, []);

  // Route Guard: redirect to /login if unauthenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Ensure active tab is within user's allowed permissions
  useEffect(() => {
    if (user && allowedModules.length > 0) {
      if (!canAccess(activeTab)) {
        setActiveTab(allowedModules[0]);
      }
    }
  }, [user, allowedModules, activeTab, canAccess]);

  const allModules = [
    {
      id: 'foh' as const,
      name: 'Gọi Món (FOH)',
      shortName: 'Gọi Món',
      desc: 'Bán hàng, order món & chọn bàn',
      icon: Utensils,
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      badge: 'FOH',
    },
    {
      id: 'kds' as const,
      name: 'Bếp & Bar (KDS)',
      shortName: 'Bếp & Bar',
      desc: 'Điều phối chế biến thời gian thực',
      icon: ChefHat,
      color: 'bg-orange-500',
      textColor: 'text-orange-400',
      badge: 'M2 Live',
    },
    {
      id: 'cashier' as const,
      name: 'Thu Ngân (Cashier)',
      shortName: 'Thu Ngân',
      desc: 'Sơ đồ bàn, hóa đơn & thanh toán QR',
      icon: CreditCard,
      color: 'bg-emerald-600',
      textColor: 'text-emerald-400',
      badge: 'M3 Live',
    },
    {
      id: 'erp' as const,
      name: 'Quản Trị Kho (ERP)',
      shortName: 'Kho ERP',
      desc: 'Tồn kho, định mức BOM & nhập hàng',
      icon: Boxes,
      color: 'bg-amber-600',
      textColor: 'text-amber-400',
      badge: 'M4 Live',
    },
    {
      id: 'admin' as const,
      name: 'Trung Tâm Quản Trị (Admin)',
      shortName: 'Quản Trị',
      desc: 'Doanh thu, sổ nợ NCC, CRM & báo cáo',
      icon: Shield,
      color: 'bg-purple-600',
      textColor: 'text-purple-400',
      badge: 'M5 Live',
    },
  ];

  // RBAC Filter: Only show modules the user has access to
  const visibleModules = allModules.filter((m) => canAccess(m.id));
  const currentModule = allModules.find((m) => m.id === activeTab) || allModules[0];

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-stone-900 text-white gap-3 font-sans">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-stone-400 font-medium">Đang kiểm tra quyền nhân viên...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-100 dark:bg-stone-950 font-sans">
      {/* Top Main Navigation Bar across POS Modules */}
      <nav className="h-12 bg-stone-900 border-b border-stone-800 px-3 sm:px-4 flex items-center justify-between shrink-0 select-none z-30 gap-2">
        {/* Left: Mobile Hamburger OR Desktop Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-stone-800 text-stone-200 hover:text-white hover:bg-stone-700 active:scale-95 transition-all"
            aria-label="Mở danh mục phân hệ"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Desktop Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
              V
            </div>
            <span className="font-bold text-white text-sm tracking-wide hidden md:inline">
              VIBE POS
            </span>
          </div>

          {/* Mobile Active Module Title Badge */}
          <div className="md:hidden flex items-center gap-1.5 min-w-0">
            <span className="text-stone-500 text-xs">/</span>
            <span className="text-xs font-bold text-white truncate flex items-center gap-1">
              {currentModule.shortName}
            </span>
          </div>

          <div className="h-4 w-px bg-stone-700 hidden md:block shrink-0" />

          {/* Desktop Module Switcher Tabs (HIDDEN ON MOBILE, FILTERED BY RBAC) */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {visibleModules.map((m) => {
              const Icon = m.icon;
              const isActive = activeTab === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveTab(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                    isActive
                      ? `${m.color} text-white shadow-xs`
                      : 'text-stone-400 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.shortName}</span>
                  {m.badge !== 'FOH' && (
                    <span className="text-[10px] px-1 bg-stone-800 text-emerald-400 rounded hidden lg:inline">
                      {m.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Top Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick Command Palette Button (Ctrl + K) */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700/60 text-xs transition-all active:scale-95 cursor-pointer"
            title="Mở bảng lệnh nhanh (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline text-stone-300">Tìm kiếm</span>
            <kbd className="hidden sm:inline-block px-1 py-0.2 text-[9px] font-mono text-stone-400 bg-stone-900 border border-stone-700 rounded shadow-2xs">
              Ctrl+K
            </kbd>
          </button>

          {isDemoMode && (
            <button
              onClick={() => setIsE2EModalOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all"
              title="Kịch bản giả lập E2E"
            >
              <span>⚡</span>
              <span className="hidden sm:inline">Giả Lập E2E</span>
              <span className="sm:hidden text-[11px]">E2E</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-800/80 border border-stone-700/60 text-[11px] text-stone-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-emerald-400 font-semibold">Realtime</span>
          </div>

          {/* Desktop User Account Pill & Logout */}
          <div className="hidden sm:flex items-center gap-2 pl-1.5 border-l border-stone-800">
            <div className="flex items-center gap-2">
              <img
                src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'}
                alt={user.full_name}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-amber-500/40"
              />
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-white truncate max-w-[110px]">
                  {user.full_name.split('(')[0].trim()}
                </div>
                <div className="text-[10px] text-amber-400 font-medium">
                  {roleLabel.split('(')[0].trim()}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors"
              title="Đăng xuất tài khoản"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Global App Drawer (Slide from Left) */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Sidebar Panel */}
          <div className="relative w-72 max-w-[82vw] h-full bg-stone-900 border-r border-stone-800 text-white flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div>
              {/* Drawer Header */}
              <div className="p-4 border-b border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                    V
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm tracking-wide text-white">VIBE POS</h2>
                    <p className="text-[10px] text-stone-400">Hệ Thống Bán Hàng & Quản Trị</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User Profile Card in Drawer */}
              {user && (
                <div className="mx-3 mt-3 p-3 rounded-2xl bg-stone-800/80 border border-stone-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-inner">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.full_name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300">
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      logout();
                    }}
                    title="Đăng xuất"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-700/50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Module List Section */}
              <div className="p-3">
                <p className="px-2 pb-2 text-[10px] font-bold tracking-wider uppercase text-stone-400">
                  Phân Hệ Được Phân Quyền
                </p>

                <div className="space-y-1">
                  {visibleModules.map((m) => {
                    const Icon = m.icon;
                    const isActive = activeTab === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setActiveTab(m.id);
                          setIsDrawerOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                          isActive
                            ? `${m.color} text-white shadow-md font-bold`
                            : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : 'bg-stone-800 text-stone-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold truncate">{m.name}</span>
                            {m.badge && (
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-stone-800 text-emerald-400'
                                }`}
                              >
                                {m.badge}
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-[10px] truncate ${
                              isActive ? 'text-white/80' : 'text-stone-400'
                            }`}
                          >
                            {m.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-stone-800 bg-stone-950/40 space-y-2">
              {isDemoMode && (
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setIsE2EModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
                >
                  <span>⚡</span>
                  <span>Kịch Bản Giả Lập E2E</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-stone-800 hover:bg-rose-500/20 text-stone-300 hover:text-rose-400 font-bold text-xs border border-stone-700/60 active:scale-95 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất ({user?.username})</span>
              </button>

              <div className="flex items-center justify-between px-2 pt-1 text-[10px] text-stone-500">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Realtime Online
                </span>
                <span>v1.12 RBAC & Alerts</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'foh' && <FOHView />}

        {activeTab === 'kds' && <KDSView />}

        {activeTab === 'cashier' && <CashierView />}

        {activeTab === 'erp' && <ERPView />}

        {activeTab === 'admin' && <AdminView />}
      </div>

      {/* Zero-Hamburger, Thumb-Friendly Mobile Bottom Navigation Bar (Fixed bottom-0 inset-x-0 z-40 h-16) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-around px-1 shadow-xl select-none">
        {visibleModules.map((m) => {
          const Icon = m.icon;
          const isActive = activeTab === m.id;

          return (
            <button
              key={m.id}
              onClick={() => setActiveTab(m.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-black'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-transform ${
                  isActive
                    ? 'scale-110 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                    : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[64px] font-bold">
                {m.shortName}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Linear-Style Command Palette (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={setActiveTab}
        allowedModules={allowedModules}
      />

      {/* End-to-End Simulation Modal */}
      <E2ESimulationModal
        isOpen={isE2EModalOpen}
        onClose={() => setIsE2EModalOpen(false)}
      />
    </div>
  );
}
