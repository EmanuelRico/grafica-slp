import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, Funnel, CaretLeft, CaretRight, Receipt, Plus } from '@phosphor-icons/react';
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
  const toast = useToast();

  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [periodMonth, setPeriodMonth] = useState<string>('');
  const [periodYear, setPeriodYear] = useState<string>(String(new Date().getFullYear()));

  // Options for dropdowns
  const [companies, setCompanies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

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
      if (companyId) params.companyId = companyId;
      if (categoryId) params.categoryId = categoryId;
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
                          <span className="inline-flex px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                            {p.companyShortName || p.company?.shortName || '—'}
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
                        <p className="text-xs text-slate-400 mt-0.5">{p.companyShortName || p.company?.shortName} · {MONTHS[(p.periodMonth || 1) - 1]} {p.periodYear}</p>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColor(p.displayStatus || p.status)}`}>
                        {statusLabel(p.displayStatus || p.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold text-slate-800">{formatCurrency(p.amount)}</span>
                      <span className={`text-xs ${days.className}`}>{p.status !== 'paid' && p.status !== 'cancelled' ? days.text : ''}</span>
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
    </motion.div>
  );
}
