import { useState, useEffect, type ReactNode } from 'react';
import { MessageSquare, ShieldCheck, Hospital, User, CalendarDays, Plus, Menu, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Chat from './Chat';
import ConsultasView from './ConsultasView';

type Tab = 'chat' | 'seguro' | 'hospitales' | 'consultas' | 'perfil';

interface Props {
  userId: string;
  onNavigate: (screen: 'login' | 'register' | 'dashboard', direction?: number) => void;
}

interface Profile {
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  planes: { nombre: string; descripcion: string } | null;
}

export default function DashboardScreen({ userId, onNavigate }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab]           = useState<Tab>('chat');
  const [profile, setProfile]               = useState<Profile | null>(null);

  // Carga el perfil del usuario autenticado
  useEffect(() => {
    supabase
      .from('profiles')
      .select('nombre, apellido, cedula, telefono, planes(nombre, descripcion)')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as unknown as Profile);
      });
  }, [userId]);

  // Cierre de sesión
  async function handleLogout() {
    await supabase.auth.signOut();
    onNavigate('login', -1);
  }

  const navItems: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'chat',      label: 'Chat Médico',  icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'seguro',    label: 'Mi Seguro',    icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'hospitales',label: 'Hospitales',   icon: <Hospital className="w-5 h-5" /> },
    { id: 'consultas', label: 'Consultas',    icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'perfil',    label: 'Perfil',       icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-background text-on-background overflow-hidden relative">

      {/* Cabecera móvil */}
      <header className="md:hidden flex justify-between items-center w-full px-4 h-16 bg-surface border-b border-outline-variant shadow-sm z-20 shrink-0">
        <div className="text-xl font-bold text-primary tracking-tight">ChatCare</div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-on-surface-variant p-2 hover:bg-surface-container rounded-md transition-colors"
          aria-label="Abrir menú">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Barra de navegación lateral */}
      <nav className={`
        absolute md:relative z-30
        h-full w-64 bg-surface border-r border-outline-variant
        flex flex-col p-4 gap-2 transition-transform duration-300 ease-in-out shrink-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Usuario */}
        <div className="flex items-center gap-3 mb-8 px-2 mt-10 md:mt-4">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-lg shrink-0">
            {profile ? profile.nombre.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="overflow-hidden">
            <h2 className="font-bold text-primary text-base leading-tight truncate">
              {profile ? `${profile.nombre} ${profile.apellido}` : 'Cargando…'}
            </h2>
            <p className="text-xs font-medium text-on-surface-variant truncate">
              {(profile?.planes as { nombre: string } | null)?.nombre ?? 'Sin plan'}
            </p>
          </div>
        </div>

        {/* Tabs de navegación */}
        <div className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 p-3 rounded-xl w-full transition-all text-left text-sm font-medium
                ${activeTab === item.id
                  ? 'bg-primary-container text-on-primary-container border border-primary-fixed-dim'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* Acciones */}
        <div className="mt-auto pt-4 flex flex-col gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-medium text-outline hover:text-error px-3 py-2 rounded-lg hover:bg-error-container transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
          <button
            onClick={() => { setActiveTab('chat'); setMobileMenuOpen(false); }}
            className="w-full bg-primary text-on-primary font-medium text-sm py-3 rounded-xl hover:bg-on-primary-fixed-variant transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Nueva Consulta
          </button>
        </div>
      </nav>

      {/* Overlay móvil */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-inverse-surface/20 z-20 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Área principal */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        <div className="w-full max-w-[1280px] mx-auto h-full flex flex-col p-4 md:p-8">

          {/* Tab: Chat Médico — siempre montado para preservar la conversación */}
          <div className={activeTab === 'chat' ? 'flex flex-col h-full' : 'hidden'}>
            <div className="mb-4 md:mb-6 shrink-0">
              <h1 className="text-2xl md:text-3xl font-bold text-on-background">Consulta Activa</h1>
              <p className="text-on-surface-variant mt-1 text-sm md:text-base">
                Tu asistente médico de IA está listo para ayudarte.
              </p>
            </div>
            <Chat userId={userId} />
          </div>

          {/* Tab: Mi Seguro */}
          {activeTab === 'seguro' && (
            <div className="flex-1 overflow-y-auto flex flex-col gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-on-background mb-2">Mi Seguro</h1>
              {profile ? (
                <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center">
                      <ShieldCheck className="w-7 h-7 text-on-primary-container" />
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant font-medium">Plan activo</p>
                      <p className="text-xl font-bold text-on-surface">
                        {(profile.planes as { nombre: string } | null)?.nombre ?? '—'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    {(profile.planes as { nombre: string; descripcion: string } | null)?.descripcion ?? ''}
                  </p>
                  <p className="text-xs text-outline">
                    Usa el Chat Médico para consultar tu copago por especialidad.
                  </p>
                </div>
              ) : (
                <p className="text-on-surface-variant">Cargando información del seguro…</p>
              )}
            </div>
          )}

          {/* Tab: Hospitales */}
          {activeTab === 'hospitales' && (
            <div className="flex-1 overflow-y-auto">
              <HospitalesList />
            </div>
          )}

          {/* Tab: Consultas */}
          {activeTab === 'consultas' && (
            <div className="flex-1 overflow-y-auto">
              <ConsultasView userId={userId} />
            </div>
          )}

          {/* Tab: Perfil */}
          {activeTab === 'perfil' && (
            <div className="flex-1 overflow-y-auto flex flex-col gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-on-background mb-2">Mi Perfil</h1>
              {profile ? (
                <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-6 flex flex-col gap-3">
                  {[
                    { label: 'Nombre completo', value: `${profile.nombre} ${profile.apellido}` },
                    { label: 'Cédula',           value: profile.cedula },
                    { label: 'Teléfono',         value: profile.telefono },
                    { label: 'Plan de seguro',   value: (profile.planes as { nombre: string } | null)?.nombre ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5 border-b border-outline-variant pb-3 last:border-0">
                      <span className="text-xs font-medium text-on-surface-variant">{label}</span>
                      <span className="text-base font-semibold text-on-surface">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-on-surface-variant">Cargando perfil…</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Sub-componente: lista de hospitales en red
function HospitalesList() {
  const [hospitales, setHospitales] = useState<{ nombre: string; direccion: string; ciudad: string; telefono: string }[]>([]);

  useEffect(() => {
    supabase.from('hospitales').select('nombre, direccion, ciudad, telefono').eq('red_activa', true)
      .then(({ data }) => { if (data) setHospitales(data); });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl md:text-3xl font-bold text-on-background mb-2">Hospitales en Red</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hospitales.map((h) => (
          <div key={h.nombre} className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Hospital className="w-5 h-5 text-primary shrink-0" />
              <h3 className="font-bold text-on-surface text-base">{h.nombre}</h3>
            </div>
            <p className="text-sm text-on-surface-variant">{h.direccion}, {h.ciudad}</p>
            <p className="text-sm text-primary font-medium">{h.telefono}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
