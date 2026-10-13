'use client';

import React, { useState } from 'react';
import { Supplier, PurchaseOrder, RawMaterial } from '@/types';
import { formatCurrencyVND, formatDateTime } from '@/lib/utils';
import { inventoryService } from '@/services/inventoryService';
import { AddRawMaterialModal } from '@/components/admin/AddRawMaterialModal';
import { AddSupplierModal } from './AddSupplierModal';
import { EditSupplierModal } from './EditSupplierModal';
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
  Edit3,
  Trash2,
  Search,
  Building2,
  Mail,
} from 'lucide-react';
import { SearchableSelect, SearchableOption } from '@/components/ui/SearchableSelect';

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
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(materials[0]?.id || '');
  const [purchaseQty, setPurchaseQty] = useState<number>(2);
  const [purchaseUnitPrice, setPurchaseUnitPrice] = useState<number>(115000);
  const [totalPOAmount, setTotalPOAmount] = useState<number>(230000);

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

  const totalSupplierDebt = suppliers.reduce((sum, s) => sum + (s.total_debt || 0), 0);

  const filteredSuppliers = suppliers.filter((sup) => {
    if (!supplierSearch.trim()) return true;
    const q = supplierSearch.toLowerCase();
    return (
      sup.name.toLowerCase().includes(q) ||
      sup.phone.toLowerCase().includes(q) ||
      (sup.address && sup.address.toLowerCase().includes(q))
    );
  });

  const handleDeleteSupplier = (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp "${name}"?`)) {
      inventoryService.deleteSupplier(id);
      onRefresh();
    }
  };

  const handleStartPOForSupplier = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setIsModalOpen(true);
  };

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h3 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-500" />
            <span>Quản Lý Nhập Hàng & Nhà Cung Cấp</span>
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Quản lý thông tin nhà cung cấp, công nợ và tự động cập nhật giá vốn trung bình (MAC) khi nhập kho
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsAddSupplierModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Nhà Cung Cấp</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Phiếu PO</span>
          </button>
        </div>
      </div>

      {/* Suppliers Management Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <h4 className="font-bold text-xs text-stone-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>Hồ Sơ Nhà Cung Cấp ({suppliers.length} đối tác)</span>
            </h4>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
              Tổng nợ: {formatCurrencyVND(totalSupplierDebt)}
            </span>
          </div>

          {/* Supplier Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm đối tác theo tên, SĐT..."
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredSuppliers.length > 0 ? (
            filteredSuppliers.map((sup) => (
              <div
                key={sup.id}
                className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between hover:border-amber-500/40 transition-all group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-stone-900 dark:text-white leading-tight">
                      {sup.name}
                    </h4>
                    <span className="text-[10px] font-mono text-stone-400 shrink-0">#{sup.id}</span>
                  </div>

                  <div className="space-y-1 text-[11px] text-stone-500 dark:text-stone-400">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                      <a href={`tel:${sup.phone}`} className="hover:text-amber-600 font-mono">
                        {sup.phone}
                      </a>
                    </div>
                    {sup.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate">{sup.email}</span>
                      </div>
                    )}
                    {sup.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate">{sup.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-400 text-[11px]">Công nợ tồn:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrencyVND(sup.total_debt || 0)}
                    </span>
                  </div>

                  {/* Supplier Card Actions */}
                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingSupplier(sup)}
                        className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-500/10 text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(sup.id, sup.name)}
                        className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-rose-500/10 text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        title="Xóa nhà cung cấp"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleStartPOForSupplier(sup.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white text-[11px] font-bold transition-all"
                    >
                      <Truck className="w-3 h-3" />
                      <span>Nhập hàng</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-stone-400 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
              <p className="text-xs">Không tìm thấy nhà cung cấp nào phù hợp</p>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Orders List: Desktop List & Mobile Card List */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h4 className="font-bold text-xs text-stone-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Lịch Sử Phiếu Nhập Kho ({purchaseOrders.length} phiếu)</span>
          </h4>
          <span className="text-[11px] text-stone-400">Đã cập nhật vào sổ kho</span>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {purchaseOrders.map((po) => (
              <div key={po.id} className="p-4 flex items-center justify-between gap-3 text-xs hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
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

        {/* Mobile Card List (md:hidden) */}
        <div className="md:hidden space-y-2.5">
          {purchaseOrders.length === 0 ? (
            <div className="p-8 text-center text-stone-400 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Chưa có phiếu nhập kho nào</p>
            </div>
          ) : (
            purchaseOrders.map((po) => (
              <div
                key={po.id}
                className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-3.5 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                        #{po.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                        Đã nhập kho
                      </span>
                    </div>
                    <h5 className="font-extrabold text-stone-900 dark:text-white text-sm mt-0.5">
                      {po.supplier_name}
                    </h5>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-black text-sm text-stone-900 dark:text-white">
                      {formatCurrencyVND(po.total_amount)}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {formatDateTime(po.created_at)}
                    </div>
                  </div>
                </div>

                {/* Items list pill */}
                <div className="p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl space-y-1 text-xs">
                  {po.items.map((it) => (
                    <div key={it.raw_material_id} className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        {it.raw_material_name}
                      </span>
                      <span className="font-mono text-stone-500">
                        {it.quantity} x {formatCurrencyVND(it.unit_price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
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
                <SearchableSelect
                  options={materials.map((m) => ({
                    value: m.id,
                    label: m.name,
                    subLabel: `Đơn vị mua: ${m.purchase_unit} • Quy đổi: 1 ${m.purchase_unit} = ${m.conversion_factor.toLocaleString()} ${m.recipe_unit}`,
                    badge: m.purchase_unit,
                  }))}
                  value={selectedMaterialId}
                  onChange={(val) => setSelectedMaterialId(val)}
                  placeholder="-- Tìm hoặc chọn nguyên vật liệu --"
                  searchPlaceholder="Gõ tên nguyên liệu cần nhập kho..."
                />
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

      {/* Add Supplier Modal */}
      {isAddSupplierModalOpen && (
        <AddSupplierModal
          onClose={() => setIsAddSupplierModalOpen(false)}
          onSuccess={() => onRefresh()}
        />
      )}

      {/* Edit Supplier Modal */}
      {editingSupplier && (
        <EditSupplierModal
          supplier={editingSupplier}
          onClose={() => setEditingSupplier(null)}
          onSuccess={() => onRefresh()}
        />
      )}
    </div>
  );
};
