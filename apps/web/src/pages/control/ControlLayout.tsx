import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { House, CurrencyDollar, Buildings, Bank, UsersThree, Gear, SignOut, List, X } from '@phosphor-icons/react';
import { useAuth } from '../../lib/auth';
import { Sparkle, DotCluster } from '../../components/brand/Decorations';

const NAV_ITEMS = [
  { to: '/control', label: 'Inicio', icon: House, end: true },
  { to: '/control/pagos', label: 'Pagos', icon: CurrencyDollar },
  { to: '/control/empresas', label: 'Empresas', icon: Buildings },
  { to: '/control/cuentas', label: 'Cuentas Bancarias', icon: Bank },
  { to: '/control/proveedores', label: 'Proveedores', icon: UsersThree },
  { to: '/control/configuracion', label: 'Configuración', icon: Gear },
];

export default function ControlLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const roleLabel = (role: string) => {
    if (role === 'control_admin') return 'Administradora';
    if (role === 'control_operator') return 'Operador';
    return 'Consulta';
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — fixed on all screens */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-[100dvh] w-[220px] sm:w-[240px] lg:w-[260px] flex flex-col
          gradient-brand-vivid overflow-visible
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Curved right edge SVG */}
        <svg className="absolute right-0 top-0 h-full translate-x-full pointer-events-none z-10"
          style={{ width: '32px', minHeight: '100%' }}
          viewBox="0 0 32 900" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="controlGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5EC1F4"/>
              <stop offset="50%" stopColor="#01AEF0"/>
              <stop offset="100%" stopColor="#0073A8"/>
            </linearGradient>
          </defs>
          <path d="M0 0 Q28 100 8 200 Q-8 300 20 450 Q40 580 6 700 Q-10 800 16 900 L0 900 Z"
            fill="url(#controlGrad)" />
        </svg>

        {/* Organic inner blob */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg viewBox="0 0 256 900" className="absolute right-0 top-0 h-full w-full opacity-[0.07]" preserveAspectRatio="xMidYMid slice">
            <path d="M80 0H256V900H80C80 900 130 820 110 700C90 580 140 520 120 400C100 280 150 200 120 100C100 40 80 0 80 0Z" fill="white"/>
          </svg>
          <div className="absolute top-1/4 left-1/2 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-1/3 left-1/4 w-32 h-32 bg-brand-yellow/20 rounded-full blur-2xl animate-float-slow" />
        </div>

        {/* Logo */}
        <div className="relative z-10 px-5 lg:px-7 pt-6 lg:pt-7 pb-2">
          <p className="text-white font-black text-lg lg:text-xl tracking-tight leading-none">GRAFICA</p>
          <p className="text-white/50 font-medium text-[10px] lg:text-xs tracking-[0.3em] mt-0.5">S  L  P</p>
          <div className="w-8 h-0.5 bg-brand-yellow mt-2 rounded-full" />
          {/* Mobile close */}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute top-6 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex-1 px-3 lg:px-4 py-3 space-y-0.5 lg:space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl text-xs lg:text-sm font-medium transition-all duration-150 ease-out
                ${isActive
                  ? 'bg-white text-brand-blue shadow-md font-semibold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white active:scale-[0.97]'
                }`
              }
            >
              <Icon size={18} weight="duotone" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: tagline + user */}
        <div className="relative z-10 px-3 lg:px-5 pb-4">
          {/* Tagline */}
          <div className="mb-3 px-2">
            <p className="font-display italic font-black text-xl lg:text-2xl text-white leading-[0.9] tracking-tight">
              make<br/>your
            </p>
            <p className="font-display italic font-black text-xl lg:text-2xl text-brand-yellow leading-[0.9] tracking-tight">
              vibe
            </p>
            <motion.div
              animate={{ rotate: [0, 15, -5, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
              className="mt-1"
            >
              <Sparkle className="text-brand-yellow" size={14} />
            </motion.div>
          </div>

          {/* User card */}
          <div className="flex items-center gap-2 lg:gap-3 p-2.5 lg:p-3 rounded-xl lg:rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] lg:text-xs font-bold">
              {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm font-semibold text-white truncate">{user?.name || 'Usuario'}</p>
              <p className="text-[10px] lg:text-xs text-white/60">{roleLabel(user?.role)}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors active:scale-[0.95]" title="Cerrar sesión">
              <SignOut size={14} />
            </button>
          </div>
        </div>

        {/* Floating decorations */}
        <DotCluster className="absolute top-[40%] right-5 text-brand-yellow/50" />
      </aside>

      {/* Main content — offset on desktop for sidebar */}
      <main className="h-[100dvh] overflow-hidden flex flex-col bg-[#f7f9fc] lg:pl-[260px]">
        {/* Mobile header */}
        <header className="lg:hidden bg-white/80 backdrop-blur-lg border-b border-slate-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors active:scale-[0.97]">
            <List size={20} className="text-slate-700" />
          </button>
          <div className="flex-1">
            <p className="font-bold text-sm text-slate-800">Control de Gastos</p>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 pt-4 md:pt-6 lg:pt-8 px-4 md:px-6 lg:px-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </>
  );
}
