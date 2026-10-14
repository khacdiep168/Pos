import { StoreSettings, Promotion, UserAccount, UserRole } from '@/types';
import {
  initialStoreSettings,
  initialPromotions,
  initialUsers,
} from '@/database/mockData';
import { realtimeEngine } from './realtimeEngine';
import { supabase } from '@/lib/supabaseClient';

const STORAGE_STORE_SETTINGS = 'pos_store_settings';
const STORAGE_PROMOTIONS = 'pos_promotions';
const STORAGE_USERS = 'pos_users';
const USERS_AUTH_KEY = 'vibe_pos_users';

class AdminService {
  private storeSettings: StoreSettings = initialStoreSettings;
  private promotions: Promotion[] = [...initialPromotions];
  private users: UserAccount[] = [...initialUsers];

  constructor() {
    this.initStorage();
    this.syncFromSupabase();
  }

  private initStorage() {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem(STORAGE_STORE_SETTINGS);
        if (savedSettings) this.storeSettings = JSON.parse(savedSettings);

        const savedPromos = localStorage.getItem(STORAGE_PROMOTIONS);
        if (savedPromos) this.promotions = JSON.parse(savedPromos);

        const savedUsers = localStorage.getItem(USERS_AUTH_KEY) || localStorage.getItem(STORAGE_USERS);
        if (savedUsers) this.users = JSON.parse(savedUsers);
      } catch {
        this.storeSettings = { ...initialStoreSettings };
        this.promotions = [...initialPromotions];
        this.users = [...initialUsers];
      }
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_STORE_SETTINGS, JSON.stringify(this.storeSettings));
      localStorage.setItem(STORAGE_PROMOTIONS, JSON.stringify(this.promotions));
      localStorage.setItem(STORAGE_USERS, JSON.stringify(this.users));
      localStorage.setItem(USERS_AUTH_KEY, JSON.stringify(this.users));
    }
  }

  /**
   * Sync store settings from Supabase Cloud
   */
  public async syncFromSupabase(): Promise<void> {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('pos_store_settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (!error && data?.settings) {
        this.storeSettings = {
          ...initialStoreSettings,
          ...data.settings,
        };
        this.save();
        realtimeEngine.emit('ORDER_UPDATED', { type: 'STORE_SETTINGS_SYNCED' });
      } else if (error && error.code === 'PGRST116') {
        // Not found, seed initial settings to Supabase
        await supabase.from('pos_store_settings').upsert({
          id: 'default',
          settings: this.storeSettings,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('[AdminService] Supabase sync failed, using local settings:', err);
    }
  }

  // Store Settings
  public getSettings(): StoreSettings {
    return { ...this.storeSettings };
  }

  public updateSettings(newSettings: Partial<StoreSettings>): StoreSettings {
    this.storeSettings = { ...this.storeSettings, ...newSettings };
    this.save();

    // Async sync to Supabase Cloud
    if (supabase) {
      supabase
        .from('pos_store_settings')
        .upsert({
          id: 'default',
          settings: this.storeSettings,
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.warn('[AdminService] Failed to upsert store settings to Supabase:', error);
        });
    }

    realtimeEngine.emit('ORDER_UPDATED', { type: 'STORE_SETTINGS_CHANGED', settings: this.storeSettings });
    return { ...this.storeSettings };
  }

  // Promotions
  public getPromotions(): Promotion[] {
    return [...this.promotions];
  }

  public addPromotion(promo: Omit<Promotion, 'id'>): Promotion {
    const newPromo: Promotion = {
      ...promo,
      id: `promo-${Date.now()}`,
    };
    this.promotions.unshift(newPromo);
    this.save();
    return newPromo;
  }

  public togglePromotion(id: string): Promotion | null {
    const p = this.promotions.find((item) => item.id === id);
    if (!p) return null;
    p.is_active = !p.is_active;
    this.save();
    return p;
  }

  public deletePromotion(id: string): void {
    this.promotions = this.promotions.filter((item) => item.id !== id);
    this.save();
  }

  // Users & RBAC
  public getUsers(): UserAccount[] {
    return [...this.users];
  }

  public addUser(user: { full_name: string; username: string; role: UserRole; password?: string }): UserAccount {
    const newUser: UserAccount = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      full_name: user.full_name,
      username: user.username,
      password: user.password || '123456',
      role: user.role,
      is_active: true,
      last_login: new Date().toISOString(),
    };
    this.users.unshift(newUser);
    this.save();
    return newUser;
  }

  public toggleUserStatus(id: string): UserAccount | null {
    const u = this.users.find((item) => item.id === id);
    if (!u) return null;
    u.is_active = !u.is_active;
    this.save();
    return u;
  }

  /**
   * Change user password (for Admin & Manager)
   */
  public updateUserPassword(userId: string, newPassword: string): boolean {
    const u = this.users.find((item) => item.id === userId);
    if (!u) return false;
    u.password = newPassword;
    this.save();
    return true;
  }
}

export const adminService = new AdminService();
