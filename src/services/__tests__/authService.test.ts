import { describe, it, expect } from 'vitest';
import { authService, ROLE_PERMISSIONS } from '../authService';

describe('AuthService - Đăng Nhập & Phân Quyền (RBAC)', () => {
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
});
