import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import NewOrder from './pages/order/NewOrder';
import Track from './pages/Track';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrderDetail from './pages/admin/OrderDetail';
import ControlLayout from './pages/control/ControlLayout';
import ControlDashboard from './pages/control/Dashboard';
import PaymentsList from './pages/control/PaymentsList';
import PaymentDetail from './pages/control/PaymentDetail';
import NewPayment from './pages/control/NewPayment';
import Companies from './pages/control/Companies';
import BankAccounts from './pages/control/BankAccounts';
import Providers from './pages/control/Providers';
import Configuration from './pages/control/Configuration';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './components/ui/Toast';
import { LoadingProvider } from './components/ui/LoadingBar';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

function ControlRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/admin/login" replace />;
  if (!user?.role?.startsWith('control_')) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/admin/login" replace />;
  if (user?.role?.startsWith('control_')) return <Navigate to="/control" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
    <LoadingProvider>
    <ToastProvider>
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pedido/nuevo" element={<NewOrder />} />
        <Route path="/rastrear" element={<Track />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/pedidos/:id" element={<AdminRoute><AdminOrderDetail /></AdminRoute>} />

        {/* Control de Gastos */}
        <Route path="/control" element={<ControlRoute><ControlLayout /></ControlRoute>}>
          <Route index element={<ControlDashboard />} />
          <Route path="pagos" element={<PaymentsList />} />
          <Route path="pagos/nuevo" element={<NewPayment />} />
          <Route path="pagos/:id" element={<PaymentDetail />} />
          <Route path="empresas" element={<Companies />} />
          <Route path="cuentas" element={<BankAccounts />} />
          <Route path="proveedores" element={<Providers />} />
          <Route path="configuracion" element={<Configuration />} />
        </Route>

        {/* Catch-all — redirect broken links to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
    </ToastProvider>
    </LoadingProvider>
    </AuthProvider>
  );
}
