import {
  RawMaterial,
  RecipeBOM,
  Supplier,
  PurchaseOrder,
  InventoryTransaction,
  Order,
  StockAuditReport,
  StockAuditItem,
  SupplierDebtTransaction,
} from '@/types';
import {
  initialRawMaterials,
  initialRecipes,
  initialSuppliers,
  initialPurchaseOrders,
  initialSupplierDebtTransactions,
  addMockSupplier,
  updateMockSupplier,
  deleteMockSupplier,
  addMockSupplierDebtTransaction,
} from '@/database/mockData';
import { realtimeEngine } from './realtimeEngine';

const STORAGE_RAW_MATERIALS = 'pos_raw_materials';
const STORAGE_RECIPES = 'pos_recipes_bom';
const STORAGE_SUPPLIERS = 'pos_suppliers';
const STORAGE_PURCHASE_ORDERS = 'pos_purchase_orders';
const STORAGE_TRANSACTIONS = 'pos_inventory_transactions';
const STORAGE_STOCK_AUDITS = 'pos_stock_audits';
const STORAGE_SUPPLIER_DEBTS = 'pos_supplier_debts';

class InventoryService {
  private rawMaterials: RawMaterial[] = [];
  private recipes: RecipeBOM[] = [];
  private suppliers: Supplier[] = [];
  private purchaseOrders: PurchaseOrder[] = [];
  private transactions: InventoryTransaction[] = [];
  private stockAudits: StockAuditReport[] = [];
  private debtTransactions: SupplierDebtTransaction[] = [];
  private isListening = false;

  constructor() {
    this.initStorage();
    this.initRealtimeListener();
  }

  private initStorage() {
    if (typeof window !== 'undefined') {
      try {
        const savedMaterials = localStorage.getItem(STORAGE_RAW_MATERIALS);
        this.rawMaterials = savedMaterials ? JSON.parse(savedMaterials) : [...initialRawMaterials];

        const savedRecipes = localStorage.getItem(STORAGE_RECIPES);
        this.recipes = savedRecipes ? JSON.parse(savedRecipes) : [...initialRecipes];

        const savedSuppliers = localStorage.getItem(STORAGE_SUPPLIERS);
        this.suppliers = savedSuppliers ? JSON.parse(savedSuppliers) : [...initialSuppliers];

        const savedPOs = localStorage.getItem(STORAGE_PURCHASE_ORDERS);
        this.purchaseOrders = savedPOs ? JSON.parse(savedPOs) : [...initialPurchaseOrders];

        const savedTx = localStorage.getItem(STORAGE_TRANSACTIONS);
        this.transactions = savedTx ? JSON.parse(savedTx) : [];

        const savedAudits = localStorage.getItem(STORAGE_STOCK_AUDITS);
        this.stockAudits = savedAudits ? JSON.parse(savedAudits) : [];

        const savedDebts = localStorage.getItem(STORAGE_SUPPLIER_DEBTS);
        this.debtTransactions = savedDebts ? JSON.parse(savedDebts) : [...initialSupplierDebtTransactions];
      } catch {
        this.fallbackDefaults();
      }
    } else {
      this.fallbackDefaults();
    }
  }

  private fallbackDefaults() {
    this.rawMaterials = [...initialRawMaterials];
    this.recipes = [...initialRecipes];
    this.suppliers = [...initialSuppliers];
    this.purchaseOrders = [...initialPurchaseOrders];
    this.transactions = [];
    this.stockAudits = [];
    this.debtTransactions = [...initialSupplierDebtTransactions];
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_RAW_MATERIALS, JSON.stringify(this.rawMaterials));
      localStorage.setItem(STORAGE_RECIPES, JSON.stringify(this.recipes));
      localStorage.setItem(STORAGE_SUPPLIERS, JSON.stringify(this.suppliers));
      localStorage.setItem(STORAGE_PURCHASE_ORDERS, JSON.stringify(this.purchaseOrders));
      localStorage.setItem(STORAGE_TRANSACTIONS, JSON.stringify(this.transactions));
      localStorage.setItem(STORAGE_STOCK_AUDITS, JSON.stringify(this.stockAudits));
      localStorage.setItem(STORAGE_SUPPLIER_DEBTS, JSON.stringify(this.debtTransactions));
    }
  }

  private initRealtimeListener() {
    if (this.isListening) return;
    this.isListening = true;

    // Automatic ACID Inventory Trigger upon Order Payment
    realtimeEngine.subscribe('PAYMENT_COMPLETED', (payload: { order: Order }) => {
      if (payload && payload.order) {
        this.deductStockForOrder(payload.order);
      }
    });
  }

  public getRawMaterials(): RawMaterial[] {
    return [...this.rawMaterials];
  }

  public addRawMaterial(material: Omit<RawMaterial, 'id'>): RawMaterial {
    const newMaterial: RawMaterial = {
      ...material,
      id: `raw-${Date.now().toString().slice(-6)}`,
      current_stock: material.current_stock ?? 0,
      avg_cost: material.avg_cost ?? 0,
    };
    this.rawMaterials.unshift(newMaterial);
    this.save();
    realtimeEngine.emit('STOCK_ALERT', { type: 'MATERIAL_ADDED', material: newMaterial });
    return newMaterial;
  }

  public updateRawMaterial(id: string, updates: Partial<RawMaterial>): RawMaterial | null {
    const idx = this.rawMaterials.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    this.rawMaterials[idx] = { ...this.rawMaterials[idx], ...updates };
    this.save();
    realtimeEngine.emit('STOCK_ALERT', { type: 'MATERIAL_UPDATED', material: this.rawMaterials[idx] });
    return this.rawMaterials[idx];
  }

  public getRecipes(): RecipeBOM[] {
    return [...this.recipes];
  }

  public getRecipesByMenuItem(menuItemId: string): RecipeBOM[] {
    return this.recipes.filter((r) => r.menu_item_id === menuItemId);
  }

  public saveRecipeBOM(
    menuItemId: string,
    boms: { raw_material_id: string; quantity: number }[]
  ): void {
    // Remove old recipe entries for this menu item
    this.recipes = this.recipes.filter((r) => r.menu_item_id !== menuItemId);

    // Insert updated BOM
    boms.forEach((b, idx) => {
      this.recipes.push({
        id: `bom-${menuItemId}-${idx}-${Date.now()}`,
        menu_item_id: menuItemId,
        raw_material_id: b.raw_material_id,
        quantity: b.quantity,
      });
    });

    this.save();
    realtimeEngine.emit('STOCK_ALERT', { type: 'RECIPES_UPDATED', menuItemId });
  }

  public getSuppliers(): Supplier[] {
    return [...this.suppliers];
  }

  public addSupplier(supplier: Omit<Supplier, 'id'>): Supplier {
    const newSup: Supplier = {
      ...supplier,
      id: `sup-${Date.now().toString().slice(-6)}`,
      total_debt: supplier.total_debt ?? 0,
    };
    this.suppliers.push(newSup);
    addMockSupplier(newSup);
    this.save();
    realtimeEngine.emit('STOCK_ALERT', { type: 'SUPPLIER_ADDED', supplier: newSup });
    return newSup;
  }

  public updateSupplier(id: string, updates: Partial<Supplier>): Supplier | null {
    const idx = this.suppliers.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.suppliers[idx] = { ...this.suppliers[idx], ...updates };
    updateMockSupplier(id, updates);
    this.save();
    realtimeEngine.emit('STOCK_ALERT', { type: 'SUPPLIER_UPDATED', supplier: this.suppliers[idx] });
    return this.suppliers[idx];
  }

  public deleteSupplier(id: string): boolean {
    const idx = this.suppliers.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    this.suppliers.splice(idx, 1);
    deleteMockSupplier(id);
    this.save();
    realtimeEngine.emit('STOCK_ALERT', { type: 'SUPPLIER_DELETED', supplierId: id });
    return true;
  }

  // ==================== SUPPLIER DEBT LEDGER (SỔ CÔNG NỢ) ====================
  public getSupplierDebtTransactions(supplierId?: string): SupplierDebtTransaction[] {
    if (supplierId) {
      return this.debtTransactions.filter((tx) => tx.supplier_id === supplierId);
    }
    return [...this.debtTransactions];
  }

  public paySupplierDebt(
    supplierId: string,
    amount: number,
    notes?: string
  ): { transaction: SupplierDebtTransaction; supplier: Supplier } | null {
    const supplier = this.suppliers.find((s) => s.id === supplierId);
    if (!supplier || amount <= 0) return null;

    const currentDebt = supplier.total_debt || 0;
    const newDebt = Math.max(0, currentDebt - amount);
    supplier.total_debt = newDebt;
    updateMockSupplier(supplierId, { total_debt: newDebt });

    const now = new Date().toISOString();
    const txId = `pay-${Date.now().toString().slice(-6)}`;
    const debtTx: SupplierDebtTransaction = {
      id: txId,
      supplier_id: supplierId,
      type: 'payment',
      amount: amount,
      balance: newDebt,
      created_at: now,
      notes: notes || 'Thanh toán tiền công nợ cho nhà cung cấp',
      reference_id: txId,
    };

    this.debtTransactions.unshift(debtTx);
    addMockSupplierDebtTransaction(debtTx);
    this.save();

    realtimeEngine.emit('STOCK_ALERT', { type: 'SUPPLIER_PAYMENT', supplier, transaction: debtTx });
    return { transaction: debtTx, supplier };
  }

  public getPurchaseOrders(): PurchaseOrder[] {
    return [...this.purchaseOrders];
  }

  public getTransactions(): InventoryTransaction[] {
    return [...this.transactions];
  }

  // Automatic Stock Deduction upon completed Order
  public deductStockForOrder(order: Order): {
    deductedMaterials: { name: string; quantity: number; unit: string }[];
  } {
    const deductedMaterials: { name: string; quantity: number; unit: string }[] = [];
    const now = new Date().toISOString();

    order.items.forEach((orderItem) => {
      // Find BOM items for this menuItem
      const itemRecipes = this.recipes.filter((r) => r.menu_item_id === orderItem.menu_item_id);

      itemRecipes.forEach((recipe) => {
        const material = this.rawMaterials.find((m) => m.id === recipe.raw_material_id);
        if (material) {
          const totalConsumed = recipe.quantity * orderItem.quantity;
          material.current_stock = Math.max(0, material.current_stock - totalConsumed);

          // Add audit transaction log
          const tx: InventoryTransaction = {
            id: `tx-out-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            raw_material_id: material.id,
            raw_material_name: material.name,
            type: 'out',
            quantity_changed: -totalConsumed,
            unit: material.recipe_unit,
            reference_type: 'order',
            reference_id: order.id,
            created_at: now,
            created_by: `Order #${order.id.slice(-6)} (${order.table_number})`,
          };
          this.transactions.unshift(tx);

          deductedMaterials.push({
            name: material.name,
            quantity: totalConsumed,
            unit: material.recipe_unit,
          });

          // Check for Low Stock Warning
          if (material.current_stock < material.min_stock_level) {
            console.warn(`[STOCK ALERT] Low stock warning for ${material.name}: ${material.current_stock}${material.recipe_unit}`);
          }
        }
      });
    });

    this.save();
    realtimeEngine.emit('STOCK_ALERT', { orderId: order.id, deductedMaterials });
    return { deductedMaterials };
  }

  // Create Purchase Order (Procurement) & Update Stock & Moving Average Cost
  public createPurchaseOrder(
    supplierId: string,
    items: { raw_material_id: string; quantity: number; unit_price: number }[]
  ): PurchaseOrder {
    const supplier = this.suppliers.find((s) => s.id === supplierId);
    const supplierName = supplier?.name || 'Nhà Cung Cấp';
    const now = new Date().toISOString();

    const poId = `po-${Date.now().toString().slice(-6)}`;
    let totalAmount = 0;

    const poItems = items.map((it) => {
      const material = this.rawMaterials.find((m) => m.id === it.raw_material_id);
      const lineTotal = it.quantity * it.unit_price;
      totalAmount += lineTotal;

      if (material) {
        // Increment stock
        const recipeQtyAdded = it.quantity * material.conversion_factor;
        const currentStock = material.current_stock;
        const oldAvgCost = material.avg_cost;

        // Moving Average Cost calculation:
        // New avg cost in recipe_unit
        const newCostPerRecipeUnit = it.unit_price / material.conversion_factor;
        const totalNewStock = currentStock + recipeQtyAdded;

        if (totalNewStock > 0) {
          material.avg_cost = Math.round(
            (currentStock * oldAvgCost + recipeQtyAdded * newCostPerRecipeUnit) / totalNewStock
          );
        }

        material.current_stock = totalNewStock;

        // Transaction log
        this.transactions.unshift({
          id: `tx-in-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          raw_material_id: material.id,
          raw_material_name: material.name,
          type: 'in',
          quantity_changed: recipeQtyAdded,
          unit: material.recipe_unit,
          reference_type: 'purchase_order',
          reference_id: poId,
          created_at: now,
          created_by: `Nhập kho từ ${supplierName}`,
        });
      }

      return {
        raw_material_id: it.raw_material_id,
        raw_material_name: material?.name || 'Nguyên liệu',
        quantity: it.quantity,
        unit_price: it.unit_price,
        total: lineTotal,
      };
    });

    const newPO: PurchaseOrder = {
      id: poId,
      supplier_id: supplierId,
      supplier_name: supplierName,
      total_amount: totalAmount,
      status: 'received',
      items: poItems,
      created_at: now,
    };

    // Update supplier debt & purchase totals
    if (supplier) {
      const newDebt = (supplier.total_debt || 0) + totalAmount;
      const newPurchase = (supplier.total_purchase || 0) + totalAmount;
      supplier.total_debt = newDebt;
      supplier.total_purchase = newPurchase;
      updateMockSupplier(supplierId, { total_debt: newDebt, total_purchase: newPurchase });

      const debtTx: SupplierDebtTransaction = {
        id: `tx-debt-${Date.now().toString().slice(-6)}`,
        supplier_id: supplierId,
        type: 'purchase',
        amount: totalAmount,
        balance: newDebt,
        created_at: now,
        notes: `Nhập kho đơn hàng #${poId}`,
        reference_id: poId,
      };
      this.debtTransactions.unshift(debtTx);
      addMockSupplierDebtTransaction(debtTx);
    }

    this.purchaseOrders.unshift(newPO);
    this.save();

    realtimeEngine.emit('STOCK_ALERT', { type: 'PURCHASE_ORDER_RECEIVED', po: newPO });
    return newPO;
  }

  // ==================== STOCK AUDIT & RECONCILIATION ====================
  public getStockAudits(): StockAuditReport[] {
    return [...this.stockAudits];
  }

  public createStockAudit(
    performedBy: string,
    auditItemsInput: { raw_material_id: string; actual_stock: number; note?: string }[],
    notes?: string
  ): StockAuditReport {
    const now = new Date().toISOString();
    const auditId = `audit-${Date.now().toString().slice(-6)}`;
    let totalDifferenceValue = 0;

    const reportItems: StockAuditItem[] = auditItemsInput.map((input) => {
      const material = this.rawMaterials.find((m) => m.id === input.raw_material_id);
      const systemStock = material?.current_stock ?? 0;
      const actualStock = input.actual_stock;
      const difference = actualStock - systemStock;
      const unitCost = material?.avg_cost ?? 0;
      const diffValue = difference * unitCost;

      totalDifferenceValue += diffValue;

      if (material) {
        // Cân bằng kho: cập nhật current_stock thành số lượng thực tế
        material.current_stock = actualStock;

        // Ghi log InventoryTransactions loại 'adjustment'
        if (difference !== 0) {
          const tx: InventoryTransaction = {
            id: `tx-adj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            raw_material_id: material.id,
            raw_material_name: material.name,
            type: 'adjustment',
            quantity_changed: difference,
            unit: material.recipe_unit,
            reference_type: 'audit',
            reference_id: auditId,
            created_at: now,
            created_by: `Kiểm kê kho (${performedBy}): ${difference > 0 ? '+' : ''}${difference} ${material.recipe_unit}`,
          };
          this.transactions.unshift(tx);
        }
      }

      return {
        raw_material_id: input.raw_material_id,
        raw_material_name: material?.name || 'Nguyên liệu',
        recipe_unit: material?.recipe_unit || 'đv',
        system_stock: systemStock,
        actual_stock: actualStock,
        difference,
        unit_cost: unitCost,
        difference_value: diffValue,
        note: input.note,
      };
    });

    const report: StockAuditReport = {
      id: auditId,
      audit_date: now,
      performed_by: performedBy,
      items: reportItems,
      total_difference_value: totalDifferenceValue,
      status: 'completed',
      notes,
    };

    this.stockAudits.unshift(report);
    this.save();

    realtimeEngine.emit('STOCK_ALERT', { type: 'STOCK_AUDIT_COMPLETED', audit: report });
    return report;
  }

  // ==================== COST OF GOODS SOLD (COGS / GIÁ VỐN) ====================
  public calculateMenuItemCost(menuItemId: string): number {
    const boms = this.getRecipesByMenuItem(menuItemId);
    return boms.reduce((sum, b) => {
      const mat = this.rawMaterials.find((m) => m.id === b.raw_material_id);
      return sum + (mat ? b.quantity * mat.avg_cost : 0);
    }, 0);
  }
}

export const inventoryService = new InventoryService();
