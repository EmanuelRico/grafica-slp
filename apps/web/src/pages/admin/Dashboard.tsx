import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, LogOut, Printer, Package, Clock, CheckCircle2, Truck, CreditCard } from 'lucide-react';
import { api, Order } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/ui/Toast';
import { staggerContainer, staggerItem } from '../../components/animations/variants';

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: any }> = {
  received:        { label: 'Recibido',          color: 'text-blue-600 bg-blue-50 border-blue-200',      Icon: Package },
  in_production:   { label: 'En Producción',     color: 'text-purple-600 bg-purple-50 border-purple-200', Icon: Clock },
  finished:        { label: 'Terminado',         color: 'text-green-600 bg-green-50 border-green-200',    Icon: CheckCircle2 },
  pending_payment: { label: 'Pago Pendiente',    color: 'text-amber-600 bg-amber-50 border-amber-200',    Icon: CreditCard },
  delivered:       { label: 'Entregado',         color: 'text-slate-600 bg-slate-50 border-slate-200',    Icon: Truck },
  cancelled:       { label: 'Cancelado',         color: 'text-red-600 bg-red-50 border-red-200',          Icon: Package },
};

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activos' },
  { value: '', label: 'Todos los estados' },
  ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label })),
];

const PRINT_TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'dtf_uv', label: 'DTF UV' },
  { value: 'dtf_textile', label: 'DTF Textil' },
  { value: 'sublimation', label: 'Sublimación' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [printTypeFilter, setPrintTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (search) params.search = search;
      if (statusFilter === 'active') params.status = 'received,in_production,finished,pending_payment';
      else if (statusFilter) params.status = statusFilter;
      if (printTypeFilter) params.printType = printTypeFilter;
      const res = await api.admin.listOrders(params);
      setOrders(res.data);
      setTotal(res.total);
    } catch (e: any) {
      // Retry once after 3s (handles cold starts)
      try {
        await new Promise(r => setTimeout(r, 3000));
        const params: Record<string, string> = { page: String(page), limit: '10' };
        if (search) params.search = search;
        if (statusFilter === 'active') params.status = 'received,in_production,finished,pending_payment';
        else if (statusFilter) params.status = statusFilter;
        if (printTypeFilter) params.printType = printTypeFilter;
        const res = await api.admin.listOrders(params);
        setOrders(res.data);
        setTotal(res.total);
      } catch {
        toast.error('Error al cargar los pedidos');
      }
    }
    setLoading(false);
  }, [search, statusFilter, printTypeFilter, page]);

  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [storage, setStorage] = useState<{ totalGB: number; limitGB: number; usedPercent: number } | null>(null);
  const [countdown, setCountdown] = useState(120);
  const [justRefreshed, setJustRefreshed] = useState(false);

  useEffect(() => { document.title = 'Admin — GRAFICA SLP'; }, []);
  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { api.admin.storageStats().then(setStorage).catch(() => {}); }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const all = await api.admin.listOrders({ limit: '1000' });
      const counts: Record<string, number> = {};
      all.data.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
      setStatusCounts(counts);
    } catch {}
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // Refetch when tab becomes visible again or restored from bfcache
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') { fetchOrders(); fetchCounts(); } };
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) { fetchOrders(); fetchCounts(); } };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [fetchOrders, fetchCounts]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          fetchOrders();
          fetchCounts();
          api.admin.storageStats().then(setStorage).catch(() => {});
          setJustRefreshed(true);
          setTimeout(() => setJustRefreshed(false), 2500);
          return 120;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  const handleBulkDelete = async () => {
    setDeleting(true);
    setShowDeleteModal(false);
    try {
      const result = await api.admin.bulkDeleteDelivered();
      toast.success(`${result.deleted} pedidos eliminados · ${result.filesDeleted} archivos borrados`);
      fetchOrders();
      fetchCounts();
      api.admin.storageStats().then(setStorage).catch(() => {});
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar pedidos');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Full-screen loading overlay — only on initial load or when returning with no data */}
      <AnimatePresence>
        {loading && orders.length === 0 && (
          <motion.div
            key="admin-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center gap-4"
          >
            <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Cargando dashboard...</p>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(13,27,42,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-soft-2xl max-w-sm w-full p-6"
            >
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🗑</span>
              </div>
              <h3 className="text-lg font-black text-brand-ink">¿Eliminar pedidos entregados y cancelados?</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Se eliminarán todos los pedidos con estado <strong>"Entregado"</strong> y <strong>"Cancelado"</strong> y sus archivos de almacenamiento. Esta acción no se puede deshacer.
              </p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm">
                  Cancelar
                </button>
                <button onClick={handleBulkDelete}
                  className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors text-sm">
                  Sí, eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-slate-800">GRAFICA SLP</span>
            <span className="text-xs bg-brand-blue/10 text-brand-blue font-medium px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => setShowDeleteModal(true)} disabled={deleting}
              className="hidden sm:flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 font-medium transition-colors disabled:opacity-50 border border-red-200 hover:border-red-400 rounded-lg px-3 py-1.5">
              🗑 {deleting ? 'Eliminando...' : 'Limpiar entregados/cancelados'}
            </button>
            <span className="text-sm text-slate-500 hidden sm:block">{user?.name}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Stats — timeline row on desktop */}
        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-0.5 bg-slate-200 -translate-y-1/2 z-0 rounded-full" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10">
            {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
              const { Icon, label, color } = cfg;
              const count = statusCounts[status] || 0;
              return (
                <motion.div key={status} whileHover={{ y: -2 }}
                  className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${statusFilter === status ? 'ring-2 ring-brand-blue shadow-md' : ''}`}
                  onClick={() => setStatusFilter(statusFilter === status ? 'active' : status)}>
                  <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${color} mb-2`}>
                    <Icon className="w-3 h-3" /> {label}
                  </div>
                  <p className="text-2xl font-black text-slate-800">{count}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Storage widget */}
        {storage && (
          <div className="bg-white rounded-xl border border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Almacenamiento</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {storage.totalGB.toFixed(3)} GB usados de {storage.limitGB} GB
                </p>
              </div>
              <span className={`text-sm font-black ${
                storage.usedPercent > 80 ? 'text-red-500' :
                storage.usedPercent > 60 ? 'text-amber-500' : 'text-green-500'
              }`}>
                {storage.usedPercent.toFixed(1)}%
              </span>
            </div>
            {/* Bar */}
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  storage.usedPercent > 80 ? 'bg-red-500' :
                  storage.usedPercent > 60 ? 'bg-amber-400' : 'gradient-brand'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(storage.usedPercent, 100)}%` }}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
              />
            </div>
            {storage.usedPercent > 70 && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ Considera limpiar pedidos entregados para liberar espacio.
              </p>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
              placeholder="Buscar pedido, nombre, teléfono..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select className="text-sm border border-slate-200 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select className="text-sm border border-slate-200 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              value={printTypeFilter} onChange={(e) => { setPrintTypeFilter(e.target.value); setPage(1); }}>
              {PRINT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Orders table */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">{total} pedidos</p>
            <div className="flex items-center gap-2">
              {justRefreshed && (
                <span className="text-xs text-green-500 font-medium animate-pulse">● Dashboard actualizado</span>
              )}
              <span className="text-xs text-slate-300">{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</span>
              <button onClick={() => { fetchOrders(); fetchCounts(); setCountdown(120); setJustRefreshed(true); setTimeout(() => setJustRefreshed(false), 2500); }}
                className="text-sm text-brand-blue font-bold hover:bg-brand-blue/10 rounded-lg px-3 py-1.5 transition-colors">↻</button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-brand-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">No se encontraron pedidos</div>
          ) : (
            <motion.div variants={staggerContainer} initial="initial" animate="animate">
              {orders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.received;
                const { Icon } = cfg;
                const wasSent = order.statusHistory.some(h => h.to === order.status && h.whatsappSentAt);
                const showWa = ['received', 'finished', 'cancelled'].includes(order.status);

                const getWaUrl = () => {
                  const phone = order.customerPhone.replace(/\D/g, '');
                  const msgs: Record<string, string> = {
                    received: `✨ Pedido recibido\n\n¡Tu archivo ya está en nuestras manos!\n\n🧾 Pedido: #${order.orderNumber}\n\nHemos recibido tu archivo correctamente y comenzaremos a procesarlo.\n\nTe notificaremos nuevamente cuando esté listo.\n\nGRAFICA SLP`,
                    finished: `🎉 Pedido terminado\n\n¡Buenas noticias!\n\nTu pedido #${order.orderNumber} ya está listo.\n\nPuedes pasar a recogerlo cuando gustes dentro de nuestro horario de atención.\n\nGracias por crear con nosotros 💙\n\nGRAFICA SLP`,
                    cancelled: `❌ Pedido cancelado\n\nHola, te informamos que tu pedido #${order.orderNumber} ha sido cancelado.\n\nSi tienes alguna duda, no dudes en contactarnos.\n\nGRAFICA SLP`,
                  };
                  return `https://wa.me/${phone}?text=${encodeURIComponent(msgs[order.status] || '')}`;
                };

                const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
                  e.stopPropagation();
                  const newStatus = e.target.value;
                  if (newStatus === order.status) return;
                  try {
                    await api.admin.updateStatus(order._id, newStatus);
                    toast.success(`${order.orderNumber} → ${STATUS_CONFIG[newStatus]?.label}`);
                    fetchOrders();
                    fetchCounts();
                  } catch (err: any) {
                    toast.error(err.message || 'Error al actualizar');
                  }
                };

                const handleWaSent = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  api.admin.markWhatsappSent(order._id).then(() => fetchOrders());
                };

                return (
                  <motion.div key={order._id} variants={staggerItem}
                    className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-0">
                    {/* Order info */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/admin/pedidos/${order._id}`)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm">{order.orderNumber}</span>
                        <span className="text-xs text-slate-400">{order.printType.name}</span>
                        {order.wantsInvoice && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${order.invoicedAt ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {order.invoicedAt ? '✓ Facturado' : '⚠ Factura'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {order.customerName} · {order.customerPhone}
                        {order.wantsInvoice && order.invoiceName && <span className="text-slate-400"> · {order.invoiceName}</span>}
                      </p>
                    </div>

                    {/* Invoice action */}
                    {order.wantsInvoice && !order.invoicedAt && (
                      <button
                        onClick={(e) => { e.stopPropagation(); api.admin.markInvoiced(order._id).then(() => fetchOrders()); }}
                        className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 hover:bg-amber-100 transition-colors whitespace-nowrap"
                      >
                        Marcar facturado
                      </button>
                    )}

                    {/* Price & specs */}
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand-blue">${order.estimatedPrice.toLocaleString('es-MX')}</p>
                      <p className="text-sm font-bold text-slate-700 mt-0.5">{order.lengthCm}cm × {order.repetitions} rep</p>
                    </div>

                    {/* Inline status dropdown */}
                    <select
                      value={order.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={handleStatusChange}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-blue/30 ${cfg.color}`}
                    >
                      {Object.entries(STATUS_CONFIG).map(([val, c]) => (
                        <option key={val} value={val}>{c.label}</option>
                      ))}
                    </select>

                    {/* WhatsApp button */}
                    {showWa && (
                      wasSent ? (
                        <span className="text-green-500 text-xs font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Enviado
                        </span>
                      ) : (
                        <a href={getWaUrl()} target="_blank" rel="noreferrer"
                          onClick={handleWaSent}
                          className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5 hover:bg-green-100 transition-colors whitespace-nowrap">
                          📱 WhatsApp
                        </a>
                      )
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Pagination */}
        {total > 10 && (
          <div className="flex justify-center gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">← Anterior</button>
            <span className="px-4 py-2 text-sm text-slate-600">Página {page}</span>
            <button disabled={page * 10 >= total} onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">Siguiente →</button>
          </div>
        )}
      </div>
    </div>
  );
}
