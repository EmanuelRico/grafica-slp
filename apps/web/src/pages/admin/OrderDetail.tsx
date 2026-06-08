import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { CaretLeft, File, FilePdf, User, Printer, Clock, ArrowSquareOut, DownloadSimple, WhatsappLogo, CheckCircle } from '@phosphor-icons/react';
import { api, Order, loadingHooks } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

const STATUS_OPTIONS = [
  { value: 'received',        label: 'Recibido',       color: 'bg-blue-50 text-blue-700 border-blue-300',       dot: 'bg-blue-500' },
  { value: 'in_production',   label: 'En Producción',  color: 'bg-purple-50 text-purple-700 border-purple-300', dot: 'bg-purple-500' },
  { value: 'finished',        label: 'Terminado',      color: 'bg-green-50 text-green-700 border-green-300',    dot: 'bg-green-500' },
  { value: 'pending_payment', label: 'Pago Pendiente', color: 'bg-amber-50 text-amber-700 border-amber-300',    dot: 'bg-amber-500' },
  { value: 'delivered',       label: 'Entregado',      color: 'bg-slate-50 text-slate-600 border-slate-300',    dot: 'bg-slate-400' },
  { value: 'cancelled',       label: 'Cancelado',      color: 'bg-red-50 text-red-600 border-red-300',          dot: 'bg-red-500' },
];

function FilePreview({ file }: { file: Order['file'] }) {
  const ext = file?.originalName?.split('.').pop()?.toLowerCase() || '';
  const isImage = ['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext);
  const fileUrl = file?.storageKey
    ? `${(import.meta as any).env?.VITE_R2_PUBLIC_URL || ''}/${file.storageKey}`
    : null;

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!file?.storageKey || downloading) return;
    setDownloading(true);
    loadingHooks.start();
    try {
      const token = localStorage.getItem('token');
      const base = (import.meta as any).env?.VITE_API_URL || '/api/v1';
      const res = await fetch(`${base}/files/download/${file.storageKey}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName || 'download';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(fileUrl!, '_blank');
    } finally {
      setDownloading(false);
      loadingHooks.done();
    }
  };

  return (
    <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
      {/* Preview area */}
      <div className="aspect-video bg-slate-100 flex items-center justify-center relative">
        {isImage && fileUrl ? (
          <img src={fileUrl} alt={file.originalName} className="max-h-full max-w-full object-contain p-4" />
        ) : (
          <div className="text-center space-y-2">
            {ext === 'pdf'
              ? <FilePdf size={48} className="text-red-400 mx-auto" weight="light" />
              : <File size={48} className="text-brand-blue/40 mx-auto" weight="light" />}
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{ext} file</p>
          </div>
        )}
      </div>

      {/* File info */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-ink truncate">{file?.originalName}</p>
          <p className="text-xs text-slate-400 mt-0.5">{file?.fileSizeBytes ? (file.fileSizeBytes / 1024 / 1024).toFixed(2) + ' MB' : ''}</p>
        </div>
        {fileUrl && (
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <a href={fileUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs text-brand-blue font-semibold hover:underline">
              <ArrowSquareOut size={13} /> Abrir
            </a>
            <span className="text-slate-200">|</span>
            <button onClick={handleDownload}
              className="flex items-center gap-1 text-xs text-slate-500 font-semibold hover:text-brand-ink transition-colors">
              <DownloadSimple size={13} /> Descargar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => { document.title = 'Admin — GRAFICA SLP'; }, []);
  useEffect(() => {
    if (!id) return;
    api.admin.getOrder(id)
      .then(o => { setOrder(o); setNewStatus(o.status); })
      .catch(() => toast.error('No se pudo cargar el pedido'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveStatus = async () => {
    if (!id || !order || newStatus === order.status) return;
    setSaving(true);
    try {
      const updated = await api.admin.updateStatus(id, newStatus, note || undefined);
      setOrder(updated);
      setNote('');
      toast.success(`Estado actualizado a "${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}"`);
    } catch (e: any) {
      toast.error(e.message || 'Error al actualizar estado');
    } finally {
      setSaving(false);
    }
  };

  const getWhatsAppUrl = (order: Order) => {
    const phone = order.customerPhone.replace(/\D/g, '');
    const messages: Record<string, string> = {
      received:
`✨ Pedido recibido

¡Tu archivo ya está en nuestras manos!

🧾 Pedido: #${order.orderNumber}

Hemos recibido tu archivo correctamente y comenzaremos a procesarlo.

Te notificaremos nuevamente cuando esté listo.

GRAFICA SLP`,
      finished:
`🎉 Pedido terminado

¡Buenas noticias!

Tu pedido #${order.orderNumber} ya está listo.

Puedes pasar a recogerlo cuando gustes dentro de nuestro horario de atención.

Gracias por crear con nosotros 💙

GRAFICA SLP`,
      cancelled:
`❌ Pedido cancelado

Hola, te informamos que tu pedido #${order.orderNumber} ha sido cancelado.

Si tienes alguna duda, no dudes en contactarnos.

GRAFICA SLP`,
    };
    const text = messages[order.status] || '';
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-400 mb-4">Pedido no encontrado</p>
        <button onClick={() => navigate('/admin')} className="text-brand-blue text-sm font-semibold hover:underline">← Volver al dashboard</button>
      </div>
    </div>
  );

  const currentCfg = STATUS_OPTIONS.find(s => s.value === order.status);
  const statusChanged = newStatus !== order.status;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 lg:px-8 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/admin')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-brand-ink font-medium text-sm transition-colors">
          <CaretLeft size={16} weight="bold" /> Dashboard
        </button>
        <span className="text-slate-300">/</span>
        <span className="font-bold text-brand-ink text-sm">{order.orderNumber}</span>
        <span className={`ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${currentCfg?.color}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${currentCfg?.dot}`} /> {currentCfg?.label}
        </span>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left column — file + customer + order */}
        <div className="lg:col-span-2 space-y-5">

          {/* File preview */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-4">
              <File size={16} className="text-brand-blue" /> Archivo del cliente
            </h3>
            <FilePreview file={order.file} />
          </motion.section>

          {/* Customer + order in 2-col grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-4">
                <User size={16} className="text-brand-blue" /> Cliente
              </h3>
              <div className="space-y-2.5 text-sm">
                {[
                  ['Nombre',   order.customerName],
                  ['WhatsApp', order.customerPhone],
                  ...(order.customerEmail ? [['Email', order.customerEmail]] : []),
                  ...(order.wantsInvoice ? [['Factura', 'Sí']] : []),
                  ...(order.invoiceName ? [['Razón social', order.invoiceName]] : []),
                  ...(order.invoiceCFDI ? [['Uso CFDI', order.invoiceCFDI]] : []),
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-slate-400 shrink-0">{label}</span>
                    {label === 'WhatsApp'
                      ? <a href={`https://wa.me/${val.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                          className="font-semibold text-brand-blue hover:underline truncate">{val}</a>
                      : <span className="font-semibold text-brand-ink truncate">{val}</span>}
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-4">
                <Printer size={16} className="text-brand-blue" /> Pedido
              </h3>
              <div className="space-y-2.5 text-sm">
                {[
                  ['Tipo',       order.printType.name],
                  ['Longitud',   `${order.lengthCm} cm`],
                  ['Repeticiones', String(order.repetitions)],
                  ['Precio est.',  `$${order.estimatedPrice.toLocaleString('es-MX')} MXN`],
                  ['Fecha',      new Date(order.createdAt).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' })],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-slate-400 shrink-0">{label}</span>
                    <span className="font-semibold text-brand-ink truncate">{val}</span>
                  </div>
                ))}
                {order.comments && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-slate-400 text-xs mb-1">Comentarios</p>
                    <p className="text-slate-700 text-xs leading-relaxed">{order.comments}</p>
                  </div>
                )}
              </div>
            </motion.section>
          </div>

          {/* Status history */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-4">
              <Clock size={16} className="text-brand-blue" /> Historial
            </h3>
            <div className="space-y-2">
              {order.statusHistory.map((h, i) => {
                const cfg = STATUS_OPTIONS.find(s => s.value === h.to);
                return (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg?.dot || 'bg-slate-300'}`} />
                    <span className="font-medium text-brand-ink">{cfg?.label || h.to}</span>
                    <span className="text-slate-400 text-xs ml-auto">{new Date(h.changedAt).toLocaleString('es-MX')}</span>
                  </div>
                );
              })}
            </div>
          </motion.section>
        </div>

        {/* Right column — status + whatsapp */}
        <div className="space-y-5">

          {/* Status changer — the key improvement */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-20">
            <h3 className="font-bold text-slate-700 text-sm mb-4">Actualizar estado</h3>
            <p className="text-xs text-slate-400 mb-3">Pedido: <span className="font-semibold text-brand-ink">{order.orderNumber}</span></p>

            <div className="space-y-2">
              {STATUS_OPTIONS.map(s => (
                <motion.button key={s.value} type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setNewStatus(s.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-150 ${
                    newStatus === s.value
                      ? `${s.color} border-current`
                      : 'border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                  {s.label}
                  {order.status === s.value && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider opacity-60">actual</span>
                  )}
                  {newStatus === s.value && newStatus !== order.status && (
                    <CheckCircle size={16} weight="fill" className="ml-auto opacity-70" />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Note */}
            <div className="mt-4">
              <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all placeholder:text-slate-300"
                placeholder="Nota interna (opcional)"
                value={note} onChange={e => setNote(e.target.value)} />
            </div>

            {/* Save button */}
            <AnimatePresence>
              {statusChanged && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  onClick={handleSaveStatus} disabled={saving}
                  className="mt-3 w-full gradient-brand text-white font-bold py-3 rounded-xl shadow-blue-glow hover:opacity-90 transition-opacity disabled:opacity-60 text-sm"
                >
                  {saving ? 'Guardando...' : 'Guardar cambio'}
                </motion.button>
              )}
            </AnimatePresence>

            {/* WhatsApp direct link — only for received and finished */}
            {['received', 'finished', 'cancelled'].includes(order.status) && (() => {
              const wasSent = order.statusHistory.some(h => h.to === order.status && h.whatsappSentAt);
              return (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-2">Notificar al cliente</p>
                {wasSent ? (
                  <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 border-green-200 bg-green-50 text-green-600">
                    <CheckCircle size={16} weight="fill" /> Mensaje enviado
                  </div>
                ) : (
                  <>
                    <a
                      href={getWhatsAppUrl(order)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        api.admin.markWhatsappSent(order._id).then(updated => setOrder(updated));
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 border-green-400 text-green-600 hover:bg-green-50 transition-colors"
                    >
                      <WhatsappLogo size={16} weight="fill" /> Enviar por WhatsApp
                    </a>
                  </>
                )}
                <p className="text-[10px] text-slate-400 mt-2 text-center leading-relaxed">
                  {wasSent ? 'Ya se notificó al cliente para este estado' : 'Abre WhatsApp con el mensaje listo'}
                </p>
              </div>
              );
            })()}
          </motion.section>
        </div>
      </div>
    </div>
  );
}
