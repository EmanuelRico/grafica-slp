import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CurrencyDollar, Plus } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { fadeUp } from '../../components/animations/variants';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Única' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'bimonthly', label: 'Bimestral' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
];

export default function NewPayment() {
  const navigate = useNavigate();
  const toast = useToast();

  const [companies, setCompanies] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [companyId, setCompanyId] = useState('');
  const [conceptId, setConceptId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [periodMonth, setPeriodMonth] = useState(String(new Date().getMonth() + 1));
  const [periodYear, setPeriodYear] = useState(String(new Date().getFullYear()));
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [fixedAmount, setFixedAmount] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    document.title = 'Nuevo Pago — Control de Gastos';
    Promise.all([
      (api as any).control.companies.list(),
      (api as any).control.concepts.list(),
      (api as any).control.categories.list(),
      (api as any).control.providers.list(),
    ]).then(([comps, concs, cats, provs]: any[]) => {
      setCompanies(comps.data || comps);
      setConcepts(concs.data || concs);
      setCategories(cats.data || cats);
      setProviders(provs.data || provs);
      setLoading(false);
    }).catch((e: any) => {
      toast.error('Error al cargar datos del formulario');
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !conceptId || !categoryId || !amount || !dueDate) {
      toast.error('Completa todos los campos requeridos');
      return;
    }
    setSubmitting(true);
    try {
      await (api as any).control.payments.create({
        company: companyId,
        concept: conceptId,
        category: categoryId,
        provider: providerId || undefined,
        periodMonth: Number(periodMonth),
        periodYear: Number(periodYear),
        amount: Number(amount),
        dueDate,
        recurrence,
        fixedAmount,
        paymentNotes: notes || undefined,
      });
      toast.success('Pago creado exitosamente');
      navigate('/control/pagos');
    } catch (e: any) {
      toast.error(e.message || 'Error al crear el pago');
    }
    setSubmitting(false);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div {...fadeUp} className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/control/pagos')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mb-4 active:scale-[0.97]"
        >
          <ArrowLeft size={16} />
          Volver a pagos
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo Pago</h1>
        <p className="text-sm text-slate-500 mt-0.5">Registra un nuevo pago u obligación</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Empresa <span className="text-red-400">*</span>
          </label>
          <select
            value={companyId}
            onChange={e => setCompanyId(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
          >
            <option value="">Seleccionar empresa...</option>
            {companies.map((c: any) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Concept + Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Concepto <span className="text-red-400">*</span>
            </label>
            <select
              value={conceptId}
              onChange={e => setConceptId(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
            >
              <option value="">Seleccionar concepto...</option>
              {concepts.map((c: any) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Categoría <span className="text-red-400">*</span>
            </label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
            >
              <option value="">Seleccionar categoría...</option>
              {categories.map((c: any) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Provider */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Proveedor (opcional)</label>
          <select
            value={providerId}
            onChange={e => setProviderId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
          >
            <option value="">Sin proveedor</option>
            {providers.map((p: any) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Period */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Período <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={periodMonth}
              onChange={e => setPeriodMonth(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={String(i + 1)}>{m}</option>
              ))}
            </select>
            <select
              value={periodYear}
              onChange={e => setPeriodYear(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
            >
              {years.map(y => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Monto <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">MXN $</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              placeholder="0.00"
              className="w-full pl-16 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
            />
          </div>
        </div>

        {/* Due date + Recurrence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Fecha de vencimiento <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Recurrencia</label>
            <select
              value={recurrence}
              onChange={e => setRecurrence(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
            >
              {RECURRENCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fixed Amount Toggle */}
        <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setFixedAmount(!fixedAmount)}
            className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200 ${fixedAmount ? 'bg-brand-blue' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${fixedAmount ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <div>
            <p className="text-sm font-medium text-slate-700">Monto fijo</p>
            <p className="text-xs text-slate-500 mt-0.5">Si se desactiva, el siguiente pago se generará sin monto definido</p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Información adicional..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all resize-none"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-blue text-white font-semibold text-sm shadow-blue-glow hover:opacity-90 disabled:opacity-50 transition-all ease-out active:scale-[0.97]"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus size={18} weight="duotone" />
            )}
            {submitting ? 'Creando...' : 'Crear Pago'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
