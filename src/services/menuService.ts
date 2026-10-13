import { MenuItem, Category } from '@/types';
import { initialMenuItems, initialCategories } from '@/database/mockData';
import { realtimeEngine } from './realtimeEngine';
import { supabase } from '@/lib/supabaseClient';

const STORAGE_MENU_ITEMS = 'pos_menu_items';
const STORAGE_CATEGORIES = 'pos_categories';

class MenuService {
  private menuItems: MenuItem[] = [...initialMenuItems];
  private categories: Category[] = [...initialCategories];
  private isSubscribed = false;

  constructor() {
    this.initStorage();
    this.syncFromSupabase();
    this.initRealtimeSubscription();
  }

  private initStorage() {
    if (typeof window !== 'undefined') {
      try {
        const savedItems = localStorage.getItem(STORAGE_MENU_ITEMS);
        if (savedItems) {
          this.menuItems = JSON.parse(savedItems);
        } else {
          this.menuItems = [...initialMenuItems];
          localStorage.setItem(STORAGE_MENU_ITEMS, JSON.stringify(this.menuItems));
        }

        const savedCats = localStorage.getItem(STORAGE_CATEGORIES);
        if (savedCats) {
          this.categories = JSON.parse(savedCats);
        } else {
          this.categories = [...initialCategories];
          localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(this.categories));
        }
      } catch {
        this.menuItems = [...initialMenuItems];
        this.categories = [...initialCategories];
      }
    }
  }

  private saveLocal() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_MENU_ITEMS, JSON.stringify(this.menuItems));
        localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(this.categories));
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }
    }
  }

  /**
   * Sync menu items and categories from Supabase Cloud PostgreSQL
   */
  public async syncFromSupabase(): Promise<void> {
    if (!supabase) return;

    try {
      // 1. Fetch categories
      const { data: catData, error: catError } = await supabase
        .from('pos_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!catError && catData && catData.length > 0) {
        this.categories = catData.map((c: any) => ({
          id: c.id,
          name: c.name,
          type: c.type || 'food',
          icon: c.icon || '🍲',
          sort_order: c.sort_order || 1,
        }));
      }

      // 2. Fetch menu items
      const { data: itemData, error: itemError } = await supabase
        .from('pos_menu_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (!itemError && itemData && itemData.length > 0) {
        this.menuItems = itemData.map((it: any) => ({
          id: it.id,
          category_id: it.category_id,
          name: it.name,
          price: Number(it.price),
          image_url: it.image_url,
          station: it.station || 'kitchen',
          is_available: it.is_available ?? true,
          description: it.description,
          modifiers: Array.isArray(it.modifiers) ? it.modifiers : [],
        }));

        this.saveLocal();
        realtimeEngine.emit('ORDER_UPDATED', { type: 'MENU_ITEMS_SYNCED' });
        console.log(`[MenuService] Synced ${this.menuItems.length} menu items from Supabase Cloud`);
      }
    } catch (err) {
      console.warn('[MenuService] Supabase sync error, using cached local items:', err);
    }
  }

  /**
   * Listen to remote DB changes from other devices (e.g. PC adds dish, Mobile updates instantly)
   */
  private initRealtimeSubscription() {
    if (this.isSubscribed || !supabase) return;
    this.isSubscribed = true;

    try {
      supabase
        .channel('pos_menu_realtime_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pos_menu_items' },
          (payload) => {
            console.log('[MenuService] Remote Postgres change detected:', payload.eventType);
            this.syncFromSupabase();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('[MenuService] Could not subscribe to pos_menu_items changes:', err);
    }
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

    // Optimistic local update
    this.menuItems.unshift(newItem);
    this.saveLocal();
    realtimeEngine.emit('ORDER_UPDATED', { type: 'MENU_ITEMS_UPDATED', item: newItem });

    // Sync to Supabase Cloud
    if (supabase) {
      supabase
        .from('pos_menu_items')
        .insert({
          id: newItem.id,
          category_id: newItem.category_id,
          name: newItem.name,
          price: newItem.price,
          image_url: newItem.image_url,
          station: newItem.station,
          is_available: newItem.is_available,
          description: newItem.description,
          modifiers: newItem.modifiers || [],
        })
        .then(({ error }) => {
          if (error) {
            console.error('[MenuService] Failed to insert into Supabase:', error);
          } else {
            console.log('[MenuService] Successfully saved new item to Supabase Cloud:', newItem.name);
          }
        });
    }

    return newItem;
  }

  public updateMenuItem(id: string, updates: Partial<MenuItem>): MenuItem | null {
    const idx = this.menuItems.findIndex((i) => i.id === id);
    if (idx === -1) return null;

    this.menuItems[idx] = { ...this.menuItems[idx], ...updates };
    this.saveLocal();
    realtimeEngine.emit('ORDER_UPDATED', { type: 'MENU_ITEMS_UPDATED', item: this.menuItems[idx] });

    if (supabase) {
      const dbUpdates: Record<string, any> = { ...updates, updated_at: new Date().toISOString() };
      supabase
        .from('pos_menu_items')
        .update(dbUpdates)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('[MenuService] Error updating menu item in Supabase:', error);
        });
    }

    return this.menuItems[idx];
  }

  public deleteMenuItem(id: string): boolean {
    const initialLen = this.menuItems.length;
    this.menuItems = this.menuItems.filter((i) => i.id !== id);

    if (this.menuItems.length !== initialLen) {
      this.saveLocal();
      realtimeEngine.emit('ORDER_UPDATED', { type: 'MENU_ITEMS_UPDATED', deletedId: id });

      if (supabase) {
        supabase
          .from('pos_menu_items')
          .delete()
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.error('[MenuService] Error deleting menu item from Supabase:', error);
          });
      }
      return true;
    }

    return false;
  }
}

export const menuService = new MenuService();
