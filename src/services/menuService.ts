import { MenuItem, Category } from '@/types';
import { initialMenuItems, initialCategories } from '@/database/mockData';
import { realtimeEngine } from './realtimeEngine';

const STORAGE_MENU_ITEMS = 'pos_menu_items';

class MenuService {
  private menuItems: MenuItem[] = [...initialMenuItems];
  private categories: Category[] = [...initialCategories];

  constructor() {
    this.initStorage();
  }

  private initStorage() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_MENU_ITEMS);
        if (saved) {
          this.menuItems = JSON.parse(saved);
        } else {
          this.menuItems = [...initialMenuItems];
          localStorage.setItem(STORAGE_MENU_ITEMS, JSON.stringify(this.menuItems));
        }
      } catch {
        this.menuItems = [...initialMenuItems];
      }
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_MENU_ITEMS, JSON.stringify(this.menuItems));
    }
    // Emit realtime event so FOH, KDS, ERP all refresh menu items
    realtimeEngine.emit('ORDER_UPDATED', { type: 'MENU_ITEMS_UPDATED' });
  }

  public getMenuItems(): MenuItem[] {
    return [...this.menuItems];
  }

  public getCategories(): Category[] {
    return [...this.categories];
  }

  public addMenuItem(item: Omit<MenuItem, 'id'>): MenuItem {
    const newItem: MenuItem = {
      ...item,
      id: `item-${Date.now().toString().slice(-6)}`,
      is_available: item.is_available ?? true,
    };
    this.menuItems.unshift(newItem);
    this.save();
    return newItem;
  }

  public updateMenuItem(id: string, updates: Partial<MenuItem>): MenuItem | null {
    const idx = this.menuItems.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    this.menuItems[idx] = { ...this.menuItems[idx], ...updates };
    this.save();
    return this.menuItems[idx];
  }

  public deleteMenuItem(id: string): boolean {
    const initialLen = this.menuItems.length;
    this.menuItems = this.menuItems.filter((i) => i.id !== id);
    if (this.menuItems.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
}

export const menuService = new MenuService();
