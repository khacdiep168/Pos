'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Order, RawMaterial, MenuItem } from '@/types';
import { initialMenuItems } from '@/database/mockData';
import { formatCurrencyVND } from '@/lib/utils';
import { DateRangePicker, DateRange, getBoundaryForPreset } from './DateRangePicker';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Award,
  CreditCard,
  QrCode,
  Banknote,
  Flame,
  Wine,
  Calendar,
  Layers,
  Inbox,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const DEFAULT_RANGE: DateRange = {
  startDate: new Date('2026-01-01T00:00:00.000Z'),
  endDate: new Date('2026-12-31T23:59:59.999Z'),
  preset: 'today',
  label: 'Hôm nay',
};

interface DashboardTabProps {
  orders: Order[];
  materials: RawMaterial[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ orders, materials }) => {
  // Date Range state with boundary (updated on mount for client hydration)
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_RANGE);

  useEffect(() => {
    setDateRange(getBoundaryForPreset('today'));
  }, []);

  // 1. FILTER ORDERS BY DATE RANGE (STRICT TIME BOUNDARY)
  const filteredOrders = useMemo(() => {
    const startTs = dateRange.startDate.getTime();
    const endTs = dateRange.endDate.getTime();

    return orders.filter((o) => {
      if (!o.created_at) return false;
      const orderTs = new Date(o.created_at).getTime();
      return orderTs >= startTs && orderTs <= endTs;
    });
  }, [orders, dateRange]);

  // 2. KPI METRICS (RE-RENDER UPON FILTER)
  const completedOrders = useMemo(
    () =>
      filteredOrders.filter(
        (o) => o.payment_status === 'paid' && o.order_status !== 'cancelled'
      ),
    [filteredOrders]
  );

  const totalRevenue = useMemo(
    () => completedOrders.reduce((sum, o) => sum + o.total_amount, 0),
    [completedOrders]
  );

  const totalOrdersCount = filteredOrders.length;
  const aov = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;
  const lowStockCount = materials.filter((m) => m.current_stock < m.min_stock_level).length;

  // 3. CHART 1: DYNAMIC REVENUE BAR CHART
  const revenueChartData = useMemo<{ time: string; revenue: number; orders: number }[]>(() => {
    const preset = dateRange.preset;

    if (preset === 'today') {
      const buckets = [
        { label: '08:00 - 10:00', minH: 8, maxH: 10, revenue: 0, orders: 0 },
        { label: '10:00 - 12:00', minH: 10, maxH: 12, revenue: 0, orders: 0 },
        { label: '12:00 - 14:00', minH: 12, maxH: 14, revenue: 0, orders: 0 },
        { label: '14:00 - 16:00', minH: 14, maxH: 16, revenue: 0, orders: 0 },
        { label: '16:00 - 18:00', minH: 16, maxH: 18, revenue: 0, orders: 0 },
        { label: '18:00 - 20:00', minH: 18, maxH: 20, revenue: 0, orders: 0 },
        { label: '20:00 - 22:00', minH: 20, maxH: 22, revenue: 0, orders: 0 },
      ];

      completedOrders.forEach((o) => {
        const h = new Date(o.created_at).getHours();
        const b = buckets.find((bucket) => h >= bucket.minH && h < bucket.maxH);
        if (b) {
          b.revenue += o.total_amount;
          b.orders += 1;
        } else if (h >= 22) {
          buckets[buckets.length - 1].revenue += o.total_amount;
          buckets[buckets.length - 1].orders += 1;
        } else {
          buckets[0].revenue += o.total_amount;
          buckets[0].orders += 1;
        }
      });

      return buckets.map((b) => ({ time: b.label.split(' - ')[0], revenue: b.revenue, orders: b.orders }));
    }

    if (preset === 'week') {
      const days = [
        { key: 1, time: 'Thứ 2', revenue: 0, orders: 0 },
        { key: 2, time: 'Thứ 3', revenue: 0, orders: 0 },
        { key: 3, time: 'Thứ 4', revenue: 0, orders: 0 },
        { key: 4, time: 'Thứ 5', revenue: 0, orders: 0 },
        { key: 5, time: 'Thứ 6', revenue: 0, orders: 0 },
        { key: 6, time: 'Thứ 7', revenue: 0, orders: 0 },
        { key: 0, time: 'Chủ Nhật', revenue: 0, orders: 0 },
      ];

      completedOrders.forEach((o) => {
        const d = new Date(o.created_at).getDay();
        const slot = days.find((item) => item.key === d);
        if (slot) {
          slot.revenue += o.total_amount;
          slot.orders += 1;
        }
      });

      return days.map((d) => ({ time: d.time, revenue: d.revenue, orders: d.orders }));
    }

    if (preset === 'year') {
      const months = Array.from({ length: 12 }, (_, i) => ({
        time: `T${i + 1}`,
        monthIndex: i,
        revenue: 0,
        orders: 0,
      }));

      completedOrders.forEach((o) => {
        const m = new Date(o.created_at).getMonth();
        if (months[m]) {
          months[m].revenue += o.total_amount;
          months[m].orders += 1;
        }
      });

      return months.map((m) => ({ time: m.time, revenue: m.revenue, orders: m.orders }));
    }

    // Default for month or custom: 6 intervals
    const intervals = [
      { time: '01-05', minD: 1, maxD: 5, revenue: 0, orders: 0 },
      { time: '06-10', minD: 6, maxD: 10, revenue: 0, orders: 0 },
      { time: '11-15', minD: 11, maxD: 15, revenue: 0, orders: 0 },
      { time: '16-20', minD: 16, maxD: 20, revenue: 0, orders: 0 },
      { time: '21-25', minD: 21, maxD: 25, revenue: 0, orders: 0 },
      { time: '26-31', minD: 26, maxD: 31, revenue: 0, orders: 0 },
    ];

    completedOrders.forEach((o) => {
      const dateNum = new Date(o.created_at).getDate();
      const slot = intervals.find((int) => dateNum >= int.minD && dateNum <= int.maxD);
      if (slot) {
        slot.revenue += o.total_amount;
        slot.orders += 1;
      }
    });

    return intervals.map((i) => ({ time: i.time, revenue: i.revenue, orders: i.orders }));
  }, [completedOrders, dateRange]);

  // 4. CHART 2: PAYMENT METHOD DONUT BREAKDOWN
  const paymentBreakdownData = useMemo(() => {
    let cash = 0;
    let qr = 0;
    let card = 0;
    let ewallet = 0;

    completedOrders.forEach((o) => {
      if (o.payment_method === 'cash') cash += o.total_amount;
      else if (o.payment_method === 'transfer_qr') qr += o.total_amount;
      else if (o.payment_method === 'card') card += o.total_amount;
      else if (o.payment_method === 'e_wallet') ewallet += o.total_amount;
      else qr += o.total_amount;
    });

    const total = cash + qr + card + ewallet;
    if (total === 0) {
      return [{ name: 'Chưa có giao dịch', value: 1, color: '#e7e5e4' }];
    }

    const res = [];
    if (qr > 0) res.push({ name: 'VietQR Chuyển khoản', value: qr, color: '#10b981' });
    if (cash > 0) res.push({ name: 'Tiền mặt (Cash)', value: cash, color: '#f59e0b' });
    if (card > 0) res.push({ name: 'Thẻ POS Ngân hàng', value: card, color: '#3b82f6' });
    if (ewallet > 0) res.push({ name: 'Ví điện tử', value: ewallet, color: '#8b5cf6' });

    return res;
  }, [completedOrders]);

  // 5. TOP 5 BEST SELLING ITEMS (RE-CALCULATED DYNAMICALLY)
  const topSellingItems = useMemo(() => {
    const itemMap = new Map<string, { menuItem: MenuItem; quantitySold: number; revenue: number }>();

    filteredOrders.forEach((o) => {
      // Don't count cancelled orders in best sellers
      if (o.order_status === 'cancelled') return;

      o.items.forEach((it) => {
        const existing = itemMap.get(it.menu_item_id);
        const menuItemMatch =
          initialMenuItems.find((m) => m.id === it.menu_item_id) || {
            id: it.menu_item_id,
            name: it.menu_item_name,
            price: it.price,
            category_id: 'cat-food',
            station: it.station,
            is_available: true,
            image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
          };

        if (existing) {
          existing.quantitySold += it.quantity;
          existing.revenue += it.quantity * it.price;
        } else {
          itemMap.set(it.menu_item_id, {
            menuItem: menuItemMatch,
            quantitySold: it.quantity,
            revenue: it.quantity * it.price,
          });
        }
      });
    });

    return Array.from(itemMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);
  }, [filteredOrders]);

  return (
    <div className="space-y-6">
      {/* Dynamic Date Range Picker Bar */}
      <DateRangePicker value={dateRange} onChange={setDateRange} />

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Doanh thu */}
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Doanh Thu ({dateRange.label})</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-stone-900 dark:text-white">
            {formatCurrencyVND(totalRevenue)}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{completedOrders.length} đơn hoàn tất</span>
          </p>
        </div>

        {/* KPI 2: Số đơn hàng */}
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Tổng Số Đơn Hàng</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-stone-900 dark:text-white">
            {totalOrdersCount} <span className="text-sm font-normal text-stone-400">đơn</span>
          </div>
          <p className="text-[11px] text-stone-400">
            {filteredOrders.filter((o) => o.order_status === 'cancelled').length} đơn hủy / đổi ý
          </p>
        </div>

        {/* KPI 3: Giá trị TB đơn */}
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Giá Trị TB (AOV)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-stone-900 dark:text-white">
            {formatCurrencyVND(aov)}
          </div>
          <p className="text-[11px] text-stone-400">Trung bình trên mỗi lượt bàn thành công</p>
        </div>

        {/* KPI 4: Cảnh báo kho */}
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Cảnh Báo Tồn Kho</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-stone-900 dark:text-white flex items-center gap-2">
            <span>{lowStockCount}</span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
              Low Stock
            </span>
          </div>
          <p className="text-[11px] text-stone-400">Cần tạo phiếu PO nhập thêm</p>
        </div>
      </div>

      {/* 2 Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chart 1: Doanh thu theo mốc thời gian (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white">
                Doanh Thu ({dateRange.label})
              </h3>
              <p className="text-xs text-stone-400">
                Thống kê động theo các mốc thời gian của bộ lọc
              </p>
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              Tổng: {formatCurrencyVND(totalRevenue)}
            </span>
          </div>

          <div className="h-64 w-full">
            {revenueChartData.length > 0 && totalRevenue > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCurrencyVND(Number(value) || 0), 'Doanh thu']}
                  />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-2">
                <Inbox className="w-8 h-8 opacity-40 text-stone-500" />
                <p className="text-xs font-medium">Chưa có dữ liệu doanh thu trong khoảng thời gian này</p>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Tỷ trọng Thanh toán (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white">
                Tỷ Trọng Phương Thức Thanh Toán
              </h3>
              <p className="text-xs text-stone-400">Kênh thanh toán theo khoảng thời gian đã lọc</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {completedOrders.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrencyVND(Number(value) || 0)} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-stone-400 space-y-1">
                <CreditCard className="w-8 h-8 mx-auto opacity-40 text-stone-500" />
                <p className="text-xs font-medium">Chưa có giao dịch thanh toán</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top 5 Best Selling Items Table */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-extrabold text-stone-900 dark:text-white">
              Top 5 Món Bán Chạy Nhất ({dateRange.label})
            </h3>
          </div>
          <span className="text-xs text-stone-400 font-mono">
            {topSellingItems.length} món ghi nhận
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-stone-400 border-b border-stone-100 dark:border-stone-800 pb-2">
              <tr>
                <th className="py-2">Hạng</th>
                <th className="py-2">Món Ăn</th>
                <th className="py-2 text-center">Trạm</th>
                <th className="py-2 text-right">Đơn Giá</th>
                <th className="py-2 text-center">Số Lượng Bán</th>
                <th className="py-2 text-right">Tổng Doanh Thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-medium">
              {topSellingItems.length > 0 ? (
                topSellingItems.map((item, idx) => (
                  <tr key={item.menuItem.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                    <td className="py-3">
                      <span
                        className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-black text-xs ${
                          idx === 0
                            ? 'bg-amber-500 text-white'
                            : idx === 1
                            ? 'bg-stone-300 dark:bg-stone-700 text-stone-800 dark:text-white'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>

                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.menuItem.image_url}
                          alt={item.menuItem.name}
                          className="w-10 h-10 rounded-xl object-cover bg-stone-100"
                        />
                        <div>
                          <div className="font-bold text-stone-900 dark:text-white">
                            {item.menuItem.name}
                          </div>
                          <div className="text-[11px] text-stone-400 line-clamp-1">
                            {item.menuItem.description}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                          item.menuItem.station === 'kitchen' ? 'bg-orange-500' : 'bg-cyan-600'
                        }`}
                      >
                        {item.menuItem.station === 'kitchen' ? (
                          <Flame className="w-2.5 h-2.5" />
                        ) : (
                          <Wine className="w-2.5 h-2.5" />
                        )}
                        {item.menuItem.station === 'kitchen' ? 'Bếp' : 'Bar'}
                      </span>
                    </td>

                    <td className="py-3 text-right font-bold text-stone-700 dark:text-stone-300">
                      {formatCurrencyVND(item.menuItem.price)}
                    </td>

                    <td className="py-3 text-center font-black font-mono text-sm text-stone-900 dark:text-white">
                      {item.quantitySold} suất
                    </td>

                    <td className="py-3 text-right font-black text-sm text-amber-600 dark:text-amber-400">
                      {formatCurrencyVND(item.revenue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    <p className="text-xs">Chưa có món ăn nào bán ra trong khoảng thời gian này</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
