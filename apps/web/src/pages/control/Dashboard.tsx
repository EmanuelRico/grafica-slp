import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Warning, Clock, CalendarCheck, CurrencyCircleDollar, Plus, ArrowRight, Buildings, CheckCircle, CaretLeft, CaretRight, Calendar as CalendarIcon } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/ui/Toast';
import { staggerContainer, staggerItem } from '../../components/animations/variants';
import { getDailyQuote } from '../../lib/quotes';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return '¡Buenos días';
  if (h < 18) return '¡Buenas tardes';
  return '¡Buenas noches';
}

const TAB_CONFIG = [
  { key: 'overdue', label: 'Vencidos', color: 'text-red-600' },
  { key: 'today', label: 'Vence hoy', color: 'text-yellow-600' },
  { key: 'week', label: 'Esta semana', color: 'text-purple-600' },
  { key: 'upcoming', label: 'Próximos', color: 'text-green-600' },
  { key: 'paid', label: 'Pagados', color: 'text-blue-600' },
] as const;

export default function ControlDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Main view tab: resumen vs calendario
  const [viewTab, setViewTab] = useState<'resumen' | 'calendario'>('resumen');

  const [stats, setStats] = useState<any>(null);
  const [companyStats, setCompanyStats] = useState<any[]>([]);
  const [attentionPayments, setAttentionPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overdue' | 'today' | 'week' | 'upcoming' | 'paid'>('overdue');
  const [loading, setLoading] = useState(true);

  // Mark as paid quick modal
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payingDate, setPayingDate] = useState(new Date().toISOString().split('T')[0]);
  const [payingLoading, setPayingLoading] = useState(false);

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [calPayments, setCalPayments] = useState<any[]>([]);

  const firstName = user?.name?.split(' ')[0] || 'Usuario';
  const today = new Date();
  const dateStr = `${DAYS[today.getDay()]}, ${today.getDate()} de ${MONTHS[today.getMonth()].toLowerCase()} de ${today.getFullYear()}`;
  const quote = getDailyQuote();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, companiesRes, attentionRes] = await Promise.all([
        api.control.dashboard.stats(),
        api.control.dashboard.companies(),
        api.control.dashboard.attention(activeTab),
      ]);
      setStats(statsRes);
      setCompanyStats(companiesRes);
      setAttentionPayments(attentionRes);
    } catch (e: any) {
      toast.error('Error al cargar el dashboard');
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  useEffect(() => {
    api.control.dashboard.attention(activeTab).then(setAttentionPayments).catch(() => {});
  }, [activeTab]);

  // Calendar data
  useEffect(() => {
    if (viewTab === 'calendario') {
      api.control.payments.calendar(calYear, calMonth)
        .then(res => setCalPayments(Array.isArray(res) ? res : (res as any).data || []))
        .catch(() => {});
    }
  }, [viewTab, calYear, calMonth]);

  useEffect(() => { document.title = 'Control de Gastos — GRAFICA SLP'; }, []);

  // Quick mark as paid
  const handleQuickPay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!payingId) return;
    setPayingLoading(true);
    try {
      await api.control.payments.markPaid(payingId, { paidAt: payingDate });
      toast.success('Pago marcado como pagado');
      setPayingId(null);
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Error al marcar como pagado');
    }
    setPayingLoading(false);
  };

  const kpiCards = [
    { label: 'Pagos vencidos', count: stats?.overdue?.count || 0, total: stats?.overdue?.total || 0, icon: Warning, iconBg: 'bg-red-50', iconColor: 'text-red-500', borderColor: 'border-red-100' },
    { label: 'Vencen hoy', count: stats?.dueToday?.count || 0, total: stats?.dueToday?.total || 0, icon: Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-500', borderColor: 'border-amber-100' },
    { label: 'Vencen esta semana', count: stats?.dueThisWeek?.count || 0, total: stats?.dueThisWeek?.total || 0, icon: CalendarCheck, iconBg: 'bg-purple-50', iconColor: 'text-purple-500', borderColor: 'border-purple-100' },
    { label: 'Total pendiente del mes', count: stats?.totalPendingMonth?.count || 0, total: stats?.totalPendingMonth?.total || 0, icon: CurrencyCircleDollar, iconBg: 'bg-green-50', iconColor: 'text-green-600', borderColor: 'border-green-100', highlight: true },
  ];

  // Calendar helpers
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const firstDayOfWeek = (new Date(calYear, calMonth - 1, 1).getDay() + 6) % 7; // Monday=0
  const calDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const getPaymentsForDay = (day: number) => calPayments.filter(p => new Date(p.dueDate).getDate() === day);

  const prevMonth = () => {
    if (calMonth === 1) { setCalMonth(12); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 12) { setCalMonth(1); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="h-full relative">
      {/* Header */}
      <div className="mb-4 sm:mb-5">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 truncate">
          {getGreeting()}, {firstName}! 👋
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1 capitalize">{dateStr}</p>
      </div>

      {/* View tabs: Resumen | Calendario */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-4 sm:mb-5">
        <button
          onClick={() => setViewTab('resumen')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${viewTab === 'resumen' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Resumen
        </button>
        <button
          onClick={() => setViewTab('calendario')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${viewTab === 'calendario' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <CalendarIcon size={14} weight="duotone" />
          Calendario
        </button>
      </div>

      {/* Slide transition between views */}
      <AnimatePresence mode="wait">
        {viewTab === 'resumen' ? (
          <motion.div
            key="resumen"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-4 pb-16"
          >
            {/* KPI Cards */}
            <motion.div {...staggerContainer} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {kpiCards.map((card) => (
                <motion.div
                  key={card.label}
                  {...staggerItem}
                  className={`bg-white rounded-xl sm:rounded-2xl border ${card.borderColor} p-3 sm:p-5 hover:shadow-md transition-shadow duration-200 ${card.highlight ? 'ring-1 ring-green-200' : ''}`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl ${card.iconBg} flex items-center justify-center`}>
                      <card.icon size={16} weight="duotone" className={card.iconColor} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide leading-tight">{card.label}</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900">{card.count}</p>
                  <p className={`text-xs sm:text-sm font-semibold mt-0.5 ${card.iconColor}`}>{formatCurrency(card.total)}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Company Summary */}
            {companyStats.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Buildings size={18} weight="duotone" className="text-slate-500" />
                  <h2 className="font-bold text-slate-800">Resumen por empresa</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {companyStats.map((company) => {
                    const status = company.overdueCount > 0 ? 'Atención requerida' : company.pendingCount > 0 ? 'Pendiente' : 'Todo al corriente';
                    const statusColor = company.overdueCount > 0 ? 'bg-red-50 text-red-600 border-red-200' : company.pendingCount > 0 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-green-50 text-green-600 border-green-200';
                    return (
                      <motion.div key={company._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all duration-200" style={{ borderTopColor: company.color || '#01AEF0', borderTopWidth: '3px' }}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${company.color || '#01AEF0'}15` }}>
                            <span className="font-black text-xs" style={{ color: company.color || '#01AEF0' }}>{company.shortName || company.name?.slice(0, 4)}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-slate-800">{company.name}</p>
                            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor} mt-0.5`}>{status}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center mb-3">
                          <div>
                            <p className="text-base font-bold text-slate-800">{formatCurrency(company.pendingTotal)}</p>
                            <p className="text-[10px] text-slate-500">Pendiente</p>
                          </div>
                          <div>
                            <p className="text-base font-bold text-slate-800">{company.pendingCount}</p>
                            <p className="text-[10px] text-slate-500">Pagos pendientes</p>
                          </div>
                          <div>
                            <p className="text-base font-bold text-red-600">{company.overdueCount}</p>
                            <p className="text-[10px] text-slate-500">Vencidos</p>
                          </div>
                        </div>
                        <button onClick={() => navigate(`/control/pagos?company=${company._id}`)} className="w-full flex items-center justify-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-blue py-2 border-t border-slate-100 transition-colors active:scale-[0.97]">
                          Ver empresa <ArrowRight size={14} />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payments needing attention with quick pay */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-3 sm:p-5">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="font-bold text-sm sm:text-base text-slate-800">Pagos que requieren atención</h2>
                <button onClick={() => navigate('/control/pagos')} className="text-xs sm:text-sm font-medium text-brand-blue hover:underline flex items-center gap-1">
                  Ver todos <ArrowRight size={12} />
                </button>
              </div>
              <div className="flex gap-1 mb-3 sm:mb-4 border-b border-slate-100 pb-2 overflow-x-auto no-scrollbar">
                {TAB_CONFIG.map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap ${activeTab === tab.key ? `${tab.color} bg-slate-50 shadow-sm` : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                  >{tab.label}</button>
                ))}
              </div>
              <div className="overflow-x-auto no-scrollbar">
                {attentionPayments.length > 0 ? (
                  <>
                    {/* Desktop table */}
                    <table className="w-full text-sm hidden md:table">
                      <thead>
                        <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                          <th className="pb-2 font-medium">Concepto</th>
                          <th className="pb-2 font-medium">Empresa</th>
                          <th className="pb-2 font-medium">Monto</th>
                          <th className="pb-2 font-medium">Fecha límite</th>
                          <th className="pb-2 font-medium">Estado</th>
                          <th className="pb-2 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {attentionPayments.map((p: any) => {
                          const rowHoverBg = activeTab === 'paid' ? 'hover:bg-blue-50/50' :
                            p.daysRemaining < 0 ? 'hover:bg-red-50/50' :
                            p.daysRemaining === 0 ? 'hover:bg-yellow-50/50' :
                            p.daysRemaining <= 7 ? 'hover:bg-purple-50/50' :
                            'hover:bg-green-50/50';
                          return (
                          <tr key={p._id} onClick={() => navigate(`/control/pagos/${p._id}`)} className={`cursor-pointer transition-colors group ${rowHoverBg}`}>
                            <td className="py-2.5 font-medium text-slate-800">
                              {p.concept?.name} {p.periodLabel && <span className="text-slate-400 font-normal">– {p.periodLabel}</span>}
                            </td>
                            <td className="py-2.5">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.company?.color || '#01AEF0' }} />
                                <span style={{ color: p.company?.color || '#01AEF0' }}>{p.company?.shortName || p.company?.name}</span>
                              </span>
                            </td>
                            <td className="py-2.5 font-semibold text-slate-800">{formatCurrency(p.amount)}</td>
                            <td className="py-2.5 text-slate-600">{new Date(p.dueDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</td>
                            <td className="py-2.5">
                              {activeTab === 'paid' ? (
                                <span className="text-xs font-bold text-blue-600">Pagado</span>
                              ) : (
                                <span className={`text-xs font-bold ${
                                  p.daysRemaining < 0 ? 'text-red-600' :
                                  p.daysRemaining === 0 ? 'text-yellow-600' :
                                  p.daysRemaining <= 7 ? 'text-purple-600' :
                                  'text-green-600'
                                }`}>
                                  {p.daysRemaining < 0 ? `Vencido (${p.daysRemaining}d)` :
                                   p.daysRemaining === 0 ? 'Vence hoy' :
                                   `${p.daysRemaining}d`}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5">
                              {activeTab !== 'paid' ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setPayingId(p._id); setPayingDate(new Date().toISOString().split('T')[0]); }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-200 hover:bg-green-100 transition-all duration-150 active:scale-[0.95]"
                                >
                                  <CheckCircle size={12} weight="bold" />
                                  Pagar
                                </button>
                              ) : (
                                <span className="text-xs font-semibold text-green-600">✓ Pagado</span>
                              )}
                            </td>
                          </tr>
                        );})}
                      </tbody>
                    </table>
                    {/* Mobile cards */}
                    <div className="md:hidden space-y-2">
                      {attentionPayments.map((p: any) => (
                        <div key={p._id} onClick={() => navigate(`/control/pagos/${p._id}`)} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 active:bg-slate-50 transition-colors cursor-pointer">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{p.concept?.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.company?.color || '#01AEF0' }} />
                                <span style={{ color: p.company?.color || '#01AEF0' }}>{p.company?.shortName || p.company?.name}</span>
                              </span>
                              <span className="text-xs text-slate-500">{formatCurrency(p.amount)}</span>
                              {activeTab === 'paid' ? (
                                <span className="text-[10px] font-bold text-blue-600">Pagado</span>
                              ) : (
                                <span className={`text-[10px] font-bold ${
                                  p.daysRemaining < 0 ? 'text-red-600' :
                                  p.daysRemaining === 0 ? 'text-yellow-600' :
                                  'text-green-600'
                                }`}>
                                  {p.daysRemaining < 0 ? `Vencido` : p.daysRemaining === 0 ? 'Hoy' : `${p.daysRemaining}d`}
                                </span>
                              )}
                            </div>
                          </div>
                          {activeTab !== 'paid' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setPayingId(p._id); setPayingDate(new Date().toISOString().split('T')[0]); }}
                              className="flex-shrink-0 p-2 bg-green-50 text-green-700 rounded-lg border border-green-200 active:scale-[0.95]"
                            >
                              <CheckCircle size={16} weight="bold" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 sm:py-8 text-slate-400">
                    <CalendarCheck size={28} weight="duotone" className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">No hay pagos en esta categoría</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quote pinned to bottom of viewport */}
            <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 z-20 overflow-hidden rounded-t-3xl">
              {/* Gradient background */}
              <div className="absolute inset-0 gradient-brand-vivid" />
              {/* Decorative orbs */}
              <div className="absolute -top-6 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 left-1/3 w-24 h-24 bg-brand-yellow/15 rounded-full blur-xl" />
              {/* Subtle top highlight line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 py-4 px-5 sm:px-6 lg:px-10">
                {/* Quotation mark icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm hidden sm:flex">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.135 5.015c-4.091 1.066-6.863 4.594-6.863 8.985 0 3.21 1.824 5.5 4.32 5.5 2.16 0 3.78-1.636 3.78-3.818 0-2.073-1.404-3.6-3.24-3.6-.432 0-.972.108-1.296.27.324-2.509 2.268-4.854 4.86-5.727L9.135 5.015zm11.34 0c-4.092 1.066-6.864 4.594-6.864 8.985 0 3.21 1.824 5.5 4.32 5.5 2.16 0 3.78-1.636 3.78-3.818 0-2.073-1.404-3.6-3.24-3.6-.432 0-.972.108-1.296.27.324-2.509 2.268-4.854 4.86-5.727L20.475 5.015z" fill="white" fillOpacity="0.6"/>
                  </svg>
                </div>
                
                {/* Quote text */}
                <p className="text-white text-xs sm:text-sm lg:text-[15px] font-medium leading-snug flex-1">
                  {quote.text}
                </p>
                
                {/* Author */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <div className="w-px h-4 bg-white/20 hidden sm:block" />
                  <p className="text-white/60 text-[11px] sm:text-xs font-semibold whitespace-nowrap">
                    — {quote.author}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="calendario"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Calendar view — large */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-3 sm:p-6 lg:p-8 pb-16">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <button onClick={prevMonth} className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-100 transition-colors active:scale-[0.95]"><CaretLeft size={18} className="text-slate-600" /></button>
                <h2 className="font-bold text-base sm:text-xl text-slate-800">{MONTHS[calMonth - 1]} {calYear}</h2>
                <button onClick={nextMonth} className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-100 transition-colors active:scale-[0.95]"><CaretRight size={18} className="text-slate-600" /></button>
              </div>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-3">
                {WEEKDAYS.map(d => <div key={d} className="text-center text-[10px] sm:text-sm font-semibold text-slate-400 py-1 sm:py-2">{d}</div>)}
              </div>
              {/* Days grid — responsive cells */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
                {calDays.map(day => {
                  const dayPayments = getPaymentsForDay(day);
                  const isToday = day === now.getDate() && calMonth === now.getMonth() + 1 && calYear === now.getFullYear();
                  return (
                    <div
                      key={day}
                      onClick={() => dayPayments.length > 0 && navigate(`/control/pagos?dueDay=${calYear}-${String(calMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`)}
                      className={`relative min-h-[44px] sm:min-h-[72px] lg:min-h-[84px] p-1 sm:p-2 rounded-lg sm:rounded-xl border text-left transition-all duration-150
                        ${isToday ? 'border-brand-blue bg-blue-50/60 shadow-sm' : 'border-slate-100 hover:border-slate-200'}
                        ${dayPayments.length > 0 ? 'cursor-pointer hover:shadow-md' : ''}`}
                    >
                      <span className={`text-[10px] sm:text-sm font-semibold ${isToday ? 'text-brand-blue' : 'text-slate-700'}`}>{day}</span>
                      {dayPayments.length > 0 && (
                        <>
                          {/* Desktop: show labels with category color */}
                          <div className="hidden sm:block mt-1.5 space-y-0.5">
                            {dayPayments.slice(0, 2).map((p: any, i: number) => (
                              <div key={i} className="text-[10px] font-medium truncate px-1.5 py-0.5 rounded flex items-center gap-1"
                                style={{ backgroundColor: `${p.category?.color || '#F59E0B'}15`, color: p.category?.color || '#F59E0B' }}>
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.category?.color || '#F59E0B' }} />
                                {p.concept?.name}
                              </div>
                            ))}
                            {dayPayments.length > 2 && <span className="text-[10px] text-slate-400 px-1">+{dayPayments.length - 2}</span>}
                          </div>
                          {/* Mobile: show dots with category color */}
                          <div className="sm:hidden flex gap-0.5 mt-1 justify-center">
                            {dayPayments.slice(0, 3).map((p: any, i: number) => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.category?.color || '#F59E0B' }} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-3 sm:gap-5 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100 flex-wrap">
                <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Colores por categoría</span>
                <div className="flex items-center gap-1.5 sm:gap-2"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-brand-blue" /><span className="text-[10px] sm:text-xs text-slate-500 font-medium">Hoy</span></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="bg-white rounded-2xl shadow-soft-2xl max-w-xs w-full p-6"
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
                <button onClick={() => setPayingId(null)} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm">
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
