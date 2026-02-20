
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, Users, CreditCard, Activity, Smartphone } from 'lucide-react';
import { ChartData, Transaction } from '../types';

const mockData: ChartData[] = [
  { name: 'Seg', value: 40000 },
  { name: 'Ter', value: 30000 },
  { name: 'Qua', value: 55000 },
  { name: 'Qui', value: 45000 },
  { name: 'Sex', value: 80000 },
  { name: 'Sáb', value: 65000 },
  { name: 'Dom', value: 90000 },
];

const recentTransactions: Transaction[] = [
  { id: 'TX1234', customerName: 'Ana Sousa', customerEmail: 'ana@gmail.com', amount: 15000, date: 'Hoje, 14:30', status: 'PAID', method: 'e-kwanza' } as any,
  { id: 'TX1235', customerName: 'Carlos Pinto', customerEmail: 'carlos@live.com', amount: 5000, date: 'Hoje, 13:15', status: 'PENDING', method: 'card' } as any,
  { id: 'TX1236', customerName: 'Maria Silva', customerEmail: 'maria@outlook.com', amount: 25000, date: 'Ontem, 18:20', status: 'PAID', method: 'multicaixa_express' } as any,
];

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
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Vendas Totais (Mês)" value="Kz 2.450.000" trend="+12.5%" icon={Wallet} trendUp={true} />
        <StatCard title="Transações" value="1,234" trend="+8.2%" icon={Activity} trendUp={true} />
        <StatCard title="Ticket Médio" value="Kz 15.400" trend="-2.1%" icon={CreditCard} trendUp={false} />
        <StatCard title="Novos Clientes" value="342" trend="+18.4%" icon={Users} trendUp={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-soft border border-gray-50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-dark-text">Desempenho de Vendas</h2>
            <select className="bg-gray-50 border border-gray-200 text-sm rounded-lg p-2 outline-none">
              <option>Últimos 7 dias</option>
              <option>Este Mês</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData}>
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