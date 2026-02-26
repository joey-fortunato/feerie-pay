import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      onLogin();
      return;
    }

    if (result.errors) {
      const map: Record<string, string> = {};
      for (const [k, v] of Object.entries(result.errors)) {
        map[k] = Array.isArray(v) ? v[0] : String(v);
      }
      setFieldErrors(map);
    }
    setError(result.error || (!result.errors ? 'Erro ao fazer login.' : null));
  };

  return (
    <div className="min-h-screen w-full flex bg-white animate-fade-in">
      
      {/* Left Side - Branding & Visuals (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#29363D] relative overflow-hidden flex-col justify-between p-12 text-white">
        
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap size={24} fill="currentColor" className="text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Feerie Pay</span>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            O futuro dos pagamentos em <span className="text-brand-primary">Angola</span>.
          </h1>
          <p className="text-lg text-gray-300 mb-8 leading-relaxed">
            Gerencie vendas, aceite pagamentos via multicaixa e e-kwanza, e escale o seu negócio digital em uma única plataforma.
          </p>
          
          <div className="space-y-4">
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                   <CheckCircle size={14} />
                </div>
                <span className="text-gray-200 font-medium">Integração direta com e-kwanza</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                   <CheckCircle size={14} />
                </div>
                <span className="text-gray-200 font-medium">Checkouts de alta conversão</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                   <CheckCircle size={14} />
                </div>
                <span className="text-gray-200 font-medium">Segurança bancária (PCI DSS)</span>
             </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="relative z-10 flex justify-between items-center text-sm text-gray-400 border-t border-white/10 pt-6">
          <p>© 2024 Feerie Pay, Lda.</p>
          <div className="flex gap-4">
             <span>Termos</span>
             <span>Privacidade</span>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-bg-main">
         <div className="w-full max-w-md space-y-8">
            
            {/* Mobile Logo (Visible only on small screens) */}
            <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white">
                <Zap size={18} fill="currentColor" />
              </div>
              <span className="text-xl font-bold text-dark-text">Feerie Pay</span>
            </div>

            <div className="text-center lg:text-left">
               <h2 className="text-3xl font-bold text-dark-text mb-2">Bem-vindo de volta!</h2>
               <p className="text-gray-500">Insira seus dados para acessar o painel.</p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Email Profissional</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
                    className={`w-full px-4 py-3.5 rounded-xl border bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all ${
                      fieldErrors.email ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="nome@empresa.com"
                    required
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-600">{fieldErrors.email}</p>
                  )}
               </div>

               <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                     <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Senha</label>
                     <a href="#" className="text-xs font-bold text-brand-primary hover:underline">Esqueceu a senha?</a>
                  </div>
                  <div className="relative">
                     <input 
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }}
                        className={`w-full pl-4 pr-12 py-3.5 rounded-xl border bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all ${
                          fieldErrors.password ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="••••••••"
                        required
                     />
                     <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                     >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                     </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-red-600">{fieldErrors.password}</p>
                  )}
               </div>

               <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-primary text-white font-bold text-lg py-3.5 rounded-xl hover:bg-brand-hover transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transform active:scale-[0.98]"
               >
                  {isLoading ? (
                     <>
                        <Loader2 size={20} className="animate-spin" />
                        Processando...
                     </>
                  ) : (
                     <>
                        Entrar no Painel
                        <ArrowRight size={20} />
                     </>
                  )}
               </button>
            </form>
            
            <div className="text-center space-y-4 pt-2">
               <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <ShieldCheck size={14} />
                  Seus dados estão protegidos e criptografados.
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
