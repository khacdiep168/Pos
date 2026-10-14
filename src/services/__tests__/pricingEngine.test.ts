import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateMultiChannelPricing,
  roundPriceVND,
  calculateFoodCostHealth,
} from '@/lib/pricingEngine';
import { inventoryService } from '@/services/inventoryService';
import { orderService } from '@/services/orderService';
import { Order, OrderItem, RawMaterial, RecipeBOM } from '@/types';

describe('Pricing Engine & Multi-Channel Calculations (F&B Financial Architecture)', () => {
  it('should accurately calculate Dine-in cost and suggested price based on target food cost', () => {
    const coreBomCost = 15000;
    const wastagePercent = 5; // 5% wastage
    const targetFoodCost = 30; // 30% target food cost

    const result = calculateMultiChannelPricing({
      coreBomCost,
      packagingCost: 3000,
      wastagePercent,
      targetFoodCostPercent: targetFoodCost,
      appCommissionRate: 25,
      roundingMode: 'none',
      takeawayMode: 'plusPackaging',
    });

    // dineInCost = 15000 * 1.05 = 15750
    expect(result.dineIn.cost).toBe(15750);
    // suggestedDineIn = 15750 / 0.30 = 52500
    expect(result.dineIn.suggestedPrice).toBe(52500);
    expect(result.dineIn.foodCostPercent).toBe(30);
    expect(result.dineIn.healthStatus).toBe('healthy');
  });

  it('should calculate Takeaway price in both plusPackaging and sameAsDineIn modes', () => {
    const coreBomCost = 15000;
    const packagingCost = 4000;
    const currentDineInPrice = 50000;

    const result = calculateMultiChannelPricing({
      coreBomCost,
      packagingCost,
      currentDineInPrice,
      wastagePercent: 0,
      targetFoodCostPercent: 30,
      appCommissionRate: 25,
      roundingMode: 'none',
      takeawayMode: 'plusPackaging',
    });

    // plusPackaging mode: 50000 + 4000 = 54000
    expect(result.takeaway.cost).toBe(15000 + 4000);
    expect(result.takeaway.plusPackaging.price).toBe(54000);
    expect(result.takeaway.plusPackaging.grossProfit).toBe(54000 - 19000); // 35000

    // sameAsDineIn mode: 50000
    expect(result.takeaway.sameAsDineIn.price).toBe(50000);
    expect(result.takeaway.sameAsDineIn.grossProfit).toBe(50000 - 19000); // 31000
    expect(result.takeaway.sameAsDineIn.profitDifference).toBe(-4000); // Lãi giảm đúng 4k tiền bao bì
  });

  it('should use mathematical Gross-up formula for Delivery App to guarantee zero profit loss', () => {
    const dineInPrice = 50000;
    const packagingCost = 5000;
    const commission = 25; // 25% app fee

    const result = calculateMultiChannelPricing({
      coreBomCost: 15000,
      packagingCost,
      currentDineInPrice: dineInPrice,
      wastagePercent: 0,
      targetFoodCostPercent: 30,
      appCommissionRate: commission,
      roundingMode: 'none',
      takeawayMode: 'plusPackaging',
    });

    // Gross-up formula: Math.round((50000 + 5000) / (1 - 0.25)) = Math.round(55000 / 0.75) = 73333
    expect(result.delivery.suggestedPrice).toBe(73333);

    // Net revenue quán thực nhận sau khi app thu 25% phí chiết khấu:
    // appFee = Math.round(73333 * 0.25) = 18333
    // netRevenue = 73333 - 18333 = 55000!
    expect(result.delivery.netRevenue).toBe(55000);
    expect(result.delivery.grossProfit).toBe(55000 - 20000); // 35000 (= lãi dine-in!)
  });

  it('should round prices according to Vietnamese Dong commercial standards (1k, 5k, 9k psychology)', () => {
    const rawPrice = 52340;

    // Round to 1,000 VND
    expect(roundPriceVND(rawPrice, '1000')).toBe(52000);
    expect(roundPriceVND(52600, '1000')).toBe(53000);

    // Round to 5,000 VND
    expect(roundPriceVND(52340, '5000')).toBe(50000);
    expect(roundPriceVND(53000, '5000')).toBe(55000);

    // Psychological pricing ending in 9,000 VND (52.340đ -> 59.000đ)
    expect(roundPriceVND(52340, '9000')).toBe(59000);
    expect(roundPriceVND(56000, '9000')).toBe(59000);
    expect(roundPriceVND(51000, '9000')).toBe(49000);
  });

  it('should correctly grade profit health levels', () => {
    expect(calculateFoodCostHealth(25)).toBe('healthy');
    expect(calculateFoodCostHealth(30)).toBe('healthy');
    expect(calculateFoodCostHealth(34)).toBe('acceptable');
    expect(calculateFoodCostHealth(38)).toBe('acceptable');
    expect(calculateFoodCostHealth(39)).toBe('danger');
    expect(calculateFoodCostHealth(45)).toBe('danger');
  });
});

describe('Smart Channel-Aware Inventory Deduction (inventoryService)', () => {
  let coreMatId = '';
  let pkgMatId = '';
  const testDishId = `dish-coffee-${Date.now()}`;

  beforeEach(() => {
    // Add raw materials via public inventoryService methods
    const core = inventoryService.addRawMaterial({
      name: `Cà Phê Robusta Hạt ${Date.now()}`,
      purchase_unit: 'kg',
      recipe_unit: 'g',
      conversion_factor: 1000,
      current_stock: 5000,
      min_stock_level: 500,
      avg_cost: 250,
    });
    coreMatId = core.id;

    const pkg = inventoryService.addRawMaterial({
      name: `Ly Giấy Mang Về 500ml ${Date.now()}`,
      purchase_unit: 'lốc',
      recipe_unit: 'cái',
      conversion_factor: 50,
      current_stock: 200,
      min_stock_level: 30,
      avg_cost: 1200,
    });
    pkgMatId = pkg.id;

    // Save recipe with core ingredient and packaging ingredient
    inventoryService.saveRecipeBOM(testDishId, [
      {
        raw_material_id: coreMatId,
        quantity: 20, // 20g cà phê
        is_packaging: false,
      },
      {
        raw_material_id: pkgMatId,
        quantity: 1, // 1 ly giấy
        is_packaging: true,
      },
    ]);
  });

  it('should only deduct core ingredients for dine_in orders and NOT packaging materials', () => {
    const dineInOrder: Order = {
      id: `ord-dine-in-${Date.now()}`,
      table_id: 'table-01',
      table_number: 'Bàn 01',
      order_channel: 'dine_in',
      order_status: 'completed',
      payment_status: 'paid',
      subtotal: 35000,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: 35000,
      items: [
        {
          id: 'item-1',
          order_id: 'ord-dine-in-test',
          menu_item_id: testDishId,
          menu_item_name: 'Cà Phê Sữa Đá',
          quantity: 2, // 2 cups
          price: 35000,
          item_status: 'served',
          station: 'bar',
          created_at: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const deductedResult = inventoryService.deductStockForOrder(dineInOrder);
    expect(deductedResult.deductedMaterials.length).toBe(1); // Only core material deducted

    const materials = inventoryService.getRawMaterials();
    const coreMat = materials.find((m) => m.id === coreMatId);
    const pkgMat = materials.find((m) => m.id === pkgMatId);

    // 2 cups * 20g = 40g deducted from 5000
    expect(coreMat?.current_stock).toBe(4960);
    // Packaging should NOT be deducted for dine-in!
    expect(pkgMat?.current_stock).toBe(200);
  });

  it('should deduct BOTH core ingredients AND packaging materials for takeaway and delivery orders', () => {
    const takeawayOrder: Order = {
      id: `ord-takeaway-${Date.now()}`,
      table_id: 'takeaway-01',
      table_number: 'Mang Về #01',
      order_channel: 'takeaway',
      order_status: 'completed',
      payment_status: 'paid',
      subtotal: 40000,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: 40000,
      items: [
        {
          id: 'item-tk-1',
          order_id: 'ord-takeaway-test',
          menu_item_id: testDishId,
          menu_item_name: 'Cà Phê Sữa Đá',
          quantity: 3, // 3 cups takeaway
          price: 40000,
          item_status: 'served',
          station: 'bar',
          created_at: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const deductedResult = inventoryService.deductStockForOrder(takeawayOrder);
    expect(deductedResult.deductedMaterials.length).toBe(2); // Both core and packaging deducted

    const materials = inventoryService.getRawMaterials();
    const coreMat = materials.find((m) => m.id === coreMatId);
    const pkgMat = materials.find((m) => m.id === pkgMatId);

    // 3 cups * 20g = 60g deducted
    expect(coreMat?.current_stock).toBe(4940);
    // 3 cups * 1 ly = 3 ly deducted from 200
    expect(pkgMat?.current_stock).toBe(197);
  });
});
