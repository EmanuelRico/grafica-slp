import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadingHooks } from '../../lib/api';

interface LoadingCtx { start: () => void; done: () => void; }
const Ctx = createContext<LoadingCtx>({ start: () => { }, done: () => { } });
export const useLoading = () => useContext(Ctx);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [count, setCount] = useState(0);
    const start = useCallback(() => setCount(c => c + 1), []);
    const done = useCallback(() => setCount(c => Math.max(0, c - 1)), []);

    useEffect(() => { loadingHooks.start = start; loadingHooks.done = done; }, [start, done]);

    return (
        <Ctx.Provider value={{ start, done }}>
            <AnimatePresence>
                {count > 0 && (
                    <motion.div
                        key="bar"
                        className="fixed top-0 left-0 right-0 z-[9999] h-[3px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { delay: 0.2, duration: 0.3 } }}
                    >
                        <motion.div
                            className="h-full gradient-brand rounded-r-full"
                            initial={{ transform: 'translateX(-100%)' }}
                            animate={{ transform: 'translateX(-5%)' }}
                            exit={{ transform: 'translateX(0%)', transition: { duration: 0.2 } }}
                            transition={{ duration: 8, ease: [0.32, 0.72, 0, 1] }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            {children}
        </Ctx.Provider>
    );
}