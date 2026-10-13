'use client';

import React from 'react';
import Link from 'next/link';
import { ERPView } from '@/components/erp/ERPView';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { ArrowLeft, ExternalLink, ChefHat, CreditCard, Utensils } from 'lucide-react';

export default function ERPPage() {
  return (
    <RouteGuard requiredModule="erp">
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-950 font-sans">
      {/* Top Bar with Navigation Links */}
      <nav className="h-10 bg-stone-900 border-b border-stone-800 px-4 flex items-center justify-between shrink-0 select-none z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Menu Gọi Món (FOH)</span>
          </Link>
          <span className="text-stone-700">|</span>
          <Link
            href="/kds"
            className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Màn Hình Bếp (KDS)</span>
          </Link>
          <span className="text-stone-700">|</span>
          <Link
            href="/cashier"
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Quầy Thu Ngân</span>
          </Link>
          <span className="text-stone-700">|</span>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition-colors hidden sm:flex"
          >
            <span>Mở FOH trên tab khác để test Trừ Kho Real-time</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-emerald-400 font-mono font-semibold">
            ERP Inventory Mode
          </span>
        </div>
      </nav>

      {/* Main ERP View */}
      <div className="flex-1 overflow-hidden">
        <ERPView />
      </div>
    </div>
  </RouteGuard>
  );
}
