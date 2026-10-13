'use client';

import React, { useState } from 'react';
import { FOHView } from '@/components/foh/FOHView';
import { KDSView } from '@/components/kds/KDSView';
import { CashierView } from '@/components/cashier/CashierView';
import { ERPView } from '@/components/erp/ERPView';
import { AdminView } from '@/components/admin/AdminView';
import { Utensils, ChefHat, CreditCard, Boxes, Shield, ExternalLink } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'foh' | 'kds' | 'cashier' | 'erp' | 'admin'>('foh');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-100 dark:bg-stone-950 font-sans">
      {/* Top Main Navigation Bar across POS Modules */}
      <nav className="h-12 bg-stone-900 border-b border-stone-800 px-4 flex items-center justify-between shrink-0 select-none z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
              V
            </div>
            <span className="font-bold text-white text-sm tracking-wide hidden sm:inline">
              VIBE POS
            </span>
          </div>

          <div className="h-4 w-px bg-stone-700 hidden sm:block" />

          {/* Module Switcher Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('foh')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'foh'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Gọi Món (FOH)</span>
            </button>

            <button
              onClick={() => setActiveTab('kds')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'kds'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Bếp & Bar (KDS)</span>
              <span className="text-[10px] px-1 bg-stone-800 text-emerald-400 rounded">M2 Live</span>
            </button>

            <button
              onClick={() => setActiveTab('cashier')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'cashier'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Thu Ngân</span>
              <span className="text-[10px] px-1 bg-stone-800 text-emerald-400 rounded">M3 Live</span>
            </button>

            <button
              onClick={() => setActiveTab('erp')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'erp'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Kho (ERP)</span>
              <span className="text-[10px] px-1 bg-stone-800 text-emerald-400 rounded">M4 Live</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Quản Trị</span>
              <span className="text-[10px] px-1 bg-stone-800 text-emerald-400 rounded">M5 Live</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-800/80 border border-stone-700/60 text-[11px] text-stone-300">
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
    </div>
  );
}
