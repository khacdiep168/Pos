'use client';

import React, { useState, useMemo } from 'react';
import {
  calculateMultiChannelPricing,
  roundPriceVND,
  RoundingMode,
} from '@/lib/pricingEngine';
import { formatCurrencyVND } from '@/lib/utils';
import {
  Utensils,
  ShoppingBag,
  Bike,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Package,
  Percent,
  Sliders,
  Check,
  RefreshCw,
} from 'lucide-react';

interface SmartPricingSimulatorProps {
  coreBomCost: number; // Vốn cốt nguyên liệu (không gồm bao bì)
  packagingCost: number; // Chi phí bao bì mang về
  currentDineInPrice?: number;
  currentTakeawayPrice?: number;
  currentDeliveryPrice?: number;
  onApplyPrices?: (prices: {
    dineInPrice: number;
    takeawayPrice: number;
    deliveryPrice: number;
    packagingCost: number;
    appCommissionRate: number;
  }) => void;
  onApplySinglePrice?: (channel: 'dine_in' | 'takeaway' | 'delivery', price: number) => void;
  compact?: boolean;
}

export const SmartPricingSimulator: React.FC<SmartPricingSimulatorProps> = ({
  coreBomCost,
  packagingCost: initialPackagingCost,
  currentDineInPrice = 0,
  currentTakeawayPrice = 0,
  currentDeliveryPrice = 0,
  onApplyPrices,
  onApplySinglePrice,
  compact = false,
}) => {
  const [targetFoodCost, setTargetFoodCost] = useState(32);
  const [appCommissionRate, setAppCommissionRate] = useState(25);
  const [wastagePercent, setWastagePercent] = useState(3);
  const [packagingCost, setPackagingCost] = useState(initialPackagingCost || 0);
  const [roundingMode, setRoundingMode] = useState<RoundingMode>('1000');
  const [takeawayMode, setTakeawayMode] = useState<'plusPackaging' | 'sameAsDineIn'>('plusPackaging');
  const [selectedDineInPrice, setSelectedDineInPrice] = useState<number>(currentDineInPrice || 0);

  // Sync packagingCost if prop updates
  React.useEffect(() => {
    if (initialPackagingCost !== undefined && initialPackagingCost !== packagingCost) {
      setPackagingCost(initialPackagingCost);
    }
  }, [initialPackagingCost]);

  // Recalculate
  const pricingResult = useMemo(() => {
    return calculateMultiChannelPricing({
      coreBomCost,
      packagingCost,
      wastagePercent,
      targetFoodCostPercent: targetFoodCost,
      appCommissionRate,
      currentDineInPrice: selectedDineInPrice > 0 ? selectedDineInPrice : undefined,
    });
  }, [coreBomCost, packagingCost, wastagePercent, targetFoodCost, appCommissionRate, selectedDineInPrice]);

  const roundedDineIn = useMemo(
    () => roundPriceVND(pricingResult.dineIn.suggestedPrice, roundingMode),
    [pricingResult.dineIn.suggestedPrice, roundingMode]
  );

  const roundedTakeaway = useMemo(() => {
    const raw = takeawayMode === 'plusPackaging'
      ? pricingResult.takeaway.plusPackaging.price
      : pricingResult.takeaway.sameAsDineIn.price;
    return roundPriceVND(raw, roundingMode);
  }, [pricingResult.takeaway, takeawayMode, roundingMode]);

  const roundedDelivery = useMemo(
    () => roundPriceVND(pricingResult.delivery.suggestedPrice, roundingMode),
    [pricingResult.delivery.suggestedPrice, roundingMode]
  );

  const getHealthBadge = (status: 'healthy' | 'acceptable' | 'danger', costPercent: number) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Lãi Tốt ({costPercent}%)
          </span>
        );
      case 'acceptable':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            An Toàn ({costPercent}%)
          </span>
        );
      case 'danger':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" />
            Bào Mòn Lãi ({costPercent}%)
          </span>
        );
    }
  };

  const handleApplyAll = () => {
    if (onApplyPrices) {
      onApplyPrices({
        dineInPrice: roundedDineIn,
        takeawayPrice: roundedTakeaway,
        deliveryPrice: roundedDelivery,
        packagingCost,
        appCommissionRate,
      });
    }
  };

  return (
    <div className="space-y-4 rounded-2xl bg-stone-900/40 p-4 border border-stone-800">
      {/* Header & Financial Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-white">
              Ma Trận Định Giá Đa Kênh F&B
            </h3>
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Mô hình Gross-up tự động bảo toàn biên lợi nhuận giữa Tại bàn, Mang về và App Giao hàng
          </p>
        </div>

        {/* Global Rounding Buttons */}
        <div className="flex items-center gap-1.5 bg-stone-900 p-1 rounded-xl border border-stone-800 self-start sm:self-auto">
          <span className="text-[10px] text-stone-400 px-1 font-medium">Làm tròn:</span>
          {(['1000', '5000', '9000'] as RoundingMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setRoundingMode(mode)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                roundingMode === mode
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {mode === '1000' ? '1.000đ' : mode === '5000' ? '5.000đ' : 'Đuôi 9k'}
            </button>
          ))}
        </div>
      </div>

      {/* Input Configuration Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-stone-900/60 p-3 rounded-xl border border-stone-800/80 text-xs">
        <div>
          <span className="text-stone-400 text-[10px] block">Vốn Cốt Chế Biến</span>
          <span className="text-white font-bold font-mono">
            {formatCurrencyVND(coreBomCost)}
          </span>
        </div>

        <div>
          <label className="text-stone-400 text-[10px] block flex items-center justify-between">
            <span>Chi Phí Bao Bì</span>
            <Package className="w-3 h-3 text-cyan-400" />
          </label>
          <input
            type="number"
            min={0}
            step={500}
            value={packagingCost}
            onChange={(e) => setPackagingCost(Math.max(0, Number(e.target.value) || 0))}
            className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1 text-white text-xs font-mono font-bold mt-0.5 focus:border-cyan-500 focus:outline-hidden"
            placeholder="0đ"
          />
        </div>

        <div>
          <label className="text-stone-400 text-[10px] block flex items-center justify-between">
            <span>Food Cost Mục Tiêu</span>
            <span className="font-bold text-amber-400">{targetFoodCost}%</span>
          </label>
          <input
            type="range"
            min={20}
            max={45}
            value={targetFoodCost}
            onChange={(e) => setTargetFoodCost(Number(e.target.value))}
            className="w-full accent-amber-500 mt-1 cursor-pointer"
          />
        </div>

        <div>
          <label className="text-stone-400 text-[10px] block flex items-center justify-between">
            <span>Chiết Khấu App (Grab/Shopee)</span>
            <span className="font-bold text-orange-400">{appCommissionRate}%</span>
          </label>
          <input
            type="range"
            min={15}
            max={35}
            value={appCommissionRate}
            onChange={(e) => setAppCommissionRate(Number(e.target.value))}
            className="w-full accent-orange-500 mt-1 cursor-pointer"
          />
        </div>
      </div>

      {/* 3 Bento Cards for Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Bento 1: Tại Bàn (Dine-in) */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3.5 space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-400">
                <Utensils className="w-3.5 h-3.5" />
                1. Ăn Tại Bàn (Dine-in)
              </span>
              {getHealthBadge(pricingResult.dineIn.healthStatus, pricingResult.dineIn.foodCostPercent)}
            </div>

            <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-stone-400 text-[11px]">
                <span>Giá vốn (kèm 3% hao hụt):</span>
                <span>{formatCurrencyVND(pricingResult.dineIn.cost)}</span>
              </div>
              <div className="flex justify-between text-stone-400 text-[11px]">
                <span>Lãi gộp ước tính:</span>
                <span className="text-emerald-400 font-bold">
                  +{formatCurrencyVND(pricingResult.dineIn.grossProfit)}
                </span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-[10px] text-stone-400 uppercase font-semibold">Giá Đề Xuất Bán</span>
              <div className="text-xl font-black text-white font-mono">
                {formatCurrencyVND(roundedDineIn)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onApplySinglePrice && onApplySinglePrice('dine_in', roundedDineIn)}
            className="w-full py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Áp Dụng Giá Tại Bàn</span>
          </button>
        </div>

        {/* Bento 2: Mang Về (Takeaway) */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3.5 space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-cyan-400">
                <ShoppingBag className="w-3.5 h-3.5" />
                2. Mang Về (Takeaway)
              </span>
              {getHealthBadge(
                takeawayMode === 'plusPackaging'
                  ? pricingResult.takeaway.plusPackaging.healthStatus
                  : pricingResult.takeaway.sameAsDineIn.healthStatus,
                takeawayMode === 'plusPackaging'
                  ? pricingResult.takeaway.plusPackaging.foodCostPercent
                  : pricingResult.takeaway.sameAsDineIn.foodCostPercent
              )}
            </div>

            {/* Toggle Mode: Đồng giá vs Cộng phụ phí */}
            <div className="grid grid-cols-2 gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-center text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setTakeawayMode('plusPackaging')}
                className={`py-1 rounded-lg transition-all ${
                  takeawayMode === 'plusPackaging'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                + Phụ Phí Bao Bì
              </button>
              <button
                type="button"
                onClick={() => setTakeawayMode('sameAsDineIn')}
                className={`py-1 rounded-lg transition-all ${
                  takeawayMode === 'sameAsDineIn'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Đồng Giá Tại Bàn
              </button>
            </div>

            <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-stone-400 text-[11px]">
                <span>Vốn (Món + Bao bì):</span>
                <span>{formatCurrencyVND(pricingResult.takeaway.cost)}</span>
              </div>
              <div className="flex justify-between text-stone-400 text-[11px]">
                <span>Lãi gộp:</span>
                <span className="text-emerald-400 font-bold">
                  +{formatCurrencyVND(
                    takeawayMode === 'plusPackaging'
                      ? pricingResult.takeaway.plusPackaging.grossProfit
                      : pricingResult.takeaway.sameAsDineIn.grossProfit
                  )}
                  {takeawayMode === 'sameAsDineIn' && (
                    <span className="text-rose-400 text-[10px] ml-1">
                      (-{formatCurrencyVND(packagingCost)})
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-[10px] text-stone-400 uppercase font-semibold">Giá Đề Xuất Mang Về</span>
              <div className="text-xl font-black text-cyan-400 font-mono">
                {formatCurrencyVND(roundedTakeaway)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onApplySinglePrice && onApplySinglePrice('takeaway', roundedTakeaway)}
            className="w-full py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Áp Dụng Giá Mang Về</span>
          </button>
        </div>

        {/* Bento 3: App Giao Hàng (Delivery App) */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3.5 space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-400">
                <Bike className="w-3.5 h-3.5" />
                3. App Giao Hàng (Gross-up)
              </span>
              {getHealthBadge(pricingResult.delivery.healthStatus, pricingResult.delivery.foodCostPercent)}
            </div>

            <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-stone-400 text-[11px]">
                <span>Phí sàn thu ({appCommissionRate}%):</span>
                <span className="text-rose-400">-{formatCurrencyVND(pricingResult.delivery.appFee)}</span>
              </div>
              <div className="flex justify-between text-stone-400 text-[11px]">
                <span>Quán thực nhận (Net):</span>
                <span className="text-white font-bold">{formatCurrencyVND(pricingResult.delivery.netRevenue)}</span>
              </div>
              <div className="flex justify-between text-stone-400 text-[11px]">
                <span>Lãi gộp sau vốn & bao bì:</span>
                <span className="text-emerald-400 font-bold">
                  +{formatCurrencyVND(pricingResult.delivery.grossProfit)}
                </span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-[10px] text-stone-400 uppercase font-semibold">Giá Niêm Yết Trên App</span>
              <div className="text-xl font-black text-emerald-400 font-mono">
                {formatCurrencyVND(roundedDelivery)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onApplySinglePrice && onApplySinglePrice('delivery', roundedDelivery)}
            className="w-full py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Áp Dụng Giá App</span>
          </button>
        </div>
      </div>

      {/* One-Click Apply All Channels Button */}
      {onApplyPrices && (
        <div className="pt-1 flex items-center justify-end">
          <button
            type="button"
            onClick={handleApplyAll}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Áp Dụng Giá Cho Cả 3 Kênh (Tại Bàn + Mang Về + App)</span>
          </button>
        </div>
      )}
    </div>
  );
};
