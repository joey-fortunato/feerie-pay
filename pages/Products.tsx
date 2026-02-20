
import React, { useState } from 'react';
import { Search, Plus, Package, DollarSign, Filter, Edit3, Trash2, BookOpen, MonitorPlay, Users, X, Upload, Check, Image as ImageIcon, Link, Copy, CheckCircle, ArrowLeft } from 'lucide-react';
import { Product } from '../types';
import { ProductEditor } from './ProductEditor';

// Mock Data Updated with Books
const initialProducts: Product[] = [
  { 
    id: 'PRD-001', 
    name: 'E-book: Dominando o E-kwanza', 
    price: 8000, 
    image: 'https://placehold.co/400x600/6363F1/FFFFFF?text=E-book+Kwanza', 
    type: 'unique', 
    category: 'book',
    sales: 342, 
    createdAt: '12 Out, 2023',
    status: 'active'
  },
  { 
    id: 'PRD-002', 
    name: 'Livro: Empreendedorismo em Angola', 
    price: 15000, 
    image: 'https://placehold.co/400x600/29363D/FFFFFF?text=Livro+Fisico', 
    type: 'unique', 
    category: 'book',
    sales: 89, 
    createdAt: '10 Out, 2023',
    status: 'active'
  },
  { 
    id: 'PRD-003', 
    name: 'Curso: Marketing Digital 360', 
    price: 25000, 
    image: 'https://placehold.co/600x400/e2e8f0/64748B?text=Curso+Online', 
    type: 'unique', 
    category: 'course',
    sales: 124, 
    createdAt: '15 Set, 2023',
    status: 'active'
  },
  { 
    id: 'PRD-004', 
    name: 'Mentoria Individual (1h)', 
    price: 50000, 
    image: 'https://placehold.co/400x400/orange/white?text=Mentoria', 
    type: 'unique', 
    category: 'service',
    sales: 12, 
    createdAt: '15 Set, 2023',
    status: 'active'
  },
  { 
    id: 'PRD-005', 
    name: 'Comunidade VIP (Assinatura)', 
    price: 5000, 
    image: 'https://placehold.co/400x400/10b981/white?text=VIP', 
    type: 'subscription', 
    category: 'service',
    sales: 450, 
    createdAt: '01 Ago, 2023',
    status: 'draft'
  },
];

export const Products: React.FC = () => {
  // View State: 'list' or 'editing'
  const [viewMode, setViewMode] = useState<'list' | 'editing'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State for "Quick Create" modal
  const [formData, setFormData] = useState<{
    name: string;
    price: string;
    category: 'book' | 'course' | 'service';
    status: 'active' | 'draft';
  }>({
    name: '',
    price: '',
    category: 'book',
    status: 'active'
  });

  // Filter Logic
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats Calculations
  const totalProducts = products.length;
  const totalRevenue = products.reduce((acc, curr) => acc + (curr.price * curr.sales), 0);
  const totalSalesCount = products.reduce((acc, curr) => acc + curr.sales, 0);
  const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

  const handleQuickSaveProduct = () => {
    if (!formData.name || !formData.price) return;

    const newProduct: Product = {
      id: `PRD-${Math.floor(Math.random() * 10000)}`,
      name: formData.name,
      price: parseFloat(formData.price),
      image: formData.category === 'book' 
        ? 'https://placehold.co/400x600/6363F1/FFFFFF?text=Novo+Livro' 
        : 'https://placehold.co/600x400/e2e8f0/64748B?text=Novo+Produto',
      type: 'unique',
      category: formData.category,
      sales: 0,
      createdAt: new Date().toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: formData.status,
    };

    setProducts([newProduct, ...products]);
    setIsModalOpen(false);
    setFormData({ name: '', price: '', category: 'book', status: 'active' }); // Reset form
    
    // Optional: Automatically switch to edit mode for the new product
    handleEditClick(newProduct);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setViewMode('editing');
  };

  const handleSaveEditedProduct = (updatedProduct: Product) => {
    // Update the product in the main list
    const updatedList = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(updatedList);
    setViewMode('list');
    setEditingProduct(null);
  };

  const handleCopyLink = (id: string) => {
    const mockUrl = `https://feerie.pay/checkout/${id.toLowerCase()}`;
    navigator.clipboard.writeText(mockUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'book': return <BookOpen size={14} className="text-blue-500" />;
      case 'course': return <MonitorPlay size={14} className="text-purple-500" />;
      case 'service': return <Users size={14} className="text-orange-500" />;
      default: return <Package size={14} className="text-gray-500" />;
    }
  };

  const getCategoryLabel = (category: string) => {
     switch(category) {
      case 'book': return 'Livro / E-book';
      case 'course': return 'Curso Online';
      case 'service': return 'Serviço / Mentoria';
      default: return 'Outro';
    }
  };

  const getImageRecommendation = (category: string) => {
    switch(category) {
      case 'book': 
        return { label: 'Vertical (Capa de Livro)', size: '1000 x 1500 px', aspect: 'aspect-[2/3]' };
      case 'course': 
        return { label: 'Horizontal (Thumbnail)', size: '1280 x 720 px', aspect: 'aspect-video' };
      case 'service': 
        return { label: 'Quadrado (Instagram)', size: '1080 x 1080 px', aspect: 'aspect-square' };
      default: 
        return { label: 'Automático', size: 'Qualquer tamanho', aspect: 'aspect-square' };
    }
  };

  const recommendation = getImageRecommendation(formData.category);

  // --- RENDER EDITOR MODE ---
  if (viewMode === 'editing' && editingProduct) {
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto relative">
        <ProductEditor 
          product={editingProduct} 
          onBack={() => setViewMode('list')} 
          onSave={handleSaveEditedProduct}
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
        
        <div className="flex w-full sm:w-auto gap-3">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter size={18} />
            <span>Filtrar</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-hover shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus size={18} />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        {filteredProducts.length > 0 ? (
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
                         <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                          <Trash2 size={16} />
                        </button>
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
               <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-dark-text">Nenhum produto encontrado</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-xs">
              Não encontramos nenhum produto com o termo "{searchTerm}". Tente limpar o filtro ou criar um novo.
            </p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-6 text-brand-primary font-semibold text-sm hover:underline"
            >
              Limpar pesquisa
            </button>
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
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome do Produto</label>
                <input 
                  type="text" 
                  placeholder="Ex: E-book Como Investir na Bolsa"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all bg-white"
                    >
                      <option value="active">Ativo (Visível)</option>
                      <option value="draft">Rascunho</option>
                    </select>
                  </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de Produto</label>
                 <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'book', label: 'Livro / Ebook', icon: BookOpen },
                      { id: 'course', label: 'Curso Online', icon: MonitorPlay },
                      { id: 'service', label: 'Mentoria', icon: Users },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setFormData({...formData, category: cat.id as any})}
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

              <div className="space-y-2">
                 <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Capa do Produto</label>
                 <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors group relative overflow-hidden">
                     <div className="relative z-10 flex flex-col items-center">
                       <div className="w-12 h-12 bg-indigo-50 text-brand-primary rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Upload size={20} />
                       </div>
                       <p className="text-sm font-bold text-dark-text mb-1">Clique para fazer upload</p>
                       <p className="text-xs text-gray-400 mb-3">PNG, JPG ou GIF (Máx. 5MB)</p>
                       <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md border border-gray-200 animate-fade-in">
                          <div className="flex items-center gap-1.5">
                             <ImageIcon size={12} className="text-gray-500" />
                             <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                                {recommendation.label}
                             </span>
                          </div>
                          <span className="text-[10px] text-gray-300">|</span>
                          <span className="text-[10px] font-medium text-brand-primary">
                             {recommendation.size}
                          </span>
                       </div>
                     </div>
                 </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
               <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
               >
                 Cancelar
               </button>
               <button 
                onClick={handleQuickSaveProduct}
                disabled={!formData.name || !formData.price}
                className="px-5 py-2.5 text-sm font-bold text-white bg-brand-primary hover:bg-brand-hover rounded-xl shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
               >
                 <Check size={16} />
                 Criar e Editar
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
