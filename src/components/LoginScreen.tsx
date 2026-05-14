import { useState, type FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  onNavigate: (screen: 'login' | 'register' | 'dashboard', direction?: number) => void;
}

export default function LoginScreen({ onNavigate }: Props) {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // Autenticación real con Supabase
  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError('Completa todos los campos.'); return; }
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
    }
    // El listener onAuthStateChange en App.tsx maneja la navegación al dashboard
    setLoading(false);
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md flex flex-col items-center">

        {/* Encabezado */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-6">ChatCare</h1>
          <h2 className="text-4xl font-bold text-on-surface mb-3 tracking-tight">
            Bienvenido de<br />nuevo
          </h2>
          <p className="text-on-surface-variant">
            Ingresa tus credenciales para acceder a tu portal de salud.
          </p>
        </div>

        {/* Tarjeta de login */}
        <div className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6 md:p-8">
          <form className="space-y-5" onSubmit={handleLogin} noValidate>

            {/* Mensaje de error */}
            {error && (
              <div role="alert" className="text-sm text-on-error bg-error-container rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email-login" className="block text-sm font-medium text-on-surface-variant mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant" />
                <input
                  id="email-login"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-10 pr-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline/60"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password-login" className="block text-sm font-medium text-on-surface-variant mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant" />
                <input
                  id="password-login"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-10 pr-10 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline/60 tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface-variant transition-colors"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Botón de ingreso */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary font-medium py-3 rounded-xl hover:bg-on-primary-fixed-variant transition-all active:scale-[0.98] shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? 'Ingresando…' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-on-surface-variant">¿No tienes cuenta? </span>
            <button
              onClick={() => onNavigate('register', -1)}
              className="font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors"
            >
              Regístrate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
