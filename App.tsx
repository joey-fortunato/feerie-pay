
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './pages/Dashboard';
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
import { ViewState } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Public View: Checkout Preview (accessible without login)
  if (currentView === 'checkout_preview') {
    return (
      <>
        <div className="fixed top-4 left-4 z-50">
           <button 
             onClick={() => setCurrentView('dashboard')}
             className="bg-white/80 backdrop-blur text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-white transition-colors flex items-center gap-2"
           >
             ← Voltar ao Dashboard
           </button>
        </div>
        <Checkout />
      </>
    );
  }

  // Authentication Check
  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'reports':
        return <Reports />;
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
     switch(currentView) {
       case 'dashboard': return 'Visão Geral';
       case 'reports': return 'Relatórios & Analytics';
       case 'transactions': return 'Transações';
       case 'products': return 'Meus Produtos';
       case 'payment_links': return 'Links de Pagamento';
       case 'clients': return 'Base de Clientes';
       case 'coupons': return 'Cupons de Desconto';
       case 'team': return 'Gestão de Equipe';
       case 'profile': return 'Meu Perfil';
       default: return '';
     }
  }

  return (
    <div className="h-screen w-full bg-bg-main flex overflow-hidden">
      {/* Sidebar sits in the flex flow on desktop, fixed drawer on mobile */}
      <Sidebar
        currentView={currentView}
        onChangeView={setCurrentView}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />
      
      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        <TopBar 
          onMenuClick={() => setMobileSidebarOpen(true)} 
          onProfileClick={() => setCurrentView('profile')}
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
