import { useState, useEffect, type FormEvent } from 'react';
import { ShieldPlus, Mail, Lock, Phone, IdCard, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  onNavigate: (screen: 'login' | 'register' | 'dashboard', direction?: number) => void;
}

interface Plan {
  id: string;
  nombre: string;
  descripcion: string;
}

export default function RegisterScreen({ onNavigate }: Props) {
  const [nombre, setNombre]       = useState('');
  const [apellido, setApellido]   = useState('');
  const [cedula, setCedula]       = useState('');
  const [telefono, setTelefono]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [planId, setPlanId]       = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [planes, setPlanes]       = useState<Plan[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [showToast, setShowToast] = useState(false);

  // Carga los planes disponibles al montar
  useEffect(() => {
    supabase.from('planes').select('id, nombre, descripcion').then(({ data }) => {
      if (data) setPlanes(data);
    });
  }, []);

  // Registro real con Supabase Auth + inserción en profiles
  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!nombre || !apellido || !cedula || !telefono || !email || !password || !planId) {
      setError('Por favor completa todos los campos.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);

    // Los datos del perfil viajan como metadata del usuario
    // El trigger `on_auth_user_created` los inserta en `profiles` automáticamente
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, apellido, cedula, telefono, plan_id: planId },
      },
    });

    if (authError) {
      setError(authError.message === 'User already registered'
        ? 'Este correo ya está registrado. Intenta iniciar sesión.'
        : 'Error al registrar. Verifica tus datos e inténtalo de nuevo.');
      setLoading(false);
      return;
    }

    // Sign out inmediato: evita que onAuthStateChange redirija al dashboard
    await supabase.auth.signOut();

    setNombre(''); setApellido(''); setCedula('');
    setTelefono(''); setEmail(''); setPassword('');
    setPlanId('');
    setLoading(false);

    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onNavigate('login', 1);
    }, 2500);
  }

  return (
    <div className="flex w-full min-h-screen">

      {/* Toast de éxito — notificación fija en la parte superior */}
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-on-surface text-inverse-on-surface px-5 py-3.5 rounded-2xl shadow-xl animate-[slideDown_0.3s_ease-out] min-w-[280px]"
        >
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold">¡Registro exitoso!</p>
            <p className="text-xs opacity-70">Redirigiendo al inicio de sesión…</p>
          </div>
          {/* Barra de progreso */}
          <div className="absolute bottom-0 left-0 h-0.5 bg-primary rounded-full animate-[shrink_2.5s_linear_forwards]" style={{width:'100%'}} />
        </div>
      )}

      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary-container overflow-hidden items-end p-10">
        <img
          alt="ChatCare — Salud inteligente a tu alcance"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDuAoI96TXKiAEfxRkMo-ttKoxnnF7ftXvbTJqOjODHpZfjfssyk1YM0Qj5CqHtxIAI5Ob_Dz6b9t4r_KBblKYRESGQxPsC9ZDx__Krz457g2YQS8YbnjYi_Xj0f8aBNddmSshkOeh_WlgvXvbEM1V8D5uCmYGXZt39tVwBQqk4_KNT3AfPmEiaiWNYAEsdizGbXvc20bOdlqesN47EJQTFDr1kp7249-c1lCe928ZZ63VXpuf1PX1fe5xbRVcCbSs2Nt4ihyubV0e"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-on-secondary-fixed/90 via-on-secondary-fixed/40 to-transparent" />
        <div className="relative z-10 max-w-lg mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-on-primary mb-6 leading-tight">
            Salud inteligente,<br />a tu alcance.
          </h1>
          <p className="text-lg text-primary-fixed-dim leading-relaxed">
            Únete a la plataforma líder en telemedicina asistida. Experimenta una atención médica precisa, empática y conectada las 24 horas del día.
          </p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="w-full lg:w-1/2 flex items-start justify-center p-6 py-10 bg-surface overflow-y-auto min-h-full">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6 md:p-8 my-6">

          {/* Encabezado */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-container text-on-primary-container mb-4 shadow-sm">
              <ShieldPlus className="w-7 h-7" />
            </div>
            <span className="text-xl font-bold text-primary block mb-1">ChatCare</span>
            <h2 className="text-2xl md:text-3xl font-bold text-on-surface">Crea tu cuenta</h2>
            <p className="text-on-surface-variant mt-2 text-sm md:text-base">
              Ingresa tus datos para acceder a tu portal de salud.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleRegister} noValidate>

            {/* Feedback visual */}
            {error && (
              <div role="alert" className="text-sm text-on-error bg-error-container rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-on-surface-variant mb-1">Nombre</label>
                <input id="nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Ana"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline" />
              </div>
              <div>
                <label htmlFor="apellido" className="block text-sm font-medium text-on-surface-variant mb-1">Apellido</label>
                <input id="apellido" type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Ej. García"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline" />
              </div>
            </div>

            {/* Cédula */}
            <div>
              <label htmlFor="cedula" className="block text-sm font-medium text-on-surface-variant mb-1">Cédula de Identidad</label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant pointer-events-none" />
                <input id="cedula" type="text" value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="Ej. 12345678"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-10 pr-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline" />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-on-surface-variant mb-1">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant pointer-events-none" />
                <input id="telefono" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+1 555 000 0000"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-10 pr-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email-register" className="block text-sm font-medium text-on-surface-variant mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant pointer-events-none" />
                <input id="email-register" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-10 pr-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline" />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password-register" className="block text-sm font-medium text-on-surface-variant mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant pointer-events-none" />
                <input id="password-register" type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-10 pr-10 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline" />
                <button type="button" onClick={() => setShowPass(!showPass)} aria-label="Mostrar contraseña"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface-variant transition-colors">
                  {showPass ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Selector de plan — tarjetas visuales */}
            <div>
              <p className="block text-sm font-medium text-on-surface-variant mb-3">Plan de Seguro</p>
              <div className="flex flex-col gap-3">
                {planes.length === 0 && (
                  <p className="text-xs text-outline text-center py-2">Cargando planes…</p>
                )}
                {planes.map((p, i) => {
                  const isSelected = planId === p.id;
                  const badges = ['Básico', 'Recomendado', 'Premium'];
                  const badgeColors = [
                    'bg-surface-container text-on-surface-variant',
                    'bg-secondary-container text-on-secondary-container',
                    'bg-primary-container text-on-primary-container',
                  ];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlanId(p.id)}
                      className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-200 flex items-start gap-3
                        ${ isSelected
                          ? 'border-primary bg-primary-container/60 shadow-sm shadow-primary/10'
                          : 'border-outline-variant bg-surface-container-low hover:border-primary/40 hover:bg-surface-container'
                        }`}
                    >
                      {/* Icono */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors
                        ${ isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                        <Shield className="w-5 h-5" />
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-semibold text-sm ${ isSelected ? 'text-primary' : 'text-on-surface'}`}>
                            {p.nombre}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ badgeColors[i] ?? badgeColors[0]}`}>
                            {badges[i] ?? 'Plan'}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1 leading-snug">{p.descripcion}</p>
                      </div>

                      {/* Checkmark */}
                      <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 transition-all ${ isSelected ? 'text-primary opacity-100' : 'opacity-0'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botón de registro */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary font-medium py-3 rounded-xl hover:bg-on-primary-fixed-variant transition-all flex items-center justify-center gap-2 group active:scale-[0.98] shadow-md shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Registrando…</>
                : <><span>Completar Registro</span><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              }
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-outline-variant text-center">
            <p className="text-on-surface-variant text-sm md:text-base">
              ¿Ya tienes una cuenta?{' '}
              <button onClick={() => onNavigate('login', 1)} className="font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors ml-1">
                Iniciar Sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
