import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Copy, Search } from 'lucide-react';

interface Props { orderNumber: string; estimatedPrice: number; }

export default function Step5Success({ orderNumber, estimatedPrice }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#01AEF0', '#5EC1F4', '#D8D350', '#FFF84E'] });
  }, []);

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-4">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
        <div className="w-24 h-24 gradient-brand rounded-full flex items-center justify-center mx-auto shadow-xl">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="text-2xl font-black text-slate-800">¡Pedido recibido!</h2>
        <p className="text-slate-500 mt-2">Tu pedido ha sido registrado correctamente.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-brand-blue/10 to-brand-blue-light/10 border border-brand-blue/20 rounded-2xl p-6">
        <p className="text-sm text-slate-500 mb-2">Número de pedido</p>
        <p className="text-4xl font-black tracking-wider text-brand-blue">{orderNumber}</p>
        <button onClick={copyOrderNumber}
          className="mt-3 flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-blue transition-colors mx-auto">
          <Copy className="w-4 h-4" /> Copiar número
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="bg-slate-50 rounded-xl p-4">
        <p className="text-sm text-slate-500">Precio estimado</p>
        <p className="text-2xl font-bold text-slate-800">${estimatedPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</p>
        <p className="text-xs text-slate-400 mt-1">El precio final puede variar. GRAFICA SLP te contactará.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="flex flex-col gap-3">
        <button onClick={() => navigate(`/rastrear?q=${orderNumber}`)}
          className="flex items-center justify-center gap-2 w-full py-3 gradient-brand text-white font-semibold rounded-xl">
          <Search className="w-4 h-4" /> Rastrear mi pedido
        </button>
        <button onClick={() => navigate('/')}
          className="w-full py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors">
          Volver al inicio
        </button>
      </motion.div>
    </motion.div>
  );
}
