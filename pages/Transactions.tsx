
import React, { useState, useEffect, useCallback } from 'react';
import { Download, Filter, X, ChevronRight, Copy, Loader2, AlertCircle, DollarSign, Receipt, Wallet } from 'lucide-react';
import { TransactionStatus } from '../types';
import { ordersApi } from '../services/ordersApi';
import { flattenPaymentsFromOrders, shortId, formatDateTime } from '../lib/orderMapper';
import type { PaymentDisplay } from '../lib/orderMapper';
import { ApiError, getFriendlyErrorMessage } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import type { ApiOrder } from '../api/types';

const StatusBadge = ({ status }: { status: TransactionStatus }) => {
  switch (status) {
    case TransactionStatus.PAID:
      return <span className="flex items-center gap-1 text-xs font-medium bg-green-100 text-green-700 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Pago</span>;
    case TransactionStatus.PENDING:
      return <span className="flex items-center gap-1 text-xs font-medium bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Pendente</span>;
    case TransactionStatus.FAILED:
      return <span className="flex items-center gap-1 text-xs font-medium bg-red-100 text-red-700 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Falhou</span>;
    default:
      return <span className="flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{status}</span>;
  }
};

const gatewayLabel = (gateway: string) => {
  if (gateway === 'gpo') return 'Multicaixa Express';
  if (gateway === 'ref') return 'Referência Multicaixa';
  if (gateway === 'ekwanza_ticket' || gateway === 'ekwanza' || gateway === 'appypay') return 'Ekwanza';
  return gateway;
};

export const Transactions: React.FC = () => {
  const toast = useToast();
  const [selectedPayment, setSelectedPayment] = useState<PaymentDisplay | null>(null);
  const [payments, setPayments] = useState<PaymentDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState<{
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  } | null>(null);

  const fetchPayments = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Buscar TODAS as páginas de pedidos e achatar todos os payments
      const first = (await ordersApi.list(page, 20)) as unknown as Record<string, unknown>;
      const firstData = Array.isArray(first?.data) ? (first.data as ApiOrder[]) : [];
      const firstMeta = (first?.meta ?? first) as Record<string, unknown> | undefined;
      const totalOrders = Number(firstMeta?.total ?? firstData.length) || 0;
      const perPage = Number(firstMeta?.per_page ?? 20) || 20;
      const currentPageNum = Number(firstMeta?.current_page ?? page) || 1;
      const lastPage = Number(firstMeta?.last_page) || Math.max(1, Math.ceil(totalOrders / perPage));

      const allOrders: ApiOrder[] = [...firstData];
      for (let p = 1; p <= lastPage; p += 1) {
        if (p === currentPageNum) continue;
        const resPage = (await ordersApi.list(p, perPage)) as unknown as Record<string, unknown>;
        const dataPage = Array.isArray(resPage?.data) ? (resPage.data as ApiOrder[]) : [];
        allOrders.push(...dataPage);
      }

      const flattened = flattenPaymentsFromOrders(allOrders);
      setPayments(flattened);
      setPaginationMeta({
        current_page: currentPageNum,
        per_page: perPage,
        total: totalOrders,
        last_page: lastPage,
      });
    } catch (err) {
      setError(getFriendlyErrorMessage(err instanceof ApiError ? err.message : 'Erro ao carregar transações.'));
      console.error('[Transactions] fetchPayments error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments(currentPage);
  }, [currentPage, fetchPayments]);

  const totalTransactions = payments.length;
  const volume = payments.filter((p) => p.status === TransactionStatus.PAID).reduce((acc, p) => acc + p.amount, 0);
  const paidCount = payments.filter((p) => p.status === TransactionStatus.PAID).length;

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto relative space-y-8">
      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700">
          <AlertCircle size={20} />
          <span className="flex-1">{error}</span>
          <button onClick={() => fetchPayments(currentPage)} className="text-sm font-semibold hover:underline">
            Tentar novamente
          </button>
        </div>
      )}
      <div>
        <h2 className="text-2xl font-bold text-dark-text">Transações</h2>
        <p className="text-gray-500 text-sm">Gerencie todos os seus pagamentos recebidos.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white relative overflow-hidden rounded-2xl p-6 shadow-soft border border-gray-50 group hover:shadow-lg transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl group-hover:bg-emerald-400/20 transition-all duration-500"></div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center mb-4 shadow-sm text-emerald-600">
              <Receipt size={20} />
            </div>
            <p className="text-3xl font-bold text-dark-text mb-1">{totalTransactions.toLocaleString()}</p>
            <p className="text-sm text-gray-500">
              Transações nesta página.
            </p>
          </div>
        </div>

        <div className="bg-white relative overflow-hidden rounded-2xl p-6 shadow-soft border border-gray-50 group hover:shadow-lg transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-green-400/10 rounded-full blur-2xl group-hover:bg-green-400/20 transition-all duration-500"></div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center mb-4 shadow-sm text-green-600">
              <Wallet size={20} />
            </div>
            <p className="text-3xl font-bold text-dark-text mb-1">
              Kz {volume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500">
              Volume <span className="font-semibold text-green-600">({paidCount} pagas)</span>.
            </p>
          </div>
        </div>

        <div className="bg-white relative overflow-hidden rounded-2xl p-6 shadow-soft border border-gray-50 group hover:shadow-lg transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl group-hover:bg-brand-primary/20 transition-all duration-500"></div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center mb-4 shadow-sm text-brand-primary">
              <DollarSign size={20} />
            </div>
            <p className="text-3xl font-bold text-dark-text mb-1">
              {totalTransactions > 0 ? (volume / paidCount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
            </p>
            <p className="text-sm text-gray-500">
              Ticket médio (pagas).
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1" />
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter size={16} />
            <span className="hidden sm:inline">Filtrar</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Download size={16} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 size={32} className="animate-spin mb-4" />
            <p>A carregar transações...</p>
          </div>
        ) : payments.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID Transação</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Pedido</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Gateway</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Valor</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                    <th className="text-right py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPayment(p)}
                      className="hover:bg-gray-50 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-brand-primary font-mono">{shortId(p.id)}</td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-600">#PED-{shortId(p.orderId)}</td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-medium text-dark-text">{p.customerName}</p>
                          <p className="text-xs text-gray-400">{p.customerEmail}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{gatewayLabel(p.gateway)}</td>
                      <td className="py-4 px-6 text-sm font-bold text-dark-text">Kz {p.amount.toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">{formatDateTime(p.createdAt)}</td>
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
            {paginationMeta && paginationMeta.total > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <p className="text-sm text-gray-500">
                  Mostrando {payments.length} transações da página {paginationMeta.current_page} de {paginationMeta.last_page} pedidos
                </p>
                {paginationMeta.last_page > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((x) => Math.max(1, x - 1))}
                      disabled={paginationMeta.current_page <= 1}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-600">
                      Página {paginationMeta.current_page} de {paginationMeta.last_page}
                    </span>
                    <button
                      onClick={() => setCurrentPage((x) => Math.min(paginationMeta.last_page, x + 1))}
                      disabled={paginationMeta.current_page >= paginationMeta.last_page}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <DollarSign size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-dark-text">Ainda não há transações</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-xs">Os pagamentos aparecerão aqui.</p>
          </div>
        )}
      </div>

      {/* Payment Detail Drawer */}
      {selectedPayment && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedPayment(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 ease-out border-l border-gray-100">
            <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-6 py-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-500 mb-1">Transação</h2>
                <span className="text-xs font-mono text-gray-400" title={selectedPayment.id}>{shortId(selectedPayment.id)}</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-dark-text">Kz {selectedPayment.amount.toLocaleString()}</span>
                  <span className="text-sm text-gray-400">AOA</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedPayment.status} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pedido</span>
                  <span className="font-medium">#PED-{shortId(selectedPayment.orderId)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Gateway</span>
                  <span className="font-medium">{gatewayLabel(selectedPayment.gateway)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Data</span>
                  <span className="font-medium">{formatDateTime(selectedPayment.createdAt)}</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Cliente</span>
                <div className="mt-2 bg-gray-50 rounded-xl p-4 space-y-1">
                  <p className="text-sm font-medium text-dark-text">{selectedPayment.customerName}</p>
                  <p className="text-sm text-gray-500">{selectedPayment.customerEmail}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedPayment.id);
                  toast.success('ID copiado.');
                }}
                className="flex items-center gap-2 w-full justify-center py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Copy size={16} />
                Copiar ID
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
