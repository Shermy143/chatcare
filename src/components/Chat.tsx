import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { Send, Loader2, Bot, CalendarCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  sendMessage,
  type ChatMessage,
  type PatientContext,
  type CoverageInfo,
  type Opcion,
} from '../lib/agent';
import Message from './Message';
import CoverageCard from './CoverageCard';

interface UIMessage extends ChatMessage {
  cobertura?: CoverageInfo | null;
}

type CitaStep = 'idle' | 'confirmando_hospital' | 'esperando_fecha' | 'esperando_jornada' | 'esperando_hora';

interface CitaDraft {
  hospital_id:     string;
  hospital_nombre: string;
  especialidad:    string;
  fecha?:          string;
  jornada?:        string;
}

interface Props { userId: string; }

const WELCOME: UIMessage = {
  role:    'assistant',
  content: '¡Hola! Soy tu asistente médico virtual de ChatCare. ¿Podrías describirme cuáles son tus síntomas el día de hoy?',
};

// Genera los próximos 14 días como opciones de fecha
function buildFechaOpciones(): Opcion[] {
  const days   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    return {
      etiqueta: `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`,
      valor:    `${yyyy}-${mm}-${dd}`,
    };
  });
}

const JORNADA_OPCIONES: Opcion[] = [
  { etiqueta: '🌅 Mañana', valor: 'mañana' },
  { etiqueta: '☀️ Tarde',  valor: 'tarde'  },
  { etiqueta: '🌙 Noche',  valor: 'noche'  },
];

const HORAS_POR_JORNADA: Record<string, string[]> = {
  'mañana': ['07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30'],
  'tarde':  ['12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'],
  'noche':  ['18:00','18:30','19:00','19:30','20:00','20:30'],
};

function buildHoraOpciones(jornada: string): Opcion[] {
  return (HORAS_POR_JORNADA[jornada] ?? HORAS_POR_JORNADA['mañana'])
    .map(h => ({ etiqueta: h, valor: h }));
}

const JORNADA_LABEL: Record<string, string> = {
  mañana: 'mañana 🌅', tarde: 'tarde ☀️', noche: 'noche 🌙',
};

export default function Chat({ userId }: Props) {
  const [messages, setMessages]             = useState<UIMessage[]>([WELCOME]);
  const [input, setInput]                   = useState('');
  const [loading, setLoading]               = useState(false);
  const [context, setContext]               = useState<PatientContext | null>(null);
  const [contextError, setContextError]     = useState(false);
  const [activeOpciones, setActiveOpciones]       = useState<Opcion[] | null>(null);
  const [citaStep, setCitaStep]                   = useState<CitaStep>('idle');
  const [citaDraft, setCitaDraft]                 = useState<Partial<CitaDraft>>({});
  const [lastEspecialidad, setLastEspecialidad]   = useState('');
  const [lastHospitalOpciones, setLastHospitalOpciones] = useState<Opcion[] | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Carga el contexto de cobertura del paciente
  useEffect(() => {
    async function loadContext() {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nombre, apellido, plan_id, planes(nombre)')
        .eq('id', userId)
        .single();

      if (!profile) { setContextError(true); return; }

      const { data: coberturas } = await supabase
        .from('coberturas')
        .select('copago_porcentaje, requiere_referido, especialidades(nombre)')
        .eq('plan_id', profile.plan_id);

      const { data: hospitales } = await supabase
        .from('hospitales')
        .select('id, nombre, telefono, direccion, ciudad')
        .eq('red_activa', true);

      const plan = (profile.planes as unknown as { nombre: string } | null)?.nombre ?? 'Sin plan';

      setContext({
        nombre:     `${profile.nombre} ${profile.apellido}`,
        plan,
        coberturas: (coberturas ?? []).map(c => ({
          especialidad:      (c.especialidades as unknown as { nombre: string } | null)?.nombre ?? '',
          copago_porcentaje: c.copago_porcentaje,
          requiere_referido: c.requiere_referido,
        })),
        hospitales: (hospitales ?? []).map(h => ({
          id:        h.id        as string,
          nombre:    h.nombre    as string,
          telefono:  h.telefono  as string | undefined,
          direccion: h.direccion as string | undefined,
          ciudad:    h.ciudad    as string | undefined,
        })),
      });
    }
    loadContext();
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, activeOpciones]);

  // Añade un mensaje del bot localmente (sin llamar al agente)
  function addBotMessage(content: string, opciones: Opcion[] | null = null) {
    setMessages(prev => [...prev, { role: 'assistant', content }]);
    setActiveOpciones(opciones);
  }

  // Guarda la cita en Supabase
  async function saveConsulta(draft: CitaDraft, hora: string) {
    await supabase.from('consultas').insert({
      paciente_id:     userId,
      hospital_id:     draft.hospital_id,
      hospital_nombre: draft.hospital_nombre,
      especialidad:    draft.especialidad,
      fecha:           draft.fecha,
      jornada:         draft.jornada,
      hora,
      estado:          'pendiente',
    });
  }

  // Maneja la selección de un botón de respuesta rápida
  async function handleOpcionSelect(opcion: Opcion) {
    const currentOpciones = activeOpciones; // capturar antes de limpiar
    setActiveOpciones(null);
    setMessages(prev => [...prev, { role: 'user', content: opcion.etiqueta }]);

    // Hospital seleccionado (tiene id y step está en idle)
    if (citaStep === 'idle' && opcion.id) {
      if (currentOpciones) setLastHospitalOpciones(currentOpciones);
      setCitaDraft({ hospital_id: opcion.id, hospital_nombre: opcion.valor, especialidad: lastEspecialidad });
      setCitaStep('confirmando_hospital');
      const h = context?.hospitales.find(h => h.id === opcion.id);
      const detalle = (h?.direccion || h?.telefono)
        ? `\n📍 ${[h?.direccion, h?.ciudad].filter(Boolean).join(', ')}\n📞 ${h?.telefono ?? 'No disponible'}`
        : '';
      addBotMessage(
        `📋 **${opcion.valor}**${detalle}\n\n¿Deseas agendar tu cita en este hospital?`,
        [
          { etiqueta: '✅ Sí, agendar aquí',       valor: 'confirmar' },
          { etiqueta: '🔄 Ver otros hospitales',    valor: 'cambiar'   },
        ]
      );
      return;
    }

    // Confirmación o cambio de hospital
    if (citaStep === 'confirmando_hospital') {
      if (opcion.valor === 'confirmar') {
        setCitaStep('esperando_fecha');
        addBotMessage('¿Qué fecha prefieres para tu cita?', buildFechaOpciones());
      } else {
        setCitaStep('idle');
        setCitaDraft({});
        addBotMessage('Sin problema. ¿En cuál de estos hospitales prefieres atenderte?', lastHospitalOpciones);
      }
      return;
    }

    if (citaStep === 'esperando_fecha') {
      setCitaDraft(prev => ({ ...prev, fecha: opcion.valor }));
      setCitaStep('esperando_jornada');
      addBotMessage('¿En qué jornada del día prefieres atenderte?', JORNADA_OPCIONES);
      return;
    }

    if (citaStep === 'esperando_jornada') {
      setCitaDraft(prev => ({ ...prev, jornada: opcion.valor }));
      setCitaStep('esperando_hora');
      addBotMessage('¿A qué hora te vendría mejor?', buildHoraOpciones(opcion.valor));
      return;
    }

    if (citaStep === 'esperando_hora') {
      const draft = citaDraft as CitaDraft;
      await saveConsulta(draft, opcion.valor);
      setCitaStep('idle');
      setCitaDraft({});
      addBotMessage(
        `✅ ¡Tu cita ha sido agendada con éxito!\n\n🏥 Hospital: ${draft.hospital_nombre}\n📅 Fecha: ${draft.fecha}\n🕐 Hora: ${opcion.valor}\n🌟 Jornada: ${JORNADA_LABEL[draft.jornada ?? ''] ?? draft.jornada}\n\nPuedes verla y gestionarla en la sección **Consultas** del menú lateral.`
      );
      return;
    }
  }

  // Envío de mensaje libre al agente
  async function handleSend() {
    const text = input.trim();
    if (!text || loading || !context) return;

    if (citaStep !== 'idle') { setCitaStep('idle'); setCitaDraft({}); }
    setActiveOpciones(null);

    const userMsg: UIMessage = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const history: ChatMessage[] = updated.slice(1).map(({ role, content }) => ({ role, content }));
      const res = await sendMessage(history, context);

      if (res.cobertura?.especialidad) setLastEspecialidad(res.cobertura.especialidad);

      setMessages(prev => [...prev, {
        role:     'assistant',
        content:  res.mensaje,
        cobertura: res.cobertura,
      }]);
      setActiveOpciones(res.opciones ?? null);
    } catch {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: 'Lo siento, hubo un problema al conectar con el asistente. Por favor intenta de nuevo.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const inputDisabled = loading || !context || citaStep !== 'idle';

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden">

      {/* Cabecera */}
      <div className="p-4 border-b border-outline-variant flex items-center gap-3 bg-surface shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shrink-0">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-on-surface text-base">Asistente ChatCare</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-outline">En línea</span>
          </div>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 bg-background">
        {contextError && (
          <div className="text-center text-sm text-error bg-error-container rounded-xl px-4 py-3">
            No se pudo cargar tu información de cobertura. Recarga la página.
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Message role={msg.role} content={msg.content} />
            {msg.cobertura && (
              <div className={msg.role === 'assistant' ? 'ml-11' : 'self-end mr-11'}>
                <CoverageCard cobertura={msg.cobertura} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-center my-1">
            <span className="text-xs font-medium text-outline px-4 py-1.5 bg-surface-container-low rounded-full flex items-center gap-2 shadow-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Analizando síntomas y cobertura…
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Botones de respuesta rápida */}
      {activeOpciones && (
        <div className="px-4 py-3 border-t border-outline-variant bg-surface shrink-0">
          <p className="text-xs font-medium text-outline mb-2">Selecciona una opción:</p>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {activeOpciones.map((op) => (
              <button
                key={op.valor}
                onClick={() => handleOpcionSelect(op)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-primary/30 bg-primary-container/40 text-on-surface text-sm font-medium hover:border-primary hover:bg-primary-container transition-all active:scale-95"
              >
                {citaStep === 'esperando_hora' && <CalendarCheck className="w-3.5 h-3.5 text-primary" />}
                {op.etiqueta}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input de texto */}
      <div className="p-3 md:p-4 bg-surface border-t border-outline-variant shrink-0">
        {!context && !contextError && (
          <p className="text-xs text-outline text-center mb-2">Cargando tu información de cobertura…</p>
        )}
        {citaStep !== 'idle' && (
          <p className="text-xs text-primary text-center mb-2 font-medium">
            Selecciona una opción de arriba para continuar con tu cita.
          </p>
        )}
        <div className={`flex items-end gap-2 bg-surface-container-low rounded-2xl p-2 border transition-all ${inputDisabled ? 'border-outline-variant opacity-60' : 'border-outline-variant focus-within:ring-2 focus-within:ring-primary/30'}`}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={inputDisabled}
            rows={1}
            placeholder={citaStep !== 'idle' ? 'Usa los botones de arriba…' : 'Describe tus síntomas…'}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-on-surface py-3 px-2 max-h-32 min-h-[44px] text-sm md:text-base outline-none w-full placeholder:text-outline/60 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={inputDisabled || !input.trim()}
            className="p-3 bg-primary text-on-primary rounded-xl hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center justify-center m-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Enviar mensaje"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-outline/60 text-center mt-2">
          Presiona <kbd className="font-mono bg-surface-container px-1 rounded">Enter</kbd> para enviar
        </p>
      </div>
    </div>
  );
}
