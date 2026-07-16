import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, PencilSimple, Clock, Receipt, FileText,
  CalendarCheck, Buildings, Tag, CurrencyDollar, Repeat, User, Bank, X,
} from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { fadeUp, scaleIn, staggerContainer, staggerItem } from '../../components/animations/variants';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

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

const RECURRENCE_LABELS: Record<string, string> = {
  once: 'Única',
  monthly: 'Mensual',
  bimonthly: 'Bimestral',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
};

export default function PaymentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Mark as paid form
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [bankAccountId, setBankAccountId] = useState('');
  const [paidNotes, setPaidNotes] = useState('');
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchPayment = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await (api as any).control.payments.getById(id);
      setPayment(res);
    } catch (e: any) {
      toast.error(e.message || 'Error al cargar el pago');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchPayment();
    (api as any).control.bankAccounts.list().then((res: any) => setBankAccounts(res.data || res)).catch(() => {});
  }, [fetchPayment]);

  useEffect(() => {
    document.title = payment ? `${payment.conceptName || 'Pago'} — Control` : 'Detalle de Pago';
  }, [payment]);

  const handleMarkPaid = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await (api as any).control.payments.markPaid(id, { paidAt, bankAccount: bankAccountId || undefined, paymentNotes: paidNotes || undefined });
      toast.success('Pago marcado como pagado');
      setShowPaidModal(false);
      fetchPayment();
    } catch (e: any) {
      toast.error(e.message || 'Error al marcar como pagado');
    }
    setSubmitting(false);
  };

  const handleCancel = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await (api as any).control.payments.cancel(id);
      toast.success('Pago cancelado');
      setShowCancelConfirm(false);
      fetchPayment();
    } catch (e: any) {
      toast.error(e.message || 'Error al cancelar el pago');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">No se encontró el pago</p>
        <button onClick={() => navigate('/control/pagos')} className="mt-4 text-brand-blue text-sm font-medium hover:underline">
          Volver a pagos
        </button>
      </div>
    );
  }

  const displayStatus = payment.displayStatus || payment.status;

  return (
    <motion.div {...fadeUp} className="space-y-6 max-w-4xl">
      {/* Back + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/control/pagos')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors active:scale-[0.97]"
        >
          <ArrowLeft size={16} />
          Volver a pagos
        </button>
        <div className="flex items-center gap-2">
          {payment.status === 'pending' && (
            <>
              <button
                onClick={() => setShowPaidModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-all ease-out active:scale-[0.97]"
              >
                <CheckCircle size={16} weight="duotone" />
                Marcar como pagado
              </button>
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-all ease-out active:scale-[0.97]"
              >
                <XCircle size={16} weight="duotone" />
                Cancelar
              </button>
            </>
          )}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ease-out active:scale-[0.97] ${editMode ? 'bg-brand-blue text-white border-brand-blue' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <PencilSimple size={16} />
            {editMode ? 'Editando' : 'Editar'}
          </button>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-3">
        <span className={`inline-flex px-4 py-1.5 rounded-full text-sm font-bold border ${statusColor(displayStatus)}`}>
          {statusLabel(displayStatus)}
        </span>
        {payment.recurrence && payment.recurrence !== 'none' && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium border border-purple-100">
            <Repeat size={12} />
            {RECURRENCE_LABELS[payment.recurrence] || payment.recurrence}
          </span>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-1">{payment.conceptName || payment.concept?.name}</h2>
        <p className="text-sm text-slate-500 mb-6">{MONTHS[(payment.periodMonth || 1) - 1]} {payment.periodYear}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoItem icon={Buildings} label="Empresa" value={payment.companyName || payment.company?.name || '—'} />
          <InfoItem icon={Tag} label="Categoría" value={payment.categoryName || payment.category?.name || '—'} />
          <InfoItem icon={User} label="Proveedor" value={payment.providerName || payment.provider?.name || 'Sin proveedor'} />
          <InfoItem icon={CurrencyDollar} label="Monto" value={formatCurrency(payment.amount)} highlight />
          <InfoItem icon={CalendarCheck} label="Vencimiento" value={new Date(payment.dueDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })} />
          <InfoItem icon={Repeat} label="Recurrencia" value={RECURRENCE_LABELS[payment.recurrence] || 'Única'} />
          {payment.paidAt && (
            <InfoItem icon={CheckCircle} label="Fecha de pago" value={new Date(payment.paidAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })} />
          )}
          {payment.bankAccount && (
            <InfoItem icon={Bank} label="Cuenta bancaria" value={payment.bankAccount.name || payment.bankAccountName || '—'} />
          )}
        </div>

        {payment.notes && (
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notas</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{payment.notes}</p>
          </div>
        )}
      </div>

      {/* Receipts */}
      {payment.receipts && payment.receipts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <FileText size={18} weight="duotone" className="text-brand-blue" />
            Comprobantes
          </h3>
          <div className="space-y-2">
            {payment.receipts.map((r: any, i: number) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <FileText size={20} weight="duotone" className="text-slate-400" />
                <span className="text-sm text-slate-700 truncate flex-1">{r.originalName || r.name || `Comprobante ${i + 1}`}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* History Timeline */}
      {payment.history && payment.history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Clock size={18} weight="duotone" className="text-brand-blue" />
            Historial
          </h3>
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-0">
            {payment.history.map((entry: any, i: number) => (
              <motion.div key={i} variants={staggerItem} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-blue mt-1.5" />
                  {i < payment.history.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-slate-800">{entry.action || entry.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(entry.createdAt || entry.date).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {entry.user && ` · ${entry.user}`}
                  </p>
                  {entry.notes && <p className="text-xs text-slate-500 mt-1">{entry.notes}</p>}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Mark as Paid Modal */}
      <AnimatePresence>
        {showPaidModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={() => setShowPaidModal(false)}
          >
            <motion.div
              {...scaleIn}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Marcar como Pagado</h3>
                <button onClick={() => setShowPaidModal(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de pago</label>
                  <input
                    type="date"
                    value={paidAt}
                    onChange={e => setPaidAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cuenta bancaria</label>
                  <select
                    value={bankAccountId}
                    onChange={e => setBankAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                  >
                    <option value="">Seleccionar cuenta...</option>
                    {bankAccounts.map((ba: any) => (
                      <option key={ba._id} value={ba._id}>{ba.name} - {ba.bankName} (****{ba.lastFourDigits})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notas (opcional)</label>
                  <textarea
                    value={paidNotes}
                    onChange={e => setPaidNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all resize-none"
                    placeholder="Referencia, número de transferencia..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowPaidModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.97]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleMarkPaid}
                  disabled={submitting || !paidAt}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-all active:scale-[0.97]"
                >
                  {submitting ? 'Guardando...' : 'Confirmar Pago'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              {...scaleIn}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm p-6 text-center"
            >
              <XCircle size={48} weight="duotone" className="text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">¿Cancelar este pago?</h3>
              <p className="text-sm text-slate-500 mb-6">Esta acción no se puede deshacer. El pago se marcará como cancelado.</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.97]"
                >
                  No, volver
                </button>
                <button
                  onClick={handleCancel}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-all active:scale-[0.97]"
                >
                  {submitting ? 'Cancelando...' : 'Sí, cancelar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InfoItem({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50">
      <Icon size={18} weight="duotone" className="text-brand-blue mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-sm font-medium ${highlight ? 'text-slate-900' : 'text-slate-700'}`}>{value}</p>
      </div>
    </div>
  );
}
