'use client';

import React, { useState } from 'react';
import { UserAccount, UserRole } from '@/types';
import { adminService } from '@/services/adminService';
import {
  Users,
  Plus,
  Shield,
  ChefHat,
  CreditCard,
  Wine,
  UserCheck,
  UserX,
  X,
  Lock,
} from 'lucide-react';

interface HRTabProps {
  users: UserAccount[];
  onRefresh: () => void;
}

export const HRTab: React.FC<HRTabProps> = ({ users, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('waiter');

  const roleConfig: Record<UserRole, { label: string; bg: string; icon: any }> = {
    admin: { label: 'Quản Trị Viên (Admin)', bg: 'bg-purple-600 text-white', icon: Shield },
    manager: { label: 'Quản Lý Cửa Hàng', bg: 'bg-blue-600 text-white', icon: Shield },
    cashier: { label: 'Thu Ngân (Cashier)', bg: 'bg-emerald-600 text-white', icon: CreditCard },
    kitchen: { label: 'Đầu Bếp (Kitchen)', bg: 'bg-orange-500 text-white', icon: ChefHat },
    bar: { label: 'Pha Chế (Bartender)', bg: 'bg-cyan-600 text-white', icon: Wine },
    waiter: { label: 'Phục Vụ (Waiter)', bg: 'bg-stone-700 text-white', icon: Users },
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username) {
      alert('Vui lòng điền họ tên và tên đăng nhập!');
      return;
    }

    adminService.addUser({
      full_name: fullName.trim(),
      username: username.trim().toLowerCase(),
      role,
    });

    onRefresh();
    setIsModalOpen(false);
    setFullName('');
    setUsername('');
  };

  const handleToggleStatus = (id: string) => {
    adminService.toggleUserStatus(id);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h3 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            <span>Đội Ngũ Nhân Sự & Phân Quyền (RBAC) ({users.length})</span>
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Quản lý tài khoản đăng nhập và phạm vi phân quyền hệ thống
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Nhân Viên Mới</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => {
          const roleInfo = roleConfig[user.role] || roleConfig.waiter;
          const RoleIcon = roleInfo.icon;

          return (
            <div
              key={user.id}
              className={`p-4 bg-white dark:bg-stone-900 border rounded-2xl shadow-xs space-y-3 transition-all ${
                user.is_active
                  ? 'border-stone-200 dark:border-stone-800'
                  : 'border-stone-200 dark:border-stone-800 opacity-60 bg-stone-50 dark:bg-stone-900/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-stone-700 dark:text-stone-300 text-sm">
                    {user.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white leading-tight">
                      {user.full_name}
                    </h4>
                    <p className="text-xs font-mono text-stone-400">@{user.username}</p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${roleInfo.bg}`}
                >
                  <RoleIcon className="w-3 h-3" />
                  <span>{user.role.toUpperCase()}</span>
                </span>
              </div>

              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-stone-400">
                  {user.is_active ? '🟢 Đang hoạt động' : '🔴 Tạm khóa'}
                </span>

                <button
                  onClick={() => handleToggleStatus(user.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    user.is_active
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                  }`}
                >
                  {user.is_active ? 'Khóa tài khoản' : 'Mở lại'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleCreateUser}
            className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full p-5 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                <span>Thêm Tài Khoản Nhân Viên</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-600 dark:text-stone-400 block mb-1">
                  Họ và tên:
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Lê Thị Phục Vụ"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-stone-600 dark:text-stone-400 block mb-1">
                  Tên đăng nhập (Username):
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: le_waiter"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-stone-600 dark:text-stone-400 block mb-1">
                  Vai trò phân quyền (Role):
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold"
                >
                  <option value="admin">Quản Trị Viên (Admin)</option>
                  <option value="manager">Quản Lý Ca (Manager)</option>
                  <option value="cashier">Thu Ngân (Cashier)</option>
                  <option value="kitchen">Đầu Bếp (Kitchen KDS)</option>
                  <option value="bar">Pha Chế (Bartender BDS)</option>
                  <option value="waiter">Nhân Viên Phục Vụ (Waiter)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
              >
                Tạo Tài Khoản
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
