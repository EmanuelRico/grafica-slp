const BASE = (import.meta as any).env?.VITE_API_URL || '/api/v1';

// Global loading hooks — attached by LoadingProvider
export const loadingHooks = { start: () => {}, done: () => {} };

let redirecting = false;

function httpErrorMessage(status: number, serverMsg?: string): string {
  if (serverMsg && serverMsg !== 'Error desconocido') return serverMsg;
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
    bulkDeleteDelivered: () =>
      req<{ deleted: number; filesDeleted: number; errors: string[] }>('/admin/orders/bulk/delivered?status=delivered', { method: 'DELETE' }),
    bulkDeleteCancelled: () =>
      req<{ deleted: number; filesDeleted: number; errors: string[] }>('/admin/orders/bulk/delivered?status=cancelled', { method: 'DELETE' }),
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
