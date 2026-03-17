
import React, { useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, Users, CreditCard, Activity } from 'lucide-react';
import { ChartData, Transaction, TransactionStatus } from '../types';
import type { ApiOrder, ApiPayment } from '../api/types';
import { ordersApi } from '../services/ordersApi';

type DashboardDateRange = '7_days' | 'this_month';

const parseDate = (iso?: string | null): Date | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDayLabel = (d: Date): string =>
  d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });

const mapPaymentStatusToTransactionStatus = (status: string): TransactionStatus => {
  switch (status) {
    case 'paid':
      return TransactionStatus.PAID;
    case 'failed':
      return TransactionStatus.FAILED;
    case 'cancelled':
      return TransactionStatus.CANCELLED;
    case 'refunded':
      return TransactionStatus.REFUNDED;
    default:
      return TransactionStatus.PENDING;
  }
};

const mapGatewayToMethod = (gateway: ApiPayment['gateway']): Transaction['method'] => {
  if (gateway === 'ekwanza_ticket') return 'e-kwanza';
  if (gateway === 'gpo') return 'multicaixa_express';
  return 'card';
};

const StatCard = ({ title, value, trend, icon: Icon, trendUp }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-50">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${trendUp ? 'bg-indigo-50 text-brand-primary' : 'bg-orange-50 text-orange-500'}`}>
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
        {trend}
        {trendUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
      </div>
    </div>
    <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-dark-text">{value}</p>
  </div>
);

export const Dashboard: React.FC = () => {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DashboardDateRange>('7_days');

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await ordersApi.list(1, 100);
        const data = Array.isArray(res?.data) ? res.data : [];
        setOrders(data);
      } catch (err) {
        console.error('[Dashboard] Erro ao carregar dados:', err);
        setError('Não foi possível carregar os dados do dashboard. Verifique se o backend está a correr.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const [startDate, endDate] = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    if (dateRange === '7_days') {
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      return [start, end] as const;
    }
    // this_month
    const start = new Date(end.getFullYear(), end.getMonth(), 1, 0, 0, 0, 0);
    return [start, end] as const;
  }, [dateRange]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const d = parseDate(order.paid_at || order.created_at);
      if (!d) return false;
      return d >= startDate && d <= endDate;
    });
  }, [orders, startDate, endDate]);

  const paidOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'paid'),
    [filteredOrders]
  );

  const chartData: ChartData[] = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach((order) => {
      const d = parseDate(order.paid_at || order.created_at);
      if (!d) return;
      const key = formatDayLabel(d);
      const total = parseFloat(order.total ?? '0') || 0;
      map.set(key, (map.get(key) ?? 0) + total);
    });
    return Array.from(map.entries())
      .sort((a, b) => {
        const [da, db] = [a[0], b[0]];
        return da.localeCompare(db, 'pt-AO');
      })
      .map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const stats = useMemo(() => {
    const totalRevenue = paidOrders.reduce(
      (acc, o) => acc + (parseFloat(o.total ?? '0') || 0),
      0
    );

    const allPayments: ApiPayment[] = [];
    filteredOrders.forEach((order) => {
      if (Array.isArray(order.payments)) {
        order.payments.forEach((p) => allPayments.push(p));
      }
    });

    const successfulPayments = allPayments.filter((p) => p.status === 'paid');
    const totalTransactions = successfulPayments.length;

    const ticketMedio =
      paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    const uniqueCustomers = new Set(
      filteredOrders
        .map((o) => o.customer?.id || o.customer_id)
        .filter(Boolean)
    );

    return {
      totalRevenue,
      totalTransactions,
      ticketMedio,
      newCustomers: uniqueCustomers.size,
    };
  }, [filteredOrders, paidOrders]);

  const recentTransactions: Transaction[] = useMemo(() => {
    const items: Transaction[] = [];
    filteredOrders.forEach((order) => {
      if (!Array.isArray(order.payments)) return;
      order.payments.forEach((payment) => {
        const date = parseDate(payment.paid_at || payment.created_at);
        if (!date) return;
        const customerName = order.customer?.name ?? 'Cliente';
        const customerEmail = order.customer?.email ?? '';
        const amount = parseFloat(payment.amount ?? '0') || 0;
        items.push({
          id: payment.id,
          customerName,
          customerEmail,
          amount,
          date: date.toLocaleString('pt-AO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: mapPaymentStatusToTransactionStatus(payment.status),
          method: mapGatewayToMethod(payment.gateway),
        });
      });
    });
    return items
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 10);
  }, [filteredOrders]);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Vendas Totais"
          value={`Kz ${stats.totalRevenue.toLocaleString()}`}
          trend=""
          icon={Wallet}
          trendUp={true}
        />
        <StatCard
          title="Transações Pagas"
          value={stats.totalTransactions.toLocaleString()}
          trend=""
          icon={Activity}
          trendUp={true}
        />
        <StatCard
          title="Ticket Médio"
          value={
            stats.ticketMedio > 0
              ? `Kz ${stats.ticketMedio.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : '—'
          }
          trend=""
          icon={CreditCard}
          trendUp={stats.ticketMedio >= 0}
        />
        <StatCard
          title="Novos Clientes"
          value={stats.newCustomers.toLocaleString()}
          trend=""
          icon={Users}
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-soft border border-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-dark-text">Desempenho de Vendas</h2>
            <select
              className="bg-gray-50 border border-gray-200 text-sm rounded-lg p-2 outline-none"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DashboardDateRange)}
            >
              <option value="7_days">Últimos 7 dias</option>
              <option value="this_month">Este Mês</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6363F1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6363F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={(val) => `Kz ${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => [`Kz ${value.toLocaleString()}`, 'Vendas']}
                />
                <Area type="monotone" dataKey="value" stroke="#6363F1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-50 flex flex-col">
          <h2 className="text-lg font-bold text-dark-text mb-6">Últimas Vendas</h2>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs 
                    ${tx.method === 'e-kwanza' ? 'bg-indigo-100 text-indigo-600' : ''}
                    ${tx.method === 'multicaixa_express' ? 'bg-orange-100 text-orange-600' : ''}
                    ${tx.method === 'card' ? 'bg-blue-100 text-blue-600' : ''}
                  `}>
                    {tx.method === 'e-kwanza' && 'EK'}
                    {tx.method === 'multicaixa_express' && 'MCX'}
                    {tx.method === 'card' && 'CC'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-dark-text">{tx.customerName}</p>
                    <p className="text-xs text-gray-400">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-dark-text">+{tx.amount.toLocaleString()} Kz</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${tx.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-sm text-brand-primary font-semibold hover:bg-indigo-50 rounded-lg transition-colors">
            Ver Todas
          </button>
        </div>
      </div>
    </div>
  );
};