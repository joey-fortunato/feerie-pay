
import React, { useState } from 'react';
import { Plus, Shield, Mail, Trash2, Check, X, ShieldCheck, User, Eye, AlertCircle, Edit3, Save } from 'lucide-react';
import { TeamMember } from '../types';

const initialTeam: TeamMember[] = [
  {
    id: 'USR-001',
    name: 'João Manuel',
    email: 'joao.admin@loja.ao',
    role: 'admin',
    status: 'active',
    addedAt: '01 Jan, 2023',
    avatar: 'JM'
  },
  {
    id: 'USR-002',
    name: 'Ana Sofia',
    email: 'ana.suporte@loja.ao',
    role: 'editor',
    status: 'active',
    addedAt: '15 Mar, 2023',
    avatar: 'AS'
  },
  {
    id: 'USR-003',
    name: 'Carlos Pedro',
    email: 'carlos.pedro@gmail.com',
    role: 'viewer',
    status: 'pending',
    addedAt: 'Hoje',
    avatar: 'CP'
  }
];

export const Team: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'viewer' as 'admin' | 'editor' | 'viewer'
  });

  const openInviteModal = () => {
    setEditingMember(null);
    setFormData({ name: '', email: '', role: 'viewer' });
    setIsModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) return;

    if (editingMember) {
      // Update existing member
      setTeam(team.map(member => 
        member.id === editingMember.id 
          ? { 
              ...member, 
              ...formData, 
              avatar: formData.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() 
            } 
          : member
      ));
    } else {
      // Create new member
      const newMember: TeamMember = {
        id: `USR-${Math.floor(Math.random() * 10000)}`,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: 'pending',
        addedAt: 'Agora',
        avatar: formData.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      };
      setTeam([...team, newMember]);
    }

    setIsModalOpen(false);
    setEditingMember(null);
    setFormData({ name: '', email: '', role: 'viewer' });
  };

  const handleRemove = (id: string) => {
    if (confirm('Tem certeza que deseja remover o acesso deste usuário?')) {
      setTeam(team.filter(m => m.id !== id));
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold"><ShieldCheck size={12} /> Administrador</span>;
      case 'editor':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold"><User size={12} /> Editor</span>;
      case 'viewer':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold"><Eye size={12} /> Visualizador</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dark-text">Equipe e Permissões</h2>
          <p className="text-gray-500 text-sm">Conceda acesso seguro para seus colaboradores.</p>
        </div>
        <button 
          onClick={openInviteModal}
          className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-hover shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5"
        >
          <Plus size={18} />
          Convidar Membro
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Members List */}
        <div className="lg:col-span-2 space-y-6">
          {team.map((member) => (
            <div key={member.id} className="bg-white p-6 rounded-2xl shadow-soft border border-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm border border-white shadow-sm">
                  {member.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-dark-text">{member.name}</h3>
                    {member.status === 'pending' && (
                      <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">Pendente</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail size={12} /> {member.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div>{getRoleBadge(member.role)}</div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openEditModal(member)}
                    className="p-2 text-gray-400 hover:text-brand-primary hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Editar Permissões"
                  >
                    <Edit3 size={18} />
                  </button>
                  {member.role !== 'admin' && (
                    <button 
                      onClick={() => handleRemove(member.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover Acesso"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
           <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <h3 className="text-blue-800 font-bold mb-3 flex items-center gap-2">
                <Shield size={18} />
                Níveis de Acesso
              </h3>
              <ul className="space-y-4 text-sm">
                <li className="flex gap-3">
                   <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">A</div>
                   <div>
                      <span className="font-bold text-blue-900">Administrador</span>
                      <p className="text-blue-700/80 text-xs mt-0.5">Acesso total: Financeiro, configurações, equipe e saques.</p>
                   </div>
                </li>
                <li className="flex gap-3">
                   <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">E</div>
                   <div>
                      <span className="font-bold text-blue-900">Editor</span>
                      <p className="text-blue-700/80 text-xs mt-0.5">Pode editar produtos, cupons e ver clientes. Sem acesso financeiro.</p>
                   </div>
                </li>
                <li className="flex gap-3">
                   <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">V</div>
                   <div>
                      <span className="font-bold text-blue-900">Visualizador</span>
                      <p className="text-blue-700/80 text-xs mt-0.5">Apenas visualização. Ideal para suporte nível 1.</p>
                   </div>
                </li>
              </ul>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex gap-3 items-start">
                 <AlertCircle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
                 <div>
                    <h4 className="font-bold text-dark-text text-sm">Segurança da Conta</h4>
                    <p className="text-xs text-gray-500 mt-1">Recomendamos que todos os administradores ativem a autenticação em dois fatores (2FA).</p>
                 </div>
              </div>
           </div>
        </div>

      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100">
             
             <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-bold text-dark-text">
                  {editingMember ? 'Editar Membro' : 'Convidar Membro'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
             </div>

             <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-gray-500 uppercase">Nome</label>
                   <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Maria Silva"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all"
                   />
                </div>
                
                <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-gray-500 uppercase">E-mail</label>
                   <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@empresa.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all"
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-semibold text-gray-500 uppercase">Permissão</label>
                   <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: 'editor', label: 'Editor', desc: 'Gerenciar produtos e vendas' },
                        { id: 'viewer', label: 'Visualizador', desc: 'Apenas leitura' },
                        { id: 'admin', label: 'Administrador', desc: 'Acesso total ao sistema' },
                      ].map((role) => (
                        <div 
                          key={role.id}
                          onClick={() => setFormData({...formData, role: role.id as any})}
                          className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                            formData.role === role.id 
                            ? 'border-brand-primary bg-indigo-50' 
                            : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                           <div>
                              <p className={`text-sm font-bold ${formData.role === role.id ? 'text-brand-primary' : 'text-gray-700'}`}>{role.label}</p>
                              <p className="text-xs text-gray-500">{role.desc}</p>
                           </div>
                           {formData.role === role.id && <Check size={16} className="text-brand-primary" />}
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-hover shadow-md shadow-indigo-200 flex items-center gap-2"
                >
                  {editingMember ? <Save size={18} /> : <Mail size={18} />}
                  {editingMember ? 'Salvar Alterações' : 'Enviar Convite'}
                </button>
             </div>

          </div>
        </div>
      )}

    </div>
  );
};
