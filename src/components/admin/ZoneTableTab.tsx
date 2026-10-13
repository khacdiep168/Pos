'use client';

import React, { useState, useEffect } from 'react';
import { RestaurantTable, Zone } from '@/types';
import { orderService } from '@/services/orderService';
import { realtimeEngine } from '@/services/realtimeEngine';
import {
  Layers,
  LayoutGrid,
  Plus,
  Pencil,
  Trash2,
  Users,
  MapPin,
  CheckCircle2,
  X,
  AlertCircle,
  Building2,
} from 'lucide-react';

export const ZoneTableTab: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('all');

  // Modal Zone
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneDesc, setZoneDesc] = useState('');
  const [zoneSortOrder, setZoneSortOrder] = useState(1);

  // Modal Table
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [tableCapacity, setTableCapacity] = useState(4);
  const [tableZoneId, setTableZoneId] = useState('');

  const loadData = () => {
    setZones(orderService.getZones());
    setTables(orderService.getTables());
  };

  useEffect(() => {
    loadData();
    const unsub = realtimeEngine.subscribe('TABLE_STATUS_CHANGED', () => {
      loadData();
    });
    return () => unsub();
  }, []);

  // Zone Actions
  const handleOpenAddZone = () => {
    setEditingZone(null);
    setZoneName('');
    setZoneDesc('');
    setZoneSortOrder(zones.length + 1);
    setIsZoneModalOpen(true);
  };

  const handleOpenEditZone = (z: Zone) => {
    setEditingZone(z);
    setZoneName(z.name);
    setZoneDesc(z.description || '');
    setZoneSortOrder(z.sort_order);
    setIsZoneModalOpen(true);
  };

  const handleSaveZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return;

    if (editingZone) {
      orderService.updateZone(editingZone.id, {
        name: zoneName.trim(),
        description: zoneDesc.trim(),
        sort_order: zoneSortOrder,
      });
    } else {
      orderService.addZone({
        name: zoneName.trim(),
        description: zoneDesc.trim(),
        sort_order: zoneSortOrder,
      });
    }
    loadData();
    setIsZoneModalOpen(false);
  };

  const handleDeleteZone = (zId: string, zName: string) => {
    if (confirm(`Bạn có chắc muốn xóa khu vực "${zName}"? Các bàn thuộc khu vực này sẽ chuyển về chưa phân loại.`)) {
      orderService.deleteZone(zId);
      loadData();
    }
  };

  // Table Actions
  const handleOpenAddTable = () => {
    setEditingTable(null);
    setTableNumber(`Bàn ${tables.length + 1 < 10 ? '0' + (tables.length + 1) : tables.length + 1}`);
    setTableCapacity(4);
    setTableZoneId(zones[0]?.id || '');
    setIsTableModalOpen(true);
  };

  const handleOpenEditTable = (t: RestaurantTable) => {
    setEditingTable(t);
    setTableNumber(t.table_number);
    setTableCapacity(t.capacity);
    setTableZoneId(t.zone_id || '');
    setIsTableModalOpen(true);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) return;

    if (editingTable) {
      orderService.updateTable(editingTable.id, {
        table_number: tableNumber.trim(),
        capacity: tableCapacity,
        zone_id: tableZoneId || undefined,
      });
    } else {
      orderService.addTable({
        table_number: tableNumber.trim(),
        capacity: tableCapacity,
        zone_id: tableZoneId || undefined,
      });
    }
    loadData();
    setIsTableModalOpen(false);
  };

  const handleDeleteTable = (tId: string, tNum: string) => {
    if (confirm(`Bạn có chắc muốn xóa bàn "${tNum}"?`)) {
      orderService.deleteTable(tId);
      loadData();
    }
  };

  const filteredTables = selectedZoneFilter === 'all'
    ? tables
    : tables.filter((t) => t.zone_id === selectedZoneFilter);

  const getStatusBadge = (status: RestaurantTable['status']) => {
    switch (status) {
      case 'available':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Trống</span>;
      case 'occupied':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">Đang dùng</span>;
      case 'billing':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">Chờ tính tiền</span>;
      case 'reserved':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">Đã đặt</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-base font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-amber-500" />
            <span>Quản Lý Sơ Đồ Bàn & Khu Vực (Zones & Tables)</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Cấu hình các tầng, sảnh, phòng VIP và định vị số bàn phục vụ thực khách
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddZone}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-all border border-stone-200 dark:border-stone-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Khu Vực</span>
          </button>

          <button
            onClick={handleOpenAddTable}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Bàn Ăn Mới</span>
          </button>
        </div>
      </div>

      {/* Danh Sách Khu Vực (Zones) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-stone-400" />
            <span>Danh Sách Khu Vực ({zones.length} khu vực)</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {zones.map((zone) => {
            const tableCount = tables.filter((t) => t.zone_id === zone.id).length;
            const occupiedCount = tables.filter((t) => t.zone_id === zone.id && t.status !== 'available').length;

            return (
              <div
                key={zone.id}
                className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-2 hover:border-amber-500/40 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-stone-900 dark:text-white">
                      {zone.name}
                    </h4>
                    <span className="text-[10px] text-stone-400 font-mono">
                      Thứ tự: #{zone.sort_order}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditZone(zone)}
                      className="p-1 rounded-lg text-stone-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      title="Sửa khu vực"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteZone(zone.id, zone.name)}
                      className="p-1 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      title="Xóa khu vực"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {zone.description && (
                  <p className="text-[11px] text-stone-500 line-clamp-2">{zone.description}</p>
                )}

                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                  <span className="text-stone-400 text-[11px]">Quy mô:</span>
                  <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                    {tableCount} bàn {occupiedCount > 0 && `(${occupiedCount} có khách)`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bảng Danh Sách Bàn Ăn (Tables Table) */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs space-y-3 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-stone-900 dark:text-white">
              Danh Sách Bàn Ăn Toàn Hệ Thống ({tables.length} bàn)
            </h3>
          </div>

          {/* Filter Pills by Zone */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setSelectedZoneFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedZoneFilter === 'all'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              Tất cả ({tables.length})
            </button>
            {zones.map((z) => {
              const count = tables.filter((t) => t.zone_id === z.id).length;
              return (
                <button
                  key={z.id}
                  onClick={() => setSelectedZoneFilter(z.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    selectedZoneFilter === z.id
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                  }`}
                >
                  {z.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3">Số Bàn</th>
                <th className="p-3">Khu Vực (Zone)</th>
                <th className="p-3 text-center">Sức Chứa (Ghế)</th>
                <th className="p-3 text-center">Trạng Thái Vận Hành</th>
                <th className="p-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-medium">
              {filteredTables.map((t) => {
                const zone = zones.find((z) => z.id === t.zone_id);
                return (
                  <tr key={t.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="p-3">
                      <div className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                        {t.table_number}
                      </div>
                      <span className="text-[10px] font-mono text-stone-400">ID: #{t.id}</span>
                    </td>

                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs border border-stone-200 dark:border-stone-700">
                        <MapPin className="w-3 h-3 text-amber-500" />
                        {zone ? zone.name : 'Chưa phân khu'}
                      </span>
                    </td>

                    <td className="p-3 text-center font-mono font-bold text-stone-800 dark:text-stone-200">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3 text-stone-400" />
                        {t.capacity} chỗ
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      {getStatusBadge(t.status)}
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenEditTable(t)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors mr-1"
                        title="Sửa bàn"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTable(t.id, t.table_number)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Xóa bàn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM / SỬA KHU VỰC */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full p-5 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>{editingZone ? 'Chỉnh Sửa Khu Vực' : 'Thêm Khu Vực Mới'}</span>
              </h3>
              <button
                onClick={() => setIsZoneModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveZone} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Tên Khu Vực / Tầng / Sảnh *:
                </label>
                <input
                  type="text"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="VD: Sân Thượng Rooftop, Tầng 3..."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Mô tả không gian:
                </label>
                <textarea
                  value={zoneDesc}
                  onChange={(e) => setZoneDesc(e.target.value)}
                  placeholder="VD: View ngắm hoàng hôn, phù hợp tiệc ngoài trời..."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs h-20"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Thứ tự hiển thị:
                </label>
                <input
                  type="number"
                  min="1"
                  value={zoneSortOrder}
                  onChange={(e) => setZoneSortOrder(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsZoneModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors"
                >
                  Lưu Khu Vực
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA BÀN ĂN */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full p-5 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-amber-500" />
                <span>{editingTable ? 'Chỉnh Sửa Bàn Ăn' : 'Tạo Bàn Ăn Mới'}</span>
              </h3>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Tên / Số Bàn *:
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="VD: Bàn 08, Bàn VIP 3..."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Thuộc Khu Vực (Zone) *:
                </label>
                <select
                  value={tableZoneId}
                  onChange={(e) => setTableZoneId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold"
                  required
                >
                  <option value="">-- Chọn khu vực --</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Sức chứa (Số ghế ngồi):
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={tableCapacity}
                  onChange={(e) => setTableCapacity(parseInt(e.target.value, 10) || 4)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors"
                >
                  {editingTable ? 'Cập Nhật Bàn' : 'Tạo Bàn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
