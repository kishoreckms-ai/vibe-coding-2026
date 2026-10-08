import { Batch, Alert, Retailer, ProductSpec, DashboardStats } from '../types';

export const api = {
  async getBatches(filters?: { status?: string; category?: string; search?: string }): Promise<{ batches: Batch[]; stats: DashboardStats }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    
    const res = await fetch(`/api/batches?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch shipments');
    return res.json();
  },

  async getBatch(id: string): Promise<{ batch: Batch; spec: ProductSpec }> {
    const res = await fetch(`/api/batches/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch batch ${id}`);
    return res.json();
  },

  async createBatch(payload: {
    productKey: string;
    quantityKg: number;
    origin: string;
    destination: string;
    carrier: string;
    initialTemp?: number;
    initialHumidity?: number;
    totalExpectedTransitHours?: number;
  }): Promise<Batch> {
    const res = await fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create shipment');
    }
    return res.json();
  },

  async injectBreach(batchId: string, type: 'temp_high' | 'humidity_drop' | 'restore'): Promise<{ batch: Batch; message: string }> {
    const res = await fetch(`/api/batches/${batchId}/breach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
    if (!res.ok) throw new Error('Failed to inject excursion breach');
    return res.json();
  },

  async acceptLiquidation(batchId: string, data: { retailerId: string; discountPercent?: number }): Promise<{ batch: Batch }> {
    const res = await fetch(`/api/batches/${batchId}/discounts/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to dispatch liquidation offer');
    return res.json();
  },

  async getAlerts(): Promise<Alert[]> {
    const res = await fetch('/api/alerts');
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async resolveAlert(id: string): Promise<Alert> {
    const res = await fetch(`/api/alerts/${id}/resolve`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to resolve alert');
    return res.json();
  },

  async getRetailers(): Promise<Retailer[]> {
    const res = await fetch('/api/retailers');
    if (!res.ok) throw new Error('Failed to fetch retailers');
    return res.json();
  },

  async getSpecs(): Promise<Record<string, ProductSpec>> {
    const res = await fetch('/api/specs');
    if (!res.ok) throw new Error('Failed to fetch specs');
    return res.json();
  },

  async simulateTick(): Promise<{ message: string; batches: Batch[] }> {
    const res = await fetch('/api/simulate/tick', {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to advance simulation');
    return res.json();
  },

  async resetDatabase(): Promise<{ message: string }> {
    const res = await fetch('/api/simulate/reset', {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to reset simulation');
    return res.json();
  }
};
