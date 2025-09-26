import { generateSessionId } from "@/ai/flows/generate-session-id";

export async function POST(req: Request) {
  try {
    const { message, sessionId: clientSessionId } = await req.json();

    if (!message) {
      return new Response("Message is required", { status: 400 });
    }

    let sessionId = clientSessionId;
    if (!sessionId) {
      sessionId = await generateSessionId();
    }
    
    const n8nWebhookUrl = "https://n8n.lioncapitalg.com/webhook/42cdc9f0-2733-4771-95ff-4b14f7f1e349/chat";

    const payload = {
      action: "sendMessage",
      chatInput: message,
      sessionId: sessionId,
    };

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!n8nResponse.ok) {
        const errorBody = await n8nResponse.text();
        console.error("n8n API error:", errorBody);
        return new Response(`Error from n8n: ${errorBody}`, { status: n8nResponse.status });
    }

    // Pipe the streaming response from n8n to our client
    const stream = n8nResponse.body;

    return new Response(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (error) {
    console.error("API route error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
