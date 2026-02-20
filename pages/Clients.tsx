
import React, { useState } from 'react';
import { Search, Plus, Download, Filter, MoreHorizontal, Mail, Smartphone, Shield, Ban, CheckCircle, User, X, Save, Calendar, MapPin, CreditCard, Clock, FileText, History, Edit3, Trash2 } from 'lucide-react';
import { Client } from '../types';

// Mock Data for Clients (Angolan context)
const initialClients: Client[] = [
  {
    id: 'CLI-001',
    name: 'Erica Gomes',
    email: 'erica.gomes@gmail.com',
    phone: '923 456 789',
    status: 'active',
    totalSpent: 125000,
    lastPurchase: '25 Out, 2023',
    joinDate: '10 Jan, 2023',
    productsCount: 3
  },
  {
    id: 'CLI-002',
    name: 'Mário Baptista',
    email: 'mario.b@outlook.com',
    phone: '945 112 334',
    status: 'active',
    totalSpent: 45000,
    lastPurchase: '12 Out, 2023',
    joinDate: '15 Ago, 2023',
    productsCount: 1
  },
  {
    id: 'CLI-003',
    name: 'Luísa Paulo',
    email: 'luisa.p@hotmail.com',
    phone: '912 887 665',
    status: 'inactive',
    totalSpent: 8000,
    lastPurchase: '20 Jun, 2023',
    joinDate: '20 Jun, 2023',
    productsCount: 1
  },
  {
    id: 'CLI-004',
    name: 'Aboua Capochichi',
    email: 'capochichi@tech.ao',
    phone: '998 221 009',
    status: 'active',
    totalSpent: 350000,
    lastPurchase: '24 Out, 2023',
    joinDate: '02 Fev, 2023',
    productsCount: 8
  },
  {
    id: 'CLI-005',
    name: 'Estefânia Daniel',
    email: 'stfdani10@gmail.com',
    phone: '933 445 667',
    status: 'blocked',
    totalSpent: 0,
    lastPurchase: '-',
    joinDate: '22 Out, 2023',
    productsCount: 0
  },
];

// Mock Data for Client History
const mockHistory = [
  { id: 1, product: 'Curso Marketing Digital', date: '25 Out, 2023', amount: 25000, status: 'paid' },
  { id: 2, product: 'Mentoria Individual', date: '10 Set, 2023', amount: 50000, status: 'paid' },
  { id: 3, product: 'Ebook: E-kwanza', date: '15 Ago, 2023', amount: 8000, status: 'failed' },
];

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Form State for New Client
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Filters
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClient = () => {
    if (!newClient.name || !newClient.email) return;
    
    const client: Client = {
      id: `CLI-${Math.floor(Math.random() * 10000)}`,
      name: newClient.name,
      email: newClient.email,
      phone: newClient.phone,
      status: 'active',
      totalSpent: 0,
      lastPurchase: '-',
      joinDate: new Date().toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' }),
      productsCount: 0
    };

    setClients([client, ...clients]);
    setIsModalOpen(false);
    setNewClient({ name: '', email: '', phone: '' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-600';
      case 'blocked': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
     switch(status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'blocked': return 'Bloqueado';
      default: return status;
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 relative">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-50 flex items-center justify-between">
            <div>
               <p className="text-sm text-gray-500 font-medium mb-1">Total de Membros</p>
               <h3 className="text-2xl font-bold text-dark-text">{clients.length}</h3>
            </div>
            <div className="w-10 h-10 bg-indigo-50 text-brand-primary rounded-lg flex items-center justify-center">
               <User size={20} />
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-50 flex items-center justify-between">
            <div>
               <p className="text-sm text-gray-500 font-medium mb-1">Novos este mês</p>
               <h3 className="text-2xl font-bold text-dark-text text-green-600">+12</h3>
            </div>
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
               <User size={20} />
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-50 flex items-center justify-between">
            <div>
               <p className="text-sm text-gray-500 font-medium mb-1">Valor Médio (LTV)</p>
               <h3 className="text-2xl font-bold text-dark-text">Kz 45.000</h3>
            </div>
            <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center">
               <Shield size={20} />
            </div>
         </div>
      </div>

      {/* Actions & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
          />
        </div>
        
        <div className="flex w-full sm:w-auto gap-3">
           <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Download size={18} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter size={18} />
            <span className="hidden sm:inline">Filtros</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-hover shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus size={18} />
            <span>Adicionar Membro</span>
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Membro / Cliente</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contato</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Gasto Total (LTV)</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Última Compra</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClients.map((client) => (
                <tr 
                  key={client.id} 
                  onClick={() => setSelectedClient(client)}
                  className="hover:bg-gray-50 transition-colors group cursor-pointer"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-white shadow-sm flex items-center justify-center text-gray-500 font-bold text-sm">
                         {getInitials(client.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark-text">{client.name}</p>
                        <p className="text-xs text-gray-400">Desde {client.joinDate}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Mail size={14} className="text-gray-400" />
                          {client.email}
                       </div>
                       <div className="flex items-center gap-1.5 text-sm text-gray-600 group/phone cursor-pointer hover:text-green-600 transition-colors">
                          <Smartphone size={14} className="text-gray-400 group-hover/phone:text-green-600" />
                          {client.phone}
                       </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                      {client.status === 'active' && <CheckCircle size={12} />}
                      {client.status === 'blocked' && <Ban size={12} />}
                      {getStatusLabel(client.status)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm font-bold text-dark-text">
                    Kz {client.totalSpent.toLocaleString()}
                    <span className="block text-xs font-normal text-gray-400">{client.productsCount} pedidos</span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    {client.lastPurchase}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="p-2 text-gray-400 hover:bg-gray-100 hover:text-brand-primary rounded-lg transition-all">
                       <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredClients.length === 0 && (
          <div className="py-12 text-center">
             <p className="text-gray-500">Nenhum cliente encontrado.</p>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100">
             <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-bold text-dark-text">Cadastrar Novo Cliente</h3>
             </div>
             <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-gray-500 uppercase">Nome Completo</label>
                   <input 
                    type="text" 
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none"
                    placeholder="Ex: João Manuel"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                   <input 
                    type="email" 
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none"
                    placeholder="Ex: cliente@email.com"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-gray-500 uppercase">Telefone (WhatsApp)</label>
                   <input 
                    type="tel" 
                    value={newClient.phone}
                    onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none"
                    placeholder="Ex: 9XX XXX XXX"
                   />
                </div>
             </div>
             <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg">Cancelar</button>
                <button onClick={handleAddClient} className="px-4 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-hover shadow-md">Salvar Cliente</button>
             </div>
          </div>
        </div>
      )}

      {/* Client Details Drawer */}
      {selectedClient && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" 
            onClick={() => setSelectedClient(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 ease-out border-l border-gray-100">
             
             {/* Drawer Header */}
             <div className="relative h-32 bg-gradient-to-r from-brand-primary to-indigo-400">
                <button 
                  onClick={() => setSelectedClient(null)}
                  className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors backdrop-blur-md"
                >
                   <X size={20} />
                </button>
             </div>

             {/* Profile Info */}
             <div className="px-8 -mt-12 mb-6">
                <div className="flex justify-between items-end mb-4">
                   <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                      <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-500">
                         {getInitials(selectedClient.name)}
                      </div>
                   </div>
                   <div className="flex gap-2 mb-1">
                      <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 shadow-sm">
                         <Ban size={14} className="text-red-500" />
                         Bloquear
                      </button>
                      <button className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-white rounded-lg text-xs font-bold hover:bg-brand-hover shadow-sm shadow-indigo-200">
                         <Edit3 size={14} />
                         Editar
                      </button>
                   </div>
                </div>
                
                <div>
                   <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold text-dark-text">{selectedClient.name}</h2>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                        selectedClient.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {getStatusLabel(selectedClient.status)}
                      </span>
                   </div>
                   <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar size={14} /> Cliente desde {selectedClient.joinDate}</span>
                      <span className="flex items-center gap-1"><MapPin size={14} /> Luanda, Angola</span>
                   </div>
                </div>
             </div>

             {/* Stats Grid */}
             <div className="px-8 grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                   <p className="text-xs text-gray-400 font-medium uppercase mb-1">Total Gasto</p>
                   <p className="text-sm font-bold text-brand-primary">Kz {selectedClient.totalSpent.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                   <p className="text-xs text-gray-400 font-medium uppercase mb-1">Pedidos</p>
                   <p className="text-sm font-bold text-dark-text">{selectedClient.productsCount}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                   <p className="text-xs text-gray-400 font-medium uppercase mb-1">Ticket Médio</p>
                   <p className="text-sm font-bold text-dark-text">
                      Kz {selectedClient.productsCount > 0 
                        ? Math.round(selectedClient.totalSpent / selectedClient.productsCount).toLocaleString() 
                        : 0}
                   </p>
                </div>
             </div>

             <div className="px-8 space-y-8 pb-10">
                
                {/* Editable Details */}
                <div className="space-y-4">
                   <h3 className="text-sm font-bold text-dark-text flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      Dados Pessoais
                   </h3>
                   <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                         <label className="text-xs text-gray-400 font-medium ml-1">Email</label>
                         <div className="relative">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                              type="email" 
                              defaultValue={selectedClient.email} 
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                            />
                         </div>
                      </div>
                      <div className="space-y-1">
                         <label className="text-xs text-gray-400 font-medium ml-1">Telefone</label>
                         <div className="relative">
                            <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                              type="tel" 
                              defaultValue={selectedClient.phone} 
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                            />
                         </div>
                      </div>
                   </div>
                </div>

                <div className="border-t border-gray-100 pt-6 space-y-4">
                   <h3 className="text-sm font-bold text-dark-text flex items-center gap-2">
                      <History size={16} className="text-gray-400" />
                      Histórico de Compras
                   </h3>
                   
                   <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                      {mockHistory.map((history, index) => (
                         <div key={history.id} className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${index !== mockHistory.length - 1 ? 'border-b border-gray-50' : ''}`}>
                            <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${history.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                                  {history.status === 'paid' ? <CheckCircle size={14} /> : <X size={14} />}
                               </div>
                               <div>
                                  <p className="text-sm font-medium text-dark-text">{history.product}</p>
                                  <p className="text-xs text-gray-400">{history.date}</p>
                               </div>
                            </div>
                            <span className="text-sm font-bold text-dark-text">Kz {history.amount.toLocaleString()}</span>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="border-t border-gray-100 pt-6 space-y-4">
                   <h3 className="text-sm font-bold text-dark-text flex items-center gap-2">
                      <FileText size={16} className="text-gray-400" />
                      Notas Internas
                   </h3>
                   <textarea 
                     rows={3}
                     placeholder="Adicione anotações sobre este cliente (visível apenas para a equipe)..."
                     className="w-full p-4 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all resize-none"
                   />
                   <button className="text-xs font-bold text-brand-primary hover:underline">Salvar Nota</button>
                </div>

             </div>

             {/* Footer Actions */}
             <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex justify-between items-center gap-4">
                 <button className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Excluir Cliente">
                    <Trash2 size={20} />
                 </button>
                 <button 
                   className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold text-sm hover:bg-brand-hover shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                   onClick={() => setSelectedClient(null)}
                 >
                    <Save size={18} />
                    Salvar Alterações
                 </button>
             </div>
          </div>
        </>
      )}
    </div>
  );
};
