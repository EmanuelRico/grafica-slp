const BASE = (import.meta as any).env?.VITE_API_URL || '/api/v1';

// Global loading hooks — attached by LoadingProvider
export const loadingHooks = { start: () => {}, done: () => {} };

let redirecting = false;

function httpErrorMessage(status: number, serverMsg?: string | string[]): string {
  const msg = Array.isArray(serverMsg) ? serverMsg.join('. ') : serverMsg;
  if (msg && msg !== 'Error desconocido') return msg;
  if (status === 400) return 'Los datos enviados no son válidos. Revisa la información e intenta de nuevo.';
  if (status === 403) return 'No tienes permisos para realizar esta acción.';
  if (status === 404) return 'No se encontró el recurso solicitado.';
  if (status === 408) return 'La solicitud tardó demasiado. Intenta de nuevo.';
  if (status === 413) return 'El archivo es demasiado grande para ser procesado.';
  if (status === 429) return 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.';
  if (status >= 500) return 'Error en el servidor. Intenta de nuevo en unos segundos.';
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  loadingHooks.start();
  try {
    const token = localStorage.getItem('token');
    let res: Response;
    try {
      res = await fetch(`${BASE}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...options,
      });
    } catch {
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.');
    }
    if (!res.ok) {
      if (res.status === 401 && token && !redirecting) {
        redirecting = true;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.replace('/admin/login');
        throw new Error('Sesión expirada');
      }
      const err = await res.json().catch(() => ({ message: undefined }));
      throw new Error(httpErrorMessage(res.status, err.message));
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
      let res: Response;
      try {
        res = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      } catch {
        throw new Error('Failed to fetch');
      }
      if (!res.ok) {
        if (res.status === 413) throw new Error('El archivo excede el tamaño máximo permitido.');
        if (res.status === 403) throw new Error('El enlace de subida expiró. Intenta subir el archivo de nuevo.');
        if (res.status >= 500) throw new Error('El servicio de almacenamiento no está disponible. Intenta en unos segundos.');
        throw new Error(`Error subiendo archivo (HTTP ${res.status})`);
      }
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
    updateOrderDetails: (id: string, data: { lengthCm?: number; repetitions?: number; estimatedPrice?: number }) =>
      req<Order>(`/admin/orders/${id}/details`, { method: 'PATCH', body: JSON.stringify(data) }),
    bulkDeleteDelivered: () =>
      req<{ deleted: number; filesDeleted: number; errors: string[] }>('/admin/orders/bulk/delivered?status=delivered', { method: 'DELETE' }),
    bulkDeleteCancelled: () =>
      req<{ deleted: number; filesDeleted: number; errors: string[] }>('/admin/orders/bulk/delivered?status=cancelled', { method: 'DELETE' }),
    storageStats: () =>
      req<{ totalBytes: number; totalGB: number; limitGB: number; usedPercent: number; byStatus: Record<string, { bytes: number; count: number }> }>('/admin/storage/stats'),
  },

  // Control de Gastos
  control: {
    dashboard: {
      stats: () => req<any>('/control/payments/dashboard/stats'),
      companies: () => req<any[]>('/control/payments/dashboard/companies'),
      attention: (tab?: string, limit?: number, company?: string) => {
        const params = new URLSearchParams();
        if (tab) params.set('tab', tab);
        if (limit) params.set('limit', String(limit));
        if (company) params.set('company', company);
        const qs = params.toString() ? `?${params.toString()}` : '';
        return req<any[]>(`/control/payments/dashboard/attention${qs}`);
      },
    },
    payments: {
      list: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return req<{ data: any[]; total: number; page: number; limit: number }>(`/control/payments${qs}`);
      },
      getById: (id: string) => req<any>(`/control/payments/${id}`),
      create: (data: any) => req<any>('/control/payments', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) => req<any>(`/control/payments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      markPaid: (id: string, data: { paidAt: string; bankAccount?: string; paymentNotes?: string }) =>
        req<any>(`/control/payments/${id}/pay`, { method: 'PATCH', body: JSON.stringify(data) }),
      cancel: (id: string) => req<any>(`/control/payments/${id}/cancel`, { method: 'PATCH' }),
      delete: (id: string) => req<any>(`/control/payments/${id}`, { method: 'DELETE' }),
      calendar: (year: number, month: number) => req<any[]>(`/control/payments/calendar/${year}/${month}`),
      storageStats: () => req<any>('/control/payments/storage/stats'),
      bulkDeleteReceipts: (olderThanDays?: number) => {
        const qs = olderThanDays ? `?olderThanDays=${olderThanDays}` : '';
        return req<any>(`/control/payments/receipts/bulk${qs}`, { method: 'DELETE' });
      },
    },
    companies: {
      list: (includeInactive?: boolean) => req<any[]>(`/control/companies${includeInactive ? '?includeInactive=true' : ''}`),
      getById: (id: string) => req<any>(`/control/companies/${id}`),
      create: (data: any) => req<any>('/control/companies', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) => req<any>(`/control/companies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deactivate: (id: string) => req<any>(`/control/companies/${id}/deactivate`, { method: 'PATCH' }),
      activate: (id: string) => req<any>(`/control/companies/${id}/activate`, { method: 'PATCH' }),
    },
    categories: {
      list: (includeInactive?: boolean) => req<any[]>(`/control/categories${includeInactive ? '?includeInactive=true' : ''}`),
      getById: (id: string) => req<any>(`/control/categories/${id}`),
      create: (data: any) => req<any>('/control/categories', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) => req<any>(`/control/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deactivate: (id: string) => req<any>(`/control/categories/${id}/deactivate`, { method: 'PATCH' }),
      activate: (id: string) => req<any>(`/control/categories/${id}/activate`, { method: 'PATCH' }),
    },
    concepts: {
      list: (includeInactive?: boolean) => req<any[]>(`/control/concepts${includeInactive ? '?includeInactive=true' : ''}`),
      getById: (id: string) => req<any>(`/control/concepts/${id}`),
      create: (data: any) => req<any>('/control/concepts', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) => req<any>(`/control/concepts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deactivate: (id: string) => req<any>(`/control/concepts/${id}/deactivate`, { method: 'PATCH' }),
      activate: (id: string) => req<any>(`/control/concepts/${id}/activate`, { method: 'PATCH' }),
    },
    providers: {
      list: (params?: { includeInactive?: boolean; companyId?: string }) => {
        const qs = new URLSearchParams();
        if (params?.includeInactive) qs.set('includeInactive', 'true');
        if (params?.companyId) qs.set('companyId', params.companyId);
        const qStr = qs.toString() ? `?${qs.toString()}` : '';
        return req<any[]>(`/control/providers${qStr}`);
      },
      getById: (id: string) => req<any>(`/control/providers/${id}`),
      create: (data: any) => req<any>('/control/providers', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) => req<any>(`/control/providers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deactivate: (id: string) => req<any>(`/control/providers/${id}/deactivate`, { method: 'PATCH' }),
      activate: (id: string) => req<any>(`/control/providers/${id}/activate`, { method: 'PATCH' }),
    },
    bankAccounts: {
      list: (params?: { includeInactive?: boolean; companyId?: string }) => {
        const qs = new URLSearchParams();
        if (params?.includeInactive) qs.set('includeInactive', 'true');
        if (params?.companyId) qs.set('companyId', params.companyId);
        const qStr = qs.toString() ? `?${qs.toString()}` : '';
        return req<any[]>(`/control/bank-accounts${qStr}`);
      },
      getById: (id: string) => req<any>(`/control/bank-accounts/${id}`),
      create: (data: any) => req<any>('/control/bank-accounts', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) => req<any>(`/control/bank-accounts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deactivate: (id: string) => req<any>(`/control/bank-accounts/${id}/deactivate`, { method: 'PATCH' }),
      activate: (id: string) => req<any>(`/control/bank-accounts/${id}/activate`, { method: 'PATCH' }),
    },
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
  pricingType?: string; // 'per_meter' | 'per_unit'
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
  file: { originalName: string; mimeType: string; storageKey: string } | null;
  createdAt: string;
  statusHistory: { status: string; changedAt: string }[];
}
