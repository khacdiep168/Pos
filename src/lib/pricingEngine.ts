/**
 * F&B Multi-Channel Pricing Engine (Bộ máy Định giá Đa Kênh F&B)
 * Derived from modern F&B financial management practices & Gross-up formulas.
 */

export interface PricingInput {
  coreBomCost: number; // Vốn cốt nguyên liệu pha chế / nấu nướng (không gồm bao bì)
  packagingCost: number; // Chi phí bao bì (ly, nắp, túi, hộp, muỗng nĩa mang về)
  wastagePercent?: number; // Tỷ lệ hao hụt dự phòng (% ví dụ: 3% - 5%, mặc định 3%)
  targetFoodCostPercent?: number; // % Food Cost mục tiêu tại bàn (mặc định 32%)
  appCommissionRate?: number; // % Chiết khấu sàn giao đồ ăn (mặc định 25%)
  currentDineInPrice?: number; // Giá bán tại bàn hiện tại (nếu đã có)
  roundingMode?: RoundingMode; // Chế độ làm tròn giá VNĐ (1000, 5000, 9000, none)
  takeawayMode?: 'plusPackaging' | 'sameAsDineIn'; // Chế độ định giá mang về mặc định
}

export interface ChannelPricingResult {
  // 1. Tại Bàn (Dine-in)
  dineIn: {
    cost: number; // dineInCost = coreBomCost * (1 + wastagePercent / 100)
    suggestedPrice: number; // cost / (targetFoodCostPercent / 100)
    grossProfit: number;
    foodCostPercent: number;
    healthStatus: 'healthy' | 'acceptable' | 'danger';
  };

  // 2. Mang Về (Takeaway)
  takeaway: {
    cost: number; // takeawayCost = dineInCost + packagingCost
    // Chế độ 1: Đồng giá tại bàn
    sameAsDineIn: {
      price: number;
      grossProfit: number;
      profitDifference: number; // So với ăn tại bàn (bị giảm do bao bì)
      foodCostPercent: number;
      healthStatus: 'healthy' | 'acceptable' | 'danger';
    };
    // Chế độ 2: Cộng phụ phí bao bì (Bảo toàn lãi gộp)
    plusPackaging: {
      price: number; // dineInPrice + packagingCost
      grossProfit: number;
      foodCostPercent: number;
      healthStatus: 'healthy' | 'acceptable' | 'danger';
    };
  };

  // 3. App Giao Đồ Ăn (Delivery App - Gross-up formula)
  delivery: {
    cost: number; // takeawayCost
    suggestedPrice: number; // (dineInPrice + packagingCost) / (1 - appCommissionRate / 100)
    appFee: number; // suggestedPrice * (appCommissionRate / 100)
    netRevenue: number; // suggestedPrice - appFee (thực nhận)
    grossProfit: number; // netRevenue - takeawayCost (bảo toàn lãi gộp tại quán)
    foodCostPercent: number; // cost / suggestedPrice * 100
    healthStatus: 'healthy' | 'acceptable' | 'danger';
  };
}

export type RoundingMode = '1000' | '5000' | '9000' | 'none';

/**
 * Làm tròn giá đẹp theo thói quen người tiêu dùng F&B Việt Nam
 */
export function roundPriceVND(price: number, mode: RoundingMode = '1000'): number {
  if (price <= 0) return 0;
  switch (mode) {
    case '1000':
      return Math.round(price / 1000) * 1000;
    case '5000':
      return Math.round(price / 5000) * 5000;
    case '9000': {
      // Tâm lý giá đuôi 9.000đ (ví dụ 43.000đ -> 49.000đ, 56.000đ -> 59.000đ)
      const base = Math.floor(price / 10000) * 10000;
      const remainder = price - base;
      if (remainder <= 2000) {
        return Math.max(9000, base - 1000);
      }
      return base + 9000;
    }
    case 'none':
    default:
      return Math.round(price);
  }
}

/**
 * Đánh giá chỉ số Sức khỏe Lợi nhuận dựa trên Food Cost %
 * - < 30%: Lãi gộp tuyệt vời (healthy - Emerald)
 * - 30% - 38%: Mức an toàn chuẩn F&B (acceptable - Amber)
 * - > 38%: Cảnh báo rủi ro bào mòn biên lợi nhuận (danger - Rose)
 */
export function evaluateHealthStatus(foodCostPercent: number): 'healthy' | 'acceptable' | 'danger' {
  if (foodCostPercent <= 30) return 'healthy';
  if (foodCostPercent <= 38) return 'acceptable';
  return 'danger';
}

export const calculateFoodCostHealth = evaluateHealthStatus;

/**
 * Tính toán tài chính đa kênh toàn diện
 */
export function calculateMultiChannelPricing(input: PricingInput): ChannelPricingResult {
  const wastage = input.wastagePercent ?? 3;
  const targetFoodCost = input.targetFoodCostPercent ?? 32;
  const appCommission = input.appCommissionRate ?? 25;
  const rounding = input.roundingMode ?? '1000';

  // 1. Tại Bàn
  const dineInCost = Math.round(input.coreBomCost * (1 + wastage / 100));
  const suggestedDineInRaw = targetFoodCost > 0 ? (dineInCost / (targetFoodCost / 100)) : dineInCost;
  const suggestedDineIn = roundPriceVND(suggestedDineInRaw, rounding);
  const dineInPrice = input.currentDineInPrice && input.currentDineInPrice > 0
    ? input.currentDineInPrice
    : suggestedDineIn;

  const dineInGrossProfit = dineInPrice - dineInCost;
  const dineInFoodCostPercent = dineInPrice > 0 ? (dineInCost / dineInPrice) * 100 : 0;

  // 2. Mang Về
  const packagingCost = input.packagingCost || 0;
  const takeawayCost = dineInCost + packagingCost;

  // Chế độ đồng giá tại bàn
  const sameAsDineInPrice = dineInPrice;
  const sameAsDineInGrossProfit = sameAsDineInPrice - takeawayCost;
  const sameAsDineInProfitDiff = sameAsDineInGrossProfit - dineInGrossProfit; // = -packagingCost
  const sameAsDineInFoodCostPercent = sameAsDineInPrice > 0 ? (takeawayCost / sameAsDineInPrice) * 100 : 0;

  // Chế độ cộng phụ phí bao bì (Bảo toàn lãi gộp)
  const plusPackagingPrice = dineInPrice + packagingCost;
  const plusPackagingGrossProfit = plusPackagingPrice - takeawayCost; // = dineInGrossProfit
  const plusPackagingFoodCostPercent = plusPackagingPrice > 0 ? (takeawayCost / plusPackagingPrice) * 100 : 0;

  // 3. App Giao Đồ Ăn (Gross-up Formula)
  // Base cần thu về để bảo toàn lợi nhuận + bao bì = dineInPrice + packagingCost
  // suggestedAppPrice * (1 - appCommission / 100) = dineInPrice + packagingCost
  const commissionMultiplier = Math.max(0.01, 1 - (appCommission / 100));
  const suggestedAppPriceRaw = (dineInPrice + packagingCost) / commissionMultiplier;
  const suggestedAppPrice = roundPriceVND(suggestedAppPriceRaw, rounding);

  const appFee = Math.round(suggestedAppPrice * (appCommission / 100));
  const netRevenue = suggestedAppPrice - appFee;
  const deliveryGrossProfit = netRevenue - takeawayCost;
  const deliveryFoodCostPercent = suggestedAppPrice > 0 ? (takeawayCost / suggestedAppPrice) * 100 : 0;

  return {
    dineIn: {
      cost: dineInCost,
      suggestedPrice: suggestedDineIn,
      grossProfit: dineInGrossProfit,
      foodCostPercent: Number(dineInFoodCostPercent.toFixed(1)),
      healthStatus: evaluateHealthStatus(dineInFoodCostPercent),
    },
    takeaway: {
      cost: takeawayCost,
      sameAsDineIn: {
        price: sameAsDineInPrice,
        grossProfit: sameAsDineInGrossProfit,
        profitDifference: sameAsDineInProfitDiff,
        foodCostPercent: Number(sameAsDineInFoodCostPercent.toFixed(1)),
        healthStatus: evaluateHealthStatus(sameAsDineInFoodCostPercent),
      },
      plusPackaging: {
        price: roundPriceVND(plusPackagingPrice, rounding),
        grossProfit: plusPackagingGrossProfit,
        foodCostPercent: Number(plusPackagingFoodCostPercent.toFixed(1)),
        healthStatus: evaluateHealthStatus(plusPackagingFoodCostPercent),
      },
    },
    delivery: {
      cost: takeawayCost,
      suggestedPrice: suggestedAppPrice,
      appFee,
      netRevenue,
      grossProfit: deliveryGrossProfit,
      foodCostPercent: Number(deliveryFoodCostPercent.toFixed(1)),
      healthStatus: evaluateHealthStatus(deliveryFoodCostPercent),
    },
  };
}
