import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Index from './pages/Index';
import MaresList from './pages/MaresList';
import AdminLogin from './pages/AdminLogin';
import AdminImport from './pages/AdminImport';
import AdminMares from './pages/AdminMares';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/mares/:year" element={<MaresList />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/import" element={<AdminImport />} />
              <Route path="/admin/mares" element={<AdminMares />} />
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

export default App;