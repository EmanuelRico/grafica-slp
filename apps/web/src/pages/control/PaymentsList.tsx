import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MagnifyingGlass, Funnel, CaretLeft, CaretRight, Receipt, Plus, CheckCircle } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { staggerContainer, staggerItem, fadeUp } from '../../components/animations/variants';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'overdue', label: 'Vencidos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'paid', label: 'Pagados' },
  { value: 'cancelled', label: 'Cancelados' },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

function statusColor(status: string) {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-700 border-green-200';
    case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
    case 'cancelled': return 'bg-slate-100 text-slate-500 border-slate-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'paid': case 'pagado': return 'Pagado';
    case 'pending': return 'Pendiente';
    case 'overdue': case 'vencido': return 'Vencido';
    case 'cancelled': case 'cancelado': return 'Cancelado';
    case 'vence_hoy': return 'Vence hoy';
    case 'vence_semana': return 'Vence esta semana';
    case 'proximo': return 'Próximo';
    default: return status.replace(/_/g, ' ');
  }
}

function daysRemaining(dueDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: `${Math.abs(diff)}d vencido`, className: 'text-red-600 font-semibold' };
  if (diff === 0) return { text: 'Hoy', className: 'text-amber-600 font-semibold' };
  if (diff <= 3) return { text: `${diff}d`, className: 'text-amber-500' };
  return { text: `${diff}d`, className: 'text-slate-500' };
}

export default function PaymentsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);

  // Filters - initialize from URL params
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [companyId, setCompanyId] = useState(searchParams.get('company') || '');
  const [categoryId, setCategoryId] = useState('');
  const [periodMonth, setPeriodMonth] = useState<string>('');
  const [periodYear, setPeriodYear] = useState<string>(String(new Date().getFullYear()));

  // Options for dropdowns
  const [companies, setCompanies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Quick pay modal
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payingDate, setPayingDate] = useState(new Date().toISOString().split('T')[0]);
  const [payingLoading, setPayingLoading] = useState(false);

  useEffect(() => {
    document.title = 'Pagos — Control de Gastos';
    Promise.all([
      (api as any).control.companies.list(),
      (api as any).control.categories.list(),
    ]).then(([comps, cats]: [any, any]) => {
      setCompanies(comps.data || comps);
      setCategories(cats.data || cats);
    }).catch(() => {});
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (status) params.status = status;
      if (companyId) params.company = companyId;
      if (categoryId) params.category = categoryId;
      if (periodMonth) params.periodMonth = periodMonth;
      if (periodYear) params.periodYear = periodYear;

      const res = await (api as any).control.payments.list(params);
      setPayments(res.data || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      toast.error(e.message || 'Error al cargar pagos');
    }
    setLoading(false);
  }, [page, limit, search, status, companyId, categoryId, periodMonth, periodYear]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // Quick mark as paid
  const handleQuickPay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!payingId) return;
    setPayingLoading(true);
    try {
      await (api as any).control.payments.markPaid(payingId, { paidAt: payingDate });
      toast.success('Pago marcado como pagado');
      setPayingId(null);
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message || 'Error al marcar como pagado');
    }
    setPayingLoading(false);
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <motion.div {...fadeUp} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pagos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestión de pagos y obligaciones</p>
        </div>
        <button
          onClick={() => navigate('/control/pagos/nuevo')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue text-white font-semibold text-sm shadow-blue-glow hover:opacity-90 transition-all ease-out active:scale-[0.97]"
        >
          <Plus size={18} weight="duotone" />
          Nuevo Pago
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Funnel size={16} weight="duotone" className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filtros</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar concepto..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
            />
          </div>
          {/* Status */}
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {/* Company */}
          <select
            value={companyId}
            onChange={e => { setCompanyId(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
          >
            <option value="">Todas las empresas</option>
            {companies.map((c: any) => (
              <option key={c._id} value={c._id}>{c.shortName || c.name}</option>
            ))}
          </select>
          {/* Category */}
          <select
            value={categoryId}
            onChange={e => { setCategoryId(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c: any) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          {/* Period */}
          <div className="flex gap-2">
            <select
              value={periodMonth}
              onChange={e => { setPeriodMonth(e.target.value); setPage(1); }}
              className="flex-1 px-2 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
            >
              <option value="">Mes</option>
              {MONTHS.map((m, i) => (
                <option key={i} value={String(i + 1)}>{m.slice(0, 3)}</option>
              ))}
            </select>
            <select
              value={periodYear}
              onChange={e => { setPeriodYear(e.target.value); setPage(1); }}
              className="w-20 px-2 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
            >
              {years.map(y => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <Receipt size={64} weight="duotone" className="text-slate-200 mb-4" />
            <p className="text-lg font-semibold text-slate-400">No se encontraron pagos</p>
            <p className="text-sm text-slate-400 mt-1">Ajusta los filtros o crea un nuevo pago</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Concepto</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Empresa</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Monto</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Vencimiento</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Estado</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Días</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600"></th>
                  </tr>
                </thead>
                <motion.tbody variants={staggerContainer} initial="initial" animate="animate">
                  {payments.map((p: any) => {
                    const days = daysRemaining(p.dueDate);
                    return (
                      <motion.tr
                        key={p._id}
                        variants={staggerItem}
                        onClick={() => navigate(`/control/pagos/${p._id}`)}
                        className="border-b border-slate-50 hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{p.conceptName || p.concept?.name || '—'}</p>
                          <p className="text-xs text-slate-400">{MONTHS[(p.periodMonth || 1) - 1]} {p.periodYear}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium border border-slate-100">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.company?.color || '#01AEF0' }} />
                            <span style={{ color: p.company?.color || '#01AEF0' }}>{p.companyShortName || p.company?.shortName || '—'}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(p.dueDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColor(p.displayStatus || p.status)}`}>
                            {statusLabel(p.displayStatus || p.status)}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right text-xs ${days.className}`}>{p.status !== 'paid' && p.status !== 'cancelled' ? days.text : '—'}</td>
                        <td className="px-4 py-3 text-center">
                          {p.status !== 'paid' && p.status !== 'cancelled' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setPayingId(p._id); setPayingDate(new Date().toISOString().split('T')[0]); }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-200 hover:bg-green-100 transition-all duration-150 active:scale-[0.95]"
                            >
                              <CheckCircle size={12} weight="bold" />
                              Pagar
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="md:hidden divide-y divide-slate-100">
              {payments.map((p: any) => {
                const days = daysRemaining(p.dueDate);
                return (
                  <motion.div
                    key={p._id}
                    variants={staggerItem}
                    onClick={() => navigate(`/control/pagos/${p._id}`)}
                    className="p-4 active:bg-slate-50 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800 truncate">{p.conceptName || p.concept?.name || '—'}</p>
                        <p className="text-xs mt-0.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.company?.color || '#01AEF0' }} />
                          <span style={{ color: p.company?.color || '#01AEF0' }}>{p.companyShortName || p.company?.shortName}</span>
                          <span className="text-slate-400">· {MONTHS[(p.periodMonth || 1) - 1]} {p.periodYear}</span>
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColor(p.displayStatus || p.status)}`}>
                        {statusLabel(p.displayStatus || p.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold text-slate-800">{formatCurrency(p.amount)}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${days.className}`}>{p.status !== 'paid' && p.status !== 'cancelled' ? days.text : ''}</span>
                        {p.status !== 'paid' && p.status !== 'cancelled' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setPayingId(p._id); setPayingDate(new Date().toISOString().split('T')[0]); }}
                            className="flex-shrink-0 p-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200 active:scale-[0.95]"
                          >
                            <CheckCircle size={14} weight="bold" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Página {page} de {totalPages} · {total} pagos
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
            >
              <CaretLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
            >
              <CaretRight size={16} />
            </button>
          </div>
        </div>
      )}
      {/* Quick pay modal */}
      <AnimatePresence>
        {payingId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(13,27,42,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setPayingId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-xs w-full p-6"
            >
              <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle size={22} weight="duotone" className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Marcar como pagado</h3>
              <p className="text-sm text-slate-500 mb-4">Selecciona la fecha de pago</p>
              <input
                type="date"
                value={payingDate}
                onChange={e => setPayingDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-colors mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => setPayingId(null)} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 text-sm">
                  Cancelar
                </button>
                <button onClick={handleQuickPay} disabled={payingLoading}
                  className="flex-1 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors text-sm disabled:opacity-60 active:scale-[0.97]">
                  {payingLoading ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
