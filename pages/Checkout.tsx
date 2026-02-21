
import React, { useState, useEffect } from 'react';
import { Lock, Check, ShieldCheck, Smartphone, CreditCard, Loader2, Timer, AlertCircle, User, Mail, Phone, Wallet } from 'lucide-react';
import { ekwanzaApi } from '../services/ekwanzaApi';
import { ordersApi } from '../services/ordersApi';
import { productsApi } from '../services/productsApi';
import { EKwanzaStatus } from '../types';
import type { ApiProduct } from '../api/types';

export const Checkout: React.FC<{ productId?: string }> = ({ productId: propProductId }) => {
  // Steps: 1: Checkout (Info + Payment), 2: Waiting Payment (É-kwanza/MCX), 3: Success
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'ekwanza' | 'card' | 'multicaixa_express'>('multicaixa_express');
  const [orderBump, setOrderBump] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Product (for order creation)
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(propProductId || '');
  const [orderCreated, setOrderCreated] = useState<{ orderId: string; total: string } | null>(null);

  useEffect(() => {
    productsApi.list(1, 50).then((r) => {
      const list = Array.isArray(r?.data) ? r.data : [];
      const arr = list as ApiProduct[];
      setProducts(arr);
      if (propProductId) setSelectedProductId(propProductId);
      else if (arr.length > 0) setSelectedProductId((prev) => prev || arr[0].id);
    }).catch(() => {});
  }, [propProductId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const basePrice = selectedProduct ? parseFloat(selectedProduct.price) : 25000;
  const bumpPrice = 5000;

  // É-kwanza State
  const [ekwanzaCode, setEkwanzaCode] = useState<string | null>(null);
  const [pollIntervalId, setPollIntervalId] = useState<any>(null);

  // Derived State
  const total = basePrice + (orderBump ? bumpPrice : 0);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalId) clearInterval(pollIntervalId);
    };
  }, [pollIntervalId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const startEkwanzaPolling = (ticketCode: string) => {
    const id = setInterval(async () => {
      try {
        const response = await ekwanzaApi.checkPaymentStatus(ticketCode);
        console.log('Verificando status É-kwanza:', response.Status);

        if (response.Status === EKwanzaStatus.PROCESSED) {
          clearInterval(id);
          setStep(3); // Success
        } else if (response.Status === EKwanzaStatus.EXPIRED || response.Status === EKwanzaStatus.CANCELLED) {
           clearInterval(id);
           alert('O tempo para pagamento expirou ou foi cancelado.');
           setStep(1); // Back to start
        }
      } catch (error) {
        console.error("Erro ao verificar status", error);
      }
    }, 3000); // Poll every 3 seconds
    setPollIntervalId(id);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (products.length === 0) {
      alert('Nenhum produto disponível. Adicione produtos primeiro.');
      return;
    }
    if (!selectedProductId || !formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      alert('Preencha nome, email e telefone.');
      return;
    }
    setLoading(true);

    try {
      const res = await ordersApi.create({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        product_id: selectedProductId,
        gateway: paymentMethod === 'ekwanza' ? 'ekwanza' : 'appypay',
      });
      setOrderCreated({ orderId: res.order.id, total: res.order.total });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao criar pedido.');
      setLoading(false);
      return;
    }

    if (paymentMethod === 'ekwanza') {
      try {
        const response = await ekwanzaApi.createPaymentTicket({
          amount: total,
          referenceCode: orderCreated?.orderId || `ORD-${Math.floor(Math.random() * 10000)}`,
          mobileNumber: formData.phone
        });

        setEkwanzaCode(response.Code);
        setLoading(false);
        setStep(2); // Move to "Waiting Payment" screen

        startEkwanzaPolling(response.Code);

      } catch (error) {
        alert("Erro ao comunicar com É-kwanza. Tente novamente.");
        setLoading(false);
      }
    } else if (paymentMethod === 'multicaixa_express') {
        // Simulação do Multicaixa Express (Push Notification)
        setTimeout(() => {
            setLoading(false);
            setStep(2); // Vai para tela de "Aceite no seu telemóvel"
            // Simula sucesso após 4 segundos
            setTimeout(() => setStep(3), 4000);
        }, 1500);
    } else {
      // Card Simulation - Fast track
      setTimeout(() => {
        setLoading(false);
        setStep(3);
      }, 2000);
    }
  };

  // --- SUCCESS STEP (3) ---
  if (step === 3) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-soft p-8 max-w-md w-full text-center border border-green-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
            <Check size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-dark-text mb-2">Pagamento Confirmado!</h2>
          <p className="text-gray-500 mb-8">Enviamos os detalhes do seu acesso para o e-mail <b>{formData.email}</b>.</p>
            <div className="bg-gray-50 p-4 rounded-xl mb-6 text-left">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-500">Referência:</span>
                <span className="font-medium">#{orderCreated?.orderId || '—'}</span>
              </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Método:</span>
              <span className="font-medium capitalize">
                  {paymentMethod === 'card' && 'Cartão Visa/Master'}
                  {paymentMethod === 'ekwanza' && 'E-Kwanza'}
                  {paymentMethod === 'multicaixa_express' && 'MCX Express'}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200">
              <span className="text-gray-500">Total Pago:</span>
              <span className="font-bold text-brand-primary">Kz {total.toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-brand-primary text-white font-bold py-3 rounded-xl hover:bg-brand-hover transition-colors"
          >
            Voltar para Loja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main flex flex-col lg:flex-row">
      {/* Left Side - Product Info (Sticky) */}
      <div className="lg:w-1/2 bg-[#29363D] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8 opacity-80">
             <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
               <ShieldCheck size={18} />
             </div>
             <span className="font-medium text-sm tracking-wide">CHECKOUT SEGURO</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">{selectedProduct?.name || 'Produto'}</h1>
            <p className="text-gray-300 text-lg leading-relaxed">Checkout seguro via Feerie Pay. Acesso vitalício e suporte.</p>
          </div>

          <div className="flex items-center gap-4 mb-8">
             <img src="https://picsum.photos/100/100" alt="Author" className="w-12 h-12 rounded-full border-2 border-white/20" />
             <div>
                <p className="font-semibold">Por João Manuel</p>
                <p className="text-sm text-gray-400">Especialista em E-commerce</p>
             </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/10">
           <div className="flex justify-between items-end">
             <span className="text-gray-400">Total a pagar</span>
             <span className="text-3xl font-bold">Kz {total.toLocaleString()}</span>
           </div>
        </div>

        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
      </div>

      {/* Right Side - Form */}
      <div className="lg:w-1/2 p-6 lg:p-16 overflow-y-auto">

        {/* STEP 2: WAITING SCREEN (Different for MCX vs E-Kwanza) */}
        {step === 2 ? (
           <div className="max-w-md mx-auto pt-10 animate-fade-in">
              {paymentMethod === 'ekwanza' ? (
                <>
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                        <Smartphone size={32} className="text-brand-primary" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white animate-pulse"></div>
                        </div>
                        <h2 className="text-2xl font-bold text-dark-text">Aguardando E-Kwanza</h2>
                        <p className="text-gray-500 mt-2">Siga as instruções abaixo para finalizar.</p>
                    </div>

                    <div className="bg-white border-2 border-brand-primary/20 rounded-2xl p-6 shadow-lg mb-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100">
                            <div className="h-full bg-brand-primary animate-loading-bar"></div>
                        </div>

                        <div className="flex flex-col items-center gap-4 py-4">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Código de Referência</p>
                            <div className="text-4xl font-mono font-bold text-brand-primary tracking-wider select-all">
                            {ekwanzaCode}
                            </div>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Timer size={12} /> Expira em 15 minutos
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-brand-primary shadow-sm flex-shrink-0">1</div>
                            <p className="text-sm text-gray-600">Abra o aplicativo <b>Unitel Money</b> ou disque <b>*449#</b>.</p>
                        </div>
                        <div className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-brand-primary shadow-sm flex-shrink-0">2</div>
                            <p className="text-sm text-gray-600">Vá em <b>Pagamentos</b> e insira o código de referência.</p>
                        </div>
                    </div>
                </>
              ) : (
                // MULTICAIXA EXPRESS WAITING SCREEN
                <>
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                        <CreditCard size={32} className="text-orange-500" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                        </div>
                        <h2 className="text-2xl font-bold text-dark-text">Abra seu Multicaixa Express</h2>
                        <p className="text-gray-500 mt-2">Enviamos uma notificação para o seu telemóvel.</p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                                <Smartphone size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Pedido de Pagamento Enviado</p>
                                <p className="text-sm text-gray-500">{formData.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center py-6">
                             <Loader2 size={32} className="text-brand-primary animate-spin" />
                        </div>
                        <p className="text-center text-sm text-gray-500">Aguardando sua confirmação no app...</p>
                    </div>
                </>
              )}

              <div className="mt-8 text-center">
                 {paymentMethod === 'ekwanza' && (
                     <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
                        <Loader2 size={16} className="animate-spin text-brand-primary" />
                        Detectando pagamento automaticamente...
                    </div>
                 )}
                 <button
                   onClick={() => setStep(1)}
                   className="text-sm text-red-500 font-medium hover:underline"
                 >
                   Cancelar Pedido
                 </button>
              </div>
           </div>
        ) : (
          // STEP 1: COMBINED FORM
          <form onSubmit={handlePayment} className="max-w-md mx-auto space-y-6">

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-dark-text">Finalizar Compra</h2>
              <p className="text-gray-500 text-sm">Preencha seus dados e escolha como pagar.</p>
            </div>

            {products.length > 1 && (
              <div className="space-y-2 mb-4">
                <label className="text-sm font-semibold text-gray-700">Produto</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — Kz {parseFloat(p.price).toLocaleString()}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Personal Info - Compact */}
            <div className="space-y-3">
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nome Completo"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all bg-gray-50/50"
                  required
                />
              </div>
              <div className="relative">
                 <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Seu e-mail principal"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all bg-gray-50/50"
                  required
                />
              </div>
              <div className="relative">
                 <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Telefone (9xx...)"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all bg-gray-50/50"
                  required
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 block">Método de Pagamento</label>
              <div className="grid grid-cols-3 gap-2">
                 
                 {/* Multicaixa Express (MCX) */}
                 <div
                  onClick={() => setPaymentMethod('multicaixa_express')}
                  className={`cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all relative min-h-[100px] ${paymentMethod === 'multicaixa_express' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                 >
                   {paymentMethod === 'multicaixa_express' && <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></div>}
                   <Smartphone className={paymentMethod === 'multicaixa_express' ? 'text-orange-500' : 'text-gray-400'} size={24} />
                   <span className={`font-bold text-[10px] uppercase text-center leading-tight ${paymentMethod === 'multicaixa_express' ? 'text-orange-600' : 'text-gray-500'}`}>MCX Express</span>
                 </div>

                 {/* E-Kwanza */}
                 <div
                  onClick={() => setPaymentMethod('ekwanza')}
                  className={`cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all relative min-h-[100px] ${paymentMethod === 'ekwanza' ? 'border-brand-primary bg-indigo-50/30' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                 >
                   {paymentMethod === 'ekwanza' && <div className="absolute top-2 right-2 w-2 h-2 bg-brand-primary rounded-full"></div>}
                   <Wallet className={paymentMethod === 'ekwanza' ? 'text-brand-primary' : 'text-gray-400'} size={24} />
                   <span className={`font-bold text-[10px] uppercase text-center leading-tight ${paymentMethod === 'ekwanza' ? 'text-brand-primary' : 'text-gray-500'}`}>E-kwanza</span>
                 </div>

                 {/* Visa / Card */}
                 <div
                  onClick={() => setPaymentMethod('card')}
                  className={`cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all relative min-h-[100px] ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                 >
                   {paymentMethod === 'card' && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>}
                   <CreditCard className={paymentMethod === 'card' ? 'text-blue-500' : 'text-gray-400'} size={24} />
                   <span className={`font-bold text-[10px] uppercase text-center leading-tight ${paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-500'}`}>Visa / Master</span>
                 </div>
              </div>

              {/* MCX Info */}
              {paymentMethod === 'multicaixa_express' && (
                 <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-2 animate-fade-in">
                    <div className="flex items-start gap-2">
                        <Smartphone size={16} className="text-orange-500 mt-0.5" />
                        <p className="text-xs text-orange-900">
                            Enviaremos uma notificação para o número <b>{formData.phone || 'digitado acima'}</b>. Certifique-se que este número está associado ao seu Multicaixa Express.
                        </p>
                    </div>
                 </div>
              )}

              {/* E-kwanza Info */}
              {paymentMethod === 'ekwanza' && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-fade-in flex gap-3 items-start">
                  <AlertCircle size={16} className="text-brand-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-indigo-900">
                     Geraremos um código de referência. Você poderá pagar via Unitel Money, MCX ou Movicel.
                  </p>
                </div>
              )}

              {/* Card Form (Shown only if card is selected) */}
              {paymentMethod === 'card' && (
                 <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3 animate-fade-in">
                    <input type="text" placeholder="Número do Cartão (Visa/Master)" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="MM/AA" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500" />
                      <input type="text" placeholder="CVC" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500" />
                    </div>
                    <input type="text" placeholder="Nome no Cartão" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500" />
                 </div>
              )}
            </div>

            {/* Order Bump */}
            <div
              className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all ${orderBump ? 'border-yellow-400 bg-yellow-50' : 'border-dashed border-gray-300 hover:border-gray-400'}`}
              onClick={() => setOrderBump(!orderBump)}
            >
              <div className="flex items-start gap-3">
                 <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${orderBump ? 'bg-yellow-500 border-yellow-500' : 'border-gray-300 bg-white'}`}>
                   {orderBump && <Check size={14} className="text-white" />}
                 </div>
                 <div>
                   <h4 className="font-bold text-dark-text text-sm">OFERTA: Mentoria de 1 Hora</h4>
                   <p className="text-xs text-gray-600 mt-1">Adicione uma sessão privada por apenas <span className="font-bold text-red-500">+ Kz {bumpPrice.toLocaleString()}</span>.</p>
                 </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-white font-bold text-lg py-4 rounded-xl hover:bg-brand-hover transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <Lock size={20} /> Pagar Kz {total.toLocaleString()}
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
                <ShieldCheck size={14} /> Pagamento 100% Seguro via Feerie Pay
              </p>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};