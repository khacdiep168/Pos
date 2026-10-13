import { describe, it, expect, beforeEach } from 'vitest';
import { inventoryService } from '../inventoryService';
import { Order, RawMaterial } from '@/types';

describe('InventoryService - Quản lý Giá Vốn & Tồn Kho Tự Động', () => {
  let testMaterial: RawMaterial;

  beforeEach(() => {
    // Tạo nguyên liệu kiểm thử với tồn kho xác định
    testMaterial = inventoryService.addRawMaterial({
      name: `Hạt Cà Phê Robusta Test ${Date.now()}`,
      category: 'beverage_base',
      purchase_unit: 'kg',
      recipe_unit: 'g',
      conversion_factor: 1000, // 1 kg = 1000 g
      current_stock: 5000,     // 5,000 g (5 kg)
      min_stock_level: 1000,
      avg_cost: 250,           // 250đ / g (250,000đ / kg)
      supplier_id: 'sup-1',
    });
  });

  it('tính toán chính xác giá vốn bình quân di động (Moving Average Cost) khi nhập hàng mới', () => {
    const initialStock = testMaterial.current_stock; // 5000g
    const initialCost = testMaterial.avg_cost;       // 250đ/g

    // Nhập thêm 5kg với giá 350.000đ / kg => 350đ / g
    const purchaseQtyKg = 5;
    const purchasePricePerKg = 350000;
    const newRecipeQty = purchaseQtyKg * testMaterial.conversion_factor; // 5000g
    const newCostPerGram = purchasePricePerKg / testMaterial.conversion_factor; // 350đ/g

    inventoryService.createPurchaseOrder('sup-1', [
      {
        raw_material_id: testMaterial.id,
        quantity: purchaseQtyKg,
        unit_price: purchasePricePerKg,
      },
    ]);

    const updatedMaterials = inventoryService.getRawMaterials();
    const updated = updatedMaterials.find((m) => m.id === testMaterial.id);

    expect(updated).toBeDefined();
    // Tồn kho mới = 5000 + 5000 = 10,000g
    expect(updated?.current_stock).toBe(initialStock + newRecipeQty);

    // Giá vốn bình quân mới = (5000 * 250 + 5000 * 350) / 10000 = 300đ/g
    const expectedAvgCost = Math.round(
      (initialStock * initialCost + newRecipeQty * newCostPerGram) / (initialStock + newRecipeQty)
    );
    expect(updated?.avg_cost).toBe(expectedAvgCost);
    expect(updated?.avg_cost).toBe(300);
  });

  it('tự động trừ tồn kho định mức (BOM) khi đơn hàng hoàn tất', () => {
    const testMenuItemId = `dish-cafe-${Date.now()}`;

    // Lưu công thức BOM cho 1 ly Cà phê: tốn 25g Hạt cà phê
    inventoryService.saveRecipeBOM(testMenuItemId, [
      {
        raw_material_id: testMaterial.id,
        quantity: 25, // 25g / ly
      },
    ]);

    const currentStockBefore = inventoryService.getRawMaterials().find((m) => m.id === testMaterial.id)?.current_stock || 0;

    // Giả lập đơn hàng khách gọi 4 ly Cà phê
    const order: Order = {
      id: `ord-coffee-${Date.now()}`,
      table_id: 'tbl-1',
      table_number: 'BÀN 01',
      order_status: 'completed',
      payment_status: 'paid',
      subtotal: 120000,
      tax_amount: 9600,
      discount_amount: 0,
      total_amount: 129600,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [
        {
          id: 'item-1',
          order_id: 'ord-coffee',
          menu_item_id: testMenuItemId,
          menu_item_name: 'Cà phê Đen Đá',
          quantity: 4, // 4 ly => Tiêu thụ 4 * 25g = 100g
          price: 30000,
          item_status: 'served',
          station: 'bar',
          created_at: new Date().toISOString(),
        },
      ],
    };

    const deductionResult = inventoryService.deductStockForOrder(order);

    expect(deductionResult.deductedMaterials.length).toBeGreaterThan(0);
    const coffeeDeducted = deductionResult.deductedMaterials.find((d) => d.name === testMaterial.name);
    expect(coffeeDeducted?.quantity).toBe(100); // 4 ly * 25g = 100g

    const stockAfter = inventoryService.getRawMaterials().find((m) => m.id === testMaterial.id)?.current_stock;
    expect(stockAfter).toBe(currentStockBefore - 100);
  });

  it('tính đúng giá vốn món ăn (COGS) dựa theo bảng định mức BOM', () => {
    const testDishId = `dish-steak-${Date.now()}`;

    // Tạo thêm 1 nguyên liệu phụ (Gia vị 500đ / g)
    const spice = inventoryService.addRawMaterial({
      name: `Gia Vị Ướp Test ${Date.now()}`,
      category: 'seasoning',
      purchase_unit: 'kg',
      recipe_unit: 'g',
      conversion_factor: 1000,
      current_stock: 1000,
      min_stock_level: 100,
      avg_cost: 500, // 500đ / g
      supplier_id: 'sup-1',
    });

    // BOM: 10g hạt cà phê (250đ/g = 2500đ) + 5g gia vị (500đ/g = 2500đ) => COGS = 5000đ
    inventoryService.saveRecipeBOM(testDishId, [
      { raw_material_id: testMaterial.id, quantity: 10 },
      { raw_material_id: spice.id, quantity: 5 },
    ]);

    const currentMaterial = inventoryService.getRawMaterials().find((m) => m.id === testMaterial.id)!;
    const cost = inventoryService.calculateMenuItemCost(testDishId);
    expect(cost).toBe(10 * currentMaterial.avg_cost + 5 * spice.avg_cost);
  });
});
