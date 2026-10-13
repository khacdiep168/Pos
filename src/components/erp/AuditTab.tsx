'use client';

import React, { useState } from 'react';
import { RawMaterial, StockAuditReport } from '@/types';
import { inventoryService } from '@/services/inventoryService';
import { formatCurrencyVND, formatDateTime } from '@/lib/utils';
import {
  ClipboardCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
  FileText,
  X,
  Sparkles,
  Layers,
} from 'lucide-react';

interface AuditTabProps {
  materials: RawMaterial[];
  onRefresh: () => void;
}

export const AuditTab: React.FC<AuditTabProps> = ({ materials, onRefresh }) => {
  const [audits, setAudits] = useState<StockAuditReport[]>(() => inventoryService.getStockAudits());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [performedBy, setPerformedBy] = useState('Thủ Kho Lê Văn Hùng');
  const [auditNotes, setAuditNotes] = useState('');
  const [selectedAuditDetail, setSelectedAuditDetail] = useState<StockAuditReport | null>(null);

  // Audit form values: map raw_material_id -> actual_stock
  const [actualCounts, setActualCounts] = useState<{ [id: string]: number }>({});

  const handleOpenNewAudit = () => {
    // Pre-fill actual counts with current system stock as starting point
    const initial: { [id: string]: number } = {};
    materials.forEach((m) => {
      initial[m.id] = m.current_stock;
    });
    setActualCounts(initial);
    setPerformedBy('Thủ Kho Lê Văn Hùng');
    setAuditNotes('');
    setIsModalOpen(true);
  };

  const handleCountChange = (materialId: string, value: number) => {
    setActualCounts((prev) => ({
      ...prev,
      [materialId]: value >= 0 ? value : 0,
    }));
  };

  const handleSaveAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!performedBy.trim()) return;

    const auditItems = materials.map((m) => ({
      raw_material_id: m.id,
      actual_stock: actualCounts[m.id] !== undefined ? actualCounts[m.id] : m.current_stock,
      note: actualCounts[m.id] !== m.current_stock ? 'Điều chỉnh kiểm kê' : undefined,
    }));

    const report = inventoryService.createStockAudit(performedBy.trim(), auditItems, auditNotes);
    setAudits(inventoryService.getStockAudits());
    onRefresh();
    setIsModalOpen(false);
    setSelectedAuditDetail(report);
  };

  // Metrics for modal preview
  const totalDifferenceValuePreview = materials.reduce((sum, m) => {
    const actual = actualCounts[m.id] !== undefined ? actualCounts[m.id] : m.current_stock;
    const diff = actual - m.current_stock;
    return sum + diff * m.avg_cost;
  }, 0);

  const changedItemsCount = materials.filter((m) => {
    const actual = actualCounts[m.id] !== undefined ? actualCounts[m.id] : m.current_stock;
    return actual !== m.current_stock;
  }).length;

  return (
    <div className="space-y-5">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h3 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-amber-500" />
            <span>Kiểm Kê Kho Định Kỳ & Cân Bằng Tồn Thực Tế (Reconciliation)</span>
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Nhập số lượng đếm tay, hệ thống tự đối chiếu với tồn sổ sách và ghi nhật ký cân bằng kho
          </p>
        </div>

        <button
          onClick={handleOpenNewAudit}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Phiếu Kiểm Kê Mới</span>
        </button>
      </div>

      {/* Danh Sách Phiếu Kiểm Kê */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 flex items-center justify-between">
          <h4 className="font-bold text-xs text-stone-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-amber-500" />
            <span>Lịch Sử Các Đợt Kiểm Kê ({audits.length} phiếu)</span>
          </h4>
          <span className="text-[11px] text-stone-400">Đã cân bằng vào sổ kho</span>
        </div>

        {audits.length === 0 ? (
          <div className="p-10 text-center text-stone-400">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-semibold">Chưa có đợt kiểm kê nào được lập</p>
            <p className="text-[11px] text-stone-500 mt-1">
              Bấm &quot;Tạo Phiếu Kiểm Kê Mới&quot; để thực hiện đợt kiểm kho đầu tiên.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {audits.map((audit) => {
              const diffItems = audit.items.filter((i) => i.difference !== 0);
              return (
                <div
                  key={audit.id}
                  onClick={() => setSelectedAuditDetail(audit)}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                        #{audit.id}
                      </span>
                      <span className="font-bold text-stone-900 dark:text-white">
                        {audit.performed_by}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                        Đã Cân Bằng Kho
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-500 flex items-center gap-2">
                      <span>{diffItems.length} mặt hàng có chênh lệch</span>
                      {audit.notes && <span>• {audit.notes}</span>}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-sm">
                      <span className={audit.total_difference_value < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {audit.total_difference_value > 0 ? '+' : ''}
                        {formatCurrencyVND(audit.total_difference_value)}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {formatDateTime(audit.audit_date)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CHI TIẾT PHIẾU KIỂM KÊ MODAL */}
      {selectedAuditDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-2xl w-full p-5 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <div>
                <h3 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>Chi Tiết Phiếu Kiểm Kê #{selectedAuditDetail.id}</span>
                </h3>
                <p className="text-[11px] text-stone-400">
                  Thực hiện bởi: {selectedAuditDetail.performed_by} • {formatDateTime(selectedAuditDetail.audit_date)}
                </p>
              </div>
              <button
                onClick={() => setSelectedAuditDetail(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-stone-800 text-stone-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Nguyên Liệu</th>
                    <th className="p-2.5 text-center">Tồn Sổ Sách</th>
                    <th className="p-2.5 text-center">Tồn Thực Tế</th>
                    <th className="p-2.5 text-center">Chênh Lệch</th>
                    <th className="p-2.5 text-right">Giá Trị Lệch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-medium">
                  {selectedAuditDetail.items.map((item) => (
                    <tr key={item.raw_material_id}>
                      <td className="p-2.5 font-bold text-stone-900 dark:text-white">
                        {item.raw_material_name}
                      </td>
                      <td className="p-2.5 text-center font-mono">
                        {item.system_stock.toLocaleString()} {item.recipe_unit}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold">
                        {item.actual_stock.toLocaleString()} {item.recipe_unit}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold">
                        <span className={item.difference < 0 ? 'text-rose-500' : item.difference > 0 ? 'text-emerald-500' : 'text-stone-400'}>
                          {item.difference > 0 ? `+${item.difference.toLocaleString()}` : item.difference.toLocaleString()} {item.recipe_unit}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold">
                        <span className={item.difference_value < 0 ? 'text-rose-500' : item.difference_value > 0 ? 'text-emerald-500' : 'text-stone-400'}>
                          {item.difference_value > 0 ? '+' : ''}{formatCurrencyVND(item.difference_value)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-stone-200 dark:border-stone-800 text-xs font-bold">
              <span>Tổng giá trị chênh lệch toàn đợt:</span>
              <span className={`text-sm font-mono font-black ${selectedAuditDetail.total_difference_value < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {selectedAuditDetail.total_difference_value > 0 ? '+' : ''}{formatCurrencyVND(selectedAuditDetail.total_difference_value)}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAuditDetail(null)}
                className="px-4 py-2 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO PHIẾU KIỂM KÊ MỚI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-3xl w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900 dark:text-white">
                    Lập Phiếu Kiểm Kê & Cân Bằng Kho
                  </h3>
                  <p className="text-xs text-stone-400">
                    Nhập số liệu đếm tay thực tế của từng nguyên liệu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAudit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Nhân viên kiểm kê *:
                  </label>
                  <input
                    type="text"
                    value={performedBy}
                    onChange={(e) => setPerformedBy(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Ghi chú đợt kiểm kê:
                  </label>
                  <input
                    type="text"
                    value={auditNotes}
                    onChange={(e) => setAuditNotes(e.target.value)}
                    placeholder="VD: Kiểm kê định kỳ cuối tuần, trước ca sáng..."
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Bảng nhập đếm tay */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 dark:bg-stone-800 text-stone-500 font-bold uppercase text-[10px] sticky top-0 z-10">
                    <tr>
                      <th className="p-3">Nguyên Vật Liệu</th>
                      <th className="p-3 text-center">Tồn Hệ Thống</th>
                      <th className="p-3 text-center">Tồn Thực Tế Đếm Tay</th>
                      <th className="p-3 text-center">Chênh Lệch</th>
                      <th className="p-3 text-right">Lệch Giá Trị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-medium">
                    {materials.map((m) => {
                      const actual = actualCounts[m.id] !== undefined ? actualCounts[m.id] : m.current_stock;
                      const diff = actual - m.current_stock;
                      const diffVal = diff * m.avg_cost;

                      return (
                        <tr key={m.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                          <td className="p-3">
                            <div className="font-bold text-stone-900 dark:text-white">{m.name}</div>
                            <span className="text-[10px] text-stone-400">Đơn vị: {m.recipe_unit}</span>
                          </td>

                          <td className="p-3 text-center font-mono text-stone-500">
                            {m.current_stock.toLocaleString()} {m.recipe_unit}
                          </td>

                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={actual}
                                onChange={(e) => handleCountChange(m.id, parseFloat(e.target.value) || 0)}
                                className="w-24 px-2.5 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold text-center text-xs focus:ring-2 focus:ring-amber-500/30"
                              />
                              <span className="text-[11px] text-stone-400">{m.recipe_unit}</span>
                            </div>
                          </td>

                          <td className="p-3 text-center font-mono font-bold">
                            <span className={diff < 0 ? 'text-rose-500' : diff > 0 ? 'text-emerald-500' : 'text-stone-400'}>
                              {diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()}
                            </span>
                          </td>

                          <td className="p-3 text-right font-mono font-bold">
                            <span className={diffVal < 0 ? 'text-rose-500' : diffVal > 0 ? 'text-emerald-500' : 'text-stone-400'}>
                              {diffVal > 0 ? '+' : ''}{formatCurrencyVND(diffVal)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Box */}
              <div className="p-3.5 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-stone-400 font-semibold">Mặt hàng thay đổi: </span>
                  <span className="font-extrabold text-stone-900 dark:text-white">
                    {changedItemsCount} / {materials.length} nguyên liệu
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-400 font-semibold">Tổng chênh lệch giá trị: </span>
                  <span className={`font-mono text-base font-black ${totalDifferenceValuePreview < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {totalDifferenceValuePreview > 0 ? '+' : ''}{formatCurrencyVND(totalDifferenceValuePreview)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-xl font-bold text-stone-600 dark:text-stone-300"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác Nhận & Cân Bằng Tồn Kho</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
