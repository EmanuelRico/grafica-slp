import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, WarningCircle, X } from '@phosphor-icons/react';

type ToastType = 'success' | 'error';
interface Toast { id: number; type: ToastType; message: string; }
interface ToastCtx { success: (msg: string) => void; error: (msg: string) => void; }

const Ctx = createContext<ToastCtx>({ success: () => {}, error: () => {} });

let _id = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((type: ToastType, message: string) => {
    const id = ++_id;
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const success = useCallback((msg: string) => add('success', msg), [add]);
  const error   = useCallback((msg: string) => add('error', msg), [add]);
  const dismiss = (id: number) => setToasts(t => t.filter(x => x.id !== id));

  return (
    <Ctx.Provider value={{ success, error }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-5 right-5 z-[999] flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-soft-xl border ${
                t.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {t.type === 'success'
                ? <CheckCircle size={18} weight="fill" className="text-green-500 flex-shrink-0 mt-0.5" />
                : <WarningCircle size={18} weight="fill" className="text-red-500 flex-shrink-0 mt-0.5" />}
              <p className="text-sm font-medium flex-1">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
