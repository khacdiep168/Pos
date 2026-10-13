import { Promotion } from '@/types';
import { adminService } from './adminService';
import { formatCurrencyVND } from '@/lib/utils';

export interface PromotionApplyResult {
  success: boolean;
  discountAmount: number;
  promo?: Promotion;
  message: string;
}

export const promotionService = {
  getActivePromotions(): Promotion[] {
    return adminService.getPromotions().filter((p) => p.is_active);
  },

  getAllPromotions(): Promotion[] {
    return adminService.getPromotions();
  },

  applyPromotion(codeOrId: string, subtotal: number): PromotionApplyResult {
    const cleanCode = codeOrId.trim().toUpperCase();
    if (!cleanCode) {
      return {
        success: false,
        discountAmount: 0,
        message: 'Vui lòng nhập mã khuyến mãi!',
      };
    }

    const promos = adminService.getPromotions();
    const promo = promos.find(
      (p) => p.promo_code.toUpperCase() === cleanCode || p.id === codeOrId
    );

    if (!promo) {
      return {
        success: false,
        discountAmount: 0,
        message: `Mã ưu đãi "${cleanCode}" không tồn tại hoặc đã hết hiệu lực!`,
      };
    }

    if (!promo.is_active) {
      return {
        success: false,
        discountAmount: 0,
        message: `Mã ưu đãi "${promo.promo_code}" hiện đang tạm ngưng áp dụng!`,
      };
    }

    if (promo.min_order_value && subtotal < promo.min_order_value) {
      return {
        success: false,
        discountAmount: 0,
        message: `Mã này chỉ áp dụng cho đơn hàng từ ${formatCurrencyVND(promo.min_order_value)} trở lên (Tạm tính hiện tại: ${formatCurrencyVND(subtotal)})!`,
      };
    }

    let discountAmount = 0;
    if (promo.discount_type === 'percent') {
      discountAmount = Math.round(subtotal * (promo.discount_value / 100));
    } else {
      discountAmount = Math.min(promo.discount_value, subtotal);
    }

    return {
      success: true,
      discountAmount,
      promo,
      message: `Đã áp dụng mã ${promo.promo_code}: Giảm ${formatCurrencyVND(discountAmount)}`,
    };
  },
};
