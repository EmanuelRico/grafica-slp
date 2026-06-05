import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Printer, Lock } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fadeUp } from '../../components/animations/variants';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { accessToken, user } = await api.login(email, password);
      login(accessToken, user);
      navigate('/admin');
    } catch (e: any) {
      setError(e.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-brand flex items-center justify-center p-6">
      <motion.div {...fadeUp} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-white rounded-2xl shadow-xl items-center justify-center mb-4">
            <Printer className="w-8 h-8 text-brand-blue" />
          </div>
          <h1 className="text-2xl font-black text-white">GRAFICA SLP</h1>
          <p className="text-white/70 text-sm mt-1">Panel Interno</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-slate-400" />
            <h2 className="font-bold text-slate-700">Acceso administrativo</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1.5">Correo</label>
              <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-colors"
                placeholder="admin@graficaslp.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1.5">Contraseña</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-colors"
                placeholder="••••••••" />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 gradient-brand text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
              {loading ? 'Accediendo...' : 'Entrar'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
