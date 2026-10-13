'use client';

import { Customer, Order } from '@/types';
import {
  initialCustomers,
  addMockCustomer,
  updateMockCustomer,
  deleteMockCustomer,
} from '@/database/mockData';
import { realtimeEngine } from './realtimeEngine';

const STORAGE_CUSTOMERS_KEY = 'pos_customers_data';

class CustomerService {
  private customers: Customer[] = [];
  private isListening = false;

  constructor() {
    this.initStorage();
    this.initRealtimeListener();
  }

  private initStorage() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_CUSTOMERS_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.customers = parsed && parsed.length > 0 ? parsed : [...initialCustomers];
        } catch {
          this.customers = [...initialCustomers];
        }
      } else {
        this.customers = [...initialCustomers];
        localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(this.customers));
      }
    } else {
      this.customers = [...initialCustomers];
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(this.customers));
    }
  }

  private initRealtimeListener() {
    if (this.isListening) return;
    this.isListening = true;

    // Listen to completed payment event to accumulate total spending & points
    realtimeEngine.subscribe('PAYMENT_COMPLETED', (payload: { order: Order }) => {
      if (payload && payload.order && payload.order.customer_id) {
        this.recordCustomerSpending(payload.order.customer_id, payload.order.total_amount);
      }
    });
  }

  public getCustomers(): Customer[] {
    return [...this.customers];
  }

  public getCustomerById(id: string): Customer | null {
    return this.customers.find((c) => c.id === id) || null;
  }

  public getCustomerByPhone(phone: string): Customer | null {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    return this.customers.find((c) => c.phone.replace(/\s+/g, '') === cleanPhone) || null;
  }

  public addCustomer(
    data: Omit<Customer, 'id' | 'total_spent' | 'points' | 'created_at'>
  ): Customer {
    const newCustomer: Customer = {
      ...data,
      id: `cus-${Date.now().toString().slice(-6)}`,
      total_spent: 0,
      points: 0,
      membership_tier: data.membership_tier || 'bronze',
      created_at: new Date().toISOString(),
    };

    this.customers.unshift(newCustomer);
    addMockCustomer(newCustomer);
    this.save();
    realtimeEngine.emit('CUSTOMER_UPDATED', newCustomer);
    return newCustomer;
  }

  public updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const idx = this.customers.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    this.customers[idx] = { ...this.customers[idx], ...updates };
    updateMockCustomer(id, updates);
    this.save();
    realtimeEngine.emit('CUSTOMER_UPDATED', this.customers[idx]);
    return this.customers[idx];
  }

  public deleteCustomer(id: string): boolean {
    const idx = this.customers.findIndex((c) => c.id === id);
    if (idx === -1) return false;

    this.customers.splice(idx, 1);
    deleteMockCustomer(id);
    this.save();
    realtimeEngine.emit('CUSTOMER_UPDATED', { id, deleted: true });
    return true;
  }

  public recordCustomerSpending(customerId: string, amount: number): Customer | null {
    const customer = this.customers.find((c) => c.id === customerId);
    if (!customer || amount <= 0) return null;

    customer.total_spent = (customer.total_spent || 0) + amount;
    // 1 point for every 10,000 VND
    customer.points = (customer.points || 0) + Math.floor(amount / 10000);

    // Auto promote membership tier based on lifetime spend
    if (customer.total_spent >= 10000000) {
      customer.membership_tier = 'diamond';
    } else if (customer.total_spent >= 5000000) {
      customer.membership_tier = 'gold';
    } else if (customer.total_spent >= 2000000) {
      customer.membership_tier = 'silver';
    } else {
      customer.membership_tier = 'bronze';
    }

    updateMockCustomer(customerId, {
      total_spent: customer.total_spent,
      points: customer.points,
      membership_tier: customer.membership_tier,
    });

    this.save();
    realtimeEngine.emit('CUSTOMER_UPDATED', customer);
    return customer;
  }
}

export const customerService = new CustomerService();
