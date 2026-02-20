
import React, { useState } from 'react';
import { ArrowLeft, Save, Layout, ShoppingCart, Zap, CheckCircle, Upload, Image as ImageIcon, Globe, Smartphone, CreditCard, ToggleLeft, Clock, MousePointerClick, Info, Eye, BookOpen, MonitorPlay, Users, Download, FileText, Link as LinkIcon } from 'lucide-react';
import { Product } from '../types';

interface ProductEditorProps {
  product: Product;
  onBack: () => void;
  onSave: (updatedProduct: Product) => void;
}

type EditorTab = 'general' | 'checkout' | 'order_bump' | 'thank_you';

export const ProductEditor: React.FC<ProductEditorProps> = ({ product, onBack, onSave }) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('general');
  const [isLoading, setIsLoading] = useState(false);
  
  // Local state for form management
  const [formData, setFormData] = useState({
    ...product,
    category: product.category || 'book',
    description: product.description || 'Aprenda as melhores estratégias para dominar o mercado.',
    pricingType: product.type === 'subscription' ? 'subscription' : 'one_time',
    checkoutConfig: {
      askPhone: true,
      askNif: false,
      countDownTimer: false,
      primaryColor: '#6363F1',
      paymentMethods: {
        ekwanza: true,
        card: true
      }
    },
    orderBump: {
      enabled: false,
      title: 'Adicionar Mentoria Express (30min)',
      price: 5000,
      description: 'Tire suas dúvidas individuais logo após a compra.'
    },
    thankYou: {
      type: 'default', // or 'redirect'
      redirectUrl: ''
    }
  });

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSave(formData);
    }, 1000);
  };

  const renderTabButton = (id: EditorTab, label: string, icon: any) => {
    const Icon = icon;
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-medium transition-all whitespace-nowrap ${
          isActive
            ? 'border-brand-primary text-brand-primary bg-indigo-50/50'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Icon size={18} />
        {label}
      </button>
    );
  };

  // Helper to define available product types
  const productTypes = [
    { id: 'book', label: 'E-book / Livro', icon: BookOpen, desc: 'PDF, EPUB ou físico' },
    { id: 'course', label: 'Curso Online', icon: MonitorPlay, desc: 'Aulas em vídeo' },
    { id: 'digital', label: 'Arquivo Digital', icon: Download, desc: 'Templates, Software, Kits' },
    { id: 'service', label: 'Serviço / Mentoria', icon: Users, desc: 'Consultoria ou Sessões' },
  ];

  return (
    <div className="animate-fade-in pb-24">
      
      {/* Top Bar - Sticky & Responsive */}
      <div className="sticky top-[70px] z-30 bg-bg-main/95 backdrop-blur-md pt-4 pb-2 mb-8 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 overflow-hidden">
            <button 
              onClick={onBack}
              className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors border border-transparent hover:border-gray-200 shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-dark-text flex items-center gap-2 leading-tight truncate">
                Editando: <span className="text-gray-500 font-normal truncate">{formData.name}</span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                <span className={`w-2 h-2 rounded-full ${formData.status === 'active' ? 'bg-green-50' : 'bg-gray-300'}`} />
                {formData.status === 'active' ? 'Oferta Ativa' : 'Rascunho'}
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-hover shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-70 transform active:scale-95 shrink-0"
          >
            {isLoading ? 'Salvando...' : (
              <>
                <Save size={18} /> Salvar
              </>
            )}
          </button>
        </div>
        
        {/* Tabs Navigation - Scrollable on Mobile */}
        <div className="mt-4 overflow-x-auto pb-1 -mx-6 px-6 lg:mx-0 lg:px-0 hide-scrollbar">
          <div className="flex border-b border-gray-200 min-w-max space-x-2">
            {renderTabButton('general', 'Geral', Layout)}
            {renderTabButton('checkout', 'Checkout & Pagamento', ShoppingCart)}
            {renderTabButton('order_bump', 'Order Bump', Zap)}
            {renderTabButton('thank_you', 'Página de Obrigado', CheckCircle)}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* TAB: GENERAL */}
        {activeTab === 'general' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Basic Info Section */}
            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-soft border border-gray-100">
              <h3 className="text-lg font-bold text-dark-text mb-6 border-b border-gray-50 pb-4">Informações da Oferta</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Nome do Produto</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-medium"
                      placeholder="Ex: Curso Completo de Marketing"
                    />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Descrição (Resumo)</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all resize-none"
                    placeholder="Descreva brevemente o que o cliente irá receber..."
                  />
                </div>

                <div className="space-y-3">
                   <label className="text-sm font-semibold text-gray-700">O que você vai vender?</label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {productTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = formData.category === type.id;
                        return (
                          <button
                            key={type.id}
                            onClick={() => setFormData({...formData, category: type.id as any})}
                            className={`flex flex-col items-center justify-center text-center p-4 rounded-xl border-2 transition-all duration-200 ${
                              isSelected 
                                ? 'border-brand-primary bg-indigo-50 text-brand-primary' 
                                : 'border-gray-100 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <Icon size={24} className="mb-2" />
                            <span className="text-sm font-bold">{type.label}</span>
                            <span className="text-[10px] opacity-70 mt-0.5">{type.desc}</span>
                          </button>
                        );
                      })}
                   </div>
                </div>
              </div>
            </div>

            {/* Dynamic Content Delivery Section */}
            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-soft border border-gray-100">
               <h3 className="text-lg font-bold text-dark-text mb-6 border-b border-gray-50 pb-4 flex items-center gap-2">
                 <FileText size={20} className="text-brand-primary" />
                 Entrega do Conteúdo
               </h3>
               
               {(formData.category === 'book' || formData.category === 'digital') && (
                  <div className="space-y-4 animate-fade-in">
                     <div className="p-4 bg-indigo-50 rounded-xl flex items-start gap-3">
                        <Info size={18} className="text-brand-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-indigo-900">
                           Como você selecionou <strong>{formData.category === 'book' ? 'E-book' : 'Arquivo Digital'}</strong>, 
                           faça o upload do arquivo que o cliente receberá automaticamente após a compra.
                        </p>
                     </div>
                     
                     <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
                           <Upload size={24} />
                        </div>
                        <p className="text-sm font-bold text-dark-text">Clique para carregar o arquivo</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, ZIP, EPUB (Max 50MB)</p>
                     </div>
                  </div>
               )}

               {(formData.category === 'course' || formData.category === 'service') && (
                  <div className="space-y-4 animate-fade-in">
                      <div className="p-4 bg-indigo-50 rounded-xl flex items-start gap-3">
                        <Info size={18} className="text-brand-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-indigo-900">
                           Para <strong>{formData.category === 'course' ? 'Cursos' : 'Serviços'}</strong>, 
                           forneça o link de acesso à área de membros ou instruções de agendamento.
                        </p>
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Link de Acesso / Instruções</label>
                        <div className="relative">
                           <LinkIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                           <input 
                              type="text" 
                              placeholder="Ex: https://member.feerie.pay/curso-marketing"
                              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                           />
                        </div>
                     </div>
                  </div>
               )}
            </div>

            {/* Pricing Card */}
            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-soft border border-gray-100">
              <h3 className="text-lg font-bold text-dark-text mb-6 border-b border-gray-50 pb-4">Precificação</h3>
              
              <div className="space-y-8">
                <div className="space-y-3">
                   <label className="text-sm font-semibold text-gray-700">Como o cliente pagará?</label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div 
                        onClick={() => setFormData({...formData, pricingType: 'one_time'})}
                        className={`cursor-pointer p-5 rounded-xl border-2 transition-all flex items-start gap-3 ${
                           formData.pricingType === 'one_time' 
                           ? 'border-brand-primary bg-indigo-50/50' 
                           : 'border-gray-100 hover:border-gray-200'
                        }`}
                     >
                        <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 ${formData.pricingType === 'one_time' ? 'border-brand-primary' : 'border-gray-300'}`}>
                           {formData.pricingType === 'one_time' && <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />}
                        </div>
                        <div>
                           <span className={`block text-sm font-bold ${formData.pricingType === 'one_time' ? 'text-brand-primary' : 'text-gray-700'}`}>Pagamento Único</span>
                           <span className="text-xs text-gray-500 mt-1 block">O cliente paga uma vez e tem acesso vitalício (ou pelo tempo definido).</span>
                        </div>
                     </div>
                     
                     <div 
                        onClick={() => setFormData({...formData, pricingType: 'subscription'})}
                        className={`cursor-pointer p-5 rounded-xl border-2 transition-all flex items-start gap-3 ${
                           formData.pricingType === 'subscription' 
                           ? 'border-brand-primary bg-indigo-50/50' 
                           : 'border-gray-100 hover:border-gray-200'
                        }`}
                     >
                        <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 ${formData.pricingType === 'subscription' ? 'border-brand-primary' : 'border-gray-300'}`}>
                           {formData.pricingType === 'subscription' && <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />}
                        </div>
                         <div>
                           <span className={`block text-sm font-bold ${formData.pricingType === 'subscription' ? 'text-brand-primary' : 'text-gray-700'}`}>Assinatura (Recorrência)</span>
                           <span className="text-xs text-gray-500 mt-1 block">Cobrança automática mensal ou anual.</span>
                        </div>
                     </div>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Valor da Oferta (Kz)</label>
                  <div className="relative max-w-sm">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">Kz</span>
                     <input 
                        type="number" 
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-xl font-bold text-dark-text outline-none transition-all"
                        placeholder="0,00"
                      />
                  </div>
                  {formData.pricingType === 'subscription' && (
                    <div className="flex items-center gap-2 mt-3 text-brand-primary bg-indigo-50 inline-flex px-4 py-2 rounded-lg w-full sm:w-auto">
                       <Info size={16} />
                       <p className="text-xs font-medium">O cliente será cobrado este valor mensalmente.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-semibold text-gray-700">Imagem de Capa</label>
                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50 border-dashed hover:bg-gray-50 transition-colors">
                      <img src={formData.image} alt="Cover" className="w-20 h-24 object-cover rounded-lg shadow-sm bg-white" />
                      <div className="flex-1">
                         <p className="text-sm font-bold text-dark-text">capa_produto.png</p>
                         <p className="text-xs text-gray-500 mt-1">Recomendado: 1000x1500px (Max 2MB). Formatos: JPG, PNG.</p>
                      </div>
                      <button className="w-full sm:w-auto px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center justify-center gap-2">
                        <ImageIcon size={16} /> Alterar
                      </button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CHECKOUT */}
        {activeTab === 'checkout' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Payment Methods */}
            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-soft border border-gray-100">
               <h3 className="text-lg font-bold text-dark-text mb-4 flex items-center gap-2">
                  <CreditCard size={20} className="text-brand-primary" />
                  Métodos de Pagamento
               </h3>
               <p className="text-sm text-gray-500 mb-6">Escolha quais opções estarão disponíveis para seu cliente.</p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-gray-100 shrink-0">
                           <Smartphone size={24} />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-dark-text">e-kwanza</p>
                           <p className="text-xs text-gray-500 mt-0.5">Unitel Money / MCX</p>
                        </div>
                     </div>
                     <div 
                        onClick={() => setFormData({
                          ...formData, 
                          checkoutConfig: {...formData.checkoutConfig, paymentMethods: {...formData.checkoutConfig.paymentMethods, ekwanza: !formData.checkoutConfig.paymentMethods.ekwanza}}
                        })}
                        className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-200 flex items-center ${formData.checkoutConfig.paymentMethods.ekwanza ? 'bg-brand-primary' : 'bg-gray-300'}`}
                     >
                        <div className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 ${formData.checkoutConfig.paymentMethods.ekwanza ? 'translate-x-5' : 'translate-x-0'}`} />
                     </div>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm border border-gray-100 shrink-0">
                           <CreditCard size={24} />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-dark-text">Cartão</p>
                           <p className="text-xs text-gray-500 mt-0.5">Multicaixa / Visa</p>
                        </div>
                     </div>
                     <div 
                        onClick={() => setFormData({
                          ...formData, 
                          checkoutConfig: {...formData.checkoutConfig, paymentMethods: {...formData.checkoutConfig.paymentMethods, card: !formData.checkoutConfig.paymentMethods.card}}
                        })}
                        className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-200 flex items-center ${formData.checkoutConfig.paymentMethods.card ? 'bg-brand-primary' : 'bg-gray-300'}`}
                     >
                        <div className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 ${formData.checkoutConfig.paymentMethods.card ? 'translate-x-5' : 'translate-x-0'}`} />
                     </div>
                  </div>
               </div>
            </div>

            {/* Fields Configuration */}
            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-soft border border-gray-100">
               <h3 className="text-lg font-bold text-dark-text mb-6 border-b border-gray-50 pb-4">Campos do Checkout</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <p className="text-sm font-bold text-gray-800 bg-gray-50 p-2 rounded-lg inline-block px-3">Dados do Cliente</p>
                     
                     <label className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer group transition-colors">
                        <span className="text-sm text-gray-600 group-hover:text-dark-text font-medium">Solicitar WhatsApp</span>
                        <input 
                          type="checkbox" 
                          checked={formData.checkoutConfig.askPhone} 
                          onChange={(e) => setFormData({...formData, checkoutConfig: {...formData.checkoutConfig, askPhone: e.target.checked}})}
                          className="w-5 h-5 text-brand-primary rounded border-gray-300 focus:ring-brand-primary accent-brand-primary"
                        />
                     </label>
                     
                     <label className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer group transition-colors">
                        <span className="text-sm text-gray-600 group-hover:text-dark-text font-medium">Solicitar NIF (Fiscal)</span>
                         <input 
                          type="checkbox" 
                          checked={formData.checkoutConfig.askNif} 
                          onChange={(e) => setFormData({...formData, checkoutConfig: {...formData.checkoutConfig, askNif: e.target.checked}})}
                          className="w-5 h-5 text-brand-primary rounded border-gray-300 focus:ring-brand-primary accent-brand-primary"
                        />
                     </label>
                  </div>

                  <div className="space-y-4">
                     <p className="text-sm font-bold text-gray-800 bg-gray-50 p-2 rounded-lg inline-block px-3">Conversão</p>

                     <label className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer group transition-colors">
                        <div className="flex items-center gap-2">
                           <Clock size={18} className="text-gray-400" />
                           <span className="text-sm text-gray-600 group-hover:text-dark-text font-medium">Timer de Escassez (15m)</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={formData.checkoutConfig.countDownTimer} 
                          onChange={(e) => setFormData({...formData, checkoutConfig: {...formData.checkoutConfig, countDownTimer: e.target.checked}})}
                          className="w-5 h-5 text-brand-primary rounded border-gray-300 focus:ring-brand-primary accent-brand-primary"
                        />
                     </label>
                     
                     <label className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer group transition-colors">
                        <div className="flex items-center gap-2">
                           <ToggleLeft size={18} className="text-gray-400" />
                           <span className="text-sm text-gray-600 group-hover:text-dark-text font-medium">Campo de Cupom</span>
                        </div>
                        <input 
                          type="checkbox" 
                          defaultChecked
                          className="w-5 h-5 text-brand-primary rounded border-gray-300 focus:ring-brand-primary accent-brand-primary"
                        />
                     </label>
                  </div>
               </div>
            </div>

          </div>
        )}

        {/* TAB: ORDER BUMP */}
        {activeTab === 'order_bump' && (
          <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-soft border border-gray-100 animate-fade-in">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 border-b border-gray-50 pb-4 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
                     <Zap size={20} className="text-yellow-500 fill-yellow-500" />
                     Order Bump
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Ofereça um produto complementar no momento do pagamento.</p>
                </div>
                <div 
                  onClick={() => setFormData({...formData, orderBump: {...formData.orderBump, enabled: !formData.orderBump.enabled}})}
                  className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 self-start sm:self-center ${formData.orderBump.enabled ? 'bg-green-500' : 'bg-gray-200'}`}
                >
                   <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${formData.orderBump.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
             </div>

             <div className={`space-y-8 transition-all duration-300 ${formData.orderBump.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale filter'}`}>
                <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-xl flex flex-col sm:flex-row gap-4 items-start">
                   <div className="w-8 h-8 mt-1 bg-yellow-100 rounded flex items-center justify-center border border-yellow-300 flex-shrink-0 text-yellow-700">
                      <Eye size={16} />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-gray-800">Pré-visualização no Checkout:</p>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">O cliente verá uma caixa pontilhada com destaque acima do botão de pagar, permitindo adicionar esta oferta com um único clique.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Título da Oferta (Call to Action)</label>
                      <input 
                        type="text" 
                        value={formData.orderBump.title}
                        onChange={(e) => setFormData({...formData, orderBump: {...formData.orderBump, title: e.target.value}})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Preço Promocional (Kz)</label>
                      <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Kz</span>
                         <input 
                           type="number" 
                           value={formData.orderBump.price}
                           onChange={(e) => setFormData({...formData, orderBump: {...formData.orderBump, price: parseFloat(e.target.value)}})}
                           className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-bold"
                         />
                      </div>
                   </div>
                </div>
                
                <div className="space-y-2">
                   <label className="text-sm font-semibold text-gray-700">Descrição Curta (Argumento de Venda)</label>
                   <textarea 
                     rows={3}
                     value={formData.orderBump.description}
                     onChange={(e) => setFormData({...formData, orderBump: {...formData.orderBump, description: e.target.value}})}
                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all resize-none"
                   />
                   <p className="text-xs text-gray-400 text-right">Max. 140 caracteres recomendados.</p>
                </div>
             </div>
          </div>
        )}

        {/* TAB: THANK YOU PAGE */}
        {activeTab === 'thank_you' && (
          <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-soft border border-gray-100 animate-fade-in">
             <h3 className="text-lg font-bold text-dark-text mb-6 border-b border-gray-50 pb-4 flex items-center gap-2">
                <CheckCircle size={20} className="text-green-500" />
                Página de Obrigado (Pós-Venda)
             </h3>

             <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div 
                    onClick={() => setFormData({...formData, thankYou: {...formData.thankYou, type: 'default'}})}
                    className={`cursor-pointer p-6 rounded-xl border-2 transition-all relative ${formData.thankYou.type === 'default' ? 'border-brand-primary bg-indigo-50/50' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}
                   >
                      <div className="flex items-center gap-3 mb-3">
                         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${formData.thankYou.type === 'default' ? 'border-brand-primary' : 'border-gray-300'}`}>
                            {formData.thankYou.type === 'default' && <div className="w-3 h-3 rounded-full bg-brand-primary" />}
                         </div>
                         <span className={`font-bold text-lg ${formData.thankYou.type === 'default' ? 'text-brand-primary' : 'text-gray-700'}`}>Padrão</span>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed pl-9">
                        Resumo da compra, botão de download e instruções.
                      </p>
                   </div>

                   <div 
                    onClick={() => setFormData({...formData, thankYou: {...formData.thankYou, type: 'redirect'}})}
                    className={`cursor-pointer p-6 rounded-xl border-2 transition-all relative ${formData.thankYou.type === 'redirect' ? 'border-brand-primary bg-indigo-50/50' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}
                   >
                      <div className="flex items-center gap-3 mb-3">
                         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${formData.thankYou.type === 'redirect' ? 'border-brand-primary' : 'border-gray-300'}`}>
                            {formData.thankYou.type === 'redirect' && <div className="w-3 h-3 rounded-full bg-brand-primary" />}
                         </div>
                         <span className={`font-bold text-lg ${formData.thankYou.type === 'redirect' ? 'text-brand-primary' : 'text-gray-700'}`}>Redirecionamento</span>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed pl-9">
                        Envie o cliente para uma página externa (Ex: WhatsApp).
                      </p>
                   </div>
                </div>

                {formData.thankYou.type === 'redirect' && (
                   <div className="animate-fade-in space-y-3 p-5 bg-gray-50 rounded-xl border border-gray-200">
                      <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                         <Globe size={16} /> URL de Redirecionamento
                      </label>
                      <input 
                        type="url" 
                        placeholder="https://chat.whatsapp.com/..."
                        value={formData.thankYou.redirectUrl}
                        onChange={(e) => setFormData({...formData, thankYou: {...formData.thankYou, redirectUrl: e.target.value}})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                      />
                      <div className="flex items-start gap-2 mt-1 text-xs text-orange-600 bg-orange-50 p-2 rounded-lg inline-flex w-full sm:w-auto">
                         <Info size={14} className="mt-0.5 flex-shrink-0" />
                         <span>Link deve começar com https://</span>
                      </div>
                   </div>
                )}
             </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-10 text-center pb-6">
           <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
              <MousePointerClick size={14} />
              Todas as alterações são aplicadas imediatamente após salvar.
           </p>
        </div>
      </div>
    </div>
  );
};
