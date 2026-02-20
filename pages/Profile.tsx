
import React, { useState } from 'react';
import { User, Lock, Bell, CreditCard, Camera, Mail, Phone, ShieldCheck, Smartphone, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'plan'>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Mock User Data
  const [userData, setUserData] = useState({
    name: 'João Manuel',
    email: 'joao.manuel@loja.ao',
    phone: '923 123 456',
    bio: 'Empreendedor digital focado em e-commerce e produtos educacionais.',
    language: 'pt-AO',
    notifications: {
      email: true,
      push: false,
      sales: true,
      marketing: false
    },
    twoFactor: true
  });

  const handleSave = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1200);
  };

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-5 py-4 text-sm font-medium border-b-2 transition-all w-full md:w-auto whitespace-nowrap ${
        activeTab === id
          ? 'border-brand-primary text-brand-primary bg-indigo-50/30'
          : 'border-transparent text-gray-500 hover:text-dark-text hover:bg-gray-50'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8 relative animate-fade-in">
      
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-24 right-6 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl z-50 animate-fade-in flex items-center gap-3">
          <CheckCircle size={20} />
          <span className="font-medium">Alterações salvas com sucesso!</span>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl p-8 shadow-soft border border-gray-50 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-brand-primary to-purple-600 opacity-10"></div>
        
        <div className="relative group">
          <div className="w-28 h-28 rounded-full bg-white p-1.5 shadow-lg z-10 relative">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-primary to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
              JM
            </div>
          </div>
          <button className="absolute bottom-1 right-1 p-2 bg-white text-gray-600 hover:text-brand-primary rounded-full shadow-md border border-gray-100 z-20 transition-transform hover:scale-110">
             <Camera size={16} />
          </button>
        </div>

        <div className="text-center md:text-left mt-2 relative z-10 flex-1">
           <h2 className="text-2xl font-bold text-dark-text">{userData.name}</h2>
           <p className="text-gray-500 mb-4">Administrador • Loja Luanda</p>
           <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100 flex items-center gap-1">
                <ShieldCheck size={12} /> Conta Verificada
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full border border-gray-200">
                Plano Pro
              </span>
           </div>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-50 overflow-hidden min-h-[500px]">
        
        {/* Tabs Header */}
        <div className="flex flex-col md:flex-row border-b border-gray-100 overflow-x-auto hide-scrollbar">
           <TabButton id="general" label="Dados Pessoais" icon={User} />
           <TabButton id="security" label="Login e Segurança" icon={Lock} />
           <TabButton id="notifications" label="Notificações" icon={Bell} />
           <TabButton id="plan" label="Plano e Faturamento" icon={CreditCard} />
        </div>

        {/* Tab Content */}
        <div className="p-6 lg:p-10">
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="max-w-2xl space-y-6 animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-xs font-semibold text-gray-500 uppercase">Nome Completo</label>
                     <input 
                        type="text" 
                        value={userData.name}
                        onChange={(e) => setUserData({...userData, name: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-semibold text-gray-500 uppercase">Idioma</label>
                     <select 
                        value={userData.language}
                        onChange={(e) => setUserData({...userData, language: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none bg-white"
                     >
                        <option value="pt-AO">Português (Angola)</option>
                        <option value="en-US">English (US)</option>
                        <option value="fr-FR">Français</option>
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                        <Mail size={12} /> Email Principal
                     </label>
                     <input 
                        type="email" 
                        value={userData.email}
                        disabled
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 outline-none cursor-not-allowed"
                     />
                     <p className="text-[10px] text-gray-400">Para alterar seu email, entre em contato com o suporte.</p>
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                        <Phone size={12} /> Telefone
                     </label>
                     <input 
                        type="tel" 
                        value={userData.phone}
                        onChange={(e) => setUserData({...userData, phone: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Bio / Sobre Você</label>
                  <textarea 
                     rows={4}
                     value={userData.bio}
                     onChange={(e) => setUserData({...userData, bio: e.target.value})}
                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all resize-none"
                  />
               </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="max-w-2xl space-y-8 animate-fade-in">
               
               {/* Change Password */}
               <div className="space-y-4 pb-8 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-dark-text">Alterar Senha</h3>
                  <div className="grid grid-cols-1 gap-4">
                     <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Senha Atual</label>
                        <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-xs font-semibold text-gray-500 uppercase">Nova Senha</label>
                           <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-semibold text-gray-500 uppercase">Confirmar Senha</label>
                           <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none" />
                        </div>
                     </div>
                  </div>
               </div>

               {/* 2FA */}
               <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                     <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-brand-primary shrink-0">
                        <Smartphone size={24} />
                     </div>
                     <div>
                        <h3 className="text-lg font-bold text-dark-text">Autenticação em Dois Fatores (2FA)</h3>
                        <p className="text-sm text-gray-500 max-w-md">Adicione uma camada extra de segurança à sua conta exigindo um código do seu telefone ao fazer login.</p>
                     </div>
                  </div>
                  <button 
                     onClick={() => setUserData({...userData, twoFactor: !userData.twoFactor})}
                     className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${userData.twoFactor ? 'bg-green-500' : 'bg-gray-200'}`}
                  >
                     <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${userData.twoFactor ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
               </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="max-w-2xl space-y-8 animate-fade-in">
               <div>
                  <h3 className="text-lg font-bold text-dark-text mb-4">Preferências de Contato</h3>
                  <div className="space-y-4">
                     <label className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                        <span className="font-medium text-gray-700">Emails de Vendas (Resumo Diário)</span>
                        <input 
                          type="checkbox" 
                          checked={userData.notifications.sales}
                          onChange={() => setUserData({...userData, notifications: {...userData.notifications, sales: !userData.notifications.sales}})}
                          className="w-5 h-5 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
                        />
                     </label>
                     <label className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                        <span className="font-medium text-gray-700">Novidades e Marketing</span>
                        <input 
                          type="checkbox" 
                          checked={userData.notifications.marketing}
                          onChange={() => setUserData({...userData, notifications: {...userData.notifications, marketing: !userData.notifications.marketing}})}
                          className="w-5 h-5 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
                        />
                     </label>
                  </div>
               </div>
               
               <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3 items-start">
                  <AlertCircle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                     <p className="text-sm font-bold text-yellow-800">Notificações Importantes</p>
                     <p className="text-xs text-yellow-700 mt-1">Emails relacionados a segurança, redefinição de senha e faturas do sistema não podem ser desativados.</p>
                  </div>
               </div>
            </div>
          )}

          {/* PLAN TAB */}
          {activeTab === 'plan' && (
            <div className="max-w-3xl animate-fade-in">
               <div className="bg-gradient-to-r from-[#1E293B] to-[#334155] rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                     <div>
                        <p className="text-gray-400 text-sm font-medium mb-1">Plano Atual</p>
                        <h2 className="text-3xl font-bold mb-2">Feerie Pay <span className="text-brand-primary">PRO</span></h2>
                        <p className="text-gray-300 text-sm max-w-md">Taxas reduzidas, saques prioritários e suporte 24/7.</p>
                     </div>
                     <div className="text-right">
                        <p className="text-2xl font-bold">Kz 15.000<span className="text-sm font-normal text-gray-400">/mês</span></p>
                        <p className="text-xs text-gray-400 mt-1">Próxima cobrança: 25 Nov, 2023</p>
                     </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-white/10 flex gap-4">
                     <button className="px-4 py-2 bg-white text-dark-text font-bold rounded-lg text-sm hover:bg-gray-100 transition-colors">
                        Gerenciar Assinatura
                     </button>
                     <button className="px-4 py-2 bg-transparent border border-white/20 text-white font-medium rounded-lg text-sm hover:bg-white/5 transition-colors">
                        Ver Faturas
                     </button>
                  </div>
               </div>

               <h3 className="text-lg font-bold text-dark-text mb-4">Histórico de Pagamentos</h3>
               <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                           <th className="px-6 py-3">Data</th>
                           <th className="px-6 py-3">Valor</th>
                           <th className="px-6 py-3">Status</th>
                           <th className="px-6 py-3 text-right">Recibo</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        <tr>
                           <td className="px-6 py-4">25 Out, 2023</td>
                           <td className="px-6 py-4">Kz 15.000</td>
                           <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Pago</span></td>
                           <td className="px-6 py-4 text-right"><button className="text-brand-primary hover:underline">Baixar</button></td>
                        </tr>
                        <tr>
                           <td className="px-6 py-4">25 Set, 2023</td>
                           <td className="px-6 py-4">Kz 15.000</td>
                           <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Pago</span></td>
                           <td className="px-6 py-4 text-right"><button className="text-brand-primary hover:underline">Baixar</button></td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>
          )}

        </div>
        
        {/* Footer Actions (Only for editable tabs) */}
        {(activeTab === 'general' || activeTab === 'security' || activeTab === 'notifications') && (
           <div className="px-6 lg:px-10 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                disabled={isLoading}
                className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
              >
                 Cancelar
              </button>
              <button 
                 onClick={handleSave}
                 disabled={isLoading}
                 className="px-8 py-2.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-hover shadow-md shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70"
              >
                 {isLoading ? (
                    <>
                       <Loader2 size={18} className="animate-spin" /> Salvando...
                    </>
                 ) : (
                    <>
                       <Save size={18} /> Salvar Alterações
                    </>
                 )}
              </button>
           </div>
        )}
      </div>
    </div>
  );
};
