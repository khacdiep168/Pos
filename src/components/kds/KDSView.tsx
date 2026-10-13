'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Order, OrderItem, StationType, ItemStatus } from '@/types';
import { orderService } from '@/services/orderService';
import { realtimeEngine } from '@/services/realtimeEngine';
import { playOrderNotificationSound, toggleAudioMute, isAudioAlertMuted } from '@/lib/audioAlert';
import { KDSTicket } from './KDSTicketCard';
import { KDSKanbanBoard } from './KDSKanbanBoard';

export const KDSView: React.FC = () => {
  const [tickets, setTickets] = useState<KDSTicket[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationType | 'all'>('all');
  const [isMuted, setIsMuted] = useState(false);

  // Convert an Order into 1 or 2 station tickets (Kitchen and/or Bar)
  const breakOrderIntoTickets = useCallback((order: Order): KDSTicket[] => {
    const stationTickets: KDSTicket[] = [];

    // Lookup table and its zone
    const allTables = orderService.getTables();
    const allZones = orderService.getZones();
    const table = allTables.find(
      (t) => t.id === order.table_id || t.table_number === order.table_number
    );
    const zone = table?.zone_id ? allZones.find((z) => z.id === table.zone_id) : undefined;
    const zoneName = zone?.name;

    const kitchenItems = order.items.filter((i) => i.station === 'kitchen');
    const barItems = order.items.filter((i) => i.station === 'bar');

    if (kitchenItems.length > 0) {
      // Determine kitchen ticket status
      const allReady = kitchenItems.every(
        (i) => i.item_status === 'ready' || i.item_status === 'served' || i.item_status === 'cancelled'
      );
      const anyCooking = kitchenItems.some((i) => i.item_status === 'cooking');
      const ticketStatus = allReady ? 'ready' : anyCooking ? 'cooking' : 'pending';

      stationTickets.push({
        id: `${order.id}_kitchen`,
        orderId: order.id,
        tableNumber: order.table_number,
        zoneName,
        station: 'kitchen',
        createdAt: order.created_at,
        items: kitchenItems,
        status: ticketStatus,
      });
    }

    if (barItems.length > 0) {
      // Determine bar ticket status
      const allReady = barItems.every(
        (i) => i.item_status === 'ready' || i.item_status === 'served' || i.item_status === 'cancelled'
      );
      const anyCooking = barItems.some((i) => i.item_status === 'cooking');
      const ticketStatus = allReady ? 'ready' : anyCooking ? 'cooking' : 'pending';

      stationTickets.push({
        id: `${order.id}_bar`,
        orderId: order.id,
        tableNumber: order.table_number,
        zoneName,
        station: 'bar',
        createdAt: order.created_at,
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

    // Filter out completely closed/cancelled orders if desired, or keep active
    allOrders.forEach((order) => {
      if (order.order_status !== 'cancelled') {
        const orderTickets = breakOrderIntoTickets(order);
        allTickets.push(...orderTickets);
      }
    });

    setTickets(allTickets);
  }, [breakOrderIntoTickets]);

  // Initial load & subscribe to realtime events
  useEffect(() => {
    setIsMuted(isAudioAlertMuted());
    refreshTickets();

    // 1. Subscribe to ORDER_CREATED (New orders incoming)
    const unsubOrderCreated = realtimeEngine.subscribe<Order>('ORDER_CREATED', (newOrder) => {
      // Play audible chime alert for kitchen & bar staff
      playOrderNotificationSound();

      const newTickets = breakOrderIntoTickets(newOrder);
      setTickets((prev) => {
        // Remove duplicates if any and prepend new tickets
        const idsToRemove = new Set(newTickets.map((t) => t.id));
        const filtered = prev.filter((t) => !idsToRemove.has(t.id));
        return [...newTickets, ...filtered];
      });
    });

    // 2. Subscribe to ORDER_UPDATED & ORDER_STATUS_CHANGED
    const unsubOrderUpdated = realtimeEngine.subscribe<Order>('ORDER_UPDATED', (updatedOrder) => {
      setTickets((prev) => {
        const updatedTickets = breakOrderIntoTickets(updatedOrder);
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
    playOrderNotificationSound();
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
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onTestSound={handleTestSound}
        onClearCompleted={handleClearCompleted}
      />
    </div>
  );
};
