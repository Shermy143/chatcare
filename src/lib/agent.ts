// Tipos del agente conversacional
export interface Opcion {
  etiqueta: string;
  valor:    string;
  id?:      string; // hospital_id cuando aplica
}

export interface CoverageInfo {
  especialidad:      string;
  copago_porcentaje: number;
  copago_fijo:       number;
  requiere_referido: boolean;
  hospitales:        string[];
}

export interface AgentResponse {
  mensaje:   string;
  cobertura: CoverageInfo | null;
  opciones:  Opcion[] | null;
}

export interface ChatMessage {
  role:    'user' | 'assistant';
  content: string;
}

export interface PatientContext {
  nombre:     string;
  plan:       string;
  coberturas: Array<{
    especialidad:      string;
    copago_porcentaje: number;
    requiere_referido: boolean;
  }>;
  hospitales: Array<{ id: string; nombre: string }>;
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL    = 'llama-3.3-70b-versatile';

// Construye el system prompt con datos reales del paciente
function buildSystemPrompt(ctx: PatientContext): string {
  const coberturasText = ctx.coberturas
    .map(c => `- ${c.especialidad}: ${c.copago_porcentaje}% de copago${c.requiere_referido ? ' (requiere referido)' : ''}`)
    .join('\n');

  const hospitalesText = ctx.hospitales
    .map(h => `- ${h.nombre} (id: ${h.id})`)
    .join('\n');

  return `Eres ChatCare, un asistente médico virtual empático y profesional. Tu misión es ayudar al paciente ${ctx.nombre} a entender su cobertura antes de acudir al médico.

INFORMACIÓN DEL PACIENTE:
- Plan de seguro: ${ctx.plan}

HOSPITALES EN RED:
${hospitalesText}

COBERTURA (especialidad → copago):
${coberturasText}

INSTRUCCIONES:
1. Escucha los síntomas con empatía.
2. Identifica la especialidad médica más adecuada.
3. Informa el copago exacto según el plan.
4. En cuanto tengas suficiente información para evaluar los síntomas, incluye INMEDIATAMENTE en la misma respuesta la evaluación, la cobertura y las opciones de hospital. NO esperes confirmación del paciente ni uses frases como "¿Te gustaría agendar una cita?". Pasa directo a ofrecer los hospitales.
5. Responde siempre en español.

FORMATO DE RESPUESTA — JSON válido siempre:
{
  "mensaje": "Texto empático con la evaluación de síntomas y el copago. Al final, pide al paciente que seleccione un hospital para agendar su cita.",
  "cobertura": {
    "especialidad": "Nombre especialidad",
    "copago_porcentaje": 20,
    "copago_fijo": 0,
    "requiere_referido": false,
    "hospitales": ["Hospital A", "Hospital B"]
  },
  "opciones": [
    { "etiqueta": "Hospital A", "valor": "Hospital A", "id": "uuid-exacto-del-hospital" },
    { "etiqueta": "Hospital B", "valor": "Hospital B", "id": "uuid-exacto-del-hospital" }
  ]
}

Si aún no tienes suficiente información para evaluar, usa "cobertura": null, "opciones": null y haz UNA sola pregunta de seguimiento. Tan pronto tengas los síntomas principales, evalúa y presenta los hospitales sin más preguntas.`;
}

// Llama a la API de Groq con el historial completo
export async function sendMessage(
  history: ChatMessage[],
  context: PatientContext
): Promise<AgentResponse> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:           MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt(context) },
        ...history,
      ],
      temperature:     0.5,
      max_tokens:      900,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`Error Groq API: ${await response.text()}`);
  }

  const data = await response.json();
  const raw  = data.choices?.[0]?.message?.content ?? '{}';

  try {
    const parsed = JSON.parse(raw) as AgentResponse;
    return {
      mensaje:   parsed.mensaje   ?? 'Lo siento, no pude procesar tu consulta.',
      cobertura: parsed.cobertura ?? null,
      opciones:  parsed.opciones  ?? null,
    };
  } catch {
    return { mensaje: raw, cobertura: null, opciones: null };
  }
}
