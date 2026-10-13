// Real-Time Event Bus & Engine for Order Sync (KDS, Cashier, FOH)
// Pluggable with WebSocket or Supabase Realtime

type EventCallback<T = any> = (payload: T) => void;

export type RealtimeEventType =
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_CHANGED'
  | 'ITEM_STATUS_CHANGED'
  | 'TABLE_STATUS_CHANGED'
  | 'PAYMENT_COMPLETED'
  | 'STOCK_ALERT';

class RealtimeEngine {
  private listeners: Map<RealtimeEventType, Set<EventCallback>> = new Map();
  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('pos_realtime_events');
      this.channel.onmessage = (event) => {
        const { type, payload } = event.data;
        this.notifyLocally(type, payload);
      };
    }
  }

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

  public emit<T = any>(event: RealtimeEventType, payload: T): void {
    // Notify local subscribers
    this.notifyLocally(event, payload);

    // Broadcast to other browser tabs / displays (e.g. Kitchen display tab, Cashier tab)
    if (this.channel) {
      this.channel.postMessage({ type: event, payload });
    }
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
