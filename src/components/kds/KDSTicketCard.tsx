'use client';

import React, { useState, useEffect } from 'react';
import { OrderItem, StationType, ItemStatus } from '@/types';
import { formatTimeAgo } from '@/lib/utils';
import {
  Flame,
  Wine,
  Clock,
  CheckCircle2,
  Play,
  RotateCcw,
  Check,
  AlertTriangle,
  Printer,
} from 'lucide-react';

export interface KDSTicket {
  id: string; // e.g. `${orderId}_${station}`
  orderId: string;
  tableNumber: string;
  zoneName?: string;
  station: StationType;
  createdAt: string;
  items: OrderItem[];
  status: 'pending' | 'cooking' | 'ready';
}

interface KDSTicketCardProps {
  ticket: KDSTicket;
  onUpdateTicketStatus: (ticket: KDSTicket, newStatus: 'pending' | 'cooking' | 'ready') => void;
  onUpdateItemStatus: (orderId: string, itemId: string, newStatus: ItemStatus) => void;
  onPrintTicket?: (ticket: KDSTicket) => void;
}

export const KDSTicketCard: React.FC<KDSTicketCardProps> = ({
  ticket,
  onUpdateTicketStatus,
  onUpdateItemStatus,
  onPrintTicket,
}) => {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Live timer for elapsed waiting time
  useEffect(() => {
    const calculateElapsed = () => {
      const diffMs = Date.now() - new Date(ticket.createdAt).getTime();
      setElapsedMinutes(Math.floor(diffMs / 60000));
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [ticket.createdAt]);

  const isKitchen = ticket.station === 'kitchen';

  // Urgent colors if order is waiting too long
  const isUrgent = elapsedMinutes >= 15;
  const isWarning = elapsedMinutes >= 8 && elapsedMinutes < 15;

  const timerColor = isUrgent
    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
    : isWarning
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
    : 'bg-stone-800 text-stone-300 border-stone-700';

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col shadow-md ${
        isUrgent && ticket.status !== 'ready'
          ? 'border-rose-500 bg-stone-900 shadow-rose-950/40'
          : 'border-stone-800 bg-stone-900/95 hover:border-stone-700'
      }`}
    >
      {/* Ticket Header */}
      <div
        className={`p-3.5 border-b border-stone-800 flex items-center justify-between ${
          isKitchen ? 'bg-orange-950/30' : 'bg-cyan-950/30'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Station Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs ${
              isKitchen ? 'bg-orange-500' : 'bg-cyan-600'
            }`}
          >
            {isKitchen ? <Flame className="w-3.5 h-3.5" /> : <Wine className="w-3.5 h-3.5" />}
            <span>{isKitchen ? 'BẾP' : 'QUẦY BAR'}</span>
          </span>

          {/* Table Number & Zone Badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {ticket.zoneName && (
              <span className="px-1.5 py-0.5 rounded bg-stone-800/90 text-amber-400 border border-amber-500/30 text-[11px] font-bold tracking-tight">
                {ticket.zoneName}
              </span>
            )}
            <span className="text-base font-black text-white tracking-wide">
              {ticket.tableNumber}
            </span>
          </div>
        </div>

        {/* Elapsed Timer & Order Ref & Print Button */}
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${timerColor}`}
            title={`Tạo lúc: ${new Date(ticket.createdAt).toLocaleTimeString('vi-VN')}`}
          >
            {isUrgent && <AlertTriangle className="w-3 h-3 text-rose-400 animate-bounce" />}
            <Clock className="w-3 h-3" />
            <span>{elapsedMinutes < 1 ? 'Vừa xong' : `${elapsedMinutes}m`}</span>
          </span>

          {onPrintTicket && (
            <button
              onClick={() => onPrintTicket(ticket)}
              className="p-1 rounded-md bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors border border-stone-700/60"
              title="In Tem Dán / Kẹp Dĩa (K80/K50)"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          )}

          <span className="text-[11px] font-mono text-stone-500 hidden sm:inline">
            #{ticket.orderId.slice(-4)}
          </span>
        </div>
      </div>

      {/* Ticket Items List */}
      <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto max-h-72">
        {ticket.items.map((item) => {
          const isItemDone = item.item_status === 'ready' || item.item_status === 'served';

          return (
            <div
              key={item.id}
              onClick={() => {
                const nextItemStatus: ItemStatus = isItemDone ? 'cooking' : 'ready';
                onUpdateItemStatus(ticket.orderId, item.id, nextItemStatus);
              }}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                isItemDone
                  ? 'bg-stone-900/40 border-stone-800 opacity-50 line-through'
                  : 'bg-stone-800/60 border-stone-700/60 hover:bg-stone-800 hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-start gap-2.5 flex-1">
                {/* Quantity Badge */}
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 font-black text-xs shrink-0 mt-0.5">
                  {item.quantity}x
                </span>

                <div className="flex-1">
                  <h4 className="text-sm font-bold text-stone-100 leading-tight">
                    {item.menu_item_name}
                  </h4>

                  {/* Modifiers (Độ chín, đường, đá, topping) */}
                  {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.selected_modifiers.map((mod) => (
                        <span
                          key={mod.id}
                          className="text-[11px] px-1.5 py-0.2 bg-stone-700 text-amber-300 font-semibold rounded"
                        >
                          {mod.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <p className="text-xs text-rose-300 italic mt-1 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/40">
                      Ghi chú: {item.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Status checkbox icon */}
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 mt-0.5 ${
                  isItemDone
                    ? 'bg-emerald-500 border-emerald-500 text-stone-950'
                    : 'border-stone-600 hover:border-amber-400'
                }`}
              >
                {isItemDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ticket Footer Action Buttons */}
      <div className="p-3 bg-stone-950/60 border-t border-stone-800">
        {ticket.status === 'pending' && (
          <button
            onClick={() => onUpdateTicketStatus(ticket, 'cooking')}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
          >
            <Play className="w-3.5 h-3.5 fill-stone-950" />
            <span>BẮT ĐẦU CHẾ BIẾN</span>
          </button>
        )}

        {ticket.status === 'cooking' && (
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateTicketStatus(ticket, 'pending')}
              className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
              title="Quay lại Chờ xử lý"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateTicketStatus(ticket, 'ready')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>HOÀN TẤT & RA MÓN</span>
            </button>
          </div>
        )}

        {ticket.status === 'ready' && (
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold px-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              ĐÃ HOÀN TẤT
            </span>
            <button
              onClick={() => onUpdateTicketStatus(ticket, 'cooking')}
              className="text-[11px] text-stone-400 hover:text-white underline font-normal"
            >
              Làm lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
