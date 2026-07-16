import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CaretLeft, CaretRight, Calendar as CalendarIcon, X } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { fadeUp, scaleIn } from '../../components/animations/variants';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function statusColor(status: string) {
  switch (status) {
    case 'paid': return 'bg-green-400';
    case 'pending': return 'bg-amber-400';
    case 'overdue': return 'bg-red-400';
    case 'cancelled': return 'bg-slate-300';
    default: return 'bg-blue-400';
  }
}

function statusPillColor(status: string) {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-700';
    case 'pending': return 'bg-amber-100 text-amber-700';
    case 'overdue': return 'bg-red-100 text-red-700';
    case 'cancelled': return 'bg-slate-100 text-slate-500';
    default: return 'bg-blue-100 text-blue-700';
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

export default function Calendar() {
  const navigate = useNavigate();
  const toast = useToast();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await (api as any).control.payments.calendar(year, month);
      setPayments(res.data || res);
    } catch (e: any) {
      toast.error(e.message || 'Error al cargar calendario');
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    document.title = 'Calendario de Pagos — Control de Gastos';
    fetchCalendar();
  }, [fetchCalendar]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  // Calendar grid calculations
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  // Monday = 0, Sunday = 6
  const startDay = (firstDayOfMonth.getDay() + 6) % 7;

  // Map payments to days
  const paymentsByDay: Record<number, any[]> = {};
  payments.forEach((p: any) => {
    const dueDate = new Date(p.dueDate);
    if (dueDate.getFullYear() === year && dueDate.getMonth() + 1 === month) {
      const day = dueDate.getDate();
      if (!paymentsByDay[day]) paymentsByDay[day] = [];
      paymentsByDay[day].push(p);
    }
  });

  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

  const selectedPayments = selectedDay ? (paymentsByDay[selectedDay] || []) : [];

  return (
    <motion.div {...fadeUp} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon size={24} weight="duotone" className="text-brand-blue" />
            Calendario de Pagos
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Visualiza los vencimientos del mes</p>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-xl hover:bg-slate-100 transition-all active:scale-[0.97]"
        >
          <CaretLeft size={20} className="text-slate-600" />
        </button>
        <h2 className="text-lg font-bold text-slate-800">
          {MONTHS[month - 1]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-xl hover:bg-slate-100 transition-all active:scale-[0.97]"
        >
          <CaretRight size={20} className="text-slate-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {WEEKDAYS.map(day => (
                <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7">
              {/* Empty cells before first day */}
              {Array.from({ length: startDay }, (_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px] border-b border-r border-slate-50 bg-slate-25" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dayPayments = paymentsByDay[day] || [];
                const hasPayments = dayPayments.length > 0;
                const isSelected = selectedDay === day;

                return (
                  <div
                    key={day}
                    onClick={() => hasPayments && setSelectedDay(isSelected ? null : day)}
                    className={`min-h-[80px] sm:min-h-[100px] border-b border-r border-slate-50 p-1.5 sm:p-2 transition-all ${
                      hasPayments ? 'cursor-pointer hover:bg-blue-50/50' : ''
                    } ${isSelected ? 'bg-blue-50 ring-1 ring-inset ring-brand-blue/30' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs sm:text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday(day) ? 'bg-brand-blue text-white' : 'text-slate-700'
                      }`}>
                        {day}
                      </span>
                      {dayPayments.length > 3 && (
                        <span className="text-[10px] font-semibold text-slate-400">+{dayPayments.length - 3}</span>
                      )}
                    </div>

                    {/* Payment dots/pills */}
                    <div className="mt-1 space-y-0.5">
                      {dayPayments.slice(0, 3).map((p: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColor(p.displayStatus || p.status)}`} />
                          <span className="text-[10px] sm:text-xs text-slate-600 truncate leading-tight">
                            {p.conceptName || p.concept?.name || '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Empty cells after last day */}
              {(() => {
                const totalCells = startDay + daysInMonth;
                const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
                return Array.from({ length: remaining }, (_, i) => (
                  <div key={`end-${i}`} className="min-h-[80px] sm:min-h-[100px] border-b border-r border-slate-50 bg-slate-25" />
                ));
              })()}
            </div>
          </>
        )}
      </div>

      {/* Selected Day Popover/Detail */}
      <AnimatePresence>
        {selectedDay && selectedPayments.length > 0 && (
          <motion.div
            {...fadeUp}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700">
                {selectedDay} de {MONTHS[month - 1]} — {selectedPayments.length} pago{selectedPayments.length > 1 ? 's' : ''}
              </h3>
              <button onClick={() => setSelectedDay(null)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-2">
              {selectedPayments.map((p: any) => (
                <div
                  key={p._id}
                  onClick={() => navigate(`/control/pagos/${p._id}`)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusColor(p.displayStatus || p.status)}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.conceptName || p.concept?.name || '—'}</p>
                      <p className="text-xs text-slate-500">{p.companyShortName || p.company?.shortName || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusPillColor(p.displayStatus || p.status)}`}>
                      {p.displayStatus === 'paid' ? 'Pagado' : p.displayStatus === 'overdue' ? 'Vencido' : p.displayStatus === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{formatCurrency(p.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        <span className="text-xs text-slate-500 font-medium">Leyenda:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-xs text-slate-600">Pendiente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="text-xs text-slate-600">Vencido</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="text-xs text-slate-600">Pagado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="text-xs text-slate-600">Cancelado</span>
        </div>
      </div>
    </motion.div>
  );
}
