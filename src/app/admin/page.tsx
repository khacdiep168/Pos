'use client';

import React from 'react';
import Link from 'next/link';
import { AdminView } from '@/components/admin/AdminView';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { ArrowLeft, ExternalLink, ChefHat, CreditCard, Boxes } from 'lucide-react';

export default function AdminPage() {
  return (
    <RouteGuard requiredModule="admin">
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
            <span>Bếp & Bar (KDS)</span>
          </Link>
          <span className="text-stone-700">|</span>
          <Link
            href="/cashier"
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Thu Ngân</span>
          </Link>
          <span className="text-stone-700">|</span>
          <Link
            href="/erp"
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Kho (ERP)</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-[11px] text-purple-400 font-mono font-semibold">
            Admin Panel Mode
          </span>
        </div>
      </nav>

      {/* Main Admin View */}
      <div className="flex-1 overflow-hidden">
        <AdminView />
      </div>
    </div>
  </RouteGuard>
  );
}
