
import React, { useEffect, useState } from 'react';
import { Plus, Copy, ExternalLink, MoreHorizontal, Trash2, Eye, ShoppingBag, Check, X, Link as LinkIcon, Loader2 } from 'lucide-react';
import type { ApiPaymentLink } from '../services/paymentLinksApi';
import { paymentLinksApi } from '../services/paymentLinksApi';
import { useToast } from '../contexts/ToastContext';
import { ApiError, getFriendlyErrorMessage } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';

export const PaymentLinks: React.FC = () => {
  const toast = useToast();
  const [links, setLinks] = useState<ApiPaymentLink[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New Link Form State
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkAmount, setNewLinkAmount] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ApiPaymentLink | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await paymentLinksApi.list(1, 50);
        const data = Array.isArray(res?.data) ? res.data : [];
        setLinks(data);
      } catch (err) {
        const msg = getFriendlyErrorMessage(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Erro ao carregar links de pagamento.'
        );
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchLinks();
  }, []);

  const buildPublicUrl = (link: ApiPaymentLink): string => {
    // 1) Prefer value devolvido diretamente pela API (url/public_url)
    const candidate =
      (link.url as string | undefined | null) ??
      ((link as unknown as { public_url?: string | null }).public_url ?? undefined);
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }

    // 2) Fallback: construir a partir de slug ou code, alinhado com as rotas do frontend
    if (typeof window === 'undefined') return '';
    const base = window.location.origin.replace(/\/$/, '');

    const slug = (link as unknown as { slug?: string | null }).slug;
    if (slug && slug.trim().length > 0) {
      return `${base}/pay/${slug.trim()}`;
    }

    const code = (link as unknown as { code?: string | null }).code;
    if (code && code.trim().length > 0) {
      return `${base}/p/${code.trim()}`;
    }

    return '';
  };

  const handleCopy = (link: ApiPaymentLink) => {
    const finalUrl = buildPublicUrl(link);
    if (!finalUrl) {
      toast.error('Não foi possível gerar o link público para este registro.');
      return;
    }
    navigator.clipboard.writeText(finalUrl);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateOrUpdateLink = async () => {
    if (!newLinkTitle || !newLinkAmount) return;
    setIsCreating(true);
    try {
      const amountNum = Number(newLinkAmount);
      if (!Number.isFinite(amountNum) || amountNum <= 0) {
        toast.error('Informe um valor válido para o link de pagamento.');
        setIsCreating(false);
        return;
      }
      if (editingId) {
        const updated = await paymentLinksApi.update(editingId, {
          title: newLinkTitle,
          amount: amountNum,
        });
        setLinks((prev) =>
          prev.map((link) => (link.id === editingId ? { ...link, ...updated } : link))
        );
        toast.success('Link de pagamento atualizado com sucesso.');
      } else {
        const created = await paymentLinksApi.create({ title: newLinkTitle, amount: amountNum });
        setLinks((prev) => [created, ...prev]);
        toast.success('Link de pagamento criado com sucesso.');
      }
      setIsModalOpen(false);
      setNewLinkTitle('');
      setNewLinkAmount('');
      setEditingId(null);
    } catch (err) {
      const msg = getFriendlyErrorMessage(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Erro ao criar link de pagamento.'
      );
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleStatus = (id: string) => {
    // Por enquanto, apenas refletimos na UI; pode-se ligar a um endpoint PATCH futuramente.
    setLinks((prev) =>
      prev.map((link) =>
        link.id === id ? { ...link, active: !link.active } : link
      )
    );
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      await paymentLinksApi.delete(confirmDelete.id);
      setLinks((prev) => prev.filter((l) => l.id !== confirmDelete.id));
      toast.success('Link de pagamento excluído com sucesso.');
    } catch (err) {
      const msg = getFriendlyErrorMessage(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Erro ao excluir link de pagamento.'
      );
      toast.error(msg);
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setNewLinkTitle('');
    setNewLinkAmount('');
    setIsModalOpen(true);
  };

  const openEditModal = (link: ApiPaymentLink) => {
    setEditingId(link.id);
    setNewLinkTitle(link.title ?? '');
    setNewLinkAmount(
      typeof link.amount === 'number' && Number.isFinite(link.amount)
        ? String(link.amount)
        : ''
    );
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dark-text">Links de Pagamento</h2>
          <p className="text-gray-500 text-sm">Crie links rápidos para vender nas redes sociais e WhatsApp.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-hover shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5"
        >
          <Plus size={18} />
          Criar Link
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-xs font-semibold underline underline-offset-2"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-gray-100 rounded-xl w-12 h-12 animate-pulse" />
                <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded-md w-3/4 animate-pulse" />
                <div className="h-6 bg-gray-100 rounded-md w-1/2 animate-pulse" />
              </div>
              <div className="h-10 bg-gray-50 border border-dashed border-gray-200 rounded-xl animate-pulse" />
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex gap-4">
                  <div className="w-12 h-3 bg-gray-100 rounded-full animate-pulse" />
                  <div className="w-16 h-3 bg-gray-100 rounded-full animate-pulse" />
                </div>
                <div className="w-16 h-3 bg-gray-100 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 hidden md:flex flex-col gap-4 animate-pulse" />
          </>
        ) : (
        links.map((link) => (
          <div key={link.id} className={`bg-white rounded-2xl p-6 shadow-soft border transition-all duration-300 ${link.active ? 'border-gray-50 hover:border-brand-primary/30' : 'border-gray-100 opacity-75 bg-gray-50/50'}`}>
            
            {/* Card Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 rounded-xl text-brand-primary">
                <LinkIcon size={24} />
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setMenuOpenId((current) => (current === link.id ? null : link.id))
                  }
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreHorizontal size={20} />
                </button>
                {menuOpenId === link.id && (
                  <div className="absolute right-0 top-full mt-2 w-40 bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden z-10">
                    <button
                      type="button"
                      onClick={() => {
                        toggleStatus(link.id);
                        setMenuOpenId(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-600"
                    >
                      {link.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        openEditModal(link);
                        setMenuOpenId(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-600"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpenId(null);
                        setConfirmDelete(link);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-500 flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Card Content */}
            <div className="mb-6">
               <h3 className="text-lg font-bold text-dark-text mb-1">{link.title}</h3>
               <p className="text-2xl font-bold text-brand-primary">Kz {link.amount.toLocaleString()}</p>
            </div>

            {/* URL Copy Area */}
            <div className="bg-gray-50 rounded-xl p-1 flex items-center justify-between border border-gray-200 mb-6">
              <div className="px-3 py-2 overflow-hidden">
                  <p className="text-xs text-gray-500 truncate w-full font-mono">
                    {buildPublicUrl(link) || 'Link indisponível'}
                  </p>
              </div>
               <button 
                 onClick={() => handleCopy(link)}
                 className={`p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${copiedId === link.id ? 'bg-green-500 text-white' : 'bg-white text-gray-500 hover:text-brand-primary shadow-sm'}`}
                 title="Copiar Link"
               >
                 {copiedId === link.id ? <Check size={16} /> : <Copy size={16} />}
               </button>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
               <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                     <Eye size={14} />
                     <span>{link.views ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                     <ShoppingBag size={14} />
                     <span>{(link.sales ?? 0)} vendas</span>
                  </div>
               </div>
               
               <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${link.active ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className="text-xs font-medium text-gray-400">{link.active ? 'Ativo' : 'Inativo'}</span>
               </div>
            </div>

          </div>
        )))}

        {/* Add New Card (Empty State Style) */}
        <button 
        onClick={openCreateModal}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50/50 hover:border-brand-primary/40 transition-all group min-h-[280px]"
        >
           <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Plus size={32} className="text-gray-300 group-hover:text-brand-primary transition-colors" />
           </div>
           <h3 className="text-lg font-bold text-gray-400 group-hover:text-brand-primary transition-colors">Criar Novo Link</h3>
           <p className="text-sm text-gray-400 mt-2">Configure um novo checkout <br/> em segundos.</p>
        </button>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100">
            
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-dark-text">
                {editingId ? 'Editar Link de Pagamento' : 'Novo Link de Pagamento'}
              </h3>
              <button
                onClick={() => {
                  if (isCreating) return;
                  setIsModalOpen(false);
                  setEditingId(null);
                }}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                disabled={isCreating}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
               <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome do Serviço/Produto</label>
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Ex: Consultoria 1h" 
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                  />
               </div>

               <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor a cobrar (Kz)</label>
                  <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">Kz</span>
                     <input 
                      type="number" 
                      placeholder="0,00" 
                      value={newLinkAmount}
                      onChange={(e) => setNewLinkAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-medium text-lg"
                    />
                  </div>
               </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
               <button 
                onClick={() => {
                  if (isCreating) return;
                  setIsModalOpen(false);
                  setEditingId(null);
                }}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                disabled={isCreating}
               >
                 Cancelar
               </button>
               <button 
                onClick={handleCreateOrUpdateLink}
                disabled={isCreating}
                className="px-5 py-2.5 text-sm font-bold text-white bg-brand-primary hover:bg-brand-hover rounded-xl shadow-md shadow-indigo-200 transition-all disabled:opacity-50 flex items-center gap-2"
               >
                 {isCreating ? (
                   <>
                     <Loader2 size={16} className="animate-spin" />
                     {editingId ? 'A atualizar...' : 'A criar...'}
                   </>
                 ) : (
                   editingId ? 'Guardar alterações' : 'Criar Link'
                 )}
               </button>
            </div>

          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Apagar link de pagamento"
        message={
          confirmDelete
            ? `Tem a certeza que deseja apagar o link "${confirmDelete.title}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
        isLoading={!!(confirmDelete && deletingId === confirmDelete.id)}
      />

    </div>
  );
};
