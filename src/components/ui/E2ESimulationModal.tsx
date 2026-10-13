'use client';

import React, { useState } from 'react';
import { runE2ESimulation, E2EStepLog } from '@/services/e2eSimulation';

interface E2ESimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function E2ESimulationModal({ isOpen, onClose }: E2ESimulationModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<E2EStepLog[]>([]);
  const [result, setResult] = useState<{ success: boolean; orderId: string } | null>(null);

  if (!isOpen) return null;

  const handleStartSimulation = async () => {
    setIsRunning(true);
    setResult(null);
    setLogs([]);

    const res = await runE2ESimulation((updatedLogs) => {
      setLogs(updatedLogs);
    });

    setResult(res);
    setIsRunning(false);
  };

  const handleOpenAllScreens = () => {
    // Open 4 screens in separate tabs
    window.open('/', '_blank');
    window.open('/kds', '_blank');
    window.open('/cashier', '_blank');
    window.open('/admin', '_blank');
  };

  const completedSteps = logs.filter((l) => l.status === 'completed').length;
  const progressPercent = logs.length > 0 ? (completedSteps / logs.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 text-xl font-bold">
              ⚡
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Kiểm Thử Liên Thông E2E (End-to-End Simulation)
              </h3>
              <p className="text-xs text-slate-400">
                Tự động kiểm tra luồng FOH ➔ KDS ➔ Cashier ➔ ERP ➔ Admin Dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Screen Launch Banner */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <span>🖥️ Mở 4 Màn Hình Đồng Thời</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">Multi-screen</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mở 4 tab riêng biệt (FOH, KDS, Thu Ngân, Admin) để quan sát hiệu ứng real-time chéo nhau.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAllScreens}
              className="px-3.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 shadow"
            >
              <span>🚀 Mở 4 Tab</span>
            </button>
          </div>

          {/* Progress Bar */}
          {logs.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-400">
                <span>Tiến độ mô phỏng</span>
                <span className="text-orange-400 font-bold">{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Step Timeline */}
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                <div className="text-4xl mb-3">🎯</div>
                <h4 className="text-sm font-semibold text-slate-300">Sẵn sàng chạy kịch bản gọi món khép kín</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Kịch bản gồm: Bàn 02 gọi Bò Wagyu + Cà phê Muối ➔ Gửi order & KDS báo chuông ➔ Bếp/Bar ra món ➔ Thu ngân quét VietQR tính tiền ➔ ERP trừ bột cafe & thịt bò ➔ Admin tăng doanh thu.
                </p>
              </div>
            ) : (
              logs.map((step) => {
                const isPending = step.status === 'pending';
                const isCurrent = step.status === 'running';
                const isDone = step.status === 'completed';

                return (
                  <div
                    key={step.step}
                    className={`p-3.5 rounded-xl border transition-all duration-300 flex items-start gap-3.5 ${
                      isDone
                        ? 'bg-emerald-950/20 border-emerald-800/40'
                        : isCurrent
                        ? 'bg-orange-950/30 border-orange-600/60 shadow-lg shadow-orange-950/50'
                        : 'bg-slate-950/40 border-slate-850 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                        isDone
                          ? 'bg-emerald-500 text-slate-950'
                          : isCurrent
                          ? 'bg-orange-500 text-white animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isDone ? '✓' : step.step}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isDone ? 'text-emerald-300' : isCurrent ? 'text-orange-300' : 'text-slate-300'}`}>
                          {step.title}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">{step.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>

                      {step.details && (
                        <div className="mt-2 text-[11px] bg-slate-900/90 border border-slate-800 rounded-md p-2 text-slate-300 font-mono">
                          {JSON.stringify(step.details)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Result Alert */}
          {result && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                result.success
                  ? 'bg-emerald-900/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-900/30 border-red-500/40 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{result.success ? '🎉' : '❌'}</span>
                <div>
                  <div className="text-sm font-bold">
                    {result.success ? 'Kiểm thử liên thông thành công 100%!' : 'Quá trình giả lập gặp sự cố'}
                  </div>
                  <div className="text-xs text-slate-400">
                    Mã đơn hàng: <span className="font-mono text-emerald-400">{result.orderId}</span> (Đã thanh toán & trừ kho thành công)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleStartSimulation}
            disabled={isRunning}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 ${
              isRunning
                ? 'bg-orange-600/50 text-orange-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20 active:scale-95'
            }`}
          >
            {isRunning ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang chạy giả lập...</span>
              </>
            ) : (
              <>
                <span>▶</span>
                <span>{logs.length > 0 ? 'Chạy Lại Giả Lập E2E' : 'Bắt Đầu Giả Lập E2E'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
