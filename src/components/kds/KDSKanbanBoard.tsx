'use client';

import React, { useState } from 'react';
import { KDSTicket, KDSTicketCard } from './KDSTicketCard';
import { StationType, ItemStatus } from '@/types';
import {
  Flame,
  Wine,
  Volume2,
  VolumeX,
  BellRing,
  RotateCcw,
  Sparkles,
  Inbox,
  ChefHat,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface KDSKanbanBoardProps {
  tickets: KDSTicket[];
  selectedStation: StationType | 'all';
  onStationChange: (station: StationType | 'all') => void;
  onUpdateTicketStatus: (ticket: KDSTicket, newStatus: 'pending' | 'cooking' | 'ready') => void;
  onUpdateItemStatus: (orderId: string, itemId: string, newStatus: ItemStatus) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onTestSound: () => void;
  onClearCompleted: () => void;
  onPrintTicket?: (ticket: KDSTicket) => void;
}

export const KDSKanbanBoard: React.FC<KDSKanbanBoardProps> = ({
  tickets,
  selectedStation,
  onStationChange,
  onUpdateTicketStatus,
  onUpdateItemStatus,
  isMuted,
  onToggleMute,
  onTestSound,
  onClearCompleted,
  onPrintTicket,
}) => {
  // Filter tickets by station
  const filteredTickets = tickets.filter((t) => {
    if (selectedStation === 'all') return true;
    return t.station === selectedStation;
  });

  const [mobileStatus, setMobileStatus] = useState<'pending' | 'cooking' | 'ready'>('pending');

  const pendingTickets = filteredTickets.filter((t) => t.status === 'pending');
  const cookingTickets = filteredTickets.filter((t) => t.status === 'cooking');
  const readyTickets = filteredTickets.filter((t) => t.status === 'ready');

  return (
    <div className="flex flex-col h-full w-full bg-stone-950 text-stone-100 select-none overflow-hidden">
      {/* Mobile Fixed Top Header for KDS (md:hidden) */}
      <div className="md:hidden bg-stone-900 border-b border-stone-800 p-3 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                KDS - Bếp & Bar
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onTestSound}
              className="p-1.5 rounded-lg bg-stone-800 text-stone-300 active:scale-95"
              title="Thử chuông"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
            </button>
            <button
              onClick={onToggleMute}
              className={`p-1.5 rounded-lg active:scale-95 ${
                isMuted ? 'bg-rose-950/60 text-rose-400' : 'bg-stone-800 text-stone-300'
              }`}
              title="Chuông"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            {readyTickets.length > 0 && (
              <button
                onClick={onClearCompleted}
                className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-rose-400"
                title="Dọn xong"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Station Filter Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-stone-950 rounded-xl border border-stone-800 text-center">
          <button
            onClick={() => onStationChange('all')}
            className={`py-1 rounded-lg text-xs font-bold transition-all ${
              selectedStation === 'all' ? 'bg-stone-800 text-white shadow-xs' : 'text-stone-400'
            }`}
          >
            Tất cả ({tickets.length})
          </button>
          <button
            onClick={() => onStationChange('kitchen')}
            className={`py-1 rounded-lg text-xs font-bold transition-all ${
              selectedStation === 'kitchen' ? 'bg-orange-500 text-white shadow-xs' : 'text-stone-400'
            }`}
          >
            Bếp ({tickets.filter((t) => t.station === 'kitchen').length})
          </button>
          <button
            onClick={() => onStationChange('bar')}
            className={`py-1 rounded-lg text-xs font-bold transition-all ${
              selectedStation === 'bar' ? 'bg-cyan-600 text-white shadow-xs' : 'text-stone-400'
            }`}
          >
            Bar ({tickets.filter((t) => t.station === 'bar').length})
          </button>
        </div>
      </div>

      {/* Mobile Segmented Control Sticky Bar: [Chờ xử lý (X)] | [Đang làm (Y)] | [Xong (Z)] */}
      <div className="md:hidden grid grid-cols-3 gap-1.5 p-2 bg-stone-900 border-b border-stone-800 shrink-0">
        <button
          onClick={() => setMobileStatus('pending')}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-black transition-all ${
            mobileStatus === 'pending'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-stone-800/80 text-amber-300/80 hover:bg-stone-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
          <span>Chờ ({pendingTickets.length})</span>
        </button>

        <button
          onClick={() => setMobileStatus('cooking')}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-black transition-all ${
            mobileStatus === 'cooking'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-stone-800/80 text-orange-300/80 hover:bg-stone-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span>Làm ({cookingTickets.length})</span>
        </button>

        <button
          onClick={() => setMobileStatus('ready')}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-black transition-all ${
            mobileStatus === 'ready'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-stone-800/80 text-emerald-300/80 hover:bg-stone-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Xong ({readyTickets.length})</span>
        </button>
      </div>

      {/* Mobile Single Column Ticket View (md:hidden) */}
      <div className="md:hidden flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {mobileStatus === 'pending' && (
          pendingTickets.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center p-6 text-center text-stone-600 bg-stone-900/40 rounded-2xl border border-stone-800">
              <Inbox className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-xs font-semibold">Chưa có order chờ xử lý</p>
            </div>
          ) : (
            pendingTickets.map((ticket) => (
              <KDSTicketCard
                key={ticket.id}
                ticket={ticket}
                onUpdateTicketStatus={onUpdateTicketStatus}
                onUpdateItemStatus={onUpdateItemStatus}
                onPrintTicket={onPrintTicket}
              />
            ))
          )
        )}

        {mobileStatus === 'cooking' && (
          cookingTickets.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center p-6 text-center text-stone-600 bg-stone-900/40 rounded-2xl border border-stone-800">
              <ChefHat className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-xs font-semibold">Không có món đang chế biến</p>
            </div>
          ) : (
            cookingTickets.map((ticket) => (
              <KDSTicketCard
                key={ticket.id}
                ticket={ticket}
                onUpdateTicketStatus={onUpdateTicketStatus}
                onUpdateItemStatus={onUpdateItemStatus}
                onPrintTicket={onPrintTicket}
              />
            ))
          )
        )}

        {mobileStatus === 'ready' && (
          readyTickets.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center p-6 text-center text-stone-600 bg-stone-900/40 rounded-2xl border border-stone-800">
              <CheckCircle2 className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-xs font-semibold">Chưa có món ra</p>
            </div>
          ) : (
            readyTickets.map((ticket) => (
              <KDSTicketCard
                key={ticket.id}
                ticket={ticket}
                onUpdateTicketStatus={onUpdateTicketStatus}
                onUpdateItemStatus={onUpdateItemStatus}
                onPrintTicket={onPrintTicket}
              />
            ))
          )
        )}
      </div>

      {/* Desktop Header Controls (hidden md:flex) */}
      <header className="hidden md:flex px-5 py-3 bg-stone-900 border-b border-stone-800 flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                KDS / BDS DISPLAY SYSTEM
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  REALTIME LIVE
                </span>
              </h1>
              <p className="text-xs text-stone-400">
                Màn hình điều phối Bếp & Quầy Bar theo thời gian thực
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-stone-800 hidden md:block" />

          {/* Station Filter Tabs */}
          <div className="flex items-center p-1 bg-stone-950 rounded-xl border border-stone-800">
            <button
              onClick={() => onStationChange('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStation === 'all'
                  ? 'bg-stone-800 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tất cả trạm</span>
              <span className="ml-1 text-[10px] px-1 bg-stone-700/60 rounded">
                {tickets.length}
              </span>
            </button>
            <button
              onClick={() => onStationChange('kitchen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStation === 'kitchen'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-stone-400 hover:text-orange-400'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Bếp (Food)</span>
              <span className="ml-1 text-[10px] px-1 bg-black/40 rounded">
                {tickets.filter((t) => t.station === 'kitchen').length}
              </span>
            </button>
            <button
              onClick={() => onStationChange('bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStation === 'bar'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-cyan-400'
              }`}
            >
              <Wine className="w-3.5 h-3.5" />
              <span>Quầy Bar (Drink)</span>
              <span className="ml-1 text-[10px] px-1 bg-black/40 rounded">
                {tickets.filter((t) => t.station === 'bar').length}
              </span>
            </button>
          </div>
        </div>

        {/* Right Tools: Audio & Clear */}
        <div className="flex items-center gap-2">
          {/* Test Sound button */}
          <button
            onClick={onTestSound}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors border border-stone-700/60"
            title="Kiểm tra âm thanh chuông"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Thử chuông</span>
          </button>

          {/* Mute/Unmute Toggle */}
          <button
            onClick={onToggleMute}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
              isMuted
                ? 'bg-rose-950/40 border-rose-800/80 text-rose-400 hover:bg-rose-900/50'
                : 'bg-stone-800 border-stone-700/60 text-stone-200 hover:bg-stone-700'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isMuted ? 'Đang tắt chuông' : 'Bật chuông'}</span>
          </button>

          {/* Clear Ready Tickets */}
          {readyTickets.length > 0 && (
            <button
              onClick={onClearCompleted}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-rose-950/40 text-stone-400 hover:text-rose-400 text-xs font-semibold transition-colors border border-stone-700/60"
              title="Dọn sạch các vé đã hoàn thành"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dọn xong</span>
            </button>
          )}
        </div>
      </header>

      {/* 3-Column Kanban Board (Desktop Only: hidden md:grid) */}
      <div className="hidden md:grid flex-1 grid-cols-3 gap-3 md:gap-4 p-3 md:p-4 overflow-hidden min-h-0">
        {/* Column 1: Chờ xử lý (Pending) */}
        <div className="flex flex-col bg-stone-900/60 rounded-2xl border border-stone-800/80 overflow-hidden min-h-[380px] md:min-h-0">
          <div className="p-3.5 bg-stone-900 border-b border-stone-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-sm font-black text-amber-300 tracking-wide">
                CHỜ XỬ LÝ (MỚI)
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-extrabold border border-amber-400/30">
              {pendingTickets.length}
            </span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {pendingTickets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-stone-600">
                <Inbox className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-xs font-semibold">Chưa có order mới</p>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  Order gửi từ FOH sẽ tự động đổ về đây ngay lập tức
                </p>
              </div>
            ) : (
              pendingTickets.map((ticket) => (
                <KDSTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onUpdateTicketStatus={onUpdateTicketStatus}
                  onUpdateItemStatus={onUpdateItemStatus}
                  onPrintTicket={onPrintTicket}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 2: Đang làm (Cooking) */}
        <div className="flex flex-col bg-stone-900/60 rounded-2xl border border-stone-800/80 overflow-hidden min-h-[380px] md:min-h-0">
          <div className="p-3.5 bg-stone-900 border-b border-stone-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <h2 className="text-sm font-black text-orange-400 tracking-wide">
                ĐANG CHẾ BIẾN
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-extrabold border border-orange-500/30">
              {cookingTickets.length}
            </span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {cookingTickets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-stone-600">
                <ChefHat className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-xs font-semibold">Bếp & Bar đang rảnh</p>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  Bấm "Bắt đầu chế biến" ở cột Chờ xử lý để chuyển sang đây
                </p>
              </div>
            ) : (
              cookingTickets.map((ticket) => (
                <KDSTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onUpdateTicketStatus={onUpdateTicketStatus}
                  onUpdateItemStatus={onUpdateItemStatus}
                  onPrintTicket={onPrintTicket}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 3: Hoàn thành (Ready) */}
        <div className="flex flex-col bg-stone-900/60 rounded-2xl border border-stone-800/80 overflow-hidden min-h-[380px] md:min-h-0">
          <div className="p-3.5 bg-stone-900 border-b border-stone-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h2 className="text-sm font-black text-emerald-400 tracking-wide">
                HOÀN THÀNH & SẴN SÀNG
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-400 text-xs font-extrabold border border-emerald-400/30">
              {readyTickets.length}
            </span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {readyTickets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-stone-600">
                <CheckCircle2 className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-xs font-semibold">Chưa có món ra</p>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  Món đã hoàn tất sẽ hiển thị tại đây để nhân viên phục vụ nhận món
                </p>
              </div>
            ) : (
              readyTickets.map((ticket) => (
                <KDSTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onUpdateTicketStatus={onUpdateTicketStatus}
                  onUpdateItemStatus={onUpdateItemStatus}
                  onPrintTicket={onPrintTicket}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
