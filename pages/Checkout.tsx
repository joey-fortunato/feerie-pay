
import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Check, ShieldCheck, Smartphone, Loader2, Timer, User, Mail, Phone, Wallet, Copy, XCircle } from 'lucide-react';
import { ordersApi } from '../services/ordersApi';
import { paymentsApi } from '../services/paymentsApi';
import { productsApi } from '../services/productsApi';
import { useToast } from '../contexts/ToastContext';
import { ApiError, getFriendlyErrorMessage } from '../services/api';
import type { ApiProduct, CreateOrderResponse } from '../api/types';

/** Produto demo para quando a API de produtos falhar ou estiver vazia */
const DEMO_PRODUCT: ApiProduct = {
  id: 'demo-1',
  name: 'Produto Demo',
  description: null,
  price: '25000',
  type: 'service',
  file_path: null,
  cover_image_path: null,
  cover_image_url: null,
  external_link: null,
  instructions: null,
  status: 'active',
};

/** Métodos da API: gpo (MCX), ref (EMIS), ekwanza_ticket (QR E-Kwanza) — doc API 3.3 */
type PaymentMethodApi = 'gpo' | 'ref' | 'ekwanza_ticket';

export const Checkout: React.FC<{ productId?: string }> = ({ productId: propProductId }) => {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodApi>('gpo');
  const [orderBump, setOrderBump] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  const [products, setProducts] = useState<ApiProduct[]>([DEMO_PRODUCT]);
  const [selectedProductId, setSelectedProductId] = useState<string>(propProductId || DEMO_PRODUCT.id);
  const [orderResponse, setOrderResponse] = useState<CreateOrderResponse | null>(null);

  const [pollIntervalId, setPollIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    productsApi.list(1, 50).then((r) => {
      const list = Array.isArray(r?.data) ? r.data : [];
      const arr = list as ApiProduct[];
      if (arr.length > 0) {
        setProducts(arr);
        if (propProductId) setSelectedProductId(propProductId);
        else setSelectedProductId((prev) => (arr.some((p) => p.id === prev) ? prev : arr[0].id));
      }
    }).catch(() => {
      setProducts([DEMO_PRODUCT]);
      setSelectedProductId(propProductId || DEMO_PRODUCT.id);
    });
  }, [propProductId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const basePrice = selectedProduct ? parseFloat(selectedProduct.price) : 25000;
  const bumpPrice = 5000;
  const total = basePrice + (orderBump ? bumpPrice : 0);

  useEffect(() => {
    return () => {
      if (pollIntervalId) clearInterval(pollIntervalId);
    };
  }, [pollIntervalId]);

  // Countdown de 90 segundos para aceitar o pagamento (apenas GPO)
  useEffect(() => {
    if (step !== 2 || paymentMethod !== 'gpo') {
      setRemainingSeconds(null);
      return;
    }
    setRemainingSeconds((prev) => (prev == null ? 90 : prev));
    const id = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev == null) return prev;
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step, paymentMethod]);

  // Quando o tempo esgota (GPO), parámos o polling automático
  useEffect(() => {
    if (paymentMethod !== 'gpo') return;
    if (remainingSeconds === 0 && pollIntervalId) {
      clearInterval(pollIntervalId);
      setPollIntervalId(null);
    }
  }, [remainingSeconds, pollIntervalId, paymentMethod]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const startPolling = useCallback((paymentId: string) => {
    const id = setInterval(async () => {
      try {
        const { payment } = await paymentsApi.get(paymentId);
        if (payment.status === 'paid') {
          clearInterval(id);
          setPollIntervalId(null);
          setStep(3);
        } else if (['failed', 'cancelled', 'expired'].includes(payment.status)) {
          clearInterval(id);
          setPollIntervalId(null);
          toast.error('O pagamento foi cancelado ou expirou.');
          setStep(1);
        }
      } catch (err) {
        console.error('Erro ao verificar status do pagamento:', err);
      }
    }, 5000);
    setPollIntervalId(id);
  }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (products.length === 0) {
      toast.error('Nenhum produto disponível. Adicione produtos primeiro.');
      return;
    }
    if (!selectedProductId || !formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error('Preencha nome, email e telefone.');
      return;
    }
    if (selectedProductId === DEMO_PRODUCT.id) {
      toast.error('Adicione produtos no painel e tente novamente. O produto demo não permite criar cobranças.');
      return;
    }

    const phone = formData.phone.trim();
    const mobileNumber = phone.replace(/\D/g, '').slice(-9);
    if (mobileNumber.length < 9) {
      toast.error('Digite um número de telefone válido (9 dígitos).');
      return;
    }
    const phoneFormatted = phone.startsWith('+') ? phone : `+244 ${mobileNumber}`;

    const payload: Parameters<typeof ordersApi.create>[0] = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: phoneFormatted,
      product_id: selectedProductId,
      payment_method: paymentMethod,
    };
    if (paymentMethod === 'gpo') (payload as { phone_number?: string }).phone_number = phoneFormatted;
    if (paymentMethod === 'ekwanza_ticket') (payload as { mobile_number?: string }).mobile_number = mobileNumber;

    setLoading(true);
    try {
      const res = await ordersApi.create(payload);
      const paymentId = res?.payment?.id;
      if (!paymentId) {
        toast.error('Resposta inválida da API.');
        setLoading(false);
        return;
      }
      setOrderResponse(res);
      setLoading(false);
      setStep(2);
      setRemainingSeconds(90);
      startPolling(paymentId);
    } catch (err: unknown) {
      const msg = getFriendlyErrorMessage(err instanceof ApiError ? err.message : (err instanceof Error ? err.message : 'Erro ao criar pedido.'));
      toast.error(msg);
      setLoading(false);
    }
  };

  const payment = orderResponse?.payment;
  const gatewayResponse = orderResponse?.gateway_response;

  const getQRsrc = (): string | null => {
    const raw = payment?.raw_response;
    const gw = gatewayResponse;
    let qr = (raw as { QRCode?: string } | undefined)?.QRCode ?? (gw as { QRCode?: string } | undefined)?.QRCode;
    if (!qr) return null;
    return qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`;
  };

  const formatExpiresAt = (iso: string | null | undefined): string => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getRefInfo = () => {
    if (!payment) {
      return { entity: '10111', reference: '—' };
    }
    const raw = payment.raw_response as unknown as {
      responseStatus?: { reference?: { entity?: string; referenceNumber?: string } };
    } | null;
    const ref = raw?.responseStatus?.reference;
    const entityFromRaw = ref?.entity;
    const refNumFromRaw = ref?.referenceNumber;

    const parts = (payment.gateway_reference || '').trim().split(/\s+/);
    const entityFromGateway = parts[0] || undefined;
    const refFromGateway = parts.slice(1).join(' ') || undefined;

    const entity = entityFromRaw || entityFromGateway || '10111';
    const reference =
      refNumFromRaw ||
      refFromGateway ||
      payment.gateway_code ||
      payment.gateway_reference ||
      '—';

    return { entity, reference };
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
              <span className="font-medium">#{orderResponse?.order?.id?.slice(-8) || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Método:</span>
              <span className="font-medium">
                {paymentMethod === 'gpo' && 'Multicaixa Express'}
                {paymentMethod === 'ref' && 'Referência Multicaixa'}
                {paymentMethod === 'ekwanza_ticket' && 'E-Kwanza'}
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

  // --- STEP 2: WAITING PAYMENT ---
  if (step === 2 && payment) {
    const qrSrc = getQRsrc();
    const isTicket = payment.gateway === 'ekwanza_ticket';
    const isRef = payment.gateway === 'ref';
    const isGpo = payment.gateway === 'gpo';

    return (
      <div className="min-h-screen bg-bg-main flex flex-col lg:flex-row">
        <div className="lg:w-1/2 bg-[#29363D] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8 opacity-80">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center"><ShieldCheck size={18} /></div>
              <span className="font-medium text-sm tracking-wide">CHECKOUT SEGURO</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">{selectedProduct?.name || 'Produto'}</h1>
            <p className="text-gray-300 text-lg">Total: Kz {total.toLocaleString()}</p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
        </div>

        <div className="lg:w-1/2 p-6 lg:p-16 overflow-y-auto">
          <div className="max-w-md mx-auto pt-10 animate-fade-in">
            {isGpo && (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Smartphone size={32} className="text-orange-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-dark-text">Aguardando aprovação</h2>
                  <p className="text-gray-500 mt-2">Abra a app Multicaixa Express no seu telemóvel e confirme o pagamento.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600"><Smartphone size={20} /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Pedido enviado para</p>
                      <p className="text-sm text-gray-500">{formData.phone}</p>
                    </div>
                  </div>
                  <div className="flex justify-center py-4">
                    {remainingSeconds === 0 ? (
                      <XCircle size={32} className="text-red-500" />
                    ) : (
                      <Loader2 size={32} className="text-brand-primary animate-spin" />
                    )}
                  </div>
                  <p className="text-center text-sm text-gray-500">
                    {remainingSeconds === 0
                      ? 'O pagamento não foi concluído a tempo. Tente novamente.'
                      : 'Aguardando confirmação no app Multicaixa Express...'}
                  </p>
                  {remainingSeconds !== null && remainingSeconds > 0 && (
                    <p className="text-center text-xs text-gray-400 mt-1">
                      Tem <span className="font-semibold text-brand-primary">{remainingSeconds}s</span> para aceitar o pagamento.
                    </p>
                  )}
                </div>
              </>
            )}

            {isRef && (() => {
              const { entity, reference } = getRefInfo();
              const amount = Number(payment.amount || 0);
              return (
                <>
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-soft mb-6 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 text-center space-y-2">
                      <h2 className="text-lg font-bold text-dark-text">Instruções de Pagamento</h2>
                      <img
                        src="/assets/images/multicaixa.png"
                        alt="Multicaixa"
                        className="h-8 mx-auto object-contain"
                      />
                    </div>
                    <div className="divide-y divide-gray-100 text-sm">
                      <div className="flex items-center justify-between px-6 py-3">
                        <span className="text-gray-500">Entidade:</span>
                        <span className="font-mono font-semibold text-dark-text">{entity}</span>
                      </div>
                      <div
                        className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => reference !== '—' && copyToClipboard(reference)}
                      >
                        <span className="text-gray-500">Referência:</span>
                        <span className="font-mono font-semibold text-brand-primary flex items-center gap-2">
                          {reference}
                          <Copy size={14} className="text-gray-400" />
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-6 py-3">
                        <span className="text-gray-500">Valor:</span>
                        <span className="font-mono font-semibold text-dark-text">
                          {amount ? `${amount.toFixed(2)} Kz` : `Kz ${total.toLocaleString()}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-6 py-3">
                        <span className="text-gray-500">Validade:</span>
                        <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                          <Timer size={12} className="text-gray-400" />
                          {payment.expires_at ? formatExpiresAt(payment.expires_at) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 text-center max-w-sm mx-auto">
                    O recibo emitido pelo terminal Multicaixa é um comprovativo do pagamento. Guarde-o.
                  </p>
                </>
              );
            })()}

            {isTicket && (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Smartphone size={32} className="text-brand-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-dark-text">Escaneie o QR Code</h2>
                  <p className="text-gray-500 mt-2">Use a app E-Kwanza para pagar.</p>
                </div>
                <div className="bg-white border-2 border-brand-primary/20 rounded-2xl p-6 shadow-lg mb-6">
                  {qrSrc ? (
                    <div className="flex flex-col items-center gap-4 py-4">
                      <img src={qrSrc} alt="QR Code para pagamento" className="w-48 h-48" />
                      {payment.expires_at && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Timer size={12} /> Válido até {formatExpiresAt(payment.expires_at)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">QR Code indisponível.</p>
                  )}
                </div>
              </>
            )}

            {!isRef && (
              <div className="mt-8 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Loader2 size={16} className="animate-spin text-brand-primary" />
                  Verificando pagamento automaticamente...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- STEP 1: FORM ---
  return (
    <div className="min-h-screen bg-bg-main flex flex-col lg:flex-row">
      <div className="lg:w-1/2 bg-[#29363D] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8 opacity-80">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center"><ShieldCheck size={18} /></div>
            <span className="font-medium text-sm tracking-wide">CHECKOUT SEGURO</span>
          </div>
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">{selectedProduct?.name || 'Produto'}</h1>
            <p className="text-gray-300 text-lg leading-relaxed">Checkout seguro via Feerie Pay.</p>
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

      <div className="lg:w-1/2 p-6 lg:p-16 overflow-y-auto">
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

          <div className="space-y-3">
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Nome Completo"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all bg-gray-50/50" required />
            </div>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Seu e-mail principal"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all bg-gray-50/50" required />
            </div>
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Telefone (+244 9xx...)"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all bg-gray-50/50" required />
            </div>
          </div>

          <hr className="border-gray-100" />

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 block">Método de Pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              <div onClick={() => setPaymentMethod('gpo')}
                className={`cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all min-h-[100px] ${paymentMethod === 'gpo' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                <img
                  src="/assets/images/gpo.png"
                  alt="Multicaixa Express"
                  className="h-8 w-auto object-contain"
                />
                <span className={`font-bold text-[10px] uppercase text-center leading-tight ${paymentMethod === 'gpo' ? 'text-orange-600' : 'text-gray-500'}`}>Multicaixa Express</span>
              </div>
              <div onClick={() => setPaymentMethod('ref')}
                className={`cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all min-h-[100px] ${paymentMethod === 'ref' ? 'border-brand-primary bg-indigo-50/30' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                <img
                  src="/assets/images/ref.png"
                  alt="Referência Multicaixa"
                  className="h-8 w-auto object-contain"
                />
                <span className={`font-bold text-[10px] uppercase text-center leading-tight ${paymentMethod === 'ref' ? 'text-brand-primary' : 'text-gray-500'}`}>Referência Multicaixa</span>
              </div>
              <div onClick={() => setPaymentMethod('ekwanza_ticket')}
                className={`cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all min-h-[100px] ${paymentMethod === 'ekwanza_ticket' ? 'border-brand-primary bg-indigo-50/30' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                <img
                  src="/assets/images/e.png"
                  alt="Ekwanza"
                  className="h-8 w-auto object-contain"
                />
                <span className={`font-bold text-[10px] uppercase text-center leading-tight ${paymentMethod === 'ekwanza_ticket' ? 'text-brand-primary' : 'text-gray-500'}`}>E-Kwanza</span>
              </div>
            </div>

            {paymentMethod === 'gpo' && (
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-xs text-orange-900">
                  Será enviada uma notificação para <b>{formData.phone || 'o número acima'}</b>. Certifique-se que está associado ao Multicaixa Express.
                </p>
              </div>
            )}
            {paymentMethod === 'ref' && (
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs text-indigo-900">
                  Será gerada uma referência para pagar em qualquer ATM ou terminal Multicaixa.
                </p>
              </div>
            )}
            {paymentMethod === 'ekwanza_ticket' && (
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs text-indigo-900">
                  Será gerado um QR Code. Escaneie com a app E-Kwanza para pagar. O número <b>{formData.phone || 'acima'}</b> será associado ao ticket.
                </p>
              </div>
            )}
          </div>

          <div className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all ${orderBump ? 'border-yellow-400 bg-yellow-50' : 'border-dashed border-gray-300 hover:border-gray-400'}`}
            onClick={() => setOrderBump(!orderBump)}>
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${orderBump ? 'bg-yellow-500 border-yellow-500' : 'border-gray-300 bg-white'}`}>
                {orderBump && <Check size={14} className="text-white" />}
              </div>
              <div>
                <h4 className="font-bold text-dark-text text-sm">OFERTA: Mentoria de 1 Hora</h4>
                <p className="text-xs text-gray-600 mt-1">Adicione uma sessão por apenas <span className="font-bold text-red-500">+ Kz {bumpPrice.toLocaleString()}</span>.</p>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-brand-primary text-white font-bold text-lg py-4 rounded-xl hover:bg-brand-hover transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? <><Loader2 className="animate-spin" /> Processando...</> : <><Lock size={20} /> Pagar Kz {total.toLocaleString()}</>}
          </button>

          <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-2">
            <ShieldCheck size={14} /> Pagamento 100% Seguro via Feerie Pay
          </p>
        </form>
      </div>
    </div>
  );
};
