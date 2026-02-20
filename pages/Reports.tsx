
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, Calendar, TrendingUp, DollarSign, CreditCard, Smartphone, ArrowUpRight, Filter, Info, ShoppingCart, RefreshCw, FileText, CalendarClock, AlertCircle } from 'lucide-react';

// Mock Data for Revenue
const revenueData = [
  { name: '01 Out', gross: 45000, net: 42750 },
  { name: '05 Out', gross: 80000, net: 76000 },
  { name: '10 Out', gross: 120000, net: 114000 },
  { name: '15 Out', gross: 95000, net: 90250 },
  { name: '20 Out', gross: 150000, net: 142500 },
  { name: '25 Out', gross: 180000, net: 171000 },
  { name: '30 Out', gross: 220000, net: 209000 },
];

// Mock Data for Payment Methods
const paymentMethodsData = [
  { name: 'e-kwanza', value: 65 },
  { name: 'Multicaixa / Card', value: 35 },
];
const COLORS = ['#6363F1', '#F97316']; // Brand Primary & Orange

// Mock Data for Top Products
const topProductsData = [
  { name: 'Curso Marketing', sales: 120 },
  { name: 'Ebook E-kwanza', sales: 85 },
  { name: 'Mentoria VIP', sales: 45 },
  { name: 'Livro Físico', sales: 30 },
];

// Mock Data for Accounting Table
const accountingData = [
  { id: 1, description: 'Vendas Brutas (Cartão)', type: 'credit', value: 450000 },
  { id: 2, description: 'Vendas Brutas (e-kwanza)', type: 'credit', value: 840000 },
  { id: 3, description: 'Taxas de Processamento', type: 'debit', value: -44500 },
  { id: 4, description: 'Reembolsos / Estornos', type: 'debit', value: -25000 },
  { id: 5, description: 'Taxas de Saque', type: 'debit', value: -2000 },
];

export const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState('this_month');

  const totalAccounting = accountingData.reduce((acc, curr) => acc + curr.value, 0);

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
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
               <Calendar size={16} />
               <span>Personalizar</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-hover shadow-lg shadow-indigo-500/20 transition-all">
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
                  <h3 className="text-2xl font-bold text-dark-text">Kz 1.290.000</h3>
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
                  <h3 className="text-2xl font-bold text-green-600">Kz 845.500</h3>
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
                  <h3 className="text-2xl font-bold text-blue-600">Kz 150.000</h3>
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
                  <h3 className="text-2xl font-bold text-dark-text">Kz 44.500</h3>
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
                        {paymentMethodsData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
               {/* Centered Total */}
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                     <p className="text-3xl font-bold text-dark-text">100%</p>
                     <p className="text-xs text-gray-400">Volume</p>
                  </div>
               </div>
            </div>

            <div className="space-y-4 mt-4">
               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-brand-primary">
                        <Smartphone size={16} />
                     </div>
                     <span className="text-sm font-medium text-dark-text">e-kwanza</span>
                  </div>
                  <span className="font-bold text-dark-text">65%</span>
               </div>
               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-500">
                        <CreditCard size={16} />
                     </div>
                     <span className="text-sm font-medium text-dark-text">Cartão / Multi</span>
                  </div>
                  <span className="font-bold text-dark-text">35%</span>
               </div>
            </div>
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
               <button className="text-brand-primary text-sm font-bold hover:underline">Baixar Extrato</button>
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
    </div>
  );
};
