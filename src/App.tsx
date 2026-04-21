import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { QueryProvider } from '@/context/QueryProvider';
import { PreferencesProvider } from '@/context/PreferencesContext';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import MyCoupons from '@/pages/MyCoupons';
import Profile from '@/pages/Profile';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import About from '@/pages/About';
import Terms from '@/pages/Terms';
import Support from '@/pages/Support';
import Scanner from '@/pages/Scanner';
import PermissionBridge from '@/pages/PermissionBridge';
import Layout from '@/components/Layout';
import { MainAppSkeleton } from '@/components/Skeleton';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <MainAppSkeleton />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <QueryProvider>
      <PreferencesProvider>
        <AuthProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/terms" element={<Terms />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Home />} />
              <Route path="coupons" element={<MyCoupons />} />
              <Route path="profile" element={<Profile />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="about" element={<About />} />
              <Route path="settings" element={<Settings />} />
              <Route path="support" element={<Support />} />
              <Route path="scanner" element={<Scanner />} />
            </Route>
            <Route path="/permissions-bridge" element={<PermissionBridge />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </PreferencesProvider>
  </QueryProvider>
);
}

export default App;
