import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MagnifyingGlass, CaretLeft, Package, Clock, CheckCircle, Truck } from '@phosphor-icons/react';
import { api, TrackedOrder } from '../lib/api';
import { Sparkle } from '../components/brand/Decorations';

const ease = [0.32, 0.72, 0, 1] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: any; step: number }> = {
  received:      { label: 'Recibido',      color: 'text-blue-600',   bg: 'bg-blue-100',   Icon: Package,    step: 1 },
  in_production: { label: 'En Producción', color: 'text-purple-600', bg: 'bg-purple-100', Icon: Clock,      step: 2 },
  finished:      { label: 'Terminado',     color: 'text-green-600',  bg: 'bg-green-100',  Icon: CheckCircle, step: 3 },
  delivered:     { label: 'Entregado',     color: 'text-slate-600',  bg: 'bg-slate-100',  Icon: Truck,      step: 4 },
  cancelled:     { label: 'Cancelado',     color: 'text-red-600',    bg: 'bg-red-100',    Icon: Package,    step: 0 },
};

const ALL_STEPS = ['received', 'in_production', 'finished', 'delivered'];

function StatusTimeline({ status }: { status: string }) {
  const currentStep = STATUS_CONFIG[status]?.step ?? 1;
  return (
    <div className="flex items-center gap-0">
      {ALL_STEPS.map((s, i) => {
        const cfg = STATUS_CONFIG[s];
        const done = cfg.step <= currentStep;
        const isCurrent = s === status;
        return (
          <div key={s} className="flex items-center flex-1">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isCurrent ? `${cfg.bg} ${cfg.color}` : done ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-300'
              } ${isCurrent ? 'ring-2 ring-offset-2 ring-brand-blue/30' : ''}`}
            >
              <cfg.Icon size={14} weight={done ? 'fill' : 'light'} />
            </motion.div>
            {i < ALL_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors ${done ? 'bg-brand-blue' : 'bg-slate-100'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order, index }: { order: TrackedOrder; index: number }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.received;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: index * 0.08, duration: 0.4, ease }}
      className="bg-white rounded-2xl border border-slate-100 shadow-soft-xl p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Número de pedido</p>
          <p className="font-black text-brand-ink text-xl tracking-wide mt-0.5">{order.orderNumber}</p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.color}`}>
          <cfg.Icon size={12} weight="fill" /> {cfg.label}
        </span>
      </div>

      {/* Status timeline */}
      <StatusTimeline status={order.status} />

      {/* Status labels below timeline */}
      <div className="flex justify-between px-1">
        {ALL_STEPS.map(s => (
          <span key={s} className={`text-[9px] font-semibold text-center leading-tight ${
            s === order.status ? STATUS_CONFIG[s].color : 'text-slate-300'
          }`}>
            {STATUS_CONFIG[s].label}
          </span>
        ))}
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Tipo', value: order.printType },
          { label: 'Longitud', value: `${order.lengthCm} cm` },
          { label: 'Repeticiones', value: String(order.repetitions) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-50 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{label}</p>
            <p className="text-sm font-bold text-brand-ink mt-0.5 truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Total price */}
      <div className="flex items-center justify-between bg-brand-blue-pale rounded-xl px-4 py-3">
        <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">Total estimado</span>
        <span className="text-lg font-black text-brand-blue">${order.estimatedPrice.toLocaleString('es-MX')}</span>
      </div>

      {/* File preview */}
      {order.file && (() => {
        const base = (import.meta as any).env?.VITE_API_URL || '/api/v1';
        const previewUrl = `${base}/files/preview/${order.file.storageKey}`;
        const isImage = order.file.mimeType.startsWith('image/');
        const isPdf = order.file.mimeType === 'application/pdf';
        return (
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            {isImage ? (
              <img src={previewUrl} alt={order.file.originalName} className="w-full h-40 object-contain bg-slate-50" />
            ) : isPdf ? (
              <iframe src={previewUrl} title={order.file.originalName} className="w-full h-48 bg-slate-50" />
            ) : (
              <div className="h-24 bg-slate-50 flex items-center justify-center">
                <Package size={28} className="text-slate-300" />
              </div>
            )}
            <div className="px-3 py-2 bg-white border-t border-slate-50">
              <p className="text-[10px] text-slate-400 truncate">{order.file.originalName}</p>
            </div>
          </div>
        );
      })()}

      {/* History */}
      {order.statusHistory.length > 0 && (
        <div className="pt-3 border-t border-slate-50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Historial</p>
          <div className="space-y-1.5">
            {order.statusHistory.map((h, i) => {
              const hCfg = STATUS_CONFIG[h.status];
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full ${hCfg ? hCfg.color.replace('text-', 'bg-') : 'bg-slate-300'}`} />
                  <span className="font-medium text-slate-600">{hCfg?.label || h.status}</span>
                  <span className="text-slate-300 ml-auto">{new Date(h.changedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function Track() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [results, setResults] = useState<TrackedOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true); setError(''); setResults(null);
    try {
      const data = await api.trackOrder(q.trim());
      setResults(data);
    } catch {
      setError('No se encontraron pedidos con ese número o teléfono.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (params.get('q')) search(params.get('q')!); }, []);

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-brand-ink font-medium text-sm transition-colors">
          <CaretLeft size={16} weight="bold" /> Inicio
        </button>
        <div className="ml-auto">
          <p className="font-black text-brand-ink text-sm tracking-tight">GRAFICA SLP</p>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-5 py-8">
        <div className="w-full max-w-lg space-y-6">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkle size={16} className="text-brand-yellow" />
              <span className="eyebrow bg-brand-blue-pale text-brand-blue">Rastreo de pedido</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-brand-ink tracking-tight leading-tight">
              ¿Cómo va<br/>tu pedido?
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Ingresa tu número de pedido o tu número de WhatsApp (10 dígitos).
            </p>
          </motion.div>

          {/* Search */}
          <motion.form
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4, ease }}
            onSubmit={(e) => { e.preventDefault(); search(); }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <MagnifyingGlass size={16} weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all text-brand-ink font-medium text-sm placeholder:text-slate-300"
                placeholder="GSLP-001258 o 4441234567"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="px-6 py-3.5 gradient-brand text-white font-bold rounded-xl shadow-blue-glow hover:opacity-90 transition-opacity disabled:opacity-60 text-sm"
            >
              {loading ? '...' : 'Buscar'}
            </motion.button>
          </motion.form>

          {/* Results */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-sm text-amber-700 font-medium">{error}</p>
                <p className="text-xs text-amber-500 mt-1">Verifica el número e intenta de nuevo.</p>
              </motion.div>
            )}
            {results && (
              <div className="space-y-4">
                {results.map((o, i) => <OrderCard key={o.orderNumber} order={o} index={i} />)}
              </div>
            )}
          </AnimatePresence>

          {/* Empty state hint */}
          {!results && !error && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-center pt-8">
              <MagnifyingGlass size={40} className="text-slate-200 mx-auto mb-3" weight="light" />
              <p className="text-sm text-slate-400">Ingresa tu folio o número de WhatsApp para consultar</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
