import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, PaperPlaneTilt } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import OrderLayout from '../../components/ui/OrderLayout';
import { useToast } from '../../components/ui/Toast';
import Step1Upload from './steps/Step1Upload';
import Step2Customer from './steps/Step2Customer';
import Step3Details from './steps/Step3Details';
import Step4Review from './steps/Step4Review';
import Step5Success from './steps/Step5Success';

const ease = [0.32, 0.72, 0, 1] as const;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0, filter: 'blur(4px)' }),
  center: { x: 0, opacity: 1, filter: 'blur(0px)' },
  exit:  (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0, filter: 'blur(4px)' }),
};

export default function NewOrder() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [dir, setDir]   = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ orderNumber: string; estimatedPrice: number } | null>(null);

  const [fileData, setFileData]         = useState<any>(null);
  const [customerData, setCustomerData] = useState({ customerName: '', customerPhone: '', wantsInvoice: false, invoiceName: '', invoiceCFDI: '' });
  const [detailsData, setDetailsData]   = useState({ printTypeSlug: '', lengthCm: 0, repetitions: 1, comments: '' });

  const goTo = (n: number) => { setDir(n > step ? 1 : -1); setStep(n); };

  const handleFileComplete     = (data: any) => { setFileData(data);     goTo(2); };
  const handleCustomerComplete = (data: any) => { setCustomerData(data); goTo(3); };
  const handleDetailsComplete  = (data: any) => { setDetailsData(data);  goTo(4); };

  const handleAcksComplete = async (acks: any) => {
    setSubmitting(true);
    try {
      const res = await api.createOrder({ ...fileData, ...customerData, ...detailsData, ...acks });
      setResult(res);
      setDir(1); setStep(5);
    } catch (e: any) {
      toast.error(e.message || 'Error al enviar el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = step < 5 ? (
    <div className="max-w-2xl flex items-center justify-between gap-4">
      <motion.button
        whileHover={{ x: -2 }} whileTap={{ scale: 0.97 }}
        onClick={() => step > 1 ? goTo(step - 1) : navigate('/')}
        className="flex items-center gap-2 text-slate-500 hover:text-brand-ink font-medium text-sm transition-colors"
      >
        <ArrowLeft size={16} weight="bold" /> Atrás
      </motion.button>

      <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
        🔒 Tus archivos están seguros · Sin modificaciones
      </div>

      {step >= 2 && (
        <motion.button
          form="step-form" type="submit" disabled={submitting}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 gradient-brand text-white font-bold px-6 py-3 rounded-xl shadow-blue-glow hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {submitting ? 'Enviando...' : step === 4 ? (
            <><PaperPlaneTilt size={16} weight="bold" /> Enviar pedido</>
          ) : (
            <>Continuar <ArrowRight size={16} weight="bold" /></>
          )}
        </motion.button>
      )}
    </div>
  ) : null;

  return (
    <OrderLayout currentStep={step} footer={footer}>
      <AnimatePresence custom={dir} mode="wait">
        <motion.div
          key={step} custom={dir} variants={slideVariants}
          initial="enter" animate="center" exit="exit"
          transition={{ duration: 0.3, ease }}
        >
          {step === 1 && <Step1Upload onComplete={handleFileComplete} />}
          {step === 2 && <Step2Customer initial={customerData} onComplete={handleCustomerComplete} />}
          {step === 3 && <Step3Details initial={detailsData} onComplete={handleDetailsComplete} />}
          {step === 4 && (
            <Step4Review
              data={{ file: fileData, customer: customerData, details: detailsData }}
              onComplete={handleAcksComplete}
            />
          )}
          {step === 5 && result && <Step5Success orderNumber={result.orderNumber} estimatedPrice={result.estimatedPrice} />}
        </motion.div>
      </AnimatePresence>
    </OrderLayout>
  );
}
