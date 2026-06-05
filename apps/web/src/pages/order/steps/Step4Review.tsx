import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, User, Printer, CheckSquare, Square } from 'lucide-react';

interface Props {
  data: any;
  onComplete: (acks: { acknowledgedFileReady: boolean; acknowledgedNoEdits: boolean; acknowledgedQuality: boolean }) => void;
}

const ACKNOWLEDGEMENTS = [
  { key: 'acknowledgedFileReady', label: 'Mi archivo está listo para producción' },
  { key: 'acknowledgedNoEdits', label: 'Entiendo que GRAFICA SLP no realiza modificaciones al archivo' },
  { key: 'acknowledgedQuality', label: 'Acepto responsabilidad por la calidad de impresión del archivo enviado' },
];

export default function Step4Review({ data, onComplete }: Props) {
  const [acks, setAcks] = useState({ acknowledgedFileReady: false, acknowledgedNoEdits: false, acknowledgedQuality: false });
  const allChecked = Object.values(acks).every(Boolean);

  const toggle = (key: string) => setAcks((a) => ({ ...a, [key]: !a[key as keyof typeof a] }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allChecked) return;
    onComplete(acks);
  };

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className="font-medium text-slate-800 text-sm text-right max-w-48">{value}</span>
    </div>
  );

  return (
    <form id="step-form" onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Revisa tu pedido</h2>
        <p className="text-slate-500 mt-1 text-sm">Verifica que todo esté correcto antes de enviar.</p>
      </div>

      {/* File */}
      <div className="bg-slate-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-brand-blue" />
          <span className="text-sm font-semibold text-slate-700">Archivo</span>
        </div>
        <p className="text-sm text-slate-600 truncate">{data.file?.originalName}</p>
        <p className="text-xs text-slate-400 mt-0.5">{data.file?.fileSizeBytes ? (data.file.fileSizeBytes / 1024 / 1024).toFixed(2) + ' MB' : ''}</p>
      </div>

      {/* Customer */}
      <div className="bg-slate-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-brand-blue" />
          <span className="text-sm font-semibold text-slate-700">Cliente</span>
        </div>
        <Row label="Nombre" value={data.customer?.customerName} />
        <Row label="WhatsApp" value={data.customer?.customerPhone} />
        {data.customer?.customerEmail && <Row label="Email" value={data.customer?.customerEmail} />}
      </div>

      {/* Order details */}
      <div className="bg-slate-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Printer className="w-4 h-4 text-brand-blue" />
          <span className="text-sm font-semibold text-slate-700">Pedido</span>
        </div>
        <Row label="Tipo" value={data.details?.printTypeSlug?.replace('_', ' ').toUpperCase()} />
        <Row label="Longitud" value={`${data.details?.lengthCm} cm`} />
        <Row label="Repeticiones" value={`${data.details?.repetitions}`} />
        {data.details?.comments && <Row label="Comentarios" value={data.details.comments} />}
      </div>

      {/* Acknowledgements */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-700">Confirma lo siguiente:</p>
        {ACKNOWLEDGEMENTS.map(({ key, label }) => (
          <motion.button key={key} type="button" whileTap={{ scale: 0.98 }}
            onClick={() => toggle(key)}
            className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-colors ${
              acks[key as keyof typeof acks] ? 'border-brand-blue bg-brand-blue/5' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {acks[key as keyof typeof acks]
              ? <CheckSquare className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" />
              : <Square className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />}
            <span className="text-sm text-slate-700">{label}</span>
          </motion.button>
        ))}
      </div>

      {!allChecked && (
        <p className="text-amber-600 text-xs text-center">Debes confirmar los 3 puntos para continuar</p>
      )}
    </form>
  );
}
