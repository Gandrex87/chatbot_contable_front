# **App Name**: Chatbot_Contable

## Core Features:

- User Authentication: Secure login with username/password (admin/password, contable/Temporal123) and manual logout.
- Intelligent Chat Interface: ChatGPT-like interface for user messages and assistant responses with 'typing...' indicator, conversation history, and clear conversation button.
- n8n Integration: Connect to n8n endpoint (https://n8n.lioncapitalg.com/webhook/42cdc9f0-2733-4771-95ff-4b14f7f1e349/chat) with payload {"action": "sendMessage", "chatInput": mensaje, "sessionId": uuid} and handle text and streaming responses. The uuid is generated, if not already present, using tool calls, to allow n8n to handle conversational flow.
- Report ID Detection: Automatically detect 'ReportId: [number]' patterns in chat responses, triggering the PDF download interface. It uses tool calls to generate more complex reportId
- PDF Report Retrieval: Connect to PostgreSQL (host 10.1.0.188:5433, table holded_reports with fields: id, file_name, pdf_data in base64) to fetch and prepare PDF reports based on reportId.
- PDF Download Interface: Display 'Obtener PDF' and 'Descargar PDF' buttons with file information (name, size, date, type) and magic bytes PDF verification.
- Welcome Message: Display a welcome message: "Soy tu asistente especializado en normativa fiscal y contable española. Mi base de conocimiento incluye Plan General Contable, módulos IRPF 2024-2025, reglamentos IVA y facturación. Además puedo generar reportes de Holded con descarga directa de PDFs."

## Style Guidelines:

- Primary color: Dark blue (#100E35), reflecting the corporate identity of LION CAPITAL GROUP S,L.
- Background color: Very light grayish-blue (#F0F2F6), creating a clean and professional look. The primary color hue has been greatly desaturated.
- Accent color: White (#FFFFFF), for contrast and readability against the dark primary color. It's analogous to blue-purple.
- Headline font: 'Poppins', a geometric sans-serif, for headings. Body font: 'Inter', a grotesque-style sans-serif.
- Use professional, clear icons from Material-UI (MUI) to represent actions and information.
- Fixed header with company logo and name, left sidebar with user info/stats/logout, central chat area, and corporate footer.
- Subtle loading animations during report generation and data fetching to improve user experience.