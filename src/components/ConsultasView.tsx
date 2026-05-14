import { useState, useEffect, type ReactNode } from 'react';
import { CalendarDays, Clock, Hospital, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Consulta {
  id: string;
  hospital_nombre: string;
  especialidad: string;
  fecha: string;
  jornada: string;
  hora: string;
  estado: 'pendiente' | 'asistida' | 'cancelada';
  created_at: string;
}

interface Props { userId: string; }

const ESTADO_META: Record<string, { label: string; color: string; icon: ReactNode }> = {
  pendiente: {
    label: 'Pendiente',
    color: 'bg-primary-container text-on-primary-container border-primary-fixed-dim',
    icon: <AlertCircle className="w-4 h-4" />,
  },
  asistida: {
    label: 'Asistida',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  cancelada: {
    label: 'Cancelada',
    color: 'bg-surface-container text-on-surface-variant border-outline-variant',
    icon: <XCircle className="w-4 h-4" />,
  },
};

const JORNADA_LABEL: Record<string, string> = {
  mañana: 'Mañana 🌅', tarde: 'Tarde ☀️', noche: 'Noche 🌙',
};

export default function ConsultasView({ userId }: Props) {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'todas' | 'pendiente' | 'asistida' | 'cancelada'>('todas');

  // Carga y auto-marca consultas al montar
  useEffect(() => {
    async function init() {
      await supabase.rpc('marcar_consultas_asistidas');
      await loadConsultas();
    }
    init();
  }, [userId]);

  async function loadConsultas() {
    setLoading(true);
    const { data } = await supabase
      .from('consultas')
      .select('id, hospital_nombre, especialidad, fecha, jornada, hora, estado, created_at')
      .eq('paciente_id', userId)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false });

    setConsultas((data as Consulta[]) ?? []);
    setLoading(false);
  }

  // Cancela la consulta tras confirmación visual
  async function handleCancelar(id: string) {
    setCancelling(true);
    await supabase.from('consultas').update({ estado: 'cancelada' }).eq('id', id);
    setConsultas(prev => prev.map(c => c.id === id ? { ...c, estado: 'cancelada' } : c));
    setConfirmingId(null);
    setCancelling(false);
  }

  // Formatea la fecha para mostrar al usuario
  function formatFecha(iso: string) {
    const [y, m, d] = iso.split('-');
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d} ${months[parseInt(m) - 1]} ${y}`;
  }

  const filtered = activeFilter === 'todas'
    ? consultas
    : consultas.filter(c => c.estado === activeFilter);

  const counts = {
    pendiente: consultas.filter(c => c.estado === 'pendiente').length,
    asistida: consultas.filter(c => c.estado === 'asistida').length,
    cancelada: consultas.filter(c => c.estado === 'cancelada').length,
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl md:text-3xl font-bold text-on-background mb-2">Mis Consultas</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {([['todas', 'Todas', consultas.length], ['pendiente', 'Pendientes', counts.pendiente], ['asistida', 'Asistidas', counts.asistida], ['cancelada', 'Canceladas', counts.cancelada]] as const).map(([val, label, count]) => (
          <button
            key={val}
            onClick={() => setActiveFilter(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${activeFilter === val
                ? 'bg-primary text-on-primary border-primary shadow-sm'
                : 'bg-surface text-on-surface-variant border-outline-variant hover:border-primary/40'
              }`}
          >
            {label} <span className="opacity-70">({count})</span>
          </button>
        ))}
      </div>

      {/* Listado */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-3">
          <CalendarDays className="w-12 h-12 text-outline-variant" />
          <p className="text-on-surface-variant font-medium">No tienes consultas {activeFilter !== 'todas' ? `${activeFilter}s` : 'registradas'}.</p>
          <p className="text-sm text-outline">Usa el Chat Médico para agendar una cita.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((c) => {
            const meta = ESTADO_META[c.estado];
            const isConfirming = confirmingId === c.id;
            return (
              <div key={c.id} className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-5 flex flex-col gap-3 transition-all">

                {/* Fila superior */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Hospital className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <p className="font-bold text-on-surface text-base leading-tight">{c.hospital_nombre}</p>
                      <p className="text-sm text-primary font-medium">{c.especialidad}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${meta.color}`}>
                    {meta.icon} {meta.label}
                  </span>
                </div>

                {/* Detalles */}
                <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-outline" />
                    {formatFecha(c.fecha)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-outline" />
                    {c.hora} — {JORNADA_LABEL[c.jornada] ?? c.jornada}
                  </span>
                </div>

                {/* Confirmación de cancelación */}
                {c.estado === 'pendiente' && (
                  <div className="border-t border-outline-variant pt-3">
                    {isConfirming ? (
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-sm font-medium text-error flex-1">¿Confirmas la cancelación de esta cita?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCancelar(c.id)}
                            disabled={cancelling}
                            className="px-4 py-1.5 bg-error text-on-error rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
                          >
                            {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                            Sí, cancelar
                          </button>
                          <button
                            onClick={() => setConfirmingId(null)}
                            className="px-4 py-1.5 bg-surface-container text-on-surface rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors"
                          >
                            No, mantener
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingId(c.id)}
                        className="text-sm font-medium text-error hover:underline"
                      >
                        Cancelar cita
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
