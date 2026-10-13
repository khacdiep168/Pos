'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Customer } from '@/types';
import { customerService } from '@/services/customerService';
import { formatCurrencyVND, formatDateTime } from '@/lib/utils';
import { AddEditCustomerModal } from './AddEditCustomerModal';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  Award,
  DollarSign,
  Star,
  Edit3,
  Trash2,
  Crown,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface CustomerTabProps {
  onRefresh?: () => void;
}

const TIER_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: React.ElementType }
> = {
  bronze: {
    label: 'Hạng Đồng',
    bg: 'bg-amber-800/10 dark:bg-amber-800/20',
    text: 'text-amber-800 dark:text-amber-500',
    border: 'border-amber-800/30',
    icon: Award,
  },
  silver: {
    label: 'Hạng Bạc',
    bg: 'bg-stone-500/10 dark:bg-stone-400/20',
    text: 'text-stone-600 dark:text-stone-300',
    border: 'border-stone-400/30',
    icon: Award,
  },
  gold: {
    label: 'Hạng Vàng',
    bg: 'bg-amber-500/15 dark:bg-amber-500/25',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/40',
    icon: Crown,
  },
  diamond: {
    label: 'Kim Cương',
    bg: 'bg-cyan-500/15 dark:bg-cyan-500/25',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/40',
    icon: Sparkles,
  },
};

export const CustomerTab: React.FC<CustomerTabProps> = ({ onRefresh }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => customerService.getCustomers());
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const refreshData = () => {
    setCustomers(customerService.getCustomers());
    if (onRefresh) onRefresh();
  };

  // Top Metrics
  const totalSpent = useMemo(
    () => customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
    [customers]
  );

  const totalPoints = useMemo(
    () => customers.reduce((sum, c) => sum + (c.points || 0), 0),
    [customers]
  );

  const vipCount = useMemo(
    () =>
      customers.filter(
        (c) => c.membership_tier === 'gold' || c.membership_tier === 'diamond'
      ).length,
    [customers]
  );

  // Filtered List
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (tierFilter !== 'all' && c.membership_tier !== tierFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone.includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q);
        const matchId = c.id.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchId) return false;
      }

      return true;
    });
  }, [customers, tierFilter, searchQuery]);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa khách hàng "${name}"?`)) {
      customerService.deleteCustomer(id);
      refreshData();
    }
  };

  return (
    <div className="space-y-5">
      {/* 4 Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1: Tổng khách hàng */}
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Khách Hàng Thành Viên</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-stone-900 dark:text-white">
            {customers.length} <span className="text-xs font-normal text-stone-400">người</span>
          </div>
          <p className="text-[11px] text-stone-400">Đăng ký hồ sơ tích điểm</p>
        </div>

        {/* Metric 2: Doanh số thành viên */}
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Doanh Số Thành Viên</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrencyVND(totalSpent)}
          </div>
          <p className="text-[11px] text-stone-400">Tổng chi tiêu tích lũy</p>
        </div>

        {/* Metric 3: Khách VIP */}
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Thành Viên VIP (Vàng/Kim Cương)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">
            {vipCount} <span className="text-xs font-normal text-stone-400">khách VIP</span>
          </div>
          <p className="text-[11px] text-stone-400">Hạng chi tiêu cao nhất</p>
        </div>

        {/* Metric 4: Điểm thưởng lưu hành */}
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Điểm Thưởng Khả Dụng</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {totalPoints.toLocaleString()} <span className="text-xs font-normal text-stone-400">điểm</span>
          </div>
          <p className="text-[11px] text-stone-400">Quy đổi 10k VNĐ = 1 điểm</p>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên khách, số điện thoại, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-100 dark:bg-stone-800 border-none rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Tier filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl shrink-0">
            {[
              { key: 'all', label: 'Tất Cả' },
              { key: 'diamond', label: 'Kim Cương' },
              { key: 'gold', label: 'Vàng' },
              { key: 'silver', label: 'Bạc' },
              { key: 'bronze', label: 'Đồng' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTierFilter(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  tierFilter === t.key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 active:scale-98 transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Khách Hàng</span>
          </button>
        </div>
      </div>

      {/* Customer Container (Table on Desktop, Card List on Mobile) */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
        {/* Desktop Table (md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Mã KH</th>
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-4">Điện Thoại</th>
                <th className="py-3 px-4">Hạng Thành Viên</th>
                <th className="py-3 px-4 text-right">Tổng Chi Tiêu</th>
                <th className="py-3 px-4 text-center">Điểm Tích Lũy</th>
                <th className="py-3 px-4">Ngày Tham Gia</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((cus) => {
                  const tier = TIER_CONFIG[cus.membership_tier || 'bronze'] || TIER_CONFIG.bronze;
                  const TierIcon = tier.icon;

                  return (
                    <tr
                      key={cus.id}
                      className="hover:bg-blue-50/40 dark:hover:bg-stone-800/40 transition-colors group"
                    >
                      {/* Mã */}
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900 dark:text-white">
                        <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                          #{cus.id}
                        </span>
                      </td>

                      {/* Họ tên & Email */}
                      <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-white">
                        <div>
                          <div>{cus.name}</div>
                          {cus.email && (
                            <div className="text-[11px] font-normal text-stone-400">{cus.email}</div>
                          )}
                        </div>
                      </td>

                      {/* Điện thoại */}
                      <td className="py-3.5 px-4 font-mono text-stone-600 dark:text-stone-400 whitespace-nowrap">
                        {cus.phone}
                      </td>

                      {/* Hạng thành viên */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${tier.bg} ${tier.text} ${tier.border}`}
                        >
                          <TierIcon className="w-3.5 h-3.5" />
                          <span>{tier.label}</span>
                        </span>
                      </td>

                      {/* Tổng chi tiêu */}
                      <td className="py-3.5 px-4 text-right font-black font-mono text-stone-900 dark:text-white whitespace-nowrap">
                        {formatCurrencyVND(cus.total_spent || 0)}
                      </td>

                      {/* Điểm tích lũy */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-purple-600 dark:text-purple-400 font-mono">
                          <Star className="w-3 h-3 fill-purple-500 text-purple-500" />
                          <span>{(cus.points || 0).toLocaleString()}</span>
                        </span>
                      </td>

                      {/* Ngày tham gia */}
                      <td className="py-3.5 px-4 text-stone-500 whitespace-nowrap">
                        {cus.created_at ? formatDateTime(cus.created_at).split(' ')[0] : '-'}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingCustomer(cus)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            title="Sửa thông tin"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cus.id, cus.name)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Xóa khách hàng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400 space-y-2">
                    <Users className="w-10 h-10 mx-auto opacity-30 text-stone-500" />
                    <p className="font-semibold text-xs text-stone-500">
                      Không tìm thấy khách hàng nào phù hợp
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List (< md - Native Mobile KiotViet-like) */}
        <div className="md:hidden flex flex-col divide-y divide-stone-100 dark:divide-stone-800">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((cus) => {
              const tier = TIER_CONFIG[cus.membership_tier || 'bronze'] || TIER_CONFIG.bronze;
              const TierIcon = tier.icon;

              return (
                <div
                  key={cus.id}
                  className="p-4 bg-white dark:bg-stone-900 flex items-center justify-between"
                >
                  {/* Left Column: Tên, Hạng, SĐT, Điểm */}
                  <div className="min-w-0 pr-3 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-stone-900 dark:text-white">
                        {cus.name}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${tier.bg} ${tier.text} ${tier.border}`}
                      >
                        <TierIcon className="w-2.5 h-2.5" />
                        <span>{tier.label}</span>
                      </span>
                    </div>

                    <div className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                      {cus.phone} {cus.email ? `• ${cus.email}` : ''}
                    </div>

                    <div className="text-[11px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-purple-500 text-purple-500" />
                      <span>{(cus.points || 0).toLocaleString()} điểm thưởng</span>
                    </div>
                  </div>

                  {/* Right Column: Tổng chi tiêu, Thao tác Sửa/Xóa */}
                  <div className="text-right shrink-0 space-y-2">
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrencyVND(cus.total_spent || 0)}
                    </div>

                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingCustomer(cus)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        title="Sửa thông tin"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cus.id, cus.name)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Xóa khách hàng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-stone-400 space-y-2 p-4">
              <Users className="w-10 h-10 mx-auto opacity-30 text-stone-500" />
              <p className="font-semibold text-xs text-stone-500">
                Không tìm thấy khách hàng nào
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <AddEditCustomerModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={refreshData}
        />
      )}

      {/* Edit Modal */}
      {editingCustomer && (
        <AddEditCustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSuccess={refreshData}
        />
      )}
    </div>
  );
};
