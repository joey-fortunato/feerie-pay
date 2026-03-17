import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { paymentLinksApi } from '../services/paymentLinksApi';
import type { ApiPaymentLink } from '../services/paymentLinksApi';

export const PublicPaymentLink: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [link, setLink] = useState<ApiPaymentLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const path = location.pathname || '';
    const match = path.match(/\/p\/([^/]+)/);
    const code = match?.[1];
    if (!code) {
      setError('Link de pagamento inválido.');
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await paymentLinksApi.getByCode(code);
        setLink(data);
        const search = new URLSearchParams();
        if (data.payment_id) search.set('payment_id', data.payment_id);
        if (data.order_id) search.set('order_id', data.order_id);
        search.set('link_code', data.code || code);
        if (data.title) search.set('link_title', data.title);
        if (typeof data.amount === 'number') search.set('link_amount', String(data.amount));
        navigate(`/checkout?${search.toString()}`, { replace: true });
      } catch (err) {
        console.error('[PublicPaymentLink] erro ao carregar link:', err);
        setError('Este link de pagamento é inválido ou expirou.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-main">
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 px-8 py-10 flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-brand-primary" />
          <p className="text-sm text-gray-600">
            A preparar o checkout seguro{link?.title ? ` para ${link.title}` : ''}...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-main">
        <div className="bg-white rounded-2xl shadow-soft border border-red-100 px-8 py-10 flex flex-col items-center gap-3 max-w-md text-center">
          <AlertCircle size={32} className="text-red-500" />
          <h1 className="text-lg font-bold text-dark-text">Link de pagamento indisponível</h1>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return null;
};

