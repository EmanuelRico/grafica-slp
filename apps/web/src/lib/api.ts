const BASE = (import.meta as any).env?.VITE_API_URL || '/api/v1';

// Global loading hooks — attached by LoadingProvider                                                          
export const loadingHooks = { start: () => { }, done: () => { } };

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  loadingHooks.start();
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...options,
    });
    if (!res.ok) {
      if (res.status === 401 && token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/admin/login';
        throw new Error('Sesión expirada');
      }
      const err = await res.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(err.message || 'Error en la solicitud');
    }
    return res.json();
  } finally {
    loadingHooks.done();

  }
}

export const api = {
  getPrintTypes: () => req<PrintType[]>('/print-types'),

  getUploadUrl: (filename: string, mimeType: string) =>
    req<{ uploadUrl: string; fileKey: string }>('/files/upload-url', {
      method: 'POST',
      body: JSON.stringify({ filename, mimeType }),
    }),

  uploadToR2: async (uploadUrl: string, file: File) => {
    loadingHooks.start();
    try {
      const res = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!res.ok) throw new Error('Error subiendo archivo');
    } finally { loadingHooks.done(); }
  },

  createOrder: (data: CreateOrderPayload) =>
    req<{ orderNumber: string; estimatedPrice: number; status: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  trackOrder: (q: string) =>
    req<TrackedOrder[]>(`/orders/track?q=${encodeURIComponent(q)}`),

  login: (email: string, password: string) =>
    req<{ accessToken: string; user: { name: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  admin: {
    listOrders: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return req<{ data: Order[]; total: number; page: number; limit: number }>(`/admin/orders${qs}`);
    },
    getOrder: (id: string) => req<Order>(`/admin/orders/${id}`),
    updateStatus: (id: string, status: string, note?: string) =>
      req<Order>(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) }),
    getWhatsappMessage: (id: string) =>
      req<{ message: string }>(`/admin/orders/${id}/whatsapp-message`),
    markWhatsappSent: (id: string) =>
      req<Order>(`/admin/orders/${id}/whatsapp-sent`, { method: 'PATCH' }),
    markInvoiced: (id: string) =>
      req<Order>(`/admin/orders/${id}/invoiced`, { method: 'PATCH' }),
    bulkDeleteDelivered: () =>
      req<{ deleted: number; filesDeleted: number; errors: string[] }>('/admin/orders/bulk/delivered', { method: 'DELETE' }),
    storageStats: () =>
      req<{ totalBytes: number; totalGB: number; limitGB: number; usedPercent: number; byStatus: Record<string, { bytes: number; count: number }> }>('/admin/storage/stats'),
  },
};

// Types
export interface PrintType {
  _id: string;
  slug: string;
  name: string;
  widthCm: number;
  minLengthCm: number;
  pricePerMeter: number;
  currency: string;
}

export interface CreateOrderPayload {
  fileKey: string;
  originalName: string;
  fileSizeBytes: number;
  mimeType: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  wantsInvoice?: boolean;
  invoiceName?: string;
  invoiceCFDI?: string;
  invoicedAt?: string;
  printTypeSlug: string;
  lengthCm: number;
  repetitions: number;
  comments?: string;
  acknowledgedFileReady: boolean;
  acknowledgedNoEdits: boolean;
  acknowledgedQuality: boolean;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  wantsInvoice?: boolean;
  invoiceName?: string;
  invoiceCFDI?: string;
  invoicedAt?: string;
  printType: { slug: string; name: string; widthCm: number; minLengthCm: number; pricePerMeter: number };
  lengthCm: number;
  repetitions: number;
  estimatedPrice: number;
  comments?: string;
  status: string;
  statusHistory: { from: string; to: string; changedAt: string; changedBy?: string; whatsappSentAt?: string }[];
  file: { storageKey: string; originalName: string; fileSizeBytes: number; mimeType: string };
  createdAt: string;
}

export interface TrackedOrder {
  orderNumber: string;
  status: string;
  printType: string;
  lengthCm: number;
  repetitions: number;
  estimatedPrice: number;
  createdAt: string;
  statusHistory: { status: string; changedAt: string }[];
}
