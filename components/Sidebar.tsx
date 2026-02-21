
import React from 'react';
import { LayoutDashboard, ShoppingCart, CreditCard, Settings, LogOut, Package, Zap, Link as LinkIcon, Users, TicketPercent, PieChart, Shield } from 'lucide-react';
import { ViewState } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, mobileOpen, setMobileOpen }) => {
  const { logout, canViewOrders, canViewCustomers, canViewProducts, canManageTeam } = useAuth();
  const allNavItems = [
    { id: 'dashboard' as ViewState, label: 'Dashboard', icon: LayoutDashboard, show: true },
    { id: 'reports' as ViewState, label: 'Relatórios', icon: PieChart, show: true },
    { id: 'transactions' as ViewState, label: 'Transações', icon: CreditCard, show: canViewOrders },
    { id: 'products' as ViewState, label: 'Produtos', icon: Package, show: canViewProducts },
    { id: 'payment_links' as ViewState, label: 'Links de Pagamento', icon: LinkIcon, show: true },
    { id: 'clients' as ViewState, label: 'Clientes', icon: Users, show: canViewCustomers },
    { id: 'coupons' as ViewState, label: 'Cupons', icon: TicketPercent, show: true },
    { id: 'team' as ViewState, label: 'Equipe', icon: Shield, show: canManageTeam },
  ];
  const navItems = allNavItems.filter((item) => item.show);

  const navClass = (isActive: boolean) =>
    `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer font-medium ${
      isActive
        ? 'bg-brand-primary text-white shadow-md shadow-indigo-200'
        : 'text-dark-text hover:bg-gray-50 text-gray-600'
    }`;

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-bg-surface border-r border-gray-100 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col h-full ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'
        }`}
      >
        {/* Header / Logo (Fixed Top) */}
        <div className="p-6 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-dark-text tracking-tight">Feerie Pay</span>
          </div>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 custom-scrollbar hover:overflow-y-auto">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-4 mt-2">
            Menu Principal
          </div>
          {navItems.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onChangeView(item.id);
                setMobileOpen(false);
              }}
              className={navClass(currentView === item.id)}
            >
              <item.icon size={20} className={currentView === item.id ? 'text-white' : 'text-gray-400'} />
              <span>{item.label}</span>
            </div>
          ))}

          <div className="pt-6 pb-2">
             <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-4">
                Ferramentas
             </div>
             <div className="space-y-1.5">
               <div
                onClick={() => {
                  onChangeView('checkout_preview');
                  setMobileOpen(false);
                }}
                className={navClass(currentView === 'checkout_preview')}
              >
                <ShoppingCart size={20} className={currentView === 'checkout_preview' ? 'text-white' : 'text-gray-400'} />
                <span>Simular Checkout</span>
              </div>
              <div 
                onClick={() => {
                  onChangeView('profile');
                  setMobileOpen(false);
                }}
                className={navClass(currentView === 'profile')}
              >
                <Settings size={20} className={currentView === 'profile' ? 'text-white' : 'text-gray-400'} />
                <span>Configurações</span>
              </div>
             </div>
          </div>
        </div>

        {/* Footer / Logout (Fixed Bottom) */}
        <div className="p-4 flex-shrink-0 border-t border-gray-100 bg-bg-surface">
          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center space-x-3 px-4 py-3 w-full text-red-500 hover:bg-red-50 rounded-xl cursor-pointer transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>
    </>
  );
};
