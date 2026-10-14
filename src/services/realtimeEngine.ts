// Multi-Device Real-Time Event Bus & Engine using Supabase Realtime Channel
// Seamlessly syncs between Server POS, Waiter Mobiles, Kitchen Tablets, and Cashier Desks

import { supabase } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

type EventCallback<T = any> = (payload: T) => void;

export type RealtimeEventType =
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED'
  | 'ORDER_STATUS_CHANGED'
  | 'ITEM_STATUS_CHANGED'
  | 'TABLE_STATUS_CHANGED'
  | 'PAYMENT_COMPLETED'
  | 'STOCK_ALERT'
  | 'CALL_WAITER'
  | 'CUSTOMER_UPDATED'
  | 'SUPPLIER_DEBT_UPDATED'
  | 'CASHBOOK_UPDATED'
  | 'TAX_CONFIG_UPDATED';

class RealtimeEngine {
  private listeners: Map<RealtimeEventType, Set<EventCallback>> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private supabaseChannel: RealtimeChannel | null = null;
  private isConnected = false;
  private reconnectTimer: any = null;

  constructor() {
    this.initLocalBroadcast();
    this.initSupabaseRealtime();
    this.initMobileLifecycleListeners();
  }

  /**
   * 1. Initialize local browser tab synchronization via BroadcastChannel
   */
  private initLocalBroadcast() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('pos_realtime_events');
      this.broadcastChannel.onmessage = (event) => {
        const { type, payload, origin } = event.data;
        // Avoid re-triggering if echoed from same client instance
        if (origin !== 'supabase_remote') {
          this.notifyLocally(type, payload);
        }
      };
    }
  }

  /**
   * 2. Initialize cross-device room 'pos-channel' via Supabase Realtime broadcast
   */
  public initSupabaseRealtime() {
    if (!supabase) return;

    try {
      if (this.supabaseChannel) {
        try {
          supabase.removeChannel(this.supabaseChannel);
        } catch {}
      }

      this.supabaseChannel = supabase.channel('pos-channel', {
        config: {
          broadcast: { self: false }, // Do not echo back to self
        },
      });

      this.supabaseChannel
        .on('broadcast', { event: 'pos-event' }, ({ payload }) => {
          if (payload && payload.type) {
            console.log(`[Supabase Realtime Received] Event: ${payload.type} from remote device`);
            this.notifyLocally(payload.type, payload.data);

            // Also forward to other local tabs if any
            if (this.broadcastChannel) {
              this.broadcastChannel.postMessage({
                type: payload.type,
                payload: payload.data,
                origin: 'supabase_remote',
              });
            }
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            if (this.reconnectTimer) {
              clearTimeout(this.reconnectTimer);
              this.reconnectTimer = null;
            }
            console.log('[RealtimeEngine] Connected to Supabase Realtime room: pos-channel (Cross-device sync ACTIVE)');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            this.isConnected = false;
            console.warn('[RealtimeEngine] Supabase Realtime status:', status);
            this.scheduleReconnect();
          }
        });
    } catch (err) {
      console.warn('[RealtimeEngine] Could not initialize Supabase Realtime channel:', err);
      this.scheduleReconnect();
    }
  }

  /**
   * Auto-reconnect when device screen turns on or network recovers
   */
  private initMobileLifecycleListeners() {
    if (typeof window === 'undefined') return;

    // When phone screen unlocks or user switches back to browser tab
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.isConnected) {
        console.log('[RealtimeEngine] Tab resumed visible on mobile, reconnecting Realtime...');
        this.reconnect();
      }
    });

    // When network reconnects (e.g. WiFi reconnections in kitchen)
    window.addEventListener('online', () => {
      console.log('[RealtimeEngine] Network online event detected, reconnecting Realtime...');
      this.reconnect();
    });
  }

  private scheduleReconnect() {
    if (typeof window === 'undefined') return;
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isConnected) {
        console.log('[RealtimeEngine] Attempting automatic reconnection to pos-channel...');
        this.initSupabaseRealtime();
      }
    }, 3000);
  }

  public reconnect(): void {
    this.initSupabaseRealtime();
  }

  /**
   * Subscribe to a specific real-time event
   */
  public subscribe<T = any>(event: RealtimeEventType, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit an event locally, to local tabs, and across all connected devices via Supabase
   */
  public emit<T = any>(event: RealtimeEventType, payload: T): void {
    // 1. Notify current window subscribers immediately (0ms latency)
    this.notifyLocally(event, payload);

    // 2. Broadcast to other tabs on the same machine
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: event, payload, origin: 'local' });
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }

    // 3. Broadcast across ALL devices (mobiles, tablets, POS desktops) via Supabase
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'pos-event',
          payload: {
            type: event,
            data: payload,
            senderTimestamp: Date.now(),
          },
        });
      } catch (err) {
        console.warn('Supabase broadcast send error:', err);
      }
    }
  }

  public isRealtimeConnected(): boolean {
    return this.isConnected;
  }

  private notifyLocally(event: RealtimeEventType, payload: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((callback) => {
        try {
          callback(payload);
        } catch (err) {
          console.error(`Error in realtime handler for ${event}:`, err);
        }
      });
    }
  }
}

export const realtimeEngine = new RealtimeEngine();
