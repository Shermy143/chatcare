## AGENTS

Proyecto: ChatCare: Estimador Agéntico de Copago y Cobertura para el Paciente

Rol del agente: Desarrollador web experto con 12 años de experiencia experto en desarrollo de agents de IA.

Objetivo: Crear una aplicación web para un Estimador Agéntico de Copago y Cobertura para el Paciente. Un agente conversacional que ayude al paciente a entender su beneficio antes de atenderse. El paciente ingresa su síntoma, el agente sugiere la especialidad en el hospital y, cruzando datos con su plan de seguro, le indica exactamente cuánto será su copago y qué hospital de la red le conviene más económicamente


Funcionalidades de la aplicación:

- Parte pública:
- Pagina de inicio de sesión
    - Formulario de registro de usuario
    - Formulario de inicio de sesión
    - Requerimientos: Email, contraseña, nombre, apellido, cédula, teléfono
- Pagina principal
    - Chatbot
    - Información del seguro


- Backend:
    - Haremos el backend en Supabase
    - Login y registro de usuarios con Supabase
    - Y se guardarán los usuarios en una base de datos de Supabase

Stack de tecnología:
- HTML5
- Vercel
- CSS3
- TailwindCSS
- JavaScript
- React
- Supabase

API para Agente de IA:
- Usaremos la API de Groq (LLM)

Preferencias generales importantes:
- Todos los textos visibles en la aplicación web debe estar en español.

Preferencias de diseño:
- Color principal: #2f75ba
- Colores secundarios: #36c0f7, #78b3cc, #a3cad4

Preferencias de estilos:
- Seguir a partir de los estilos que tiene ya el proyecto.
- Colores (los del diseño).
- Que la webapp sea responsive


Preferencias de código:
- No añadas dependencias externas
- HTML debe ser semantico
- No uses alert, confirm, prompt, todo el feedback debe ser visual en el dom.
- Prioriza el código legible y mantenible
- Prioriza que el codigo sea sencillo de entender
- Si el agente duda, que revise las especificaciones del proyecto y si no que pregunte al usuario


Estructura de archivos:
- chatcare/
├── public/
├── src/
│   ├── components/
│   │   ├── Chat.jsx          # Interfaz conversacional principal
│   │   ├── Message.jsx       # Burbuja de mensaje
│   │   └── CoverageCard.jsx  # Tarjeta con resultado: copago + hospital
│   ├── lib/
│   │   ├── supabase.js       # Cliente de Supabase
│   │   └── agent.js          # Lógica de llamada a Groq
│   ├── App.jsx
│   └── main.jsx
├── .env                      # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_AI_API_KEY
├── package.json
└── vite.config.js

