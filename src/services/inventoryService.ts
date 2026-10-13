import {
  RawMaterial,
  RecipeBOM,
  Supplier,
  PurchaseOrder,
  InventoryTransaction,
  Order,
} from '@/types';
import {
  initialRawMaterials,
  initialRecipes,
  initialSuppliers,
  initialPurchaseOrders,
} from '@/database/mockData';
import { realtimeEngine } from './realtimeEngine';

const STORAGE_RAW_MATERIALS = 'pos_raw_materials';
const STORAGE_RECIPES = 'pos_recipes_bom';
const STORAGE_SUPPLIERS = 'pos_suppliers';
const STORAGE_PURCHASE_ORDERS = 'pos_purchase_orders';
const STORAGE_TRANSACTIONS = 'pos_inventory_transactions';

class InventoryService {
  private rawMaterials: RawMaterial[] = [];
  private recipes: RecipeBOM[] = [];
  private suppliers: Supplier[] = [];
  private purchaseOrders: PurchaseOrder[] = [];
  private transactions: InventoryTransaction[] = [];
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
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_RAW_MATERIALS, JSON.stringify(this.rawMaterials));
      localStorage.setItem(STORAGE_RECIPES, JSON.stringify(this.recipes));
      localStorage.setItem(STORAGE_SUPPLIERS, JSON.stringify(this.suppliers));
      localStorage.setItem(STORAGE_PURCHASE_ORDERS, JSON.stringify(this.purchaseOrders));
      localStorage.setItem(STORAGE_TRANSACTIONS, JSON.stringify(this.transactions));
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

    this.purchaseOrders.unshift(newPO);
    this.save();

    realtimeEngine.emit('STOCK_ALERT', { type: 'PURCHASE_ORDER_RECEIVED', po: newPO });
    return newPO;
  }
}

export const inventoryService = new InventoryService();
