import { UserAccount, UserRole } from '@/types';
import { initialUsers } from '@/database/mockData';
import { initAudioContext } from '@/lib/audioAlert';

const USERS_STORAGE_KEY = 'vibe_pos_users';
const CURRENT_USER_STORAGE_KEY = 'vibe_pos_current_user';

export type AppModule = 'foh' | 'kds' | 'cashier' | 'erp' | 'admin';

export const ROLE_PERMISSIONS: Record<UserRole, AppModule[]> = {
  waiter: ['foh'],
  kitchen: ['kds'],
  bar: ['kds'],
  cashier: ['foh', 'cashier'],
  manager: ['foh', 'kds', 'cashier', 'erp', 'admin'],
  admin: ['foh', 'kds', 'cashier', 'erp', 'admin'],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Quản Trị Viên (Admin)',
  manager: 'Quản Lý Cửa Hàng',
  cashier: 'Thu Ngân',
  kitchen: 'Bếp Trưởng',
  bar: 'Pha Chế Bar',
  waiter: 'Nhân Viên Phục Vụ',
};

class AuthService {
  private users: UserAccount[] = [];

  constructor() {
    this.loadUsers();
  }

  private loadUsers() {
    if (typeof window === 'undefined') {
      this.users = initialUsers;
      return;
    }
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        this.users = JSON.parse(stored);
      } else {
        this.users = initialUsers;
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
      }
    } catch {
      this.users = initialUsers;
    }
  }

  public getUsers(): UserAccount[] {
    return this.users;
  }

  public getCurrentUser(): UserAccount | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error('Failed to parse current user from localStorage:', err);
    }
    return null;
  }

  public login(username: string, password: string): { success: boolean; user?: UserAccount; message?: string } {
    this.loadUsers();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    const user = this.users.find(
      (u) => u.username.toLowerCase() === cleanUsername && u.is_active
    );

    if (!user) {
      return { success: false, message: 'Tên đăng nhập không tồn tại hoặc tài khoản bị vô hiệu hóa!' };
    }

    // Accepts either the account's password or demo fallback '123456' / 'password123'
    const isPasswordValid =
      user.password === cleanPassword ||
      cleanPassword === '123456' ||
      cleanPassword === 'password123';

    if (!isPasswordValid) {
      return { success: false, message: 'Mật khẩu không chính xác! (Thử: 123456 hoặc password123)' };
    }

    // Unlock Web Audio Context on successful login interaction
    initAudioContext();

    // Update last_login
    const updatedUser: UserAccount = {
      ...user,
      last_login: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updatedUser));
      } catch (err) {
        console.error('Failed to save current user:', err);
      }
    }

    return { success: true, user: updatedUser };
  }

  public logout(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      } catch (err) {
        console.error('Failed to remove current user:', err);
      }
    }
  }

  public canAccessModule(role: UserRole | undefined, module: AppModule): boolean {
    if (!role) return false;
    const allowed = ROLE_PERMISSIONS[role] || [];
    return allowed.includes(module);
  }

  public getAllowedModules(role: UserRole | undefined): AppModule[] {
    if (!role) return [];
    return ROLE_PERMISSIONS[role] || [];
  }

  public getDefaultModuleForRole(role: UserRole | undefined): AppModule {
    if (!role) return 'foh';
    const allowed = ROLE_PERMISSIONS[role] || ['foh'];
    return allowed[0] || 'foh';
  }
}

export const authService = new AuthService();
