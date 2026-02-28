
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, TicketPercent, Copy, Check, Trash2, Clock, DollarSign, Percent, RefreshCw, X, Edit3, Filter, Loader2 } from 'lucide-react';
import { Coupon } from '../types';
import { couponsApi, type ApiCoupon } from '../services/couponsApi';
import { useToast } from '../contexts/ToastContext';
import { ApiError, getFriendlyErrorMessage } from '../services/api';

function apiCouponToCoupon(api: ApiCoupon): Coupon {
  const exp = api.expires_at ? new Date(api.expires_at) : null;
  const now = new Date();
  let status: Coupon['status'] = api.is_active ? 'active' : 'paused';
  if (exp && exp < now) status = 'expired';
  const day = exp ? exp.getUTCDate().toString().padStart(2, '0') : null;
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const expiryDate = exp ? `${day} ${months[exp.getUTCMonth()]}, ${exp.getUTCFullYear()}` : null;
  return {
    id: api.id,
    code: api.code,
    type: api.type,
    value: parseFloat(api.value),
    usedCount: api.used_count,
    maxUses: api.usage_limit,
    status,
    expiryDate,
  };
}

export const Coupons: React.FC = () => {
  const toast = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'expired'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await couponsApi.list(1, 50);
      const data = Array.isArray((res as { data?: unknown }).data)
        ? (res as { data: ApiCoupon[] }).data
        : (res as ApiCoupon[]);
      setCoupons(data.map(apiCouponToCoupon));
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err instanceof ApiError ? err.message : 'Erro ao carregar cupons.'));
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    type: 'percentage' | 'fixed';
    value: string;
    maxUses: string;
    expiryDate: string;
    status: 'active' | 'expired' | 'paused';
  }>({
    code: '',
    type: 'percentage',
    value: '',
    maxUses: '',
    expiryDate: '',
    status: 'active'
  });

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return;
    try {
      await couponsApi.delete(id);
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success('Cupom excluído.');
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err instanceof ApiError ? err.message : 'Erro ao excluir cupom.'));
    }
  };

  // Helper to parse "25 Dez, 2024" back to "2024-12-25" for input
  const parseDateToISO = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const months: { [key: string]: string } = {
        'Jan': '01', 'Fev': '02', 'Mar': '03', 'Abr': '04', 'Mai': '05', 'Jun': '06',
        'Jul': '07', 'Ago': '08', 'Set': '09', 'Out': '10', 'Nov': '11', 'Dez': '12'
      };
      // Handle formats like "25 Dez, 2024" or "25 Dez 2024"
      const cleanDate = dateStr.replace(',', '');
      const [day, monthName, year] = cleanDate.split(' ');
      
      if(months[monthName]) {
        return `${year}-${months[monthName]}-${day.padStart(2, '0')}`;
      }
      return '';
    } catch (e) {
      return '';
    }
  };

  // Helper to format ISO "2024-12-25" to display "25 Dez, 2024"
  const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate) return null;
    try {
      const date = new Date(isoDate);
      const day = date.getUTCDate().toString().padStart(2, '0');
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const month = months[date.getUTCMonth()];
      const year = date.getUTCFullYear();
      return `${day} ${month}, ${year}`;
    } catch(e) {
      return null;
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      maxUses: '',
      expiryDate: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value.toString(),
      maxUses: coupon.maxUses ? coupon.maxUses.toString() : '',
      expiryDate: parseDateToISO(coupon.expiryDate),
      status: coupon.status
    });
    setIsModalOpen(true);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.value) {
      toast.error('Preencha o código e o valor.');
      return;
    }
    const code = formData.code.trim().toUpperCase();
    const value = parseFloat(formData.value);
    const usageLimit = formData.maxUses ? parseInt(formData.maxUses, 10) : null;
    const expiresAt = formData.expiryDate ? `${formData.expiryDate}T23:59:59.000Z` : null;
    const isActive = formData.status === 'active';

    setIsSaving(true);
    try {
      if (editingId) {
        await couponsApi.update(editingId, {
          code,
          type: formData.type,
          value,
          usage_limit: usageLimit,
          expires_at: expiresAt,
          is_active: isActive,
        });
        const updated = coupons.map(c =>
          c.id === editingId
            ? {
                ...c,
                code,
                type: formData.type,
                value,
                maxUses: usageLimit,
                expiryDate: formData.expiryDate ? formatDateForDisplay(formData.expiryDate) : null,
                status: formData.status,
              }
            : c
        );
        setCoupons(updated);
        toast.success('Cupom atualizado.');
      } else {
        const res = await couponsApi.create({
          code,
          type: formData.type,
          value,
          usage_limit: usageLimit,
          expires_at: expiresAt,
          is_active: isActive,
        });
        const raw = (res as { data?: ApiCoupon }).data ?? (res as ApiCoupon);
        const newCoupon = apiCouponToCoupon(raw);
        setCoupons([newCoupon, ...coupons]);
        toast.success('Cupom criado.');
      }
      setIsModalOpen(false);
      setFormData({ code: '', type: 'percentage', value: '', maxUses: '', expiryDate: '', status: 'active' });
      setEditingId(null);
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err instanceof ApiError ? err.message : 'Erro ao guardar cupom.'));
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to render the discount badge
  const renderDiscountBadge = (type: 'percentage' | 'fixed', value: number) => {
    if (type === 'percentage') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-bold">
          <Percent size={12} /> {value}% OFF
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">
        <DollarSign size={12} /> Kz {value.toLocaleString()} OFF
      </span>
    );
  };

  // Helper for progress bar
  const getProgressWidth = (used: number, max: number | null) => {
    if (!max) return '100%';
    const percent = (used / max) * 100;
    return `${Math.min(percent, 100)}%`;
  };

  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dark-text">Cupons de Desconto</h2>
          <p className="text-gray-500 text-sm">Crie códigos promocionais para aumentar suas vendas.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-hover shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5"
        >
          <Plus size={18} />
          Criar Cupom
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="relative min-w-[180px]">
           <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
           <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-10 pr-8 py-2.5 w-full bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all appearance-none text-gray-600 cursor-pointer"
           >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="paused">Pausados</option>
              <option value="expired">Expirados</option>
           </select>
           <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
           </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-brand-primary" />
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCoupons.map((coupon) => (
          <div key={coupon.id} className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100 flex flex-col justify-between relative overflow-hidden group">
             
             {/* Status Tag */}
             <div className="absolute top-5 right-5">
                {coupon.status === 'active' && <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full uppercase tracking-wide border border-green-100">Ativo</span>}
                {coupon.status === 'paused' && <span className="px-2 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-bold rounded-full uppercase tracking-wide border border-yellow-100">Pausado</span>}
                {coupon.status === 'expired' && <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full uppercase tracking-wide border border-gray-200">Expirado</span>}
             </div>

             <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-brand-primary border border-indigo-100">
                  <TicketPercent size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-dark-text tracking-wide">{coupon.code}</h3>
                    <button 
                      onClick={() => handleCopy(coupon.id, coupon.code)}
                      className="text-gray-400 hover:text-brand-primary transition-colors"
                    >
                      {copiedId === coupon.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                     {renderDiscountBadge(coupon.type, coupon.value)}
                  </div>
                </div>
             </div>

             <div className="space-y-4">
                {/* Usage Bar */}
                <div className="space-y-1">
                   <div className="flex justify-between text-xs font-medium text-gray-500">
                      <span>Usos: {coupon.usedCount} {coupon.maxUses && `/ ${coupon.maxUses}`}</span>
                      {coupon.maxUses && <span>{Math.round((coupon.usedCount / coupon.maxUses) * 100)}%</span>}
                   </div>
                   <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${coupon.status === 'expired' ? 'bg-gray-400' : 'bg-brand-primary'}`}
                        style={{ width: getProgressWidth(coupon.usedCount, coupon.maxUses) }}
                      />
                   </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                   <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={14} />
                      {coupon.expiryDate ? `Expira em: ${coupon.expiryDate}` : 'Validade indeterminada'}
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => openEditModal(coupon)}
                        className="p-2 text-gray-400 hover:text-brand-primary hover:bg-indigo-50 rounded-lg transition-all"
                        title="Editar Cupom"
                      >
                         <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(coupon.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                         <Trash2 size={16} />
                      </button>
                   </div>
                </div>
             </div>
          </div>
        ))}

        {/* Add New Empty State */}
        <button 
          onClick={openCreateModal}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50/50 hover:border-brand-primary/40 transition-all group min-h-[220px]"
        >
           <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <Plus size={28} className="text-gray-300 group-hover:text-brand-primary transition-colors" />
           </div>
           <h3 className="text-base font-bold text-gray-400 group-hover:text-brand-primary transition-colors">Criar Novo Cupom</h3>
        </button>
      </div>
      )}

      {/* Create/Edit Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100 flex flex-col max-h-[90vh]">
             
             <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
                <h3 className="text-lg font-bold text-dark-text">
                  {editingId ? 'Editar Cupom' : 'Novo Cupom'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
             </div>

             <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                
                <div className="space-y-2">
                   <label className="text-xs font-semibold text-gray-500 uppercase">Código do Cupom</label>
                   <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                        placeholder="EX: NATAL10"
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-mono uppercase"
                      />
                      <button 
                        onClick={generateRandomCode}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors"
                        title="Gerar código aleatório"
                      >
                         <RefreshCw size={20} />
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Tipo</label>
                      <select 
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary bg-white outline-none"
                      >
                         <option value="percentage">Porcentagem (%)</option>
                         <option value="fixed">Valor Fixo (Kz)</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Valor</label>
                      <div className="relative">
                         <input 
                           type="number" 
                           value={formData.value}
                           onChange={(e) => setFormData({...formData, value: e.target.value})}
                           placeholder="0"
                           className="w-full pl-4 pr-8 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none font-bold"
                         />
                         <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                            {formData.type === 'percentage' ? '%' : 'Kz'}
                         </span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Limite de Usos</label>
                      <input 
                        type="number" 
                        value={formData.maxUses}
                        onChange={(e) => setFormData({...formData, maxUses: e.target.value})}
                        placeholder="∞"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none"
                      />
                      <p className="text-[10px] text-gray-400">Vazio = ilimitado</p>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Expira em</label>
                      <input 
                        type="date" 
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none text-gray-600"
                      />
                   </div>
                </div>

                {editingId && (
                   <div className="space-y-2 pt-2 border-t border-gray-50">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Status do Cupom</label>
                      <div className="flex gap-2">
                         {['active', 'paused', 'expired'].map((statusOption) => (
                            <button
                               key={statusOption}
                               onClick={() => setFormData({...formData, status: statusOption as any})}
                               className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${
                                  formData.status === statusOption 
                                  ? 'bg-indigo-50 border-brand-primary text-brand-primary' 
                                  : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                               }`}
                            >
                               {statusOption === 'active' && 'Ativo'}
                               {statusOption === 'paused' && 'Pausado'}
                               {statusOption === 'expired' && 'Expirado'}
                            </button>
                         ))}
                      </div>
                   </div>
                )}

             </div>

             <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-hover shadow-md shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : (editingId ? 'Salvar Alterações' : 'Criar Cupom')}
                </button>
             </div>

          </div>
        </div>
      )}

    </div>
  );
};
