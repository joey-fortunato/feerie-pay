import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Transactions } from './pages/Transactions';
import { Products } from './pages/Products';
import { Checkout } from './pages/Checkout';
import { PaymentLinks } from './pages/PaymentLinks';
import { Clients } from './pages/Clients';
import { Coupons } from './pages/Coupons';
import { Reports } from './pages/Reports';
import { Team } from './pages/Team';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { PublicPaymentLink } from './pages/PublicPaymentLink';
import { ViewState } from './types';
import { useAuth } from './contexts/AuthContext';

const getViewFromPath = (pathname: string): ViewState => {
  switch (pathname) {
    case '/':
      return 'dashboard';
    case '/reports':
      return 'reports';
    case '/orders':
      return 'orders';
    case '/transactions':
      return 'transactions';
    case '/products':
      return 'products';
    case '/payment-links':
      return 'payment_links';
    case '/clients':
      return 'clients';
    case '/coupons':
      return 'coupons';
    case '/team':
      return 'team';
    case '/profile':
      return 'profile';
    case '/checkout-preview':
      return 'checkout_preview';
    default:
      // rota pública de link de pagamento (/p/:code)
      if (pathname.startsWith('/p/')) {
        return 'checkout_preview';
      }
      return 'dashboard';
  }
};

const getPathFromView = (view: ViewState): string => {
  switch (view) {
    case 'dashboard':
      return '/';
    case 'reports':
      return '/reports';
    case 'orders':
      return '/orders';
    case 'transactions':
      return '/transactions';
    case 'products':
      return '/products';
    case 'payment_links':
      return '/payment-links';
    case 'clients':
      return '/clients';
    case 'coupons':
      return '/coupons';
    case 'team':
      return '/team';
    case 'profile':
      return '/profile';
    case 'checkout_preview':
      return '/checkout-preview';
    default:
      return '/';
  }
};

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const currentView = getViewFromPath(location.pathname);

  const handleChangeView = (view: ViewState) => {
    const path = getPathFromView(view);
    if (path !== location.pathname) {
      navigate(path);
    }
  };

  // Public View: Checkout Preview / Public Payment Link (acessível sem login)
  if (currentView === 'checkout_preview') {
    if (location.pathname.startsWith('/p/')) {
      return <PublicPaymentLink />;
    }
    return (
      <>
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => handleChangeView('dashboard')}
            className="bg-white/80 backdrop-blur text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-white transition-colors flex items-center gap-2"
          >
            ← Voltar ao Dashboard
          </button>
        </div>
        <Checkout />
      </>
    );
  }

  // Loading: verificar sessão
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-bg-main">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/20" />
          <p className="text-sm text-gray-500">A carregar...</p>
        </div>
      </div>
    );
  }

  // Authentication Check
  if (!isAuthenticated) {
    return <Login onLogin={() => {}} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'reports':
        return <Reports />;
      case 'orders':
        return <Orders />;
      case 'transactions':
        return <Transactions />;
      case 'products':
        return <Products />;
      case 'payment_links':
        return <PaymentLinks />;
      case 'clients':
        return <Clients />;
      case 'coupons':
        return <Coupons />;
      case 'team':
        return <Team />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Visão Geral';
      case 'reports':
        return 'Relatórios & Analytics';
      case 'orders':
        return 'Pedidos';
      case 'transactions':
        return 'Transações';
      case 'products':
        return 'Meus Produtos';
      case 'payment_links':
        return 'Links de Pagamento';
      case 'clients':
        return 'Base de Clientes';
      case 'coupons':
        return 'Cupons de Desconto';
      case 'team':
        return 'Gestão de Equipe';
      case 'profile':
        return 'Meu Perfil';
      default:
        return '';
    }
  };

  return (
    <div className="h-screen w-full bg-bg-main flex overflow-hidden">
      {/* Sidebar sits in the flex flow on desktop, fixed drawer on mobile */}
      <Sidebar
        currentView={currentView}
        onChangeView={handleChangeView}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        <TopBar
          onMenuClick={() => setMobileSidebarOpen(true)}
          onProfileClick={() => handleChangeView('profile')}
          title={getTitle()}
        />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar scroll-smooth">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
