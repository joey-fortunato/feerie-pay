
import React, { useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, Calendar, TrendingUp, DollarSign, CreditCard, Smartphone, ArrowUpRight, Filter, Info, ShoppingCart, RefreshCw, FileText, CalendarClock, AlertCircle, X, Loader2 } from 'lucide-react';
import type { ApiOrder, ApiPayment } from '../api/types';
import { ordersApi } from '../services/ordersApi';

type ReportsDateRange = '7_days' | 'this_month' | 'last_month' | 'custom';

type AccountingRow = {
  id: number;
  description: string;
  type: 'credit' | 'debit';
  value: number;
};

type RevenuePoint = { name: string; gross: number; net: number };

type PaymentMethodSlice = { name: string; value: number };

type TopProductPoint = { name: string; sales: number };

const COLORS = ['#6363F1', '#F97316', '#10B981']; // Brand Primary, Orange, Green

const parseDate = (iso?: string | null): Date | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDayLabel = (d: Date): string =>
  d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });

export const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState<ReportsDateRange>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await ordersApi.list(1, 200);
        const data = Array.isArray(res?.data) ? res.data : [];
        setOrders(data);
      } catch (err) {
        console.error('[Reports] Erro ao carregar dados:', err);
        setError('Não foi possível carregar os dados dos relatórios. Verifique se o backend está a correr.');
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

    if (dateRange === 'last_month') {
      const firstOfThis = new Date(end.getFullYear(), end.getMonth(), 1);
      const lastOfLast = new Date(firstOfThis.getTime() - 1);
      const start = new Date(lastOfLast.getFullYear(), lastOfLast.getMonth(), 1, 0, 0, 0, 0);
      return [start, lastOfLast] as const;
    }

    if (dateRange === 'custom' && customStart && customEnd) {
      const start = new Date(customStart);
      const endCustom = new Date(customEnd);
      endCustom.setHours(23, 59, 59, 999);
      return [start, endCustom] as const;
    }

    const start = new Date(end.getFullYear(), end.getMonth(), 1, 0, 0, 0, 0);
    return [start, end] as const;
  }, [dateRange, customStart, customEnd]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const d = parseDate(order.paid_at || order.created_at);
        if (!d) return false;
        return d >= startDate && d <= endDate;
      }),
    [orders, startDate, endDate]
  );

  const paidOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'paid'),
    [filteredOrders]
  );

  const allPayments: ApiPayment[] = useMemo(() => {
    const list: ApiPayment[] = [];
    filteredOrders.forEach((order) => {
      if (Array.isArray(order.payments)) {
        order.payments.forEach((p) => list.push(p));
      }
    });
    return list;
  }, [filteredOrders]);

  const revenueData: RevenuePoint[] = useMemo(() => {
    const map = new Map<string, { gross: number; net: number }>();
    paidOrders.forEach((order) => {
      const d = parseDate(order.paid_at || order.created_at);
      if (!d) return;
      const key = formatDayLabel(d);
      const total = parseFloat(order.total ?? '0') || 0;
      const prev = map.get(key) ?? { gross: 0, net: 0 };
      const gross = prev.gross + total;
      const net = gross * 0.966; // ~3.4% de taxas
      map.set(key, { gross, net });
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'pt-AO'))
      .map(([name, vals]) => ({ name, gross: vals.gross, net: vals.net }));
  }, [paidOrders]);

  const paymentMethodsData: PaymentMethodSlice[] = useMemo(() => {
    let gpoTotal = 0;
    let refTotal = 0;
    let ekTotal = 0;

    allPayments
      .filter((p) => p.status === 'paid')
      .forEach((p) => {
        const amount = parseFloat(p.amount ?? '0') || 0;
        if (p.gateway === 'gpo') gpoTotal += amount;
        else if (p.gateway === 'ref') refTotal += amount;
        else if (p.gateway === 'ekwanza_ticket') ekTotal += amount;
      });

    const total = gpoTotal + refTotal + ekTotal;
    if (total <= 0) return [];

    const toPercent = (value: number) =>
      Math.round((value / total) * 100);

    const slices: PaymentMethodSlice[] = [];
    if (gpoTotal > 0) {
      slices.push({ name: 'Multicaixa Express', value: toPercent(gpoTotal) });
    }
    if (refTotal > 0) {
      slices.push({ name: 'Referência Multicaixa', value: toPercent(refTotal) });
    }
    if (ekTotal > 0) {
      slices.push({ name: 'E-Kwanza', value: toPercent(ekTotal) });
    }
    return slices;
  }, [allPayments]);

  const topProductsData: TopProductPoint[] = useMemo(() => {
    const map = new Map<string, { name: string; sales: number }>();
    paidOrders.forEach((order) => {
      const productName = order.product?.name ?? 'Produto';
      const entry = map.get(order.product_id) ?? { name: productName, sales: 0 };
      entry.sales += 1;
      map.set(order.product_id, entry);
    });
    return Array.from(map.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
  }, [paidOrders]);

  const accountingData: AccountingRow[] = useMemo(() => {
    let grossCard = 0;
    let grossEkwanza = 0;
    let refunds = 0;

    allPayments.forEach((p) => {
      const amount = parseFloat(p.amount ?? '0') || 0;
      if (p.status === 'paid') {
        if (p.gateway === 'ekwanza_ticket') grossEkwanza += amount;
        else if (p.gateway === 'gpo' || p.gateway === 'ref') grossCard += amount;
      }
      if (p.status === 'refunded') {
        refunds += amount;
      }
    });

    const totalGross = grossCard + grossEkwanza;
    const fees = totalGross * 0.034;
    const withdrawalsFees = 0;

    const rows: AccountingRow[] = [];
    if (grossCard > 0) {
      rows.push({
        id: 1,
        description: 'Vendas Brutas (Cartão / REF)',
        type: 'credit',
        value: grossCard,
      });
    }
    if (grossEkwanza > 0) {
      rows.push({
        id: 2,
        description: 'Vendas Brutas (E-Kwanza)',
        type: 'credit',
        value: grossEkwanza,
      });
    }
    if (fees > 0) {
      rows.push({
        id: 3,
        description: 'Taxas de Processamento (estimadas)',
        type: 'debit',
        value: -fees,
      });
    }
    if (refunds > 0) {
      rows.push({
        id: 4,
        description: 'Reembolsos / Estornos',
        type: 'debit',
        value: -refunds,
      });
    }
    if (withdrawalsFees > 0) {
      rows.push({
        id: 5,
        description: 'Taxas de Saque',
        type: 'debit',
        value: -withdrawalsFees,
      });
    }
    return rows;
  }, [allPayments]);

  const totalAccounting = useMemo(
    () => accountingData.reduce((acc, curr) => acc + curr.value, 0),
    [accountingData]
  );

  const aggregates = useMemo(() => {
    const grossCardRow = accountingData.find((r) =>
      r.description.startsWith('Vendas Brutas (Cartão')
    );
    const grossEkwanzaRow = accountingData.find((r) =>
      r.description.startsWith('Vendas Brutas (E-Kwanza')
    );
    const feesRow = accountingData.find((r) =>
      r.description.startsWith('Taxas de Processamento')
    );

    const grossRevenue =
      (grossCardRow?.value ?? 0) + (grossEkwanzaRow?.value ?? 0);
    const feesTotal = Math.abs(feesRow?.value ?? 0);

    // A receber (futuro): soma dos pedidos que ainda não estão pagos
    const futureAmount = filteredOrders
      .filter((o) => o.status === 'pending' || o.status === 'processing')
      .reduce(
        (acc, o) => acc + (parseFloat(o.total ?? '0') || 0),
        0
      );

    return {
      grossRevenue,
      netAvailable: totalAccounting,
      futureAmount,
      feesTotal,
    };
  }, [accountingData, filteredOrders, totalAccounting]);

  const handleExportPdf = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadStatement = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <button 
              onClick={() => setDateRange('7_days')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${dateRange === '7_days' ? 'bg-gray-100 text-dark-text' : 'text-gray-500 hover:text-gray-700'}`}
            >
              7 Dias
            </button>
            <button 
               onClick={() => setDateRange('this_month')}
               className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${dateRange === 'this_month' ? 'bg-gray-100 text-dark-text' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Este Mês
            </button>
            <button 
               onClick={() => setDateRange('last_month')}
               className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${dateRange === 'last_month' ? 'bg-gray-100 text-dark-text' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Mês Passado
            </button>
         </div>

         <div className="flex gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              onClick={() => setIsCustomModalOpen(true)}
            >
               <Calendar size={16} />
               <span>Personalizar</span>
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-hover shadow-lg shadow-indigo-500/20 transition-all"
              onClick={handleExportPdf}
            >
               <Download size={16} />
               <span>Exportar PDF</span>
            </button>
         </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {/* Gross Revenue */}
         <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-50 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
               <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Receita Bruta</p>
                  <h3 className="text-2xl font-bold text-dark-text">
                    Kz {aggregates.grossRevenue.toLocaleString()}
                  </h3>
               </div>
               <div className="p-3 bg-indigo-50 text-brand-primary rounded-xl">
                  <DollarSign size={20} />
               </div>
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-green-600 relative z-10">
               <TrendingUp size={16} />
               <span>+15.3%</span>
               <span className="text-gray-400 font-normal ml-1">vs. mês anterior</span>
            </div>
         </div>

         {/* Net Revenue */}
         <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-50 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
               <div>
                  <div className="flex items-center gap-1 mb-1">
                     <p className="text-sm text-gray-500 font-medium">Líquido Disponível</p>
                     <Info size={12} className="text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-600">
                    Kz {aggregates.netAvailable.toLocaleString()}
                  </h3>
               </div>
               <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                  <CreditCard size={20} />
               </div>
            </div>
            <p className="text-xs text-gray-400">Já descontando taxas e reembolsos.</p>
         </div>

         {/* Future Releases (Lançamentos Futuros) */}
         <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-50 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
               <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">A Receber (Futuro)</p>
                  <h3 className="text-2xl font-bold text-blue-600">
                    Kz {aggregates.futureAmount.toLocaleString()}
                  </h3>
               </div>
               <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <CalendarClock size={20} />
               </div>
            </div>
            <p className="text-xs text-gray-400">Previsão de depósito para os próximos 15 dias.</p>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-100">
               <div className="h-full bg-blue-500 w-2/3"></div>
            </div>
         </div>

         {/* Fees */}
         <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-50 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
               <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Total de Taxas</p>
                  <h3 className="text-2xl font-bold text-dark-text">
                    Kz {aggregates.feesTotal.toLocaleString()}
                  </h3>
               </div>
               <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
                  <Filter size={20} />
               </div>
            </div>
            <p className="text-xs text-gray-400">~3.4% do volume bruto processado.</p>
         </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* Revenue Evolution (Area Chart) */}
         <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-soft border border-gray-50">
            <h3 className="text-lg font-bold text-dark-text mb-6">Evolução Financeira</h3>
            <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                     <defs>
                        <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#6363F1" stopOpacity={0.2}/>
                           <stop offset="95%" stopColor="#6363F1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                           <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={(val) => `${val/1000}k`} />
                     <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value: number) => [`Kz ${value.toLocaleString()}`, '']}
                     />
                     <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                     <Area type="monotone" name="Receita Bruta" dataKey="gross" stroke="#6363F1" strokeWidth={3} fillOpacity={1} fill="url(#colorGross)" />
                     <Area type="monotone" name="Receita Líquida" dataKey="net" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Payment Methods (Pie Chart) */}
         <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-50 flex flex-col">
            <h3 className="text-lg font-bold text-dark-text mb-2">Canais de Pagamento</h3>
            <p className="text-sm text-gray-400 mb-6">Preferência dos seus clientes</p>
            
            {paymentMethodsData.length === 0 ? (
              <div className="flex-1 min-h-[250px] flex flex-col items-center justify-center text-sm text-gray-400">
                <p>Não há pagamentos no período selecionado.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 relative min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentMethodsData.map((entry, index) => {
                          const color =
                            entry.name === 'E-Kwanza'
                              ? COLORS[0]
                              : entry.name === 'Multicaixa Express'
                              ? COLORS[1]
                              : COLORS[2];
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value}%`, 'Participação']} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centered Total */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-dark-text">100%</p>
                      <p className="text-xs text-gray-400">Receita por gateway</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-4">
                  {paymentMethodsData.map((m) => (
                    <div
                      key={m.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={[
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            m.name === 'E-Kwanza'
                              ? 'bg-indigo-100 text-brand-primary'
                              : m.name === 'Multicaixa Express'
                              ? 'bg-orange-100 text-orange-500'
                              : 'bg-emerald-100 text-emerald-600',
                          ].join(' ')}
                        >
                          {m.name === 'E-Kwanza' && <Smartphone size={16} />}
                          {m.name === 'Multicaixa Express' && <Smartphone size={16} />}
                          {m.name === 'Referência Multicaixa' && <CreditCard size={16} />}
                        </div>
                        <span className="text-sm font-medium text-dark-text">{m.name}</span>
                      </div>
                      <span className="font-bold text-dark-text">
                        {m.value.toLocaleString()}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
         </div>
      </div>

      {/* Secondary Metrics Row: Abandonment & Refunds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         
         {/* Abandoned Carts */}
         <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-50">
            <div className="flex items-center justify-between mb-6">
               <div>
                  <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
                     <ShoppingCart size={20} className="text-gray-500" />
                     Carrinhos Abandonados
                  </h3>
                  <p className="text-sm text-gray-500">Oportunidades de venda não finalizadas.</p>
               </div>
               <span className="px-3 py-1 bg-yellow-50 text-yellow-600 text-xs font-bold rounded-full">Atenção</span>
            </div>

            <div className="flex items-center gap-8 mb-6">
               <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Perda Potencial</p>
                  <p className="text-2xl font-bold text-dark-text">Kz 245.000</p>
               </div>
               <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Carrinhos</p>
                  <p className="text-2xl font-bold text-dark-text">18</p>
               </div>
               <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Recuperados</p>
                  <p className="text-2xl font-bold text-green-600">3 (16%)</p>
               </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
               <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '16%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mb-4">Taxa de recuperação abaixo da média (20%).</p>
            <button className="w-full py-2 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 text-sm transition-colors">
               Ver detalhes e enviar lembretes
            </button>
         </div>

         {/* Refunds & Chargebacks */}
         <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-50">
            <div className="flex items-center justify-between mb-6">
               <div>
                  <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
                     <RefreshCw size={20} className="text-gray-500" />
                     Reembolsos
                  </h3>
                  <p className="text-sm text-gray-500">Saúde dos produtos e satisfação.</p>
               </div>
               <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full">Saudável</span>
            </div>

            <div className="flex items-center gap-8 mb-6">
               <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Total Reembolsado</p>
                  <p className="text-2xl font-bold text-red-500">Kz 25.000</p>
               </div>
               <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Quantidade</p>
                  <p className="text-2xl font-bold text-dark-text">2</p>
               </div>
               <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Taxa de Reembolso</p>
                  <p className="text-2xl font-bold text-dark-text">0.8%</p>
               </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
               <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mb-4">Sua taxa de aprovação está excelente (99.2%).</p>
            <button className="w-full py-2 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 text-sm transition-colors">
               Gerenciar disputas
            </button>
         </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* Accounting Data Table */}
         <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft border border-gray-50 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
               <div>
                  <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
                     <FileText size={20} className="text-gray-500" />
                     Dados Contábeis (Demonstrativo)
                  </h3>
                  <p className="text-sm text-gray-500">Resumo financeiro para contabilidade.</p>
               </div>
               <button
                 className="text-brand-primary text-sm font-bold hover:underline"
                 onClick={handleDownloadStatement}
               >
                 Baixar Extrato
               </button>
            </div>
            
            <div className="overflow-x-auto">
               <table className="w-full">
                  <thead className="bg-gray-50">
                     <tr>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Descrição</th>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                        <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {accountingData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="py-4 px-6 text-sm font-medium text-dark-text">{item.description}</td>
                           <td className="py-4 px-6">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase ${item.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                 {item.type === 'credit' ? 'Crédito' : 'Débito'}
                              </span>
                           </td>
                           <td className={`py-4 px-6 text-right text-sm font-bold ${item.type === 'credit' ? 'text-gray-700' : 'text-red-500'}`}>
                              {item.type === 'debit' ? '-' : ''} Kz {Math.abs(item.value).toLocaleString()}
                           </td>
                        </tr>
                     ))}
                     <tr className="bg-gray-50 border-t-2 border-gray-100">
                        <td className="py-4 px-6 text-sm font-bold text-dark-text">Resultado Líquido</td>
                        <td></td>
                        <td className="py-4 px-6 text-right text-lg font-bold text-brand-primary">
                           Kz {totalAccounting.toLocaleString()}
                        </td>
                     </tr>
                  </tbody>
               </table>
            </div>
         </div>

         {/* Top Products (Existing) */}
         <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-50">
            <h3 className="text-lg font-bold text-dark-text mb-6">Produtos Mais Vendidos</h3>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                     <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                     />
                     <Bar dataKey="sales" fill="#6363F1" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
               <p className="text-xs text-gray-500 text-center">O "Curso Marketing" representa 42% das suas vendas totais.</p>
            </div>
         </div>

      </div>
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-dark-text">Filtrar por data</h3>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Escolha um intervalo personalizado para os relatórios financeiros.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Data inicial
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Data final
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (customStart && customEnd) {
                    setDateRange('custom');
                    setIsCustomModalOpen(false);
                  }
                }}
                disabled={!customStart || !customEnd}
                className="px-4 py-2 text-sm font-bold text-white bg-brand-primary hover:bg-brand-hover rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 max-w-sm bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl shadow-lg flex items-start gap-2">
          <AlertCircle size={18} className="mt-0.5" />
          <div>
            <p className="font-semibold">Erro ao carregar relatórios</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
          <div className="px-4 py-2 bg-white/90 border border-gray-200 rounded-xl shadow-sm text-sm text-gray-600 flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-brand-primary" />
            <span>A atualizar dados...</span>
          </div>
        </div>
      )}
    </div>
  );
};
