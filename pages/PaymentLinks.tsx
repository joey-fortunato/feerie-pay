
import React, { useState } from 'react';
import { Plus, Copy, ExternalLink, MoreHorizontal, Trash2, Eye, ShoppingBag, Check, X, Link as LinkIcon } from 'lucide-react';
import { PaymentLink } from '../types';

const initialLinks: PaymentLink[] = [
  {
    id: 'LNK-9921',
    title: 'Consultoria Rápida',
    amount: 15000,
    url: 'https://feerie.pay/p/consultoria-rapida',
    active: true,
    views: 142,
    sales: 8,
    createdAt: '10 Out, 2023'
  },
  {
    id: 'LNK-9922',
    title: 'Promoção Ebook',
    amount: 5000,
    url: 'https://feerie.pay/p/promo-ebook-24h',
    active: true,
    views: 850,
    sales: 45,
    createdAt: '12 Out, 2023'
  },
  {
    id: 'LNK-9923',
    title: 'Aula Particular (Inglês)',
    amount: 7000,
    url: 'https://feerie.pay/p/aula-ingles',
    active: false,
    views: 20,
    sales: 2,
    createdAt: '01 Set, 2023'
  }
];

export const PaymentLinks: React.FC = () => {
  const [links, setLinks] = useState<PaymentLink[]>(initialLinks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // New Link Form State
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkAmount, setNewLinkAmount] = useState('');

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateLink = () => {
    if (!newLinkTitle || !newLinkAmount) return;

    const newLink: PaymentLink = {
      id: `LNK-${Math.floor(Math.random() * 10000)}`,
      title: newLinkTitle,
      amount: parseFloat(newLinkAmount),
      url: `https://feerie.pay/p/${newLinkTitle.toLowerCase().replace(/\s+/g, '-')}`,
      active: true,
      views: 0,
      sales: 0,
      createdAt: new Date().toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    setLinks([newLink, ...links]);
    setIsModalOpen(false);
    setNewLinkTitle('');
    setNewLinkAmount('');
  };

  const toggleStatus = (id: string) => {
    setLinks(links.map(link => 
      link.id === id ? { ...link, active: !link.active } : link
    ));
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dark-text">Links de Pagamento</h2>
          <p className="text-gray-500 text-sm">Crie links rápidos para vender nas redes sociais e WhatsApp.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-hover shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5"
        >
          <Plus size={18} />
          Criar Link
        </button>
      </div>

      {/* Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {links.map((link) => (
          <div key={link.id} className={`bg-white rounded-2xl p-6 shadow-soft border transition-all duration-300 ${link.active ? 'border-gray-50 hover:border-brand-primary/30' : 'border-gray-100 opacity-75 bg-gray-50/50'}`}>
            
            {/* Card Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 rounded-xl text-brand-primary">
                <LinkIcon size={24} />
              </div>
              <div className="relative group">
                 <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                   <MoreHorizontal size={20} />
                 </button>
                 {/* Dropdown (Simulated) */}
                 <div className="absolute right-0 top-full mt-2 w-32 bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden hidden group-hover:block z-10">
                    <button onClick={() => toggleStatus(link.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-600">
                      {link.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-500 flex items-center gap-2">
                      <Trash2 size={14} /> Excluir
                    </button>
                 </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="mb-6">
               <h3 className="text-lg font-bold text-dark-text mb-1">{link.title}</h3>
               <p className="text-2xl font-bold text-brand-primary">Kz {link.amount.toLocaleString()}</p>
            </div>

            {/* URL Copy Area */}
            <div className="bg-gray-50 rounded-xl p-1 flex items-center justify-between border border-gray-200 mb-6">
               <div className="px-3 py-2 overflow-hidden">
                  <p className="text-xs text-gray-500 truncate w-full font-mono">{link.url}</p>
               </div>
               <button 
                 onClick={() => handleCopy(link.id, link.url)}
                 className={`p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${copiedId === link.id ? 'bg-green-500 text-white' : 'bg-white text-gray-500 hover:text-brand-primary shadow-sm'}`}
                 title="Copiar Link"
               >
                 {copiedId === link.id ? <Check size={16} /> : <Copy size={16} />}
               </button>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
               <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                     <Eye size={14} />
                     <span>{link.views}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                     <ShoppingBag size={14} />
                     <span>{link.sales} vendas</span>
                  </div>
               </div>
               
               <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${link.active ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className="text-xs font-medium text-gray-400">{link.active ? 'Ativo' : 'Inativo'}</span>
               </div>
            </div>

          </div>
        ))}

        {/* Add New Card (Empty State Style) */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50/50 hover:border-brand-primary/40 transition-all group min-h-[280px]"
        >
           <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Plus size={32} className="text-gray-300 group-hover:text-brand-primary transition-colors" />
           </div>
           <h3 className="text-lg font-bold text-gray-400 group-hover:text-brand-primary transition-colors">Criar Novo Link</h3>
           <p className="text-sm text-gray-400 mt-2">Configure um novo checkout <br/> em segundos.</p>
        </button>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100">
            
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-dark-text">Novo Link de Pagamento</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
               <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome do Serviço/Produto</label>
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Ex: Consultoria 1h" 
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                  />
               </div>

               <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor a cobrar (Kz)</label>
                  <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">Kz</span>
                     <input 
                      type="number" 
                      placeholder="0,00" 
                      value={newLinkAmount}
                      onChange={(e) => setNewLinkAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-medium text-lg"
                    />
                  </div>
               </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
               <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
               >
                 Cancelar
               </button>
               <button 
                onClick={handleCreateLink}
                className="px-5 py-2.5 text-sm font-bold text-white bg-brand-primary hover:bg-brand-hover rounded-xl shadow-md shadow-indigo-200 transition-all"
               >
                 Criar Link
               </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
