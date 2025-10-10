import { generateSessionId } from "@/ai/flows/generate-session-id";
import { getUserInfo } from '@/lib/user-config';

export async function POST(req: Request) {
  try {
    const { message, sessionId: clientSessionId, username, file } = await req.json();
    
    console.log("=== CHAT API DEBUG ===");
    console.log("Message:", message);
    console.log("ClientSessionId:", clientSessionId);
    console.log("Username:", username);
    console.log("File attached:", file ? file.name : 'None');

    if (!message && !file) {
      return new Response("Message or file is required", { status: 400 });
    }

    let sessionId = clientSessionId;
    if (!sessionId) {
      sessionId = await generateSessionId();
    }

    // Obtener metadata del usuario
    const userInfo = getUserInfo(username || 'usuario');
    const personalizedSessionId = username ? `${username}_${sessionId}` : sessionId;
    
    //const n8nWebhookUrl = "https://n8n.lioncapitalg.com/webhook/42cdc9f0-2733-4771-95ff-4b14f7f1e349/chat";
    //nuevo flujo con router
    const n8nWebhookUrl = "https://n8n.lioncapitalg.com/webhook/fcfab710-02f4-4395-96b5-8713563fe0a7/chat";
    // Preparar payload con archivo si existe
    const payload: any = {
      action: "sendMessage",
      chatInput: message || "Archivo adjunto para análisis",
      sessionId: personalizedSessionId,
      userMetadata: {
        userId: username || 'usuario',
        userName: userInfo.fullName,
        userRole: userInfo.role,
        responseStyle: userInfo.style
      }
    };

    // Añadir archivo al payload si existe
    if (file) {
      payload.file = file;
    }

    console.log("Payload to n8n:", JSON.stringify({
      ...payload,
      file: file ? { name: file.name, type: file.type, size: file.data?.length } : undefined
    }, null, 2));

    // Crear AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutos

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("n8n Response Status:", n8nResponse.status);
    console.log("n8n Response Headers:", Object.fromEntries(n8nResponse.headers.entries()));

    const contentType = n8nResponse.headers.get('content-type');
    console.log("Content-Type:", contentType);

    // IMPORTANTE: Detectar si la respuesta es HTML (error page)
    if (contentType?.includes('text/html')) {
      console.error("Received HTML response - likely an error page");
      
      // Leer el HTML para determinar el tipo de error
      const htmlContent = await n8nResponse.text();
      console.log("HTML Error Content (first 500 chars):", htmlContent.substring(0, 500));
      
      // Detectar error 524 (timeout de Cloudflare)
      if (htmlContent.includes('524') || htmlContent.includes('timeout')) {
        return new Response(
          "⏱️ La búsqueda web está tardando demasiado debido al límite de tiempo del servidor . Este es un problema conocido con búsquedas complejas. Por favor:\n\n" +
          "Nota: La búsqueda se completó en el servidor pero no pudo enviarse a tiempo.",
          { 
            status: 200,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          }
        );
      }
      
      // Otros errores HTML
      return new Response(
        "❌ El servidor devolvió una página de error en lugar de la respuesta esperada. " +
        "Esto suele ocurrir con búsquedas muy largas ",
        { 
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        }
      );
    }

    // Verificar el status después de verificar el content-type
    if (!n8nResponse.ok) {
      const errorBody = await n8nResponse.text();
      console.error("n8n API error:", errorBody);
      return new Response(`Error from n8n: ${errorBody}`, { status: n8nResponse.status });
    }
    
    // Manejar respuesta streaming (text/plain)
    if (contentType?.includes('text/plain')) {
      console.log("Returning text/plain response");
      return new Response(n8nResponse.body, {
        headers: { 
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache"
        },
      });
    } else {
      // Respuesta JSON
      const responseText = await n8nResponse.text();
      console.log("Raw n8n Response:", responseText);
      
      try {
        const data = JSON.parse(responseText);
        console.log("Parsed n8n Response:", JSON.stringify(data, null, 2));
        
        // Intentar diferentes propiedades comunes de respuesta
        const responseContent = data.output || 
                               data.response || 
                               data.text || 
                               data.content || 
                               data.message || 
                               data.result ||
                               JSON.stringify(data); // Si no encuentra nada, devolver el JSON completo
        
        console.log("Final Response Content:", responseContent);
        
        return new Response(responseContent, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        console.log("Returning raw response as fallback");
        
        return new Response(responseText, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    }
  } catch (error) {
    console.error("API route error:", error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response("⏱️ La consulta está tardando más de lo esperado. Por favor, inténtalo de nuevo.", { status: 408 });
    }
    
    return new Response("❌ Error interno del servidor", { status: 500 });
  }
}

// Configuración opcional para Next.js 13+ App Router
export const runtime = 'nodejs'; // Cambiar de 'edge' a 'nodejs' para mejor manejo de streams
export const maxDuration = 300; // 5 minutos