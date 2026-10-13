'use client';

import React, { useState } from 'react';
import { FOHView } from '@/components/foh/FOHView';
import { KDSView } from '@/components/kds/KDSView';
import { CashierView } from '@/components/cashier/CashierView';
import { ERPView } from '@/components/erp/ERPView';
import { AdminView } from '@/components/admin/AdminView';
import { E2ESimulationModal } from '@/components/ui/E2ESimulationModal';
import { Utensils, ChefHat, CreditCard, Boxes, Shield, ExternalLink } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'foh' | 'kds' | 'cashier' | 'erp' | 'admin'>('foh');
  const [isE2EModalOpen, setIsE2EModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-100 dark:bg-stone-950 font-sans">
      {/* Top Main Navigation Bar across POS Modules */}
      <nav className="h-12 bg-stone-900 border-b border-stone-800 px-2 sm:px-4 flex items-center justify-between shrink-0 select-none z-30 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
              V
            </div>
            <span className="font-bold text-white text-sm tracking-wide hidden md:inline">
              VIBE POS
            </span>
          </div>

          <div className="h-4 w-px bg-stone-700 hidden md:block shrink-0" />

          {/* Module Switcher Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveTab('foh')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                activeTab === 'foh'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Gọi Món</span>
            </button>

            <button
              onClick={() => setActiveTab('kds')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                activeTab === 'kds'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Bếp & Bar</span>
              <span className="text-[10px] px-1 bg-stone-800 text-emerald-400 rounded hidden md:inline">M2 Live</span>
            </button>

            <button
              onClick={() => setActiveTab('cashier')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                activeTab === 'cashier'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Thu Ngân</span>
              <span className="text-[10px] px-1 bg-stone-800 text-emerald-400 rounded hidden md:inline">M3 Live</span>
            </button>

            <button
              onClick={() => setActiveTab('erp')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                activeTab === 'erp'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Kho ERP</span>
              <span className="text-[10px] px-1 bg-stone-800 text-emerald-400 rounded hidden md:inline">M4 Live</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                activeTab === 'admin'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Quản Trị</span>
              <span className="text-[10px] px-1 bg-stone-800 text-emerald-400 rounded hidden md:inline">M5 Live</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={() => setIsE2EModalOpen(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all"
            title="Kịch bản giả lập E2E"
          >
            <span>⚡</span>
            <span className="hidden sm:inline">Giả Lập E2E</span>
            <span className="sm:hidden text-[11px]">E2E</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-800/80 border border-stone-700/60 text-[11px] text-stone-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-emerald-400 font-semibold">Real-time Online</span>
          </div>
        </div>
      </nav>

      {/* Main View Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'foh' && <FOHView />}

        {activeTab === 'kds' && <KDSView />}

        {activeTab === 'cashier' && <CashierView />}

        {activeTab === 'erp' && <ERPView />}

        {activeTab === 'admin' && <AdminView />}
      </div>

      {/* End-to-End Simulation Modal */}
      <E2ESimulationModal
        isOpen={isE2EModalOpen}
        onClose={() => setIsE2EModalOpen(false)}
      />
    </div>
  );
}
