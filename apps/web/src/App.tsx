import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import NewOrder from './pages/order/NewOrder';
import Track from './pages/Track';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrderDetail from './pages/admin/OrderDetail';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './components/ui/Toast';
import { LoadingProvider } from './components/ui/LoadingBar';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/admin/login" replace />;
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
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/pedidos/:id" element={<ProtectedRoute><AdminOrderDetail /></ProtectedRoute>} />
        {/* Catch-all — redirect broken links to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
    </ToastProvider>
    </LoadingProvider>
    </AuthProvider>
  );
}
