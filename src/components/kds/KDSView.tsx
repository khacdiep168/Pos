'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Order, OrderItem, StationType, ItemStatus } from '@/types';
import { orderService } from '@/services/orderService';
import { realtimeEngine } from '@/services/realtimeEngine';
import { playNewOrderSound, toggleAudioMute, isAudioAlertMuted } from '@/lib/audioAlert';
import { useAuth } from '@/context/AuthContext';
import { KDSTicket } from './KDSTicketCard';
import { KDSKanbanBoard } from './KDSKanbanBoard';
import { KitchenReceiptModal } from './KitchenReceiptModal';

export const KDSView: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<KDSTicket[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationType | 'all'>(() => {
    if (user?.role === 'bar') return 'bar';
    if (user?.role === 'kitchen') return 'kitchen';
    return 'all';
  });
  const [isMuted, setIsMuted] = useState(false);
  const [printTicket, setPrintTicket] = useState<KDSTicket | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Synchronize station filter when user account changes
  useEffect(() => {
    if (user?.role === 'bar') {
      setSelectedStation('bar');
    } else if (user?.role === 'kitchen') {
      setSelectedStation('kitchen');
    }
  }, [user?.role]);

  // Convert an Order into 1 or 2 station tickets (Kitchen and/or Bar)
  const breakOrderIntoTickets = useCallback((order: any): KDSTicket[] => {
    const stationTickets: KDSTicket[] = [];
    if (!order || !order.id || !Array.isArray(order.items)) {
      return stationTickets;
    }

    // Lookup table and its zone
    const allTables = orderService.getTables() || [];
    const allZones = orderService.getZones() || [];
    const table = allTables.find(
      (t) => t.id === order.table_id || t.table_number === order.table_number
    );
    const zone = table?.zone_id ? allZones.find((z) => z.id === table.zone_id) : undefined;
    const zoneName = zone?.name;

    const kitchenItems = order.items.filter((i: any) => i && i.station === 'kitchen');
    const barItems = order.items.filter((i: any) => i && i.station === 'bar');

    if (kitchenItems.length > 0) {
      // Determine kitchen ticket status
      const allReady = kitchenItems.every(
        (i: any) => i.item_status === 'ready' || i.item_status === 'served' || i.item_status === 'cancelled'
      );
      const anyCooking = kitchenItems.some((i: any) => i.item_status === 'cooking');
      const ticketStatus = allReady ? 'ready' : anyCooking ? 'cooking' : 'pending';

      stationTickets.push({
        id: `${order.id}_kitchen`,
        orderId: order.id,
        tableNumber: order.table_number || 'Bàn',
        zoneName,
        station: 'kitchen',
        createdAt: order.created_at || new Date().toISOString(),
        items: kitchenItems,
        status: ticketStatus,
      });
    }

    if (barItems.length > 0) {
      // Determine bar ticket status
      const allReady = barItems.every(
        (i: any) => i.item_status === 'ready' || i.item_status === 'served' || i.item_status === 'cancelled'
      );
      const anyCooking = barItems.some((i: any) => i.item_status === 'cooking');
      const ticketStatus = allReady ? 'ready' : anyCooking ? 'cooking' : 'pending';

      stationTickets.push({
        id: `${order.id}_bar`,
        orderId: order.id,
        tableNumber: order.table_number || 'Bàn',
        zoneName,
        station: 'bar',
        createdAt: order.created_at || new Date().toISOString(),
        items: barItems,
        status: ticketStatus,
      });
    }

    return stationTickets;
  }, []);

  // Reload all tickets from stored orders
  const refreshTickets = useCallback(() => {
    const allOrders = orderService.getOrders();
    const allTickets: KDSTicket[] = [];

    if (Array.isArray(allOrders)) {
      allOrders.forEach((order) => {
        if (order && order.order_status !== 'cancelled') {
          const orderTickets = breakOrderIntoTickets(order);
          allTickets.push(...orderTickets);
        }
      });
    }

    setTickets(allTickets);
  }, [breakOrderIntoTickets]);

  // Initial load & subscribe to realtime events
  useEffect(() => {
    setIsMuted(isAudioAlertMuted());
    refreshTickets();

    // 1. Subscribe to ORDER_CREATED (New orders incoming)
    const unsubOrderCreated = realtimeEngine.subscribe<any>('ORDER_CREATED', (newOrder) => {
      if (!newOrder || !newOrder.id || !Array.isArray(newOrder.items)) {
        refreshTickets();
        return;
      }

      // Bếp & Bar: Tiếng bíp dồn dập báo món mới
      playNewOrderSound();

      const newTickets = breakOrderIntoTickets(newOrder);
      if (newTickets.length === 0) return;

      setTickets((prev) => {
        // Remove duplicates if any and prepend new tickets
        const idsToRemove = new Set(newTickets.map((t) => t.id));
        const filtered = prev.filter((t) => !idsToRemove.has(t.id));
        return [...newTickets, ...filtered];
      });
    });

    // 2. Subscribe to ORDER_UPDATED & ORDER_STATUS_CHANGED
    const unsubOrderUpdated = realtimeEngine.subscribe<any>('ORDER_UPDATED', (payload) => {
      // If payload is a generic signal (e.g. { type: 'SUPABASE_SYNC_COMPLETED' }) or lacks items
      if (!payload || !payload.id || !Array.isArray(payload.items)) {
        refreshTickets();
        return;
      }

      setTickets((prev) => {
        const updatedTickets = breakOrderIntoTickets(payload);
        const updatedMap = new Map(updatedTickets.map((t) => [t.id, t]));

        return prev.map((t) => (updatedMap.has(t.id) ? updatedMap.get(t.id)! : t));
      });
    });

    // 3. Subscribe to ITEM_STATUS_CHANGED
    const unsubItemStatus = realtimeEngine.subscribe<{ orderId: string; item: OrderItem }>(
      'ITEM_STATUS_CHANGED',
      () => {
        refreshTickets();
      }
    );

    return () => {
      unsubOrderCreated();
      unsubOrderUpdated();
      unsubItemStatus();
    };
  }, [breakOrderIntoTickets, refreshTickets]);

  // Handle ticket status change (pending -> cooking -> ready)
  const handleUpdateTicketStatus = (
    ticket: KDSTicket,
    newStatus: 'pending' | 'cooking' | 'ready'
  ) => {
    // Map ticket status to OrderItem status
    const itemStatusMap: Record<string, ItemStatus> = {
      pending: 'pending',
      cooking: 'cooking',
      ready: 'ready',
    };

    const targetItemStatus = itemStatusMap[newStatus];

    // Update in orderService
    const updatedOrder = orderService.updateStationItemsStatus(
      ticket.orderId,
      ticket.station,
      targetItemStatus
    );

    if (updatedOrder) {
      // Tự động mở modal và kích hoạt lệnh in tem nhiệt K80/K50 khi bấm Hoàn tất ra món
      if (newStatus === 'ready') {
        setPrintTicket(ticket);
        setIsPrintModalOpen(true);
      }

      // Optimistic local update
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id === ticket.id) {
            return {
              ...t,
              status: newStatus,
              items: t.items.map((i) => ({ ...i, item_status: targetItemStatus })),
            };
          }
          return t;
        })
      );
    }
  };

  // In tem nhiệt thủ công theo yêu cầu nhân viên
  const handlePrintTicket = (ticket: KDSTicket) => {
    setPrintTicket(ticket);
    setIsPrintModalOpen(true);
  };

  // Handle single item status change
  const handleUpdateItemStatus = (orderId: string, itemId: string, newStatus: ItemStatus) => {
    const updatedOrder = orderService.updateItemStatus(orderId, itemId, newStatus);
    if (updatedOrder) {
      refreshTickets();
    }
  };

  // Sound controls
  const handleToggleMute = () => {
    const nextMuted = toggleAudioMute();
    setIsMuted(nextMuted);
  };

  const handleTestSound = () => {
    playNewOrderSound();
  };

  // Clear completed tickets from the board view
  const handleClearCompleted = () => {
    setTickets((prev) => prev.filter((t) => t.status !== 'ready'));
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <KDSKanbanBoard
        tickets={tickets}
        selectedStation={selectedStation}
        onStationChange={setSelectedStation}
        onUpdateTicketStatus={handleUpdateTicketStatus}
        onUpdateItemStatus={handleUpdateItemStatus}
        onPrintTicket={handlePrintTicket}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onTestSound={handleTestSound}
        onClearCompleted={handleClearCompleted}
      />

      {/* Kitchen & Bar Thermal Ticket Printing Modal */}
      <KitchenReceiptModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        ticket={printTicket}
        autoPrint={true}
      />
    </div>
  );
};
