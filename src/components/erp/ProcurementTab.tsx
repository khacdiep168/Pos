'use client';

import React, { useState } from 'react';
import { Supplier, PurchaseOrder, RawMaterial } from '@/types';
import { formatCurrencyVND, formatDateTime } from '@/lib/utils';
import { inventoryService } from '@/services/inventoryService';
import { AddRawMaterialModal } from '@/components/admin/AddRawMaterialModal';
import {
  Truck,
  Plus,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  FileText,
  DollarSign,
  Boxes,
  X,
  Sparkles,
} from 'lucide-react';

interface ProcurementTabProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  materials: RawMaterial[];
  onRefresh: () => void;
}

export const ProcurementTab: React.FC<ProcurementTabProps> = ({
  suppliers,
  purchaseOrders,
  materials,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(materials[0]?.id || '');
  const [purchaseQty, setPurchaseQty] = useState<number>(2);
  const [purchaseUnitPrice, setPurchaseUnitPrice] = useState<number>(115000);
  const [totalPOAmount, setTotalPOAmount] = useState<number>(230000);

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

  // Sync unit price when material changes
  React.useEffect(() => {
    if (selectedMaterial) {
      const defaultUnitPrice = selectedMaterial.avg_cost > 0 
        ? selectedMaterial.avg_cost * selectedMaterial.conversion_factor 
        : 115000;
      setPurchaseUnitPrice(defaultUnitPrice);
      setTotalPOAmount(purchaseQty * defaultUnitPrice);
    }
  }, [selectedMaterialId]);

  // Handle changes with 2-way sync
  const handleQtyChange = (qty: number) => {
    setPurchaseQty(qty);
    setTotalPOAmount(Math.round(qty * purchaseUnitPrice));
  };

  const handleUnitPriceChange = (price: number) => {
    setPurchaseUnitPrice(price);
    setTotalPOAmount(Math.round(purchaseQty * price));
  };

  const handleTotalAmountChange = (total: number) => {
    setTotalPOAmount(total);
    if (purchaseQty > 0) {
      setPurchaseUnitPrice(Math.round(total / purchaseQty));
    }
  };

  const conversionFactor = selectedMaterial?.conversion_factor || 1000;
  // Unit cost formula: (Total / Qty) / Conversion Factor = Unit Price / Conversion Factor
  const calculatedUnitCost = purchaseQty > 0 && conversionFactor > 0
    ? Math.round((totalPOAmount / purchaseQty) / conversionFactor)
    : 0;

  const handleQuickMaterialAdded = (newMat: RawMaterial) => {
    onRefresh();
    setSelectedMaterialId(newMat.id);
    if (newMat.avg_cost > 0 && newMat.conversion_factor > 0) {
      const unitP = newMat.avg_cost * newMat.conversion_factor;
      setPurchaseUnitPrice(unitP);
      setTotalPOAmount(purchaseQty * unitP);
    }
  };

  const handleCreatePO = () => {
    if (!selectedSupplierId || !selectedMaterialId || purchaseQty <= 0) {
      alert('Vui lòng nhập đầy đủ thông tin hợp lệ!');
      return;
    }

    inventoryService.createPurchaseOrder(selectedSupplierId, [
      {
        raw_material_id: selectedMaterialId,
        quantity: purchaseQty,
        unit_price: purchaseUnitPrice,
      },
    ]);

    onRefresh();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h3 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-500" />
            <span>Quản Lý Nhập Hàng & Nhà Cung Cấp</span>
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Tạo phiếu nhập kho, tự động cộng tồn kho và tính lại giá vốn trung bình (Moving Average Cost)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Phiếu Nhập Kho (PO)</span>
        </button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suppliers.map((sup) => (
          <div
            key={sup.id}
            className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-2"
          >
            <div className="flex items-start justify-between">
              <h4 className="font-bold text-xs text-stone-900 dark:text-white leading-tight">
                {sup.name}
              </h4>
              <span className="text-[10px] font-mono text-stone-400">#{sup.id}</span>
            </div>

            <div className="space-y-1 text-[11px] text-stone-500 dark:text-stone-400">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-stone-400" />
                <span>{sup.phone}</span>
              </div>
              {sup.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-stone-400" />
                  <span className="truncate">{sup.address}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center text-xs">
              <span className="text-stone-400 text-[11px]">Công nợ tồn:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {formatCurrencyVND(sup.total_debt || 0)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Purchase Orders List */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 flex items-center justify-between">
          <h4 className="font-bold text-xs text-stone-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Lịch Sử Phiếu Nhập Kho ({purchaseOrders.length} phiếu)</span>
          </h4>
          <span className="text-[11px] text-stone-400">Đã cập nhật vào sổ kho</span>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {purchaseOrders.map((po) => (
            <div key={po.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                    #{po.id}
                  </span>
                  <span className="font-bold text-stone-900 dark:text-white">
                    {po.supplier_name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    Đã nhập kho
                  </span>
                </div>

                <div className="text-[11px] text-stone-500">
                  {po.items.map((it) => (
                    <span key={it.raw_material_id} className="mr-3">
                      • {it.raw_material_name}: {it.quantity} x {formatCurrencyVND(it.unit_price)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-sm text-stone-900 dark:text-white">
                  {formatCurrencyVND(po.total_amount)}
                </div>
                <div className="text-[10px] text-stone-400">
                  {formatDateTime(po.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Purchase Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full p-5 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-500" />
                <span>Tạo Phiếu Nhập Kho Mới</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-600 dark:text-stone-400 block mb-1">
                  Nhà cung cấp:
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-600 dark:text-stone-400 block text-xs">
                    Nguyên vật liệu nhập:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddMaterialModalOpen(true)}
                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-bold text-[11px] flex items-center gap-1 hover:underline active:scale-95 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Thêm nhanh nguyên liệu mới</span>
                  </button>
                </div>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold text-xs"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Đơn vị mua: {m.purchase_unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-stone-600 dark:text-stone-400 block mb-1">
                    Số lượng nhập ({selectedMaterial?.purchase_unit || 'đơn vị'}):
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={purchaseQty}
                    onChange={(e) => handleQtyChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-600 dark:text-stone-400 block mb-1">
                    Đơn giá mua (VND/{selectedMaterial?.purchase_unit || 'đv'}):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={purchaseUnitPrice}
                    onChange={(e) => handleUnitPriceChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-600 dark:text-stone-400 block mb-1">
                    Tổng tiền mua (VND):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={totalPOAmount}
                    onChange={(e) => handleTotalAmountChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold text-xs text-amber-600 dark:text-amber-400"
                  />
                </div>
              </div>

              {/* Box Thuật toán Tự động quy đổi Giá vốn (Unit Cost Conversion) */}
              <div className="p-3 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Thuật toán Quy đổi Giá vốn (Unit Cost Conversion)</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full font-bold">
                    Tự động lưu avg_cost
                  </span>
                </div>

                <div className="text-[11px] font-mono bg-white dark:bg-stone-900/90 p-2.5 rounded-xl border border-amber-500/20 space-y-1">
                  <div className="text-stone-400 text-[10px]">
                    Công thức: (Tổng tiền ÷ Số lượng mua) ÷ Hệ số quy đổi
                  </div>
                  <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center justify-between flex-wrap gap-1">
                    <span>
                      ({formatCurrencyVND(totalPOAmount)} ÷ {purchaseQty} {selectedMaterial?.purchase_unit}) ÷ {conversionFactor.toLocaleString()}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs">
                      = {formatCurrencyVND(calculatedUnitCost)} / {selectedMaterial?.recipe_unit}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-600 dark:text-stone-400">
                  <span>Giá vốn định mức hiện tại trong kho:</span>
                  <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                    {formatCurrencyVND(selectedMaterial?.avg_cost || 0)} / {selectedMaterial?.recipe_unit}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1">
                <div className="flex justify-between text-stone-500">
                  <span>Quy đổi tăng tồn kho:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    +{(purchaseQty * conversionFactor).toLocaleString()}{' '}
                    {selectedMaterial?.recipe_unit}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-stone-900 dark:text-white pt-1 border-t border-stone-200 dark:border-stone-700">
                  <span>Tổng tiền thanh toán hóa đơn:</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono text-base">
                    {formatCurrencyVND(totalPOAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleCreatePO}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
              >
                Xác Nhận Nhập Kho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Raw Material Modal */}
      <AddRawMaterialModal
        isOpen={isAddMaterialModalOpen}
        onClose={() => setIsAddMaterialModalOpen(false)}
        onMaterialAdded={handleQuickMaterialAdded}
      />
    </div>
  );
};
