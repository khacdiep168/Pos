'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { orderService } from '@/services/orderService';
import { menuService } from '@/services/menuService';
import { formatCurrencyVND } from '@/lib/utils';
import {
  Search,
  Utensils,
  ChefHat,
  CreditCard,
  Boxes,
  Shield,
  MapPin,
  ShoppingBag,
  ArrowRight,
  X,
  Command,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'foh' | 'kds' | 'cashier' | 'erp' | 'admin') => void;
  allowedModules?: ('foh' | 'kds' | 'cashier' | 'erp' | 'admin')[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  allowedModules = ['foh', 'kds', 'cashier', 'erp', 'admin'],
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle global keyboard navigation within palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Data sources
  const tables = orderService.getTables();
  const menuItems = menuService.getMenuItems();
  const takeawayOrders = orderService.getTakeawayOrders();

  // Navigation Items
  const navItems = [
    { id: 'foh' as const, name: 'Gọi Món (FOH)', desc: 'Order món & chọn bàn tại sảnh', icon: Utensils, category: 'Phân Hệ POS' },
    { id: 'kds' as const, name: 'Bếp & Bar (KDS)', desc: 'Điều phối chế biến trực quan thời gian thực', icon: ChefHat, category: 'Phân Hệ POS' },
    { id: 'cashier' as const, name: 'Thu Ngân & Bàn Ăn (Cashier)', desc: 'Sơ đồ bàn, thanh toán hóa đơn & QR', icon: CreditCard, category: 'Phân Hệ POS' },
    { id: 'erp' as const, name: 'Quản Trị Kho & Định Mức (ERP)', desc: 'Tồn kho, nhập hàng & định mức BOM', icon: Boxes, category: 'Phân Hệ POS' },
    { id: 'admin' as const, name: 'Trung Tâm Quản Trị (Admin)', desc: 'Báo cáo doanh thu, sổ nợ & CRM', icon: Shield, category: 'Phân Hệ POS' },
  ].filter((item) => allowedModules.includes(item.id));

  const lowerQuery = query.toLowerCase().trim();

  // Filter modules
  const filteredNav = navItems.filter(
    (n) => n.name.toLowerCase().includes(lowerQuery) || n.desc.toLowerCase().includes(lowerQuery)
  );

  // Filter tables
  const filteredTables = tables
    .filter(
      (t) =>
        t.table_number.toLowerCase().includes(lowerQuery) ||
        `bàn ${t.table_number}`.toLowerCase().includes(lowerQuery)
    )
    .slice(0, 6);

  // Filter menu items
  const filteredMenuItems = menuItems
    .filter((m) => m.name.toLowerCase().includes(lowerQuery))
    .slice(0, 6);

  // Flattened results for keyboard navigation
  const allResults: { type: 'module' | 'table' | 'takeaway' | 'menu'; data: any }[] = [
    ...filteredNav.map((m) => ({ type: 'module' as const, data: m })),
    ...takeawayOrders
      .filter((tk) => tk.table_number.toLowerCase().includes(lowerQuery) || lowerQuery.includes('mang'))
      .slice(0, 3)
      .map((tk) => ({ type: 'takeaway' as const, data: tk })),
    ...filteredTables.map((t) => ({ type: 'table' as const, data: t })),
    ...filteredMenuItems.map((m) => ({ type: 'menu' as const, data: m })),
  ];

  const handleSelectResult = (index: number) => {
    const item = allResults[index];
    if (!item) return;

    if (item.type === 'module') {
      onNavigateTab(item.data.id);
      onClose();
    } else if (item.type === 'table') {
      onNavigateTab('cashier');
      onClose();
    } else if (item.type === 'takeaway') {
      onNavigateTab('cashier');
      onClose();
    } else if (item.type === 'menu') {
      onNavigateTab('foh');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm bàn số X, món ăn, đơn mang về hoặc phân hệ... (ESC để thoát)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev < allResults.length - 1 ? prev + 1 : 0));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allResults.length - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSelectResult(selectedIndex);
              }
            }}
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 text-sm sm:text-base focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {allResults.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              Không tìm thấy kết quả phù hợp cho &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {/* Phân hệ POS */}
              {filteredNav.length > 0 && (
                <div>
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Phân Hệ POS
                  </div>
                  <div className="space-y-0.5">
                    {filteredNav.map((item) => {
                      const overallIdx = allResults.findIndex((r) => r.type === 'module' && r.data.id === item.id);
                      const isSelected = overallIdx === selectedIndex;
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectResult(overallIdx)}
                          onMouseEnter={() => setSelectedIndex(overallIdx)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                            <div className="truncate">
                              <span className="font-bold">{item.name}</span>
                              <span className={`ml-2 text-[11px] truncate hidden sm:inline ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                                {item.desc}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Đơn Mang Về */}
              {takeawayOrders.length > 0 && (
                <div>
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    🛍️ Đơn Mang Về Đang Chờ
                  </div>
                  <div className="space-y-0.5">
                    {takeawayOrders.slice(0, 3).map((tk) => {
                      const overallIdx = allResults.findIndex((r) => r.type === 'takeaway' && r.data.id === tk.id);
                      const isSelected = overallIdx === selectedIndex;

                      return (
                        <div
                          key={tk.id}
                          onClick={() => handleSelectResult(overallIdx)}
                          onMouseEnter={() => setSelectedIndex(overallIdx)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? 'bg-orange-600 text-white font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <ShoppingBag className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-orange-500'}`} />
                            <span className="font-bold">{tk.table_number} (#{tk.id.slice(-4)})</span>
                            <span className={`text-[11px] ${isSelected ? 'text-orange-100' : 'text-slate-400'} tabular-nums`}>
                              {tk.items.reduce((s, i) => s + i.quantity, 0)} món • {formatCurrencyVND(tk.total_amount)}
                            </span>
                          </div>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${isSelected ? 'bg-white/20' : 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'}`}>
                            {tk.order_status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bàn Ăn */}
              {filteredTables.length > 0 && (
                <div>
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    🪑 Sơ Đồ Bàn Ăn
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {filteredTables.map((t) => {
                      const overallIdx = allResults.findIndex((r) => r.type === 'table' && r.data.id === t.id);
                      const isSelected = overallIdx === selectedIndex;

                      return (
                        <div
                          key={t.id}
                          onClick={() => handleSelectResult(overallIdx)}
                          onMouseEnter={() => setSelectedIndex(overallIdx)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                            <span className="font-bold truncate">Bàn {t.table_number}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isSelected
                              ? 'bg-white/20'
                              : t.status === 'occupied'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : t.status === 'billing'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {t.status === 'occupied' ? 'Đang dùng' : t.status === 'billing' ? 'Chờ thanh toán' : 'Trống'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Món Ăn Trong Thực Đơn */}
              {filteredMenuItems.length > 0 && (
                <div>
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    🍜 Món Ăn Thực Đơn
                  </div>
                  <div className="space-y-0.5">
                    {filteredMenuItems.map((m) => {
                      const overallIdx = allResults.findIndex((r) => r.type === 'menu' && r.data.id === m.id);
                      const isSelected = overallIdx === selectedIndex;

                      return (
                        <div
                          key={m.id}
                          onClick={() => handleSelectResult(overallIdx)}
                          onMouseEnter={() => setSelectedIndex(overallIdx)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={m.image_url}
                              alt={m.name}
                              className="w-6 h-6 rounded-lg object-cover shrink-0"
                            />
                            <span className="font-bold truncate">{m.name}</span>
                          </div>
                          <span className={`text-xs font-black tabular-nums ${isSelected ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
                            {formatCurrencyVND(m.price)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px]">↑</kbd>
              <kbd className="px-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px]">↓</kbd>
              <span>chọn</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px]">↵</kbd>
              <span>mở</span>
            </span>
          </div>
          <span>Linear-Style Quick Command</span>
        </div>
      </div>
    </div>
  );
};
