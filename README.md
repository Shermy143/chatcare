# ChatCare — Estimador Agéntico de Copago y Cobertura

Asistente conversacional de salud que ayuda al paciente a entender su cobertura de seguro antes de atenderse. El agente sugiere especialidades médicas, calcula el copago exacto y recomienda el hospital en red más conveniente.

## Stack tecnológico

- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **Backend/Auth/BD:** Supabase (PostgreSQL + Auth + RLS)
- **Agente IA:** Groq API — modelo `llama-3.3-70b-versatile`

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
VITE_GROQ_API_KEY=<tu-groq-api-key>
```

## Ejecutar localmente

**Prerequisitos:** Node.js 18+

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Configurar el archivo `.env` con las claves reales.
3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

La aplicación estará disponible en `http://localhost:3000`.
