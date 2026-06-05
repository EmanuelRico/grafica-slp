import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { FilePlus, MagnifyingGlass, Question, ArrowRight, InstagramLogo, FacebookLogo, WhatsappLogo } from '@phosphor-icons/react';
import { Sparkle, SparkleSmall, Squiggle, DotCluster, GLettermark, WavyLine } from '../components/brand/Decorations';

const ease = [0.32, 0.72, 0, 1] as const;

const stagger = {
  animate: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 28, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease } },
};

function ActionCard({ icon, label, sub, color, onClick, delay }: {
  icon: React.ReactNode; label: string; sub: string;
  color: 'blue' | 'yellow'; onClick: () => void; delay: number;
}) {
  return (
    <motion.button
      variants={fadeUp}
      transition={{ delay }}
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="group relative w-full text-left rounded-3xl border border-slate-100 bg-white p-6 shadow-soft-xl hover:shadow-soft-2xl transition-shadow duration-500 overflow-hidden"
    >
      {/* Subtle gradient hover fill */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl ${
        color === 'blue' ? 'gradient-brand' : 'gradient-yellow'
      }`} />

      {/* Icon blob */}
      <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${
        color === 'blue'
          ? 'bg-brand-blue-pale'
          : 'bg-brand-yellow-pale'
      }`}>
        {/* Decorative sparkles around icon */}
        <SparkleSmall className={`absolute -top-1.5 -right-1.5 ${color === 'blue' ? 'text-brand-blue' : 'text-brand-yellow'}`} />
        <div className={color === 'blue' ? 'text-brand-blue' : 'text-brand-ink'}>
          {icon}
        </div>
      </div>

      <h3 className="text-lg font-bold text-brand-ink">{label}</h3>
      <p className="text-sm text-slate-400 mt-1 leading-relaxed">{sub}</p>

      {/* Arrow CTA */}
      <div className={`mt-5 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
        color === 'blue' ? 'gradient-brand text-white' : 'gradient-yellow text-brand-ink'
      }`}>
        <ArrowRight size={16} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </motion.button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  useEffect(() => { document.title = 'GRAFICA SLP'; }, []);
  // Magnetic mouse effect on the headline area (Emil Kowalski pattern)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [3, -3]), { stiffness: 100, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-3, 3]), { stiffness: 100, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  return (
    <div className="min-h-[100dvh] flex noise" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>

      {/* ── Blue Sidebar ─────────────────────────────────── */}
      <motion.aside
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease }}
        className="hidden lg:flex flex-col w-56 xl:w-64 gradient-brand-vivid relative overflow-visible flex-shrink-0 z-10"
        style={{ rotateX, rotateY, transformPerspective: 1200 }}
      >
        {/* Curved right edge */}
        <svg className="absolute right-0 top-0 h-full translate-x-full pointer-events-none z-10"
          style={{ width: '32px', minHeight: '100%' }}
          viewBox="0 0 32 900" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="homeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5EC1F4"/>
              <stop offset="50%" stopColor="#01AEF0"/>
              <stop offset="100%" stopColor="#0073A8"/>
            </linearGradient>
          </defs>
          <path d="M0 0 Q28 100 8 200 Q-8 300 20 450 Q40 580 6 700 Q-10 800 16 900 L0 900 Z"
            fill="url(#homeGrad)" />
        </svg>
        {/* Organic inner blob */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-none">
          <svg viewBox="0 0 256 900" className="absolute right-0 top-0 h-full w-full opacity-[0.07]" preserveAspectRatio="xMidYMid slice">
            <path d="M80 0H256V900H80C80 900 130 820 110 700C90 580 140 520 120 400C100 280 150 200 120 100C100 40 80 0 80 0Z" fill="white"/>
          </svg>
          {/* Animated orbs */}
          <div className="absolute top-1/4 left-1/2 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-1/3 left-1/4 w-32 h-32 bg-brand-yellow/20 rounded-full blur-2xl animate-float-slow" />
        </div>

        {/* Logo */}
        <div className="relative z-10 px-7 pt-9">
          <p className="text-white font-black text-xl tracking-tight leading-none">GRAFICA</p>
          <p className="text-white/50 font-medium text-xs tracking-[0.3em] mt-0.5">S  L  P</p>
          <div className="w-8 h-0.5 bg-brand-yellow mt-2 rounded-full" />
        </div>

        {/* Tagline — the hero of the sidebar */}
        <div className="relative z-10 px-7 mt-10 flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease }}
          >
            <p className="font-display italic font-black text-[2.6rem] xl:text-[3rem] text-white leading-[0.9] tracking-tight">
              make<br/>your
            </p>
            <p className="font-display italic font-black text-[2.6rem] xl:text-[3rem] text-brand-yellow leading-[0.9] tracking-tight">
              vibe
            </p>
            <motion.div
              animate={{ rotate: [0, 15, -5, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkle className="text-brand-yellow mt-3" size={20} />
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-white/60 text-sm mt-6 leading-relaxed font-medium"
          >
            Imprimimos tus ideas<br/>
            con <span className="text-white font-semibold">calidad</span> y <span className="text-white font-semibold">color.</span>
          </motion.p>
        </div>

        {/* Cap illustration */}
        <motion.div
          className="relative z-10 px-7 pb-2"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img src="/sidebar-illustration.png" alt="GRAFICA SLP" className="w-52 h-auto opacity-40 -ml-8" />
        </motion.div>

        {/* Social links */}
        <div className="relative z-10 px-7 pb-8 flex items-center gap-4">
          <a href="https://www.instagram.com/grafica.slp" target="_blank" rel="noreferrer" className="w-9 h-9 bg-white/15 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors">
            <InstagramLogo size={20} weight="fill" className="text-white" />
          </a>
          <a href="https://www.facebook.com/GraficaSLP" target="_blank" rel="noreferrer" className="w-9 h-9 bg-white/15 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors">
            <FacebookLogo size={20} weight="fill" className="text-white" />
          </a>
          <a href="https://wa.me/524445807577" target="_blank" rel="noreferrer" className="w-9 h-9 bg-white/15 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors">
            <WhatsappLogo size={20} weight="fill" className="text-white" />
          </a>
        </div>

        {/* Floating decorations */}
        <Squiggle className="absolute bottom-36 right-1 text-white/15" />
        <DotCluster className="absolute top-2/5 right-5 text-brand-yellow/50" />
      </motion.aside>

      {/* ── Main content ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-[100dvh]">

        {/* Top bar */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="flex items-center justify-between px-6 lg:px-12 pt-4 pb-1"
        >
          {/* Mobile logo */}
          <div className="lg:hidden">
            <p className="font-black text-brand-ink text-lg tracking-tight">GRAFICA SLP</p>
            <div className="w-6 h-0.5 bg-brand-yellow mt-0.5 rounded-full" />
          </div>
          <div className="hidden lg:block" />

          {/* Help pill */}
          <motion.a
            href="https://wa.me/524445807577"
            target="_blank"
            rel="noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-full px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <Question size={16} className="text-brand-blue" weight="bold" />
            <div className="text-left">
              <p className="text-xs font-bold text-brand-ink leading-none">¿Dudas?</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Escríbenos por WhatsApp</p>
            </div>
          </motion.a>
        </motion.header>

        {/* Hero */}
        <main className="flex-1 flex items-center px-6 lg:px-12 py-4 lg:py-2">
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="w-full max-w-2xl mx-auto space-y-5 xl:space-y-4"
          >
            {/* Eyebrow */}
            <motion.div variants={fadeUp}>
              <span className="eyebrow bg-brand-blue-pale text-brand-blue">
                <Sparkle size={10} className="text-brand-yellow" />
                Plataforma de impresión digital
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div variants={fadeUp}>
              <h1 className="text-4xl lg:text-5xl xl:text-[3.5rem] font-black text-brand-ink leading-[1.05] tracking-tight">
                ¿Qué deseas<br/>
                hacer{' '}
                <span className="relative inline-block">
                  <span className="text-brand-blue">hoy</span>
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-1 bg-brand-yellow rounded-full origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.5, ease }}
                  />
                </span>
                <span className="text-brand-blue">?</span>
              </h1>
              <p className="text-slate-400 mt-2 text-base leading-relaxed max-w-sm">
                Estamos aquí para hacer realidad tus ideas.
                Elige una opción para comenzar.
              </p>
            </motion.div>

            {/* Action cards */}
            <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ActionCard
                icon={<FilePlus size={28} weight="light" />}
                label="Nuevo pedido"
                sub="Sube tu archivo, cuéntanos los detalles y recibe tu pedido."
                color="blue"
                onClick={() => navigate('/pedido/nuevo')}
                delay={0}
              />
              <ActionCard
                icon={<MagnifyingGlass size={28} weight="light" />}
                label="Consultar pedido"
                sub="Consulta el estado de tu pedido de forma rápida."
                color="yellow"
                onClick={() => navigate('/rastrear')}
                delay={0.08}
              />
            </motion.div>

            {/* How it works — 3 steps */}
            <motion.div variants={fadeUp} className="pt-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">¿Cómo funciona?</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { n: '01', label: 'Sube tu archivo', icon: '📁' },
                  { n: '02', label: 'Elige impresión', icon: '🖨️' },
                  { n: '03', label: 'Recibe tu pedido', icon: '✅' },
                ].map((step, i) => (
                  <motion.div
                    key={step.n}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + i * 0.1, duration: 0.4, ease }}
                    className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm"
                  >
                    <span className="text-2xl">{step.icon}</span>
                    <p className="text-[10px] text-brand-blue font-bold mt-2">{step.n}</p>
                    <p className="text-xs font-semibold text-brand-ink mt-0.5 leading-tight">{step.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Print types + trust */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-between gap-3 pb-2">
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'DTF UV', price: '$520/m', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                  { label: 'DTF Textil', price: '$220/m', color: 'bg-sky-50 text-sky-600 border-sky-100' },
                  { label: 'Sublimación', price: '$80/m', color: 'bg-orange-50 text-orange-600 border-orange-100' },
                ].map(t => (
                  <span key={t.label} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${t.color}`}>
                    {t.label} <span className="opacity-60 font-normal">{t.price}</span>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="text-green-500">🔒</span> Sin registro requerido
              </div>
            </motion.div>
          </motion.div>
        </main>

        {/* Floating decorations — right side */}
        <div className="fixed right-8 top-1/2 -translate-y-1/2 pointer-events-none hidden xl:flex flex-col gap-8 items-center opacity-60">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
            <Sparkle size={28} className="text-brand-blue/30" />
          </motion.div>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            <GLettermark className="text-brand-yellow/40 w-12 h-12" />
          </motion.div>
          <WavyLine className="text-brand-blue/20 rotate-90 w-16" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}>
            <SparkleSmall className="text-brand-yellow/50" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
