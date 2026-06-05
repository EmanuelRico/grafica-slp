import { motion } from 'framer-motion';
import { Check, InstagramLogo, FacebookLogo, WhatsappLogo } from '@phosphor-icons/react';
import { Sparkle, Squiggle, DotCluster } from '../brand/Decorations';

const STEPS = [
  { n: 1, label: 'Subir archivo' },
  { n: 2, label: 'Datos del cliente' },
  { n: 3, label: 'Detalles del pedido' },
  { n: 4, label: 'Confirmación' },
  { n: 5, label: 'Pedido recibido' },
];

interface Props {
  currentStep: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function OrderLayout({ currentStep, children, footer }: Props) {
  return (
    <div className="min-h-[100dvh] flex bg-[#f7f9fc]">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-64 gradient-brand relative overflow-visible flex-shrink-0 z-10">
        {/* Curved right edge — SVG overlay that bleeds into main content */}
        <svg className="absolute right-0 top-0 h-full translate-x-full pointer-events-none z-10"
          style={{ width: '32px', minHeight: '100%' }}
          viewBox="0 0 32 900" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sidebarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#01AEF0"/>
              <stop offset="50%" stopColor="#0098D4"/>
              <stop offset="100%" stopColor="#0073A8"/>
            </linearGradient>
          </defs>
          <path d="M0 0 Q28 100 8 200 Q-8 300 20 450 Q40 580 6 700 Q-10 800 16 900 L0 900 Z"
            fill="url(#sidebarGrad)" />
        </svg>
        {/* Organic shape overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <svg viewBox="0 0 256 900" className="absolute right-0 top-0 h-full w-auto opacity-10" preserveAspectRatio="none">
            <path d="M80 0H256V900H80C80 900 130 820 110 700C90 580 140 520 120 400C100 280 150 200 120 100C100 40 80 0 80 0Z" fill="white"/>
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10 px-7 pt-8 pb-6">
          <p className="text-white font-black text-xl tracking-tight leading-none">GRAFICA</p>
          <p className="text-white/60 font-medium text-sm tracking-widest mt-0.5">S L P</p>
          <div className="w-8 h-0.5 bg-brand-yellow mt-2 rounded-full" />
        </div>

        {/* Step nav */}
        <nav className="relative z-10 px-7 flex-1 space-y-1">
          {STEPS.map((step) => {
            const done    = step.n < currentStep;
            const active  = step.n === currentStep;
            const pending = step.n > currentStep;
            return (
              <div key={step.n} className="flex items-center gap-3 py-2">
                <motion.div
                  animate={active ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all duration-300 ${
                    done    ? 'bg-white text-brand-blue' :
                    active  ? 'bg-brand-yellow text-brand-ink shadow-yellow-glow' :
                              'border-2 border-white/25 text-white/40'
                  }`}
                >
                  {done ? <Check size={13} weight="bold" /> : step.n}
                </motion.div>
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  active ? 'text-white font-semibold' : done ? 'text-white/80' : 'text-white/35'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </nav>

        {/* Brand tagline */}
        <div className="relative z-10 px-7 py-6">
          <p className="font-display italic font-black text-3xl text-white leading-none">
            make<br/>your<br/>
            <span className="text-brand-yellow not-italic">vibe</span>
          </p>
          <Sparkle className="text-brand-yellow mt-2" size={18} />
        </div>

        {/* Illustrations */}
        <div className="relative z-10 px-7 pb-4">
          <img src="/sidebar-illustration.png" alt="GRAFICA SLP" className="w-44 h-auto opacity-40 -ml-8" />
        </div>

        {/* Social */}
        <div className="relative z-10 px-7 pb-8 flex items-center gap-3">
          <a href="https://www.instagram.com/grafica.slp" target="_blank" rel="noreferrer" className="w-8 h-8 bg-white/15 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors">
            <InstagramLogo size={18} weight="fill" className="text-white" />
          </a>
          <a href="https://www.facebook.com/GraficaSLP" target="_blank" rel="noreferrer" className="w-8 h-8 bg-white/15 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors">
            <FacebookLogo size={18} weight="fill" className="text-white" />
          </a>
          <a href="https://wa.me/524445807577" target="_blank" rel="noreferrer" className="w-8 h-8 bg-white/15 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors">
            <WhatsappLogo size={18} weight="fill" className="text-white" />
          </a>
        </div>

        {/* Floating decorations */}
        <Squiggle   className="absolute bottom-32 right-2 text-white/20 rotate-12" />
        <DotCluster className="absolute top-1/3 right-4 text-brand-yellow/40" />
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-[100dvh]">
        {/* Mobile logo */}
        <div className="lg:hidden gradient-brand px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-black text-lg tracking-tight leading-none">GRAFICA SLP</p>
            <div className="w-6 h-0.5 bg-brand-yellow mt-1 rounded-full" />
          </div>
          <div className="flex gap-2">
            {STEPS.map(s => (
              <div key={s.n} className={`h-1.5 rounded-full transition-all ${
                s.n === currentStep ? 'w-6 bg-white' : s.n < currentStep ? 'w-3 bg-white/50' : 'w-3 bg-white/20'
              }`} />
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto flex items-start justify-center">
          <div className="w-full max-w-2xl">
            {children}
          </div>
        </main>

        {footer && (
          <footer className="bg-white border-t border-slate-100 px-5 py-4">
            <div className="max-w-2xl mx-auto">
              {footer}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
