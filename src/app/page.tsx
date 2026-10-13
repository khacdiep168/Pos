'use client';

import React, { useState } from 'react';
import { FOHView } from '@/components/foh/FOHView';
import { KDSView } from '@/components/kds/KDSView';
import { Utensils, ChefHat, CreditCard, ExternalLink } from 'lucide-react';

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
              <span className="text-[10px] px-1 bg-stone-800 text-stone-400 rounded">M3</span>
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

        {activeTab === 'cashier' && (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-stone-900 text-stone-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <CreditCard className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Module 3: Thu Ngân & Sơ Đồ Bàn</h2>
            <p className="text-sm text-stone-400 max-w-md mb-6">
              Sơ đồ bàn trực quan, thanh toán hóa đơn đa kênh (VietQR động, tiền mặt) và trừ tồn kho tự động.
            </p>
            <button
              onClick={() => setActiveTab('foh')}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors"
            >
              Quay lại Menu Gọi Món (FOH)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
