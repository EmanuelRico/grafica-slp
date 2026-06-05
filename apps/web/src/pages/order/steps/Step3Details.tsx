import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator } from '@phosphor-icons/react';
import { api, PrintType } from '../../../lib/api';

interface Data { printTypeSlug: string; lengthCm: number; repetitions: number; comments: string; }
interface Props { initial: Data; onComplete: (data: Data) => void; }

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  dtf_uv:      { bg: 'bg-blue-50',   border: 'border-brand-blue',   text: 'text-brand-blue',   dot: 'bg-brand-blue' },
  dtf_textile: { bg: 'bg-sky-50',    border: 'border-sky-400',      text: 'text-sky-600',      dot: 'bg-sky-400' },
  sublimation: { bg: 'bg-orange-50', border: 'border-orange-400',   text: 'text-orange-600',   dot: 'bg-orange-400' },
};

export default function Step3Details({ initial, onComplete }: Props) {
  const [printTypes, setPrintTypes] = useState<PrintType[]>([]);
  const [data, setData]   = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { api.getPrintTypes().then(setPrintTypes).catch(() => {}); }, []);

  const selected = printTypes.find((p) => p.slug === data.printTypeSlug);
  const estimatedPrice = selected ? (data.lengthCm / 100) * data.repetitions * selected.pricePerMeter : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!data.printTypeSlug) err.printTypeSlug = 'Selecciona un tipo';
    if (!data.lengthCm || data.lengthCm <= 0) err.lengthCm = 'Ingresa la longitud';
    if (selected && data.lengthCm < selected.minLengthCm)
      err.lengthCm = `Mínimo ${selected.minLengthCm} cm para ${selected.name}`;
    if (!data.repetitions || data.repetitions < 1) err.repetitions = 'Mínimo 1';
    if (Object.keys(err).length) { setErrors(err); return; }
    onComplete(data);
  };

  return (
    <form id="step-form" onSubmit={handleSubmit} className="px-6 lg:px-10 py-10">
      <span className="eyebrow bg-brand-blue-pale text-brand-blue">03. Detalles del pedido</span>
      <h2 className="text-3xl font-black text-brand-ink tracking-tight mt-5">
        Selecciona el tipo<br/>de impresión
      </h2>
      <p className="text-slate-400 mt-2 text-sm">y los detalles de tu pedido.</p>

      {/* Print type cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {printTypes.map((pt) => {
          const c = TYPE_COLORS[pt.slug] || TYPE_COLORS.dtf_uv;
          const isSelected = data.printTypeSlug === pt.slug;
          return (
            <motion.button key={pt.slug} type="button"
              whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => {
                setData(d => ({ ...d, printTypeSlug: pt.slug, lengthCm: 0 }));
                setErrors(e => { const n = { ...e }; delete n.lengthCm; delete n.printTypeSlug; return n; });
              }}
              className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                isSelected ? `${c.bg} ${c.border}` : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mb-3 ${isSelected ? c.dot : 'bg-slate-300'}`} />
              <p className={`font-bold text-sm ${isSelected ? c.text : 'text-brand-ink'}`}>{pt.name}</p>
              <p className="text-xs text-slate-400 mt-1">{pt.widthCm} cm ancho</p>
              <p className={`text-sm font-black mt-2 ${isSelected ? c.text : 'text-slate-600'}`}>
                ${pt.pricePerMeter}<span className="text-xs font-normal"> /metro</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Mínimo {pt.minLengthCm} cm</p>
            </motion.button>
          );
        })}
      </div>
      {errors.printTypeSlug && <p className="text-red-500 text-xs mt-2">{errors.printTypeSlug}</p>}

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <label className="text-sm font-semibold text-brand-ink block mb-1.5">
            Largo requerido (cm) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input type="number" min={selected?.minLengthCm || 1} step="0.5"
              className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all text-brand-ink font-medium text-sm"
              value={data.lengthCm || ''} placeholder={selected ? `Mín. ${selected.minLengthCm}` : '0'}
              onBlur={(e) => {
                if (selected && +e.target.value < selected.minLengthCm) {
                  setData(d => ({ ...d, lengthCm: selected.minLengthCm }));
                  setErrors(err => ({ ...err, lengthCm: `Mínimo ${selected.minLengthCm} cm para ${selected.name}` }));
                }
              }}
              onChange={(e) => {
                setData(d => ({ ...d, lengthCm: +e.target.value }));
                setErrors(err => { const n = { ...err }; delete n.lengthCm; return n; });
              }} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">cm</span>
          </div>
          {errors.lengthCm && <p className="text-red-500 text-xs mt-1">{errors.lengthCm}</p>}
        </div>
        <div>
          <label className="text-sm font-semibold text-brand-ink block mb-1.5">
            Número de repeticiones <span className="text-red-400">*</span>
          </label>
          <input type="number" min={1}
            className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all text-brand-ink font-medium text-sm"
            value={data.repetitions || ''} placeholder="1"
            onChange={(e) => setData(d => ({ ...d, repetitions: +e.target.value }))} />
          {errors.repetitions && <p className="text-red-500 text-xs mt-1">{errors.repetitions}</p>}
        </div>
      </div>

      {/* Live price */}
      <AnimatePresence>
        {estimatedPrice > 0 && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="mt-5 bg-brand-blue-pale border border-brand-blue/20 rounded-2xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-slate font-medium">Precio estimado</p>
              <motion.p
                key={estimatedPrice}
                initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
                className="text-2xl font-black text-brand-blue mt-0.5"
              >
                ${estimatedPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                <span className="text-sm font-normal text-brand-slate ml-1">MXN</span>
              </motion.p>
              <p className="text-xs text-slate-400 mt-0.5">
                {data.lengthCm}cm × {data.repetitions} rep × ${selected?.pricePerMeter}/m
              </p>
            </div>
            <Calculator size={28} className="text-brand-blue/30" weight="light" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments */}
      <div className="mt-5">
        <label className="text-sm font-semibold text-brand-ink block mb-1.5">Comentarios (opcional)</label>
        <textarea rows={3} placeholder="Instrucciones especiales, referencias de color, etc."
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all resize-none text-sm text-brand-ink placeholder:text-slate-300"
          value={data.comments} onChange={(e) => setData(d => ({ ...d, comments: e.target.value }))} />
      </div>
    </form>
  );
}
