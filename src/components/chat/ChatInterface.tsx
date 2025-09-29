"use client";

import { useAuth } from "@/hooks/use-auth";
import { useState, useRef, useEffect } from "react";
import type { Message } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Eraser } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { generateSessionId } from "@/ai/flows/generate-session-id";
import { extractReportId } from "@/ai/flows/extract-report-id";

const welcomeMessage: Message = {
  id: "0",
  role: "assistant",
  content: `Soy tu asistente especializado en normativa contable española.

## 📚 Puedo ayudarte con:

**Consultas normativas**
- Plan General Contable
- Módulos IRPF 2024-2025
- Reglamento IVA y facturación
- Epígrafes IAE

**Información actualizada**
- Últimas novedades fiscales
- Cambios normativos del BOE
- Actualizaciones de la Agencia Tributaria

**Reportes financieros de Holded**
- Genera y descarga PDFs de Pérdidas y Ganancias
- Balance de Situación por cualquier período

## 💡 Ejemplos de consultas:

- *"¿Cuéntame sobre el Artículo 11 del BOE de 1992?"*
- *"Genera el reporte de pérdidas y ganancias del Q1 2025"*
- *"Dame el balance de situación de 2025"*

¿En qué puedo ayudarte hoy?`,
};

export function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initSession = async () => {
      const id = await generateSessionId();
      setSessionId(id);
    };
    initSession();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleClear = () => {
    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          sessionId,
          username: user?.username,
          history: messages,
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullResponse += chunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: fullResponse }
              : msg
          )
        );
      }

      const { reportId } = await extractReportId({ chatResponse: fullResponse });
      
      if (reportId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, reportId: reportId }
              : msg
          )
        );
      }

    } catch (error) {
      console.error("Chat API error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: "Lo siento, ha ocurrido un error.", error: (error as Error).message }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header - Responsive */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b bg-card/50 backdrop-blur">
        <h2 className="text-base md:text-lg font-semibold font-headline">Chat Contable</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleClear} 
          title="Limpiar conversación"
          className="h-8 w-8 md:h-9 md:w-9"
        >
          <Eraser className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
      </div>

      {/* Chat Area - Responsive padding */}
      <ScrollArea className="flex-grow px-3 md:px-4 py-4" ref={scrollAreaRef}>
        <div className="space-y-4 pb-4 max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isTyping={isLoading && index === messages.length - 1}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Input Area - Responsive */}
      <div className="border-t p-3 md:p-4 bg-card/50 backdrop-blur">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu consulta aquí..."
            disabled={isLoading}
            autoComplete="off"
            className="flex-1 h-9 md:h-10 text-sm md:text-base"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="h-9 w-9 md:h-10 md:w-10 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          El Agente de IA puede cometer errores. Considera verificar la información importante.
        </p>
      </div>
    </div>
  );
}