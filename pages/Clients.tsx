import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Download, Filter, MoreHorizontal, Mail, Smartphone, Shield, Ban, CheckCircle,
  User, X, Calendar, Edit3, Trash2, Loader2, AlertCircle,
} from 'lucide-react';
import { Client } from '../types';
import { customersApi } from '../services/customersApi';
import { apiCustomerToClient } from '../lib/customerMapper';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { ApiError, getFriendlyErrorMessage } from '../services/api';
import type { ApiCustomer } from '../api/types';
import type { CustomerStatus } from '../api/types';

const STATUS_OPTIONS: { value: CustomerStatus; label: string }[] = [
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'blocked', label: 'Bloqueado' },
];

export const Clients: React.FC = () => {
  const toast = useToast();
  const { canManageCustomers } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState<{
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<{ name: string; email: string; phone: string; status: Client['status'] }>({ name: '', email: '', phone: '', status: 'active' });

  const [newClient, setNewClient] = useState<{ name: string; email: string; phone: string; status: Client['status'] }>({ name: '', email: '', phone: '', status: 'active' });
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCustomers = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = (await customersApi.list(page, 10)) as unknown as Record<string, unknown>;
      const data = Array.isArray(res?.data) ? res.data : [];
      const meta = (res?.meta ?? res) as Record<string, unknown> | undefined;
      const total = Number(meta?.total ?? data.length) || 0;
      const perPage = Number(meta?.per_page ?? 10) || 10;
      const currentPageNum = Number(meta?.current_page ?? page) || 1;
      const lastPage = Number(meta?.last_page) || Math.max(1, Math.ceil(total / perPage));
      const mapped = (data as ApiCustomer[]).map(apiCustomerToClient);
      setClients(mapped);
      setPaginationMeta({
        current_page: currentPageNum,
        per_page: perPage,
        total,
        last_page: lastPage,
      });
    } catch (err) {
      setError(getFriendlyErrorMessage(err instanceof ApiError ? err.message : 'Erro ao carregar clientes.'));
      console.error('[Clients] fetchCustomers error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(currentPage);
  }, [currentPage, fetchCustomers]);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone && client.phone.includes(searchTerm))
  );

  const totalCustomers = paginationMeta ? paginationMeta.total : 0;
  const totalSpentSum = clients.reduce((acc, c) => acc + c.totalSpent, 0);
  const averageLTV = clients.length > 0 ? totalSpentSum / clients.length : 0;

  const handleCreateClient = async () => {
    if (!newClient.name.trim() || !newClient.email.trim() || !newClient.phone.trim()) {
      setFormError('Nome, email e telefone são obrigatórios.');
      return;
    }
    setFormError(null);
    setIsCreating(true);
    try {
      await customersApi.create({
        name: newClient.name.trim(),
        email: newClient.email.trim(),
        phone: newClient.phone.trim(),
        status: newClient.status,
      });
      toast.success('Cliente criado com sucesso.');
      setIsModalOpen(false);
      setNewClient({ name: '', email: '', phone: '', status: 'active' });
      fetchCustomers(currentPage);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const first = Object.values(err.errors).flat()[0];
        setFormError(first ? getFriendlyErrorMessage(first) : getFriendlyErrorMessage(err.message));
      } else {
        setFormError(getFriendlyErrorMessage(err instanceof ApiError ? err.message : 'Erro ao criar cliente.'));
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateClient = async () => {
    if (!selectedClient) return;
    if (!editForm.name.trim() || !editForm.email.trim()) {
      toast.error('Nome e email são obrigatórios.');
      return;
    }
    setIsUpdating(true);
    try {
      await customersApi.update(selectedClient.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
        status: editForm.status,
      });
      toast.success('Cliente atualizado com sucesso.');
      setIsEditMode(false);
      setSelectedClient({
        ...selectedClient,
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        status: editForm.status,
      });
      fetchCustomers(currentPage);
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err instanceof ApiError ? err.message : 'Erro ao atualizar cliente.'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await customersApi.delete(confirmDelete.id);
      toast.success('Cliente apagado com sucesso.');
      setConfirmDelete(null);
      setSelectedClient(null);
      fetchCustomers(currentPage);
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err instanceof ApiError ? err.message : 'Erro ao apagar cliente.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (client: Client) => {
    setSelectedClient(client);
    setEditForm({ name: client.name, email: client.email, phone: client.phone, status: client.status });
    setIsEditMode(true);
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-600';
      case 'blocked': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'blocked': return 'Bloqueado';
      default: return status;
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 relative">
      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700">
          <AlertCircle size={20} />
          <span className="flex-1">{error}</span>
          <button onClick={() => fetchCustomers(currentPage)} className="text-sm font-semibold hover:underline">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-50 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Total de Membros</p>
            <h3 className="text-2xl font-bold text-dark-text">{totalCustomers}</h3>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-brand-primary rounded-lg flex items-center justify-center">
            <User size={20} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-50 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Nesta página</p>
            <h3 className="text-2xl font-bold text-dark-text">{clients.length}</h3>
          </div>
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
            <User size={20} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-50 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Valor Médio (LTV)</p>
            <h3 className="text-2xl font-bold text-dark-text">
              Kz {Math.round(averageLTV).toLocaleString()}
            </h3>
          </div>
          <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center">
            <Shield size={20} />
          </div>
        </div>
      </div>

      {/* Actions & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
          />
        </div>
        <div className="flex w-full sm:w-auto gap-3">
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Download size={18} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter size={18} />
            <span className="hidden sm:inline">Filtros</span>
          </button>
          {canManageCustomers && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-hover shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <Plus size={18} />
              <span>Adicionar Cliente</span>
            </button>
          )}
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 size={32} className="animate-spin mb-4" />
            <p>A carregar clientes...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Membro / Cliente</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contato</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Gasto Total (LTV)</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Última Compra</th>
                    <th className="text-right py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => { setSelectedClient(client); setEditForm({ name: client.name, email: client.email, phone: client.phone, status: client.status }); setIsEditMode(false); }}
                      className="hover:bg-gray-50 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-white shadow-sm flex items-center justify-center text-gray-500 font-bold text-sm">
                            {getInitials(client.name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-dark-text">{client.name}</p>
                            <p className="text-xs text-gray-400">Desde {client.joinDate}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Mail size={14} className="text-gray-400" />
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <Smartphone size={14} className="text-gray-400" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                          {client.status === 'active' && <CheckCircle size={12} />}
                          {client.status === 'blocked' && <Ban size={12} />}
                          {getStatusLabel(client.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-dark-text">
                        Kz {client.totalSpent.toLocaleString()}
                        <span className="block text-xs font-normal text-gray-400">{client.productsCount} pedidos</span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {client.lastPurchase}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {canManageCustomers && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(client); }}
                            className="p-2 text-gray-400 hover:bg-gray-100 hover:text-brand-primary rounded-lg transition-all"
                          >
                            <MoreHorizontal size={20} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredClients.length === 0 && !isLoading && (
              <div className="py-12 text-center">
                <p className="text-gray-500">Nenhum cliente encontrado.</p>
              </div>
            )}
            {paginationMeta && paginationMeta.total > 0 && paginationMeta.last_page > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <p className="text-sm text-gray-500">
                  Mostrando {(paginationMeta.current_page - 1) * paginationMeta.per_page + 1}–
                  {Math.min(paginationMeta.current_page * paginationMeta.per_page, paginationMeta.total)} de {paginationMeta.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={paginationMeta.current_page <= 1}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(paginationMeta.last_page, p + 1))}
                    disabled={paginationMeta.current_page >= paginationMeta.last_page}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-dark-text">Cadastrar Novo Cliente</h3>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">{formError}</div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase">Nome Completo</label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none"
                  placeholder="Ex: João Manuel"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none"
                  placeholder="Ex: cliente@email.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase">Telefone (WhatsApp)</label>
                <input
                  type="tel"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none"
                  placeholder="Ex: 9XX XXX XXX"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                <select
                  value={newClient.status}
                  onChange={(e) => setNewClient({ ...newClient, status: e.target.value as Client['status'] })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none bg-white"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => { setIsModalOpen(false); setFormError(null); }}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateClient}
                disabled={isCreating}
                className="px-4 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-hover shadow-md disabled:opacity-70 flex items-center gap-2"
              >
                {isCreating && <Loader2 size={16} className="animate-spin" />}
                Salvar Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Details Drawer */}
      {selectedClient && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => { setSelectedClient(null); setIsEditMode(false); }}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 ease-out border-l border-gray-100">
            <div className="relative h-32 bg-gradient-to-r from-brand-primary to-indigo-400">
              <button
                onClick={() => { setSelectedClient(null); setIsEditMode(false); }}
                className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors backdrop-blur-md"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-8 -mt-12 mb-6">
              <div className="flex justify-between items-end mb-4">
                <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-500">
                    {getInitials(selectedClient.name)}
                  </div>
                </div>
                {canManageCustomers && (
                  <div className="flex gap-2 mb-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(selectedClient); }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 shadow-sm"
                    >
                      <Trash2 size={14} />
                      Excluir
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsEditMode(!isEditMode); setEditForm({ name: selectedClient.name, email: selectedClient.email, phone: selectedClient.phone, status: selectedClient.status }); }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-white rounded-lg text-xs font-bold hover:bg-brand-hover shadow-sm shadow-indigo-200"
                    >
                      <Edit3 size={14} />
                      {isEditMode ? 'Cancelar' : 'Editar'}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-dark-text">{selectedClient.name}</h2>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${getStatusColor(selectedClient.status)} border-current/20`}>
                    {getStatusLabel(selectedClient.status)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={14} /> Cliente desde {selectedClient.joinDate}</span>
                </div>
              </div>
            </div>

            <div className="px-8 grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                <p className="text-xs text-gray-400 font-medium uppercase mb-1">Total Gasto</p>
                <p className="text-sm font-bold text-brand-primary">Kz {selectedClient.totalSpent.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                <p className="text-xs text-gray-400 font-medium uppercase mb-1">Pedidos</p>
                <p className="text-sm font-bold text-dark-text">{selectedClient.productsCount}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                <p className="text-xs text-gray-400 font-medium uppercase mb-1">Ticket Médio</p>
                <p className="text-sm font-bold text-dark-text">
                  Kz {selectedClient.productsCount > 0 ? Math.round(selectedClient.totalSpent / selectedClient.productsCount).toLocaleString() : 0}
                </p>
              </div>
            </div>

            <div className="px-8 space-y-8 pb-10">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-dark-text flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  Dados Pessoais
                </h3>
                {isEditMode ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-medium ml-1">Nome</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-medium ml-1">Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-medium ml-1">Telefone</label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-medium ml-1">Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Client['status'] })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none bg-white"
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleUpdateClient}
                      disabled={isUpdating}
                      className="w-full py-3 bg-brand-primary text-white rounded-xl font-bold text-sm hover:bg-brand-hover flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isUpdating && <Loader2 size={18} className="animate-spin" />}
                      Salvar Alterações
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-medium ml-1">Email</label>
                      <div className="flex items-center gap-2 text-sm text-dark-text">
                        <Mail size={16} className="text-gray-400" />
                        {selectedClient.email}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-medium ml-1">Telefone</label>
                      <div className="flex items-center gap-2 text-sm text-dark-text">
                        <Smartphone size={16} className="text-gray-400" />
                        {selectedClient.phone || '—'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Excluir cliente"
        message={confirmDelete ? `Tem certeza que deseja excluir "${confirmDelete.name}"? Esta ação não pode ser desfeita.` : ''}
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={handleDeleteClient}
        onCancel={() => setConfirmDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
