# Flujo de Agendamiento de Citas + Tab Consultas

## Descripción

Añadir al chat un flujo guiado de agendamiento con botones interactivos (hospital → jornada → hora), guardar la cita en Supabase y mostrar las consultas del usuario en una nueva pestaña del dashboard.

---

## Bug: Flash de pantalla de chat al registrar

**Causa:** `onAuthStateChange` en `App.tsx` escucha eventos de sesión globalmente. Al hacer `signUp()`, el trigger auto-confirma el email → Supabase emite `SIGNED_IN` → el listener redirige al dashboard → un instante después el `setTimeout` lleva al login.

**Solución:** Llamar `supabase.auth.signOut()` inmediatamente después del `signUp()` exitoso, **antes** del toast. Esto emite `SIGNED_OUT` y mantiene la pantalla de registro hasta que el timeout navegue al login.

---

## Propuesta de Cambios

### Base de datos — Supabase

#### [NEW] Migración `create_consultas_table`
```sql
CREATE TABLE public.consultas (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  hospital_id     uuid REFERENCES public.hospitales(id) ON DELETE SET NULL,
  especialidad    text NOT NULL,
  jornada         text NOT NULL CHECK (jornada IN ('mañana', 'tarde', 'noche')),
  hora            text NOT NULL,
  estado          text NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente', 'asistida', 'cancelada')),
  notas           text,
  created_at      timestamptz DEFAULT now() NOT NULL
);
-- RLS: cada paciente solo ve sus propias consultas
```

---

### `src/lib/agent.ts`

#### [MODIFY] Extender tipos y system prompt

**Nuevos tipos:**
```typescript
export interface Opcion {
  etiqueta: string;  // texto visible en el botón
  valor: string;     // texto que se envía como mensaje al seleccionar
  id?: string;       // hospital_id cuando aplica
}

export interface AgentResponse {
  mensaje: string;
  cobertura: CoverageInfo | null;
  opciones: Opcion[] | null;   // botones de respuesta rápida
}

export interface PatientContext {
  // añadir hospital_ids al context para que el agente los incluya en opciones
  hospitales: Array<{ nombre: string; id: string }>;
  ...
}
```

**System prompt actualizado:** el agente debe incluir `opciones` con los hospitales de la red cuando recomiende atención presencial, incluyendo el `id` de cada hospital.

---

### `src/components/Chat.tsx`

#### [MODIFY] Máquina de estados para el agendamiento

```typescript
type CitaStep = 'idle' | 'esperando_jornada' | 'esperando_hora';

interface CitaDraft {
  hospital_id: string;
  hospital_nombre: string;
  especialidad: string;
  jornada?: string;
}
```

**Flujo:**
1. El agente responde con `opciones` de hospitales → se renderizan como botones
2. Usuario selecciona hospital → `citaDraft` se actualiza, se muestra localmente mensaje "¿En qué jornada prefieres atenderte?" con 3 botones (Mañana 🌅 / Tarde ☀️ / Noche 🌙)
3. Usuario selecciona jornada → se muestran los horarios disponibles según jornada:
   - **Mañana:** 07:00 – 11:30 (cada 30 min)
   - **Tarde:** 12:00 – 17:30 (cada 30 min)
   - **Noche:** 18:00 – 21:00 (cada 30 min)
4. Usuario selecciona hora → se guarda en `consultas` y se muestra confirmación visual

**Renderizado de botones:** aparecen debajo del último mensaje del bot, desaparecen una vez que el usuario hace su selección.

---

### `src/components/ConsultasView.tsx`

#### [NEW] Vista de citas del paciente

Muestra tres secciones con acordeón o tabs internos:
- **Pendientes** — badge azul primario
- **Asistidas** — badge verde
- **Canceladas** — badge gris

Cada tarjeta de consulta muestra:
- Especialidad, hospital, jornada, hora
- Fecha de creación
- Badge de estado con color
- Botón "Cancelar" (solo en pendientes) → actualiza `estado = 'cancelada'` en Supabase

---

### `src/components/DashboardScreen.tsx`

#### [MODIFY] Añadir tab "Consultas"

- Nuevo tab entre "Hospitales" y "Perfil"
- Icono: `CalendarDays` de lucide-react
- Renderiza `<ConsultasView userId={userId} />`
- El botón "Nueva Consulta" del sidebar lleva al tab "chat" (ya existente)

---

## Verificación

1. `npm run lint` sin errores
2. Registrar usuario nuevo → sin flash de dashboard
3. Describir síntoma → agente responde con botones de hospital
4. Seleccionar hospital → aparecen botones de jornada
5. Seleccionar jornada → aparecen botones de hora
6. Seleccionar hora → cita guardada en BD, confirmación visual
7. Tab "Consultas" muestra la cita como pendiente
8. Botón cancelar → estado cambia a cancelada
