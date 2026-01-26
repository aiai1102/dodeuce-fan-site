import { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Index from './pages/Index';
import MaresList from './pages/MaresList';
import AdminLogin from './pages/AdminLogin';
import AdminImport from './pages/AdminImport';
import AdminMares from './pages/AdminMares';
import AdminNews from './pages/AdminNews';
import NotFound from './pages/NotFound';
import { initGA, trackPageView } from '@/lib/analytics';

const queryClient = new QueryClient();

// Google Analyticsのページビュー追跡コンポーネント
const GATracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
};

const App = () => {
  useEffect(() => {
    // Google Analytics初期化
    initGA();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <GATracker />
          <div className="flex min-h-screen flex-col overflow-x-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/mares/:year" element={<MaresList />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/import" element={<AdminImport />} />
                <Route path="/admin/mares" element={<AdminMares />} />
                <Route path="/admin/news" element={<AdminNews />} />
                <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;