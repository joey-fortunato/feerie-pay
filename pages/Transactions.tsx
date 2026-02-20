
import React, { useState } from 'react';
import { Download, Filter, MoreHorizontal, CheckCircle, XCircle, Clock, Plus, X, Search, User, Link, Tag, DollarSign, ChevronRight, Copy, CornerUpLeft, Send, FileText, Shield, Smartphone, CreditCard, Wallet } from 'lucide-react';
import { Transaction, TransactionStatus } from '../types';

const transactionsData: Transaction[] = [
  { id: 'ORD-7782', customerName: 'Mario Baptista', customerEmail: 'mario.b@gmail.com', amount: 45000, date: '12 Out, 2023', status: TransactionStatus.PAID, method: 'e-kwanza' },
  { id: 'ORD-7781', customerName: 'Luisa Paulo', customerEmail: 'luisa.p@hotmail.com', amount: 12000, date: '12 Out, 2023', status: TransactionStatus.PENDING, method: 'multicaixa_express' },
  { id: 'ORD-7780', customerName: 'José Eduardo', customerEmail: 'jose.ed@company.ao', amount: 8500, date: '11 Out, 2023', status: TransactionStatus.FAILED, method: 'e-kwanza' },
  { id: 'ORD-7779', customerName: 'Ana Maria', customerEmail: 'anam@gmail.com', amount: 22000, date: '11 Out, 2023', status: TransactionStatus.PAID, method: 'multicaixa_express' },
  { id: 'ORD-7778', customerName: 'Pedro Gomes', customerEmail: 'pgomes@tech.ao', amount: 150000, date: '10 Out, 2023', status: TransactionStatus.PAID, method: 'card' },
];

// Mock Data for Dropdowns
const mockCustomers = [
  { id: 1, name: 'Mario Baptista' },
  { id: 2, name: 'Luisa Paulo' },
  { id: 3, name: 'José Eduardo' },
  { id: 4, name: 'Ana Maria' },
];

const mockProducts = [
  { id: 1, name: 'E-book: Dominando o E-kwanza', price: 8000 },
  { id: 2, name: 'Livro: Empreendedorismo', price: 15000 },
  { id: 3, name: 'Curso: Marketing Digital', price: 25000 },
  { id: 4, name: 'Mentoria Individual', price: 50000 },
];

const StatusBadge = ({ status }: { status: TransactionStatus }) => {
  switch (status) {
    case TransactionStatus.PAID:
      return <span className="flex items-center gap-1 text-xs font-medium bg-green-100 text-green-700 px-2.5 py-1 rounded-full"><CheckCircle size={12} /> Pago</span>;
    case TransactionStatus.PENDING:
      return <span className="flex items-center gap-1 text-xs font-medium bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full"><Clock size={12} /> Pendente</span>;
    case TransactionStatus.FAILED:
      return <span className="flex items-center gap-1 text-xs font-medium bg-red-100 text-red-700 px-2.5 py-1 rounded-full"><XCircle size={12} /> Falhou</span>;
    default:
      return null;
  }
};

const MethodIcon = ({ method }: { method: string }) => {
   if (method === 'e-kwanza') {
      return (
         <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs bg-indigo-100 text-indigo-600" title="E-Kwanza">
            <Wallet size={16} />
         </div>
      );
   }
   if (method === 'multicaixa_express') {
      return (
         <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs bg-orange-100 text-orange-600" title="Multicaixa Express">
            <Smartphone size={16} />
         </div>
      );
   }
   return (
      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs bg-blue-100 text-blue-600" title="Cartão Visa/Master">
         <CreditCard size={16} />
      </div>
   );
};

export const Transactions: React.FC = () => {
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(transactionsData);
  
  // Form State
  const [formStep, setFormStep] = useState<'existing_client' | 'new_client'>('existing_client');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [productPrice, setProductPrice] = useState<number | string>('');
  const [enableCoupons, setEnableCoupons] = useState(false);

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prodId = e.target.value;
    setSelectedProduct(prodId);
    const product = mockProducts.find(p => p.id.toString() === prodId);
    if (product) {
      setProductPrice(product.price);
    } else {
      setProductPrice('');
    }
  };

  const handleRowClick = (tx: Transaction) => {
    setSelectedTransaction(tx);
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dark-text">Transações</h2>
          <p className="text-gray-500 text-sm">Gerencie todos os seus pagamentos recebidos.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter size={16} />
            <span className="hidden sm:inline">Filtrar</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Download size={16} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button 
            onClick={() => setIsChargeModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold hover:bg-brand-hover shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus size={18} />
            Nova Cobrança
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID do Pedido</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Valor</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <tr 
                  key={tx.id} 
                  onClick={() => handleRowClick(tx)}
                  className="hover:bg-gray-50 transition-colors group cursor-pointer"
                >
                  <td className="py-4 px-6 text-sm font-medium text-brand-primary">{tx.id}</td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-sm font-medium text-dark-text">{tx.customerName}</p>
                      <p className="text-xs text-gray-400">{tx.customerEmail}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">{tx.date}</td>
                  <td className="py-4 px-6 text-sm font-bold text-dark-text">Kz {tx.amount.toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-gray-400 hover:text-brand-primary opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-gray-100 rounded-full">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-center">
          <button className="text-sm text-gray-500 hover:text-brand-primary font-medium">Carregar mais</button>
        </div>
      </div>

      {/* TRANSACTION DETAILS DRAWER (SLIDE-OVER) */}
      {selectedTransaction && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" 
            onClick={() => setSelectedTransaction(null)}
          />
          
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 ease-out border-l border-gray-100">
             
             {/* Drawer Header */}
             <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-8 py-6 flex items-start justify-between">
                <div>
                   <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-bold text-gray-500">Pagamento</h2>
                      <span className="text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-mono">{selectedTransaction.id}</span>
                      <button className="text-gray-400 hover:text-brand-primary" title="Copiar ID"><Copy size={14} /></button>
                   </div>
                   <div className="flex items-end gap-3">
                      <span className="text-3xl font-bold text-dark-text tracking-tight">
                         Kz {selectedTransaction.amount.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-400 font-medium mb-1.5">AOA</span>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedTransaction(null)}
                  className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full transition-colors"
                >
                   <X size={24} />
                </button>
             </div>

             {/* Drawer Content */}
             <div className="p-8 space-y-8">
                
                {/* Status & Actions */}
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                   <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-400 uppercase mb-1">Status Atual</span>
                      <StatusBadge status={selectedTransaction.status} />
                   </div>
                   {selectedTransaction.status === 'PENDING' && (
                     <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-bold text-gray-600 rounded-lg hover:bg-gray-100 shadow-sm">
                           Cancelar
                        </button>
                        <button className="px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-hover shadow-sm shadow-indigo-200">
                           Aprovar
                        </button>
                     </div>
                   )}
                   {selectedTransaction.status === 'PAID' && (
                      <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-xs font-bold text-gray-600 rounded-lg hover:bg-gray-100 shadow-sm transition-all">
                         <CornerUpLeft size={14} /> Reembolsar
                      </button>
                   )}
                </div>

                {/* Customer Details */}
                <div>
                   <h3 className="text-sm font-bold text-dark-text mb-4 flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      Dados do Cliente
                   </h3>
                   <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
                      <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                         <span className="text-sm text-gray-500">Nome</span>
                         <span className="text-sm font-medium text-dark-text">{selectedTransaction.customerName}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                         <span className="text-sm text-gray-500">Email</span>
                         <span className="text-sm font-medium text-brand-primary hover:underline cursor-pointer">{selectedTransaction.customerEmail}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-sm text-gray-500">Telefone</span>
                         <span className="text-sm font-medium text-dark-text">+244 9XX XXX XXX</span>
                      </div>
                   </div>
                </div>

                {/* Payment Details */}
                <div>
                   <h3 className="text-sm font-bold text-dark-text mb-4 flex items-center gap-2">
                      <Tag size={16} className="text-gray-400" />
                      Detalhes da Venda
                   </h3>
                   <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
                      <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                         <span className="text-sm text-gray-500">Produto</span>
                         <span className="text-sm font-medium text-dark-text">Curso: Marketing Digital</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                         <span className="text-sm text-gray-500">Método</span>
                         <div className="flex items-center gap-2">
                            {selectedTransaction.method === 'e-kwanza' && (
                               <>
                                 <Wallet size={14} className="text-brand-primary" />
                                 <span className="text-sm font-medium text-dark-text uppercase">E-Kwanza</span>
                               </>
                            )}
                            {selectedTransaction.method === 'multicaixa_express' && (
                               <>
                                 <Smartphone size={14} className="text-orange-500" />
                                 <span className="text-sm font-medium text-dark-text uppercase">MCX Express</span>
                               </>
                            )}
                            {selectedTransaction.method === 'card' && (
                               <>
                                 <CreditCard size={14} className="text-blue-500" />
                                 <span className="text-sm font-medium text-dark-text uppercase">Visa / Master</span>
                               </>
                            )}
                         </div>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                         <span className="text-sm text-gray-500">Taxa de Processamento</span>
                         <span className="text-sm font-medium text-red-500">- Kz {(selectedTransaction.amount * 0.03).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                         <span className="text-sm font-bold text-dark-text">Líquido (Recebido)</span>
                         <span className="text-sm font-bold text-green-600">Kz {(selectedTransaction.amount * 0.97).toLocaleString()}</span>
                      </div>
                   </div>
                </div>

                {/* Timeline */}
                <div>
                   <h3 className="text-sm font-bold text-dark-text mb-4 flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      Histórico
                   </h3>
                   <div className="relative border-l-2 border-gray-100 ml-3 space-y-6 pb-2">
                      
                      {/* Step 1 */}
                      <div className="relative pl-6">
                         <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gray-200 border-2 border-white shadow-sm"></div>
                         <p className="text-xs text-gray-400 mb-0.5">10 Out, 14:30</p>
                         <p className="text-sm font-medium text-dark-text">Cobrança criada</p>
                         <p className="text-xs text-gray-500">Checkout iniciado via link de pagamento.</p>
                      </div>

                      {/* Step 2 */}
                      <div className="relative pl-6">
                         <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${selectedTransaction.status === 'FAILED' ? 'bg-red-500' : 'bg-brand-primary'}`}></div>
                         <p className="text-xs text-gray-400 mb-0.5">10 Out, 14:32</p>
                         <p className="text-sm font-medium text-dark-text">
                            {selectedTransaction.status === 'PENDING' && 'Aguardando pagamento...'}
                            {selectedTransaction.status === 'PAID' && 'Pagamento confirmado'}
                            {selectedTransaction.status === 'FAILED' && 'Falha no processamento'}
                         </p>
                         {selectedTransaction.status === 'PAID' && (
                           <p className="text-xs text-gray-500">Transação capturada com sucesso.</p>
                         )}
                      </div>
                      
                      {/* Step 3 (Receipt) */}
                      {selectedTransaction.status === 'PAID' && (
                         <div className="relative pl-6">
                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
                            <p className="text-xs text-gray-400 mb-0.5">10 Out, 14:32</p>
                            <p className="text-sm font-medium text-dark-text">Recibo enviado</p>
                            <p className="text-xs text-gray-500">Email enviado para {selectedTransaction.customerEmail}</p>
                         </div>
                      )}
                   </div>
                </div>
                
                {/* Action Buttons Footer inside Drawer */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                   <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm">
                      <FileText size={18} />
                      Ver Fatura
                   </button>
                   <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm">
                      <Send size={18} />
                      Reenviar Email
                   </button>
                </div>

             </div>
          </div>
        </>
      )}

      {/* Create Charge Modal */}
      {isChargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all scale-100 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-xl font-bold text-dark-text">Criar Cobrança</h3>
              <button 
                onClick={() => setIsChargeModalOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              
              {/* Customer Selection Toggle */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
                 <span className="text-sm font-medium text-gray-700 pl-2">Cliente</span>
                 <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-medium">Cadastrar novo cliente</span>
                    <button 
                      onClick={() => setFormStep(formStep === 'existing_client' ? 'new_client' : 'existing_client')}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${formStep === 'new_client' ? 'bg-brand-primary' : 'bg-gray-300'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${formStep === 'new_client' ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                 </div>
              </div>

              {/* Customer Form Fields */}
              {formStep === 'existing_client' ? (
                <div className="space-y-2">
                   <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Selecionar um cliente</label>
                   <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all bg-white appearance-none text-gray-600">
                        <option value="">Selecione um cliente...</option>
                        {mockCustomers.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                   <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome Completo</label>
                      <input type="text" placeholder="Nome do cliente" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                        <input type="email" placeholder="email@exemplo.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Telefone</label>
                        <input type="tel" placeholder="9XX XXX XXX" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all" />
                      </div>
                   </div>
                </div>
              )}

              <div className="h-px bg-gray-100 w-full" />

              {/* Product Selection */}
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Selecione um Produto</label>
                 <div className="relative">
                    <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select 
                      value={selectedProduct}
                      onChange={handleProductChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all bg-white appearance-none text-gray-600"
                    >
                      <option value="">Selecione produtos...</option>
                      {mockProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                 </div>
              </div>

              {/* Value (Auto-filled) */}
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor</label>
                 <div className="relative">
                    <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      value={productPrice ? `Kz ${productPrice.toLocaleString()}` : 'Kz 0,00'}
                      disabled
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 font-medium outline-none cursor-not-allowed"
                    />
                 </div>
              </div>

              {/* Coupons Toggle */}
              <div className="flex items-center justify-between pt-2">
                 <div className="flex flex-col">
                    <span className="text-sm font-medium text-dark-text">Habilitar cupom?</span>
                    <span className="text-xs text-gray-400">Permite que o cliente use códigos de desconto.</span>
                 </div>
                 <button 
                    onClick={() => setEnableCoupons(!enableCoupons)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${enableCoupons ? 'bg-brand-primary' : 'bg-gray-300'}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${enableCoupons ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
              </div>

               {/* URLs */}
               <div className="space-y-4 pt-2">
                   <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        URL de Retorno
                        <Link size={12} className="text-gray-400" />
                      </label>
                      <input type="text" placeholder="https://" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        URL de Conclusão
                        <CheckCircle size={12} className="text-gray-400" />
                      </label>
                      <input type="text" placeholder="https://" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all" />
                   </div>
               </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-between gap-3 flex-shrink-0 border-t border-gray-100">
               <button 
                onClick={() => setIsChargeModalOpen(false)}
                className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors w-full sm:w-auto"
               >
                 Voltar
               </button>
               <button 
                className="px-6 py-2.5 text-sm font-bold text-white bg-brand-primary hover:bg-brand-hover rounded-xl shadow-md shadow-indigo-200 transition-all w-full sm:w-auto"
               >
                 Salvar
               </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};