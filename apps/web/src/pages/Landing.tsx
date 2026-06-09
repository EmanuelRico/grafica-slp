import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Printer, Lightning, ShieldCheck, Truck, CurrencyDollar,
  ArrowRight, WhatsappLogo, InstagramLogo, FacebookLogo, TiktokLogo,
  Upload, ChatCircleDots, Package, CheckCircle,
} from '@phosphor-icons/react';

import printerImg from '../assets/images/printer-colormake.webp';
import rollImg from '../assets/images/roll-colormake.png';
import tshirtImg from '../assets/images/tshirt-lion.png';
import capImg from '../assets/images/cap-graficap.png';
import productsImg from '../assets/images/products-vinyl-caps.png';
import mugImg from '../assets/images/mug-grafica.png';
import heroHeatpress from '../assets/images/hero-heatpress.png';

const ease = [0.32, 0.72, 0, 1] as const;

/* ─── Reveal on scroll ───────────────────────────────── */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay, ease }} className={className}>
      {children}
    </motion.div>
  );
}

/* ─── Slow page-snap hook ────────────────────────────── */
function useSlowSnap(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [currentSection, setCurrentSection] = useState(0);
  const isAnimating = useRef(false);
  const sectionCount = useRef(0);

  const scrollToSection = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container || isAnimating.current) return;
    const sections = container.querySelectorAll<HTMLElement>('[data-section]');
    sectionCount.current = sections.length;
    if (index < 0 || index >= sections.length) return;

    isAnimating.current = true;
    setCurrentSection(index);
    const target = sections[index].offsetTop;

    // Fast start, slow smooth glide — 1200ms
    const start = container.scrollTop;
    const distance = target - start;
    const duration = 1200;
    let startTime: number | null = null;

    function easeOutExpo(t: number) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function step(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      container!.scrollTop = start + distance * easedProgress;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        // Lock after animation complete + cooldown
        setTimeout(() => { isAnimating.current = false; }, 300);
      }
    }
    requestAnimationFrame(step);
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sections = container.querySelectorAll('[data-section]');
    sectionCount.current = sections.length;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isAnimating.current) return;
      const direction = e.deltaY > 0 ? 1 : -1;
      const next = currentSection + direction;
      if (next >= 0 && next < sectionCount.current) {
        scrollToSection(next);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating.current) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        scrollToSection(currentSection + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToSection(currentSection - 1);
      }
    };

    // Touch support
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const handleTouchEnd = (e: TouchEvent) => {
      if (isAnimating.current) return;
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 50) {
        scrollToSection(currentSection + (diff > 0 ? 1 : -1));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, currentSection, scrollToSection]);

  return { currentSection, scrollToSection };
}

/* ═══════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentSection } = useSlowSnap(containerRef);

  useEffect(() => { document.title = 'GRÁFICA SLP — Impresión, Insumos y Personalización'; }, []);

  return (
    <div ref={containerRef} className="h-[100dvh] overflow-y-hidden no-scrollbar">

      {/* ─── NAVBAR ───────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100/60">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 gradient-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">G</span>
            </div>
            <div>
              <p className="font-black text-brand-ink text-sm leading-none tracking-tight">GRÁFICA</p>
              <p className="text-[8px] text-brand-slate tracking-[0.2em] font-medium">SLP</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-7 text-[13px] font-semibold text-brand-slate">
            <span className="hover:text-brand-ink cursor-pointer transition-colors">Inicio</span>
            <span className="hover:text-brand-ink cursor-pointer transition-colors">Impresión</span>
            <span className="hover:text-brand-ink cursor-pointer transition-colors">Color Make</span>
            <span className="hover:text-brand-ink cursor-pointer transition-colors">GRAFICAP</span>
            <span className="hover:text-brand-ink cursor-pointer transition-colors">Contacto</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.open('https://wa.me/524445807577?text=Hola, quiero cotizar un proyecto', '_blank')}
            className="gradient-brand text-white font-bold text-xs px-4 py-2 rounded-full shadow-blue-glow flex items-center gap-1.5"
          >
            <WhatsappLogo size={14} weight="fill" /> Cotiza tu proyecto
          </motion.button>
        </div>
      </nav>

      {/* ═══ SECTION 1 — HERO with product collage ═══ */}
      <section data-section className="h-[100dvh] relative flex items-center overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-blue-50/40 pt-14">
        {/* Decorative bg dots */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #01AEF0 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
          <div className="max-w-lg">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-brand-ink leading-[0.9] tracking-tight"
            >
              Impresión,<br />
              <span className="text-brand-blue">insumos y</span><br />
              <span className="text-brand-yellow">personalización</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-lg text-brand-ink/60 mt-3 font-medium">
              en un solo lugar.
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="text-sm text-brand-slate mt-3 max-w-sm leading-relaxed">
              Soluciones de alta calidad para negocios, emprendedores y marcas que quieren destacar.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, ease }} className="flex gap-3 mt-8">
              <button onClick={() => window.open('https://wa.me/524445807577', '_blank')} className="flex items-center gap-2 gradient-brand text-white font-bold px-5 py-3 rounded-full text-sm shadow-blue-glow">
                <WhatsappLogo size={16} weight="fill" /> Solicitar cotización
              </button>
              <button onClick={() => navigate('/impresion')} className="flex items-center gap-2 bg-white border-2 border-slate-200 text-brand-ink font-bold px-5 py-3 rounded-full text-sm">
                <Upload size={16} weight="bold" /> Subir archivo
              </button>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="flex items-center gap-3 mt-6">
              <div className="flex -space-x-2">
                {[...'🎨🖨️✨'].map((e, i) => <div key={i} className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px]">{e}</div>)}
              </div>
              <p className="text-[11px] text-brand-slate"><strong className="text-brand-ink">+1,000 proyectos</strong> con calidad y compromiso</p>
            </motion.div>
          </div>
        </div>

        {/* ─── PRODUCT COLLAGE (transparent, floating) ─── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden pt-14">
          {/* Printer — large, right center */}
          <motion.img src={printerImg} alt="" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 1, ease }}
            className="absolute right-[2%] top-[18%] w-[48%] max-w-[580px] drop-shadow-2xl" />
          {/* Cap — top right */}
          <motion.img src={capImg} alt="" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8, ease }}
            style={{ animation: 'float 5s ease-in-out infinite' }}
            className="absolute right-[8%] top-[8%] w-[12%] max-w-[110px] drop-shadow-xl" />
          {/* Roll — bottom right */}
          <motion.img src={rollImg} alt="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            style={{ animation: 'float 4.5s ease-in-out infinite 0.5s' }}
            className="absolute right-[48%] bottom-[12%] w-[14%] max-w-[130px] drop-shadow-xl" />
          {/* Mug — bottom center-right */}
          <motion.img src={mugImg} alt="" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.8, ease }}
            style={{ animation: 'float 5.5s ease-in-out infinite 1s' }}
            className="absolute right-[5%] bottom-[8%] w-[13%] max-w-[120px] drop-shadow-lg" />
          {/* T-shirt — mid-right overlapping printer */}
          <motion.img src={tshirtImg} alt="" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9, duration: 0.8, ease }}
            style={{ animation: 'float 6s ease-in-out infinite 0.3s' }}
            className="absolute right-[30%] top-[10%] w-[11%] max-w-[100px] drop-shadow-xl" />
          {/* Decorative elements */}
          <div className="absolute right-[20%] top-[15%] text-brand-blue text-3xl font-light select-none animate-pulse-soft">+</div>
          <div className="absolute right-[55%] top-[22%] text-brand-yellow text-xl select-none">✦</div>
          <div className="absolute right-[10%] bottom-[30%] text-brand-blue text-2xl font-light select-none">+</div>
          <div className="absolute right-[42%] bottom-[6%] w-3 h-3 bg-brand-yellow rounded-full animate-pulse-soft" />
        </div>

        {/* Scroll hint */}
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <div className="w-9 h-9 bg-white rounded-full shadow-soft-xl flex items-center justify-center border border-slate-100">
            <span className="text-brand-blue text-sm">↓</span>
          </div>
        </motion.div>
      </section>

      {/* ═══ SECTION 2 — AREAS + SERVICES ═══ */}
      <section data-section className="h-[100dvh] relative flex items-center overflow-y-auto bg-white">
        <div className="max-w-7xl mx-auto px-6 w-full py-16">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-blue mb-2">Nuestras áreas</p>
            <h2 className="text-3xl sm:text-4xl font-black text-brand-ink leading-tight">Tres soluciones,<br />un mismo <span className="text-brand-blue">compromiso.</span></h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 mt-10">
            {[
              { title: 'IMPRESIÓN', desc: 'Tecnología y calidad para dar vida a tus ideas.', items: ['DTF UV', 'DTF Textil', 'Sublimación', 'Grabado Láser', 'Corte Láser', 'Impresión Láser', 'Corte de Vinil'], cta: 'Conoce más', href: '/impresion', img: tshirtImg },
              { title: 'DISTRIBUIDOR AUTORIZADO', subtitle: 'COLOR MAKE', desc: 'Únicos distribuidores autorizados en SLP.', items: ['Tintas', 'Papeles', 'Planchas', 'Accesorios y más'], cta: 'Ver productos', href: 'https://colormake.com', img: rollImg },
              { title: 'GRAFICAP', desc: 'Viniles textiles, adhesivos y gorras.', items: ['Viniles textiles', 'Viniles adhesivos', 'Gorras para personalización'], cta: 'Ir a la tienda', href: '#', img: productsImg },
            ].map((area, i) => (
              <Reveal key={area.title} delay={i * 0.12}>
                <div className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-soft-xl hover:shadow-soft-2xl transition-shadow h-full flex flex-col">
                  <div className="h-44 flex items-center justify-center p-4">
                    <img src={area.img} alt={area.title} className="max-h-40 w-auto object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="px-5 pb-5 flex-1 flex flex-col">
                    <h3 className="text-xs font-black text-brand-ink uppercase tracking-wide">{area.title}</h3>
                    {area.subtitle && <p className="text-xs font-bold text-brand-blue">{area.subtitle}</p>}
                    <p className="text-[11px] text-brand-slate mt-1.5 leading-relaxed">{area.desc}</p>
                    <ul className="mt-2 space-y-1 flex-1">
                      {area.items.map(item => (
                        <li key={item} className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-brand-blue rounded-full" /> {item}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => area.href.startsWith('/') ? navigate(area.href) : window.open(area.href, '_blank')}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-blue group-hover:gap-2 transition-all">
                      {area.cta} <ArrowRight size={12} weight="bold" />
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3 — SERVICES + WHY US ═══ */}
      <section data-section className="h-[100dvh] relative flex items-center overflow-y-auto bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 w-full py-16 space-y-16">
          {/* Services row */}
          <div className="text-center">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-blue mb-2">Nuestros servicios</p>
              <h2 className="text-2xl sm:text-3xl font-black text-brand-ink">Tecnología que se adapta a <span className="underline decoration-brand-yellow decoration-[3px] underline-offset-4">tus ideas.</span></h2>
            </Reveal>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mt-10">
              {['DTF UV', 'DTF Textil', 'Sublimación', 'Grabado Láser', 'Corte Láser', 'Cama Plana UV', 'Impresión Láser', 'Corte de Vinil'].map((svc, i) => (
                <Reveal key={svc} delay={i * 0.04} className="text-center">
                  <div className="w-12 h-12 mx-auto bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm"><Printer size={20} className="text-brand-blue" /></div>
                  <p className="text-[9px] font-bold text-brand-ink mt-2 leading-tight">{svc}</p>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Why us with image */}
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-blue mb-2">¿Por qué elegirnos?</p>
              <h2 className="text-2xl sm:text-3xl font-black text-brand-ink leading-tight">Calidad, experiencia y compromiso en <span className="text-brand-blue">cada proyecto.</span></h2>
              <div className="grid grid-cols-3 gap-3 mt-8">
                {[
                  { icon: Printer, label: 'Producción propia' },
                  { icon: ShieldCheck, label: 'Materiales premium' },
                  { icon: Lightning, label: 'Atención personalizada' },
                  { icon: Truck, label: 'Entregas rápidas' },
                  { icon: CurrencyDollar, label: 'Precios competitivos' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="text-center p-3">
                    <div className="w-10 h-10 mx-auto bg-brand-blue-pale rounded-xl flex items-center justify-center mb-1.5"><Icon size={18} className="text-brand-blue" weight="light" /></div>
                    <p className="text-[10px] font-bold text-brand-ink">{label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <img src={heroHeatpress} alt="Plancha de calor" className="w-full rounded-2xl shadow-soft-2xl" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 4 — COLOR MAKE + PROCESS + CTA + FOOTER ═══ */}
      <section data-section className="h-[100dvh] relative flex flex-col overflow-y-auto">
        {/* Color Make dark banner */}
        <div className="bg-brand-ink px-6 py-12 flex-shrink-0">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[auto_1fr_auto] gap-8 items-center">
            <img src={rollImg} alt="Color Make" className="w-28 drop-shadow-xl hidden lg:block" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-blue mb-1">Somos distribuidores autorizados</p>
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">COLOR MAKE EN SAN LUIS POTOSÍ</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-lg">Ofrecemos los mejores insumos para sublimación con la garantía y calidad que tu negocio necesita.</p>
              <div className="flex flex-wrap gap-5 mt-4">
                {['Productos 100% originales', 'Asesoría especializada', 'Soporte y garantía'].map(t => (
                  <div key={t} className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-brand-blue" /><span className="text-[10px] text-white/80 font-medium">{t}</span></div>
                ))}
              </div>
            </div>
            <img src={rollImg} alt="" className="w-24 opacity-60 hidden lg:block" />
          </div>
        </div>

        {/* Process + CTA */}
        <div className="bg-slate-50 px-6 py-12 flex-shrink-0">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-blue mb-6 text-center">Así trabajamos contigo</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: ChatCircleDots, n: '1', title: 'Solicita cotización', desc: 'Cuéntanos tu idea.' },
                { icon: Upload, n: '2', title: 'Envía tu archivo', desc: 'Sube tu diseño.' },
                { icon: Package, n: '3', title: 'Producimos', desc: 'Con la mejor calidad.' },
                { icon: CheckCircle, n: '4', title: 'Recibe tu pedido', desc: 'A tiempo en SLP y México.' },
              ].map(step => (
                <div key={step.n} className="flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="w-14 h-14 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm"><step.icon size={22} className="text-brand-blue" weight="light" /></div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 gradient-brand rounded-full text-white text-[9px] font-black flex items-center justify-center">{step.n}</span>
                  </div>
                  <h4 className="text-[11px] font-bold text-brand-ink mt-3">{step.title}</h4>
                  <p className="text-[10px] text-brand-slate mt-0.5">{step.desc}</p>
                </div>
              ))}
            </div>
            {/* CTA */}
            <div className="mt-10 gradient-brand rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-blue-glow">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">¿Listo para empezar tu proyecto?</h3>
                <p className="text-xs text-white/60 mt-1">Estamos aquí para ayudarte a hacerlo realidad.</p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <button onClick={() => navigate('/impresion')} className="flex items-center gap-1.5 bg-white text-brand-blue font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg"><Upload size={14} weight="bold" /> Subir archivo</button>
                <button onClick={() => window.open('https://wa.me/524445807577', '_blank')} className="flex items-center gap-1.5 bg-white/15 border border-white/30 text-white font-bold px-4 py-2.5 rounded-xl text-xs"><WhatsappLogo size={14} weight="fill" /> Cotizar</button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-brand-ink text-white px-6 py-10 flex-1">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 pb-6 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 gradient-brand rounded flex items-center justify-center"><span className="text-white font-black text-[9px]">G</span></div>
                  <p className="font-black text-white text-xs">GRÁFICA SLP</p>
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed">Impresión, insumos y personalización en un solo lugar.</p>
                <div className="flex gap-2 mt-3">
                  {[FacebookLogo, InstagramLogo, TiktokLogo, WhatsappLogo].map((Icon, idx) => (
                    <div key={idx} className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center"><Icon size={13} weight="fill" className="text-white/70" /></div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/30 mb-2">Impresión</p>
                <ul className="space-y-1.5">
                  {['DTF UV', 'DTF Textil', 'Sublimación', 'Grabado Láser', 'Corte Láser', 'Impresión Láser', 'Corte de Vinil', 'Cama Plana UV'].map(s => <li key={s} className="text-[10px] text-white/50">{s}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/30 mb-2">Color Make</p>
                <ul className="space-y-1.5">
                  {['Tintas', 'Papeles', 'Planchas', 'Accesorios', 'Equipos', 'y más'].map(s => <li key={s} className="text-[10px] text-white/50">{s}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/30 mb-2">GRAFICAP</p>
                <ul className="space-y-1.5">
                  {['Viniles textiles', 'Viniles adhesivos', 'Gorras', 'Accesorios'].map(s => <li key={s} className="text-[10px] text-white/50">{s}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/30 mb-2">Contacto</p>
                <ul className="space-y-1.5 text-[10px] text-white/50">
                  <li>San Luis Potosí, S.L.P.</li>
                  <li>444 123 4567</li>
                  <li>ventas@graficaslp.com</li>
                  <li className="pt-1.5 border-t border-white/10">L-V: 9-18h · S: 9-14h</li>
                </ul>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4">
              <p className="text-[9px] text-white/25">© 2024 GRÁFICA SLP</p>
              <p className="text-[9px] text-white/25">Aviso de privacidad · Términos</p>
            </div>
          </div>
        </footer>
      </section>

      {/* Page indicators */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${currentSection === i ? 'bg-brand-blue scale-125' : 'bg-slate-300'}`} />
        ))}
      </div>
    </div>
  );
}
