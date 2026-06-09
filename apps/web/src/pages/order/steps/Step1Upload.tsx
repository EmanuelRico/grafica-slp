import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudArrowUp, CheckCircle, WarningCircle, File, ShieldCheck, Warning, X } from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { Sparkle, SparkleSmall, Squiggle, DotCluster } from '../../../components/brand/Decorations';

const ACCEPTED = ['application/pdf', 'image/png'];
const MAX_MB = 0; // no limit
const ease = [0.32, 0.72, 0, 1] as const;

interface Props {
  onComplete: (data: { fileKey: string; originalName: string; fileSizeBytes: number; mimeType: string }) => void;
}

function FileWarningModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,27,42,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-soft-2xl max-w-md w-full p-7"
      >
        {/* Icon */}
        <div className="w-14 h-14 bg-brand-yellow/20 rounded-2xl flex items-center justify-center mb-5">
          <Warning size={28} weight="fill" className="text-brand-yellow" />
        </div>

        <h2 className="text-xl font-black text-brand-ink tracking-tight">
          Antes de subir tu archivo
        </h2>
        <p className="text-slate-500 text-sm mt-2 leading-relaxed">
          Para garantizar la mejor calidad de impresión, asegúrate de que tu archivo cumpla con lo siguiente:
        </p>

        <ul className="mt-4 space-y-2.5">
          {[
            'Los archivos de baja calidad se imprimirán tal como fueron enviados',
            'Los colores están en modo CMYK o configurados para impresión',
            'El diseño tiene las dimensiones y proporciones correctas',
            'No hay textos o elementos importantes cerca de los bordes',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
              <div className="w-5 h-5 rounded-full bg-brand-blue-pale flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-brand-blue font-bold text-[10px]">{i + 1}</span>
              </div>
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600 leading-relaxed">
          <strong>Importante:</strong> GRAFICA SLP no realiza modificaciones a los archivos. La calidad de impresión depende directamente de tu diseño.
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm"
          >
            Revisar mi archivo
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
            className="flex-1 py-3 gradient-brand text-white font-bold rounded-xl shadow-blue-glow text-sm"
          >
            Sí, está listo ✓
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Step1Upload({ onComplete }: Props) {
  const [showWarning, setShowWarning] = useState(false);
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [uploaded, setUploaded]   = useState<string | null>(null);
  const [fileSize, setFileSize]   = useState<number>(0);
  const [error, setError]         = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingFile = useRef<File | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError('Formato no permitido. Solo se aceptan: PDF, PNG');
      return;
    }
    setUploading(true); setProgress(0);

    // Simulate progress — slows down as it approaches 90% to feel natural with large files
    const tick = setInterval(() => setProgress(p => {
      if (p < 50) return p + 8;
      if (p < 75) return p + 3;
      if (p < 90) return p + 0.5;
      return p;
    }), 300);
    try {
      let uploadUrl: string;
      let fileKey: string;
      try {
        const res = await api.getUploadUrl(file.name, file.type || 'application/octet-stream');
        uploadUrl = res.uploadUrl;
        fileKey = res.fileKey;
      } catch (e: any) {
        const msg = e.message === 'Failed to fetch'
          ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.'
          : (e.message || 'Error al preparar la subida');
        throw new Error(msg);
      }
      try {
        await api.uploadToR2(uploadUrl, file);
      } catch (e: any) {
        const msg = e.message === 'Failed to fetch' || e.message === 'Error subiendo archivo'
          ? `No se pudo subir el archivo (${(file.size / 1024 / 1024).toFixed(1)} MB). Puede ser un problema de conexión o que el archivo es demasiado grande. Intenta de nuevo.`
          : (e.message || 'Error al subir el archivo');
        throw new Error(msg);
      }
      clearInterval(tick);
      setProgress(100);
      setFileSize(file.size);
      setTimeout(() => { setUploaded(file.name); onComplete({ fileKey, originalName: file.name, fileSizeBytes: file.size, mimeType: file.type }); }, 400);
    } catch (e: any) {
      clearInterval(tick);
      setError(e.message || 'Error al subir el archivo. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { pendingFile.current = file; setShowWarning(true); }
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { pendingFile.current = file; setShowWarning(true); }
  };

  const handleConfirm = () => {
    setShowWarning(false);
    if (pendingFile.current) handleFile(pendingFile.current);
  };

  const handleCancel = () => {
    setShowWarning(false);
    pendingFile.current = null;
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="relative px-6 lg:px-10 py-10">
      {/* Full-screen upload overlay */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            key="upload-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-5"
          >
            <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
            <div className="w-64 space-y-2">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full gradient-brand rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-center text-sm font-bold text-brand-blue">{Math.round(progress)}%</p>
            </div>
            <p className="text-slate-700 font-semibold text-sm">Subiendo tu archivo...</p>
            <p className="text-slate-400 text-xs">Archivos pesados pueden tardar un momento en completarse</p>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Warning modal */}
      <AnimatePresence>
        {showWarning && <FileWarningModal onConfirm={handleConfirm} onCancel={handleCancel} />}
      </AnimatePresence>
      {/* Step label */}
      <div className="flex items-center gap-3 mb-6">
        <span className="eyebrow bg-brand-blue-pale text-brand-blue">
          02. Subir archivo
        </span>
      </div>

      <h2 className="text-3xl font-black text-brand-ink tracking-tight">Sube tu archivo</h2>
      <p className="text-slate-400 mt-2 text-sm leading-relaxed">
        Tu diseño es el primer paso para hacerlo realidad.
      </p>

      {/* Drop zone */}
      <div className="relative mt-8">
        {/* Floating decorations around the zone */}
        <motion.div animate={{ y: [0,-8,0] }} transition={{ duration:3, repeat:Infinity }} className="absolute -top-4 left-1/4 pointer-events-none">
          <Sparkle size={20} className="text-brand-yellow" />
        </motion.div>
        <motion.div animate={{ y:[0,8,0] }} transition={{ duration:3.5, repeat:Infinity }} className="absolute top-6 -right-4 pointer-events-none">
          <Sparkle size={28} className="text-brand-blue/60" />
        </motion.div>
        <motion.div animate={{ rotate:[0,15,0] }} transition={{ duration:4, repeat:Infinity }} className="absolute -bottom-4 left-8 pointer-events-none">
          <SparkleSmall className="text-brand-yellow" />
        </motion.div>
        <Squiggle className="absolute -right-8 bottom-12 text-brand-blue/30 pointer-events-none" />
        <DotCluster className="absolute -left-6 top-12 text-brand-yellow/50 pointer-events-none" />

        <motion.div
          className={`relative rounded-[2rem] cursor-pointer transition-all duration-500 overflow-hidden ${
            dragging ? 'ring-2 ring-brand-blue ring-offset-4' :
            uploaded ? 'ring-2 ring-green-400 ring-offset-2' : ''
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && !uploaded && inputRef.current?.click()}
          animate={dragging ? { scale: 1.015 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <input ref={inputRef} type="file" accept=".pdf,.png"
            className="hidden" onChange={onFileInput} />

          {/* Outer bezel */}
          <div className="bezel">
            {/* Inner core */}
            <div className={`bezel-inner flex flex-col items-center justify-center py-14 px-8 text-center transition-colors duration-300 ${
              dragging ? 'bg-brand-blue-pale' : 'bg-white'
            }`}>
              <AnimatePresence mode="wait">
                {/* Uploading */}
                {uploading && (
                  <motion.div key="uploading" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }} className="space-y-5 w-full">
                    <div className="relative w-20 h-20 mx-auto">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="#E8F7FD" strokeWidth="6"/>
                        <motion.circle cx="40" cy="40" r="34" fill="none" stroke="#01AEF0" strokeWidth="6"
                          strokeLinecap="round" strokeDasharray={`${2*Math.PI*34}`}
                          initial={{ strokeDashoffset: 2*Math.PI*34 }}
                          animate={{ strokeDashoffset: 2*Math.PI*34 * (1 - progress/100) }}
                          transition={{ duration: 0.3 }} />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-brand-blue">{progress}%</span>
                    </div>
                    <p className="text-brand-blue font-semibold text-sm">Subiendo tu archivo...</p>
                    <p className="text-slate-400 text-xs">Archivos pesados pueden tardar un momento en completarse</p>
                  </motion.div>
                )}

                {/* Success */}
                {uploaded && !uploading && (
                  <motion.div key="done" initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }}
                    transition={{ type:'spring', stiffness:300, damping:20 }} className="space-y-3">
                    <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                      transition={{ delay:0.1, type:'spring', stiffness:400, damping:15 }}>
                      <CheckCircle size={56} weight="fill" className="text-green-500 mx-auto" />
                    </motion.div>
                    <p className="font-bold text-green-700 text-sm">{uploaded}</p>
                    <p className="text-xs text-green-500">{(fileSize/1024/1024).toFixed(2)} MB · Listo ✓</p>
                  </motion.div>
                )}

                {/* Idle */}
                {!uploading && !uploaded && (
                  <motion.div key="idle" initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-4">
                    <motion.div
                      animate={dragging ? { scale:1.1, y:-4 } : { scale:1, y:0 }}
                      transition={{ type:'spring', stiffness:300, damping:20 }}
                    >
                      <CloudArrowUp size={64} weight="light" className={`mx-auto transition-colors duration-300 ${dragging ? 'text-brand-blue' : 'text-brand-blue/50'}`} />
                    </motion.div>
                    <div>
                      <p className="font-bold text-brand-ink text-lg">Arrastra aquí</p>
                      <p className="text-brand-blue/70 font-medium">tu diseño</p>
                    </div>
                    <p className="text-slate-400 text-sm">o</p>
                    <motion.button
                      type="button"
                      whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                      onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                      className="flex items-center gap-2 gradient-brand text-white font-semibold px-6 py-3 rounded-xl shadow-blue-glow hover:opacity-90 transition-opacity"
                    >
                      <File size={16} weight="bold" /> Seleccionar archivo
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="mt-4 flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 rounded-xl px-4 py-3 text-sm">
            <WarningCircle size={16} weight="bold" className="flex-shrink-0" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Format pills */}
      <div className="mt-6 text-center space-y-2">
        <p className="text-xs text-slate-400 font-medium">Formatos permitidos:</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {['PDF', 'PNG'].map(f => (
            <span key={f} className="text-xs bg-white border border-slate-200 text-slate-500 font-semibold px-3 py-1 rounded-full">{f}</span>
          ))}
        </div>
      </div>

      {/* Security note */}
      <div className="mt-6 flex items-start gap-3 bg-brand-blue-pale/50 rounded-2xl px-4 py-3">
        <ShieldCheck size={18} className="text-brand-blue flex-shrink-0 mt-0.5" weight="fill" />
        <div className="text-xs text-brand-slate leading-relaxed">
          <p className="font-semibold text-brand-ink">Tus archivos están seguros con nosotros.</p>
          <p className="text-slate-500 mt-0.5">No se realizarán modificaciones sin tu autorización.</p>
        </div>
      </div>
    </div>
  );
}
