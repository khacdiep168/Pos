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

export const AUTH_COOKIE_NAME = 'vibe_pos_auth';

export const MODULE_LABELS: Record<AppModule, { name: string; description: string }> = {
  foh: { name: 'Phục Vụ & Gọi Món (FOH)', description: 'Sơ đồ bàn, gọi món và chuyển đơn xuống bếp' },
  kds: { name: 'Màn Hình Bếp & Bar (KDS)', description: 'Điều phối và chế biến món ăn/thức uống theo thời gian thực' },
  cashier: { name: 'Thu Ngân & Thanh Toán (Cashier)', description: 'Thanh toán hóa đơn, in phiếu K80 và xuất VietQR động' },
  erp: { name: 'Kế Toán & Sổ Quỹ Thu Chi (ERP)', description: 'Sổ quỹ, báo cáo thuế NĐ 254/TT 91 và quản lý giá vốn kho' },
  admin: { name: 'Quản Trị Hệ Thống (Admin)', description: 'Cấu hình quán, tài khoản nhân viên và bảng giá kênh bán' },
};

let memoryCookieStore = '';

export function setAuthCookie(user: UserAccount): void {
  const payload = encodeURIComponent(
    JSON.stringify({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    })
  );

  if (typeof document !== 'undefined') {
    try {
      document.cookie = `${AUTH_COOKIE_NAME}=${payload}; path=/; max-age=86400; SameSite=Lax`;
    } catch (err) {
      console.error('Failed to set auth cookie:', err);
    }
  } else {
    memoryCookieStore = `${AUTH_COOKIE_NAME}=${payload}`;
  }
}

export function clearAuthCookie(): void {
  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
  memoryCookieStore = '';
}

export function getAuthCookie(): { id: string; username: string; role: UserRole; full_name: string } | null {
  const cookieString = typeof document !== 'undefined' ? document.cookie : memoryCookieStore;
  if (!cookieString) return null;
  try {
    const match = cookieString
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
    if (!match) return null;
    const raw = decodeURIComponent(match.substring(AUTH_COOKIE_NAME.length + 1));
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasAuthCookie(): boolean {
  const cookieString = typeof document !== 'undefined' ? document.cookie : memoryCookieStore;
  if (!cookieString) return false;
  return cookieString.split(';').some((item) => item.trim().startsWith(`${AUTH_COOKIE_NAME}=`));
}

export function validateRouteAccess(
  role: UserRole | undefined,
  pathname: string
): { allowed: boolean; requiredModule?: AppModule; reason?: string } {
  if (!role) {
    return { allowed: false, reason: 'Chưa xác thực danh tính người dùng' };
  }

  const cleanPath = pathname.toLowerCase();

  let requiredModule: AppModule = 'foh';
  if (cleanPath.startsWith('/admin')) {
    requiredModule = 'admin';
  } else if (cleanPath.startsWith('/cashier')) {
    requiredModule = 'cashier';
  } else if (cleanPath.startsWith('/erp')) {
    requiredModule = 'erp';
  } else if (cleanPath.startsWith('/kds')) {
    requiredModule = 'kds';
  } else {
    // POS Hub root
    return { allowed: true };
  }

  const allowed = (ROLE_PERMISSIONS[role] || []).includes(requiredModule);
  return {
    allowed,
    requiredModule,
    reason: allowed
      ? undefined
      : `Vai trò [${ROLE_LABELS[role] || role}] không có quyền truy cập phân hệ [${MODULE_LABELS[requiredModule]?.name || requiredModule}]`,
  };
}

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
    setAuthCookie(updatedUser);

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
    clearAuthCookie();
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
