import { describe, it, expect, beforeEach } from 'vitest';
import {
  authService,
  ROLE_PERMISSIONS,
  validateRouteAccess,
  AUTH_COOKIE_NAME,
  getAuthCookie,
  clearAuthCookie,
} from '../authService';

describe('AuthService - Đăng Nhập & Phân Quyền (RBAC)', () => {
  beforeEach(() => {
    authService.logout();
    clearAuthCookie();
  });

  it('đăng nhập thành công với tài khoản Admin hợp lệ', () => {
    const res = authService.login('admin', 'password123');
    expect(res.success).toBe(true);
    expect(res.user).toBeDefined();
    expect(res.user?.role).toBe('admin');
    expect(res.user?.username).toBe('admin');
  });

  it('đăng nhập thành công với tài khoản Phục vụ (waiter) và mật khẩu demo', () => {
    const res = authService.login('waiter', '123456');
    expect(res.success).toBe(true);
    expect(res.user?.role).toBe('waiter');
  });

  it('đăng nhập thành công với tài khoản Pha Chế (bartender) và mật khẩu demo', () => {
    const res = authService.login('bartender', '123456');
    expect(res.success).toBe(true);
    expect(res.user?.role).toBe('bar');
    expect(authService.getAllowedModules(res.user!.role)).toEqual(['kds']);
  });

  it('từ chối đăng nhập khi sai mật khẩu', () => {
    const res = authService.login('admin', 'wrongpassword_999');
    expect(res.success).toBe(false);
    expect(res.user).toBeUndefined();
    expect(res.message).toContain('Mật khẩu không chính xác');
  });

  it('từ chối đăng nhập khi tên tài khoản không tồn tại', () => {
    const res = authService.login('non_existent_user_xyz', '123456');
    expect(res.success).toBe(false);
    expect(res.message).toContain('Tên đăng nhập không tồn tại');
  });

  describe('Ma trận phân quyền Module (Role-Based Access Control)', () => {
    it('Phục vụ (waiter) chỉ có quyền truy cập FOH (Gọi món)', () => {
      expect(authService.canAccessModule('waiter', 'foh')).toBe(true);
      expect(authService.canAccessModule('waiter', 'kds')).toBe(false);
      expect(authService.canAccessModule('waiter', 'cashier')).toBe(false);
      expect(authService.canAccessModule('waiter', 'erp')).toBe(false);
      expect(authService.canAccessModule('waiter', 'admin')).toBe(false);
      expect(authService.getAllowedModules('waiter')).toEqual(['foh']);
    });

    it('Bếp (kitchen) & Quầy Bar (bar) chỉ có quyền truy cập KDS', () => {
      expect(authService.canAccessModule('kitchen', 'kds')).toBe(true);
      expect(authService.canAccessModule('kitchen', 'foh')).toBe(false);
      expect(authService.canAccessModule('kitchen', 'cashier')).toBe(false);

      expect(authService.canAccessModule('bar', 'kds')).toBe(true);
      expect(authService.canAccessModule('bar', 'foh')).toBe(false);
    });

    it('Thu ngân (cashier) có quyền truy cập FOH và Cashier', () => {
      expect(authService.canAccessModule('cashier', 'foh')).toBe(true);
      expect(authService.canAccessModule('cashier', 'cashier')).toBe(true);
      expect(authService.canAccessModule('cashier', 'erp')).toBe(false);
      expect(authService.canAccessModule('cashier', 'admin')).toBe(false);
      expect(authService.getAllowedModules('cashier')).toEqual(['foh', 'cashier']);
    });

    it('Quản trị viên (admin) và Quản lý (manager) có toàn quyền cả 5 phân hệ', () => {
      const allModules = ['foh', 'kds', 'cashier', 'erp', 'admin'] as const;
      allModules.forEach((mod) => {
        expect(authService.canAccessModule('admin', mod)).toBe(true);
        expect(authService.canAccessModule('manager', mod)).toBe(true);
      });
    });

    it('trả về đúng module mặc định khi điều hướng ban đầu', () => {
      expect(authService.getDefaultModuleForRole('waiter')).toBe('foh');
      expect(authService.getDefaultModuleForRole('kitchen')).toBe('kds');
      expect(authService.getDefaultModuleForRole('bar')).toBe('kds');
      expect(authService.getDefaultModuleForRole('cashier')).toBe('foh');
      expect(authService.getDefaultModuleForRole('admin')).toBe('foh');
    });
  });

  describe('Kiểm thử Bảo Vệ Tuyến Đường URL (Route Protection & Penetration Testing)', () => {
    it('chặn hoàn toàn truy cập URL bảo vệ khi chưa xác thực (unauthenticated)', () => {
      const checkAdmin = validateRouteAccess(undefined, '/admin');
      expect(checkAdmin.allowed).toBe(false);
      expect(checkAdmin.reason).toContain('Chưa xác thực');

      const checkCashier = validateRouteAccess(undefined, '/cashier');
      expect(checkCashier.allowed).toBe(false);

      const checkERP = validateRouteAccess(undefined, '/erp');
      expect(checkERP.allowed).toBe(false);

      const checkKDS = validateRouteAccess(undefined, '/kds');
      expect(checkKDS.allowed).toBe(false);
    });

    it('chặn nhân viên phục vụ (waiter) cố tình truy cập trái phép URL /admin, /cashier, /erp, /kds', () => {
      const checkAdmin = validateRouteAccess('waiter', '/admin');
      expect(checkAdmin.allowed).toBe(false);
      expect(checkAdmin.requiredModule).toBe('admin');
      expect(checkAdmin.reason).toContain('không có quyền truy cập');

      const checkCashier = validateRouteAccess('waiter', '/cashier');
      expect(checkCashier.allowed).toBe(false);

      const checkERP = validateRouteAccess('waiter', '/erp');
      expect(checkERP.allowed).toBe(false);

      const checkKDS = validateRouteAccess('waiter', '/kds');
      expect(checkKDS.allowed).toBe(false);

      // Nhưng cho phép vào trang chính / (FOH)
      const checkHome = validateRouteAccess('waiter', '/');
      expect(checkHome.allowed).toBe(true);
    });

    it('cho phép bếp/bar vào /kds nhưng chặn truy cập /admin và /cashier', () => {
      expect(validateRouteAccess('kitchen', '/kds').allowed).toBe(true);
      expect(validateRouteAccess('kitchen', '/admin').allowed).toBe(false);
      expect(validateRouteAccess('kitchen', '/cashier').allowed).toBe(false);

      expect(validateRouteAccess('bar', '/kds').allowed).toBe(true);
      expect(validateRouteAccess('bar', '/admin').allowed).toBe(false);
    });

    it('cho phép thu ngân vào /cashier nhưng chặn truy cập /admin và /erp', () => {
      expect(validateRouteAccess('cashier', '/cashier').allowed).toBe(true);
      expect(validateRouteAccess('cashier', '/admin').allowed).toBe(false);
      expect(validateRouteAccess('cashier', '/erp').allowed).toBe(false);
    });

    it('cho phép Admin và Quản lý truy cập tất cả các URL chức năng', () => {
      const protectedRoutes = ['/', '/admin', '/admin/settings', '/cashier', '/erp', '/kds'];
      protectedRoutes.forEach((route) => {
        expect(validateRouteAccess('admin', route).allowed).toBe(true);
        expect(validateRouteAccess('manager', route).allowed).toBe(true);
      });
    });
  });

  describe('Quản lý Cookie Xác Thực & Session (vibe_pos_auth)', () => {
    it('tự động tạo cookie vibe_pos_auth khi đăng nhập thành công', () => {
      const res = authService.login('admin', '123456');
      expect(res.success).toBe(true);

      const cookieData = getAuthCookie();
      expect(cookieData).toBeDefined();
      expect(cookieData?.username).toBe('admin');
      expect(cookieData?.role).toBe('admin');
    });

    it('tự động xóa sạch cookie vibe_pos_auth khi đăng xuất (logout)', () => {
      authService.login('cashier', '123456');
      expect(getAuthCookie()).toBeDefined();

      authService.logout();
      expect(getAuthCookie()).toBeNull();
    });
  });
});
