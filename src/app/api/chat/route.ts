import { generateSessionId } from "@/ai/flows/generate-session-id";
import { getUserInfo } from '@/lib/user-config';

export async function POST(req: Request) {
  try {
    const { message, sessionId: clientSessionId, username } = await req.json();
    
    console.log("=== CHAT API DEBUG ===");
    console.log("Message:", message);
    console.log("ClientSessionId:", clientSessionId);
    console.log("Username:", username);

    if (!message) {
      return new Response("Message is required", { status: 400 });
    }

    let sessionId = clientSessionId;
    if (!sessionId) {
      sessionId = await generateSessionId();
    }

    // Obtener metadata del usuario
    const userInfo = getUserInfo(username || 'usuario');
    const personalizedSessionId = username ? `${username}_${sessionId}` : sessionId;
    
    const n8nWebhookUrl = "https://n8n.lioncapitalg.com/webhook/42cdc9f0-2733-4771-95ff-4b14f7f1e349/chat";
    const payload = {
      action: "sendMessage",
      chatInput: message,
      sessionId: personalizedSessionId,
      userMetadata: {
        userId: username || 'usuario',
        userName: userInfo.fullName,
        userRole: userInfo.role,
        responseStyle: userInfo.style
      }
    };

    console.log("Payload to n8n:", JSON.stringify(payload, null, 2));

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

    if (!n8nResponse.ok) {
      const errorBody = await n8nResponse.text();
      console.error("n8n API error:", errorBody);
      return new Response(`Error from n8n: ${errorBody}`, { status: n8nResponse.status });
    }

    const contentType = n8nResponse.headers.get('content-type');
    console.log("Content-Type:", contentType);
    
    if (contentType?.includes('text/plain')) {
      console.log("Returning text/plain response");
      return new Response(n8nResponse.body, {
        headers: { 
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache"
        },
      });
    } else {
      // Obtener el response como texto primero para debugging
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