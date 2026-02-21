import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Package, DollarSign, Edit3, Trash2, BookOpen, MonitorPlay, Users, X, Upload, Check, Image as ImageIcon, Link, Copy, CheckCircle, Loader2, AlertCircle, Download, Filter } from 'lucide-react';
import { Product } from '../types';
import { ProductEditor } from './ProductEditor';
import { productsApi } from '../services/productsApi';
import { apiProductToProduct, API_TYPE_FROM_CATEGORY } from '../lib/productMapper';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { ApiError } from '../services/api';

export const Products: React.FC = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [viewMode, setViewMode] = useState<'list' | 'editing'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    price: string;
    category: 'book' | 'course' | 'service' | 'digital';
    status: 'active' | 'draft';
    external_link: string;
    instructions: string;
    file: File | null;
    cover_image: File | null;
  }>({
    name: '',
    price: '',
    category: 'book',
    status: 'active',
    external_link: '',
    instructions: '',
    file: null,
    cover_image: null,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{ product: Product } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [productStatuses, setProductStatuses] = useState<{ value: string; label: string }[]>([
    { value: 'active', label: 'Ativo (Visível)' },
    { value: 'draft', label: 'Rascunho' },
  ]);

  const STATUS_LABELS: Record<string, string> = {
    active: 'Ativo (Visível)',
    draft: 'Rascunho',
    inactive: 'Inativo',
    archived: 'Arquivado',
  };

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await productsApi.list(1);
      const mapped = res.data.map(apiProductToProduct);
      setProducts(mapped);

      const statusesFromApi = [...new Set(res.data.map((p) => p.status).filter(Boolean))] as string[];
      const defaultStatuses = ['active', 'draft'];
      const allStatuses = [...new Set([...defaultStatuses, ...statusesFromApi])];
      setProductStatuses(
        allStatuses.map((s) => ({
          value: s,
          label: STATUS_LABELS[s] || s.charAt(0).toUpperCase() + s.slice(1),
        }))
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar produtos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (formData.cover_image) {
      const url = URL.createObjectURL(formData.cover_image);
      setCoverPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setCoverPreviewUrl(null);
    return undefined;
  }, [formData.cover_image]);

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = !filterCategory || p.category === filterCategory;
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const totalProducts = products.length;
  const totalRevenue = products.reduce((acc, curr) => acc + curr.price * curr.sales, 0);
  const totalSalesCount = products.reduce((acc, curr) => acc + curr.sales, 0);
  const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

  const handleQuickSaveProduct = async () => {
    if (!formData.name || !formData.price) return;
    setFormError(null);
    setIsCreating(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('price', formData.price);
      fd.append('type', API_TYPE_FROM_CATEGORY[formData.category]);
      fd.append('status', formData.status);

      if (formData.category === 'book' || formData.category === 'digital') {
        if (!formData.file) {
          setFormError('O ficheiro é obrigatório para e-book ou arquivo digital.');
          setIsCreating(false);
          return;
        }
        fd.append('file', formData.file);
      } else if (formData.category === 'course') {
        fd.append('external_link', formData.external_link || '');
      } else if (formData.category === 'service') {
        fd.append('instructions', formData.instructions || '');
      }
      if (formData.cover_image) {
        fd.append('cover_image', formData.cover_image);
      }

      await productsApi.create(fd);
      setIsModalOpen(false);
      setFormData({
        name: '',
        price: '',
        category: 'book',
        status: 'active',
        external_link: '',
        instructions: '',
        file: null,
        cover_image: null,
      });
      await fetchProducts();
      toast.success('Produto criado com sucesso.');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erro ao criar produto.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setViewMode('editing');
  };

  const handleSaveEditedProduct = (updatedProduct: Product) => {
    const updatedList = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
    setProducts(updatedList);
    setViewMode('list');
    setEditingProduct(null);
  };

  const handleDeleteClick = (product: Product) => setConfirmDelete({ product });

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await productsApi.delete(confirmDelete.product.id);
      setProducts((prev) => prev.filter((p) => p.id !== confirmDelete.product.id));
      setConfirmDelete(null);
      toast.success('Produto apagado com sucesso.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao apagar.');
    } finally {
      setIsDeleting(false);
    }
  };

  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const handleDownload = async (product: Product) => {
    if (!product.file_path || !['book', 'digital'].includes(product.category)) return;
    setIsDownloading(product.id);
    try {
      await productsApi.download(product.id, product.name);
      toast.success('Download iniciado.');
    } catch {
      toast.error('Erro ao fazer o download.');
    } finally {
      setIsDownloading(null);
    }
  };

  const handleCopyLink = (id: string) => {
    const mockUrl = `https://feerie.pay/checkout/${id.toLowerCase()}`;
    navigator.clipboard.writeText(mockUrl);
    setCopiedId(id);
    toast.success('Link copiado para a área de transferência.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'book':
        return <BookOpen size={14} className="text-blue-500" />;
      case 'course':
        return <MonitorPlay size={14} className="text-purple-500" />;
      case 'service':
        return <Users size={14} className="text-orange-500" />;
      case 'digital':
        return <Package size={14} className="text-teal-500" />;
      default:
        return <Package size={14} className="text-gray-500" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'book':
        return 'Livro / E-book';
      case 'course':
        return 'Curso Online';
      case 'service':
        return 'Serviço / Mentoria';
      case 'digital':
        return 'Arquivo Digital';
      default:
        return 'Outro';
    }
  };

  const handleSaveToApi = useCallback(
    (productId: string) => async (formData: FormData): Promise<Product | void> => {
      try {
        const res = await productsApi.update(productId, formData);
        await fetchProducts();
        toast.success('Produto atualizado com sucesso.');
        return apiProductToProduct(res);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Erro ao atualizar.');
        throw err;
      }
    },
    [toast, fetchProducts]
  );

  if (viewMode === 'editing' && editingProduct) {
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto relative">
        <ProductEditor
          product={editingProduct}
          onBack={() => { setViewMode('list'); setEditingProduct(null); }}
          onSave={handleSaveEditedProduct}
          onSaveToApi={isAdmin ? handleSaveToApi(editingProduct.id) : undefined}
        />
      </div>
    );
  }

  // --- RENDER LIST MODE ---
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 relative">
      
      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-bold text-dark-text">Meus Produtos</h2>
        <p className="text-gray-500 text-sm">Gerencie seus livros, cursos e serviços.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white relative overflow-hidden rounded-2xl p-6 shadow-soft border border-gray-50 group hover:shadow-lg transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl group-hover:bg-brand-primary/20 transition-all duration-500"></div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center mb-4 shadow-sm text-brand-primary">
              <DollarSign size={20} />
            </div>
            <p className="text-3xl font-bold text-dark-text mb-1">Kz {averageTicket.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-sm text-gray-500">
              Ticket médio calculado sobre <span className="font-semibold text-brand-primary">{totalSalesCount}</span> vendas realizadas.
            </p>
          </div>
        </div>

        <div className="bg-white relative overflow-hidden rounded-2xl p-6 shadow-soft border border-gray-50 group hover:shadow-lg transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl group-hover:bg-emerald-400/20 transition-all duration-500"></div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center mb-4 shadow-sm text-emerald-600">
              <Package size={20} />
            </div>
            <p className="text-3xl font-bold text-dark-text mb-1">{totalProducts}</p>
            <p className="text-sm text-gray-500">
              Produtos ativos no catálogo (Livros e Cursos).
            </p>
          </div>
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Pesquisar livros, cursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen((v) => !v)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                isFilterOpen || filterCategory || filterStatus
                  ? 'bg-indigo-50 border-brand-primary text-brand-primary'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              title="Filtrar"
            >
              <Filter size={18} />
              <span>Filtrar</span>
              {(filterCategory || filterStatus) && (
                <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-bold">
                  {(filterCategory ? 1 : 0) + (filterStatus ? 1 : 0)}
                </span>
              )}
            </button>
            {isFilterOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsFilterOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full mt-2 z-50 w-72 p-4 bg-white rounded-xl shadow-lg border border-gray-100 animate-fade-in">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Filtros</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">Categoria</label>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                      >
                        <option value="">Todas</option>
                        <option value="book">E-book</option>
                        <option value="course">Curso</option>
                        <option value="digital">Arquivo</option>
                        <option value="service">Serviço</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                      >
                        <option value="">Todos</option>
                        <option value="active">Ativo</option>
                        <option value="draft">Rascunho</option>
                      </select>
                    </div>
                  </div>
                  {(filterCategory || filterStatus) && (
                    <button
                      onClick={() => {
                        setFilterCategory('');
                        setFilterStatus('');
                      }}
                      className="mt-3 w-full py-2 text-sm font-medium text-gray-500 hover:text-brand-primary hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setFormError(null);
                setIsModalOpen(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-hover shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <Plus size={18} />
              <span>Novo Produto</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button
            onClick={() => fetchProducts()}
            className="ml-auto text-sm font-semibold hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 size={32} className="animate-spin mb-4" />
            <p>A carregar produtos...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Item</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Categoria</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Preço</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendas</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-16 rounded-lg overflow-hidden border border-gray-100 shadow-sm flex-shrink-0 relative bg-gray-100">
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-dark-text line-clamp-1">{product.name}</p>
                          <p className="text-xs text-gray-400 uppercase">{product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                         <div className="p-1.5 rounded-md bg-gray-50 border border-gray-100">
                            {getCategoryIcon(product.category)}
                         </div>
                         <span className="text-sm text-gray-600">{getCategoryLabel(product.category)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-dark-text">
                      Kz {product.price.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {product.sales} un
                    </td>
                    <td className="py-4 px-6">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                         product.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                       }`}>
                         {product.status === 'active' ? 'Ativo' : 'Rascunho'}
                       </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(product.category === 'book' || product.category === 'digital') && product.file_path && (
                          <button
                            onClick={() => handleDownload(product)}
                            disabled={isDownloading === product.id}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Descarregar ficheiro"
                          >
                            {isDownloading === product.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Download size={16} />
                            )}
                          </button>
                        )}
                        <button 
                          onClick={() => handleCopyLink(product.id)}
                          className={`p-2 rounded-lg transition-all ${
                            copiedId === product.id 
                            ? 'text-green-600 bg-green-50' 
                            : 'text-gray-400 hover:text-brand-primary hover:bg-indigo-50'
                          }`} 
                          title="Copiar Link de Pagamento"
                        >
                          {copiedId === product.id ? <CheckCircle size={16} /> : <Link size={16} />}
                        </button>
                        <button
                          onClick={() => handleEditClick(product)}
                          className="p-2 text-gray-400 hover:text-brand-primary hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit3 size={16} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteClick(product)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Package size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-dark-text">
              {searchTerm || filterCategory || filterStatus ? 'Nenhum produto encontrado' : 'Ainda não há produtos'}
            </h3>
            <p className="text-gray-500 text-sm mt-1 max-w-xs">
              {searchTerm || filterCategory || filterStatus
                ? 'Nenhum produto corresponde aos filtros aplicados.'
                : 'Crie o seu primeiro produto para começar a vender.'}
            </p>
            {searchTerm || filterCategory || filterStatus ? (
              <button
                onClick={() => { setSearchTerm(''); setFilterCategory(''); setFilterStatus(''); }}
                className="mt-6 text-brand-primary font-semibold text-sm hover:underline"
              >
                Limpar filtros
              </button>
            ) : (
              isAdmin && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-6 px-4 py-2 bg-brand-primary text-white font-semibold text-sm rounded-xl hover:bg-brand-hover"
                >
                  Criar Produto
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Create Product Modal (Quick Add) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all scale-100 flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-xl font-bold text-dark-text">Criar Novo Produto</h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setFormError(null);
                  setFormData({ name: '', price: '', category: 'book', status: 'active', external_link: '', instructions: '', file: null, cover_image: null });
                  setCoverPreviewUrl(null);
                }}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                  <AlertCircle size={18} />
                  {formError}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome do Produto</label>
                <input
                  type="text"
                  placeholder="Ex: E-book Como Investir na Bolsa"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preço (Kz)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">Kz</span>
                      <input 
                        type="number" 
                        placeholder="0,00"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                   <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as Product['status']})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all bg-white"
                    >
                      {productStatuses.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de Produto</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'book' as const, label: 'E-book', icon: BookOpen },
                    { id: 'course' as const, label: 'Curso', icon: MonitorPlay },
                    { id: 'digital' as const, label: 'Arquivo', icon: Package },
                    { id: 'service' as const, label: 'Serviço', icon: Users },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, category: cat.id, file: null })
                      }
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        formData.category === cat.id
                          ? 'border-brand-primary bg-indigo-50 text-brand-primary'
                          : 'border-gray-100 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <cat.icon size={20} />
                      <span className="text-xs font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Imagem de capa
                </label>
                <label className="block border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) =>
                      setFormData({ ...formData, cover_image: e.target.files?.[0] ?? null })
                    }
                  />
                  <div className="flex items-center gap-4">
                    {coverPreviewUrl ? (
                      <>
                        <img
                          src={coverPreviewUrl}
                          alt="Preview capa"
                          className="w-16 h-20 object-cover rounded-lg shrink-0"
                        />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-brand-primary">{formData.cover_image.name}</p>
                          <p className="text-xs text-gray-500">Recomendado: 1000×1500px. Máx. 2MB. JPG, PNG.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-20 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <ImageIcon size={24} className="text-gray-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm text-gray-600">Clique para escolher uma imagem</p>
                          <p className="text-xs text-gray-500">Recomendado: 1000×1500px. Máx. 2MB. JPG, PNG.</p>
                        </div>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {(formData.category === 'book' || formData.category === 'digital') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Ficheiro do produto *
                  </label>
                  <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:bg-gray-50 transition-colors text-center">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.epub,.zip"
                      onChange={(e) =>
                        setFormData({ ...formData, file: e.target.files?.[0] ?? null })
                      }
                    />
                    {formData.file ? (
                      <p className="text-sm font-medium text-brand-primary">{formData.file.name}</p>
                    ) : (
                      <>
                        <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">PDF, EPUB, ZIP (Máx. 10MB)</p>
                      </>
                    )}
                  </label>
                </div>
              )}

              {formData.category === 'course' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Link do curso *
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.external_link}
                    onChange={(e) =>
                      setFormData({ ...formData, external_link: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none"
                  />
                </div>
              )}

              {formData.category === 'service' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Instruções de entrega *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Entra em contacto após a compra para agendar a sessão..."
                    value={formData.instructions}
                    onChange={(e) =>
                      setFormData({ ...formData, instructions: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none resize-none"
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormError(null);
                  setFormData({ name: '', price: '', category: 'book', status: 'active', external_link: '', instructions: '', file: null, cover_image: null });
                  setCoverPreviewUrl(null);
                }}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleQuickSaveProduct}
                disabled={
                  isCreating ||
                  !formData.name ||
                  !formData.price ||
                  (formData.category === 'book' || formData.category === 'digital'
                    ? !formData.file
                    : formData.category === 'course'
                      ? !formData.external_link.trim()
                      : formData.category === 'service'
                        ? !formData.instructions.trim()
                        : false)
                }
                className="px-5 py-2.5 text-sm font-bold text-white bg-brand-primary hover:bg-brand-hover rounded-xl shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    A criar...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Criar Produto
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Apagar produto"
        message={
          confirmDelete
            ? `Tem a certeza que deseja apagar "${confirmDelete.product.name}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
