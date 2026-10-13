'use client';

import React from 'react';
import Link from 'next/link';
import { KDSView } from '@/components/kds/KDSView';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function KDSPage() {
  return (
    <RouteGuard requiredModule="kds">
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-950 font-sans">
      {/* Top Bar with Navigation Link to FOH */}
      <nav className="h-10 bg-stone-900 border-b border-stone-800 px-4 flex items-center justify-between shrink-0 select-none z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Menu POS (FOH)</span>
          </Link>
          <span className="text-stone-700">|</span>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>Mở FOH trên tab khác để test Real-time</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-emerald-400 font-mono font-semibold">
            KDS Display Mode (Landscape)
          </span>
        </div>
      </nav>

      {/* Main KDS Board */}
      <div className="flex-1 overflow-hidden">
        <KDSView />
      </div>
    </div>
  </RouteGuard>
  );
}
