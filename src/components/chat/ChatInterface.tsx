"use client";

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
  content:
    "Soy tu asistente especializado en normativa fiscal y contable española. Mi base de conocimiento incluye Plan General Contable, módulos IRPF 2024-2025, reglamentos IVA y facturación. Además puedo generar reportes de Holded con descarga directa de PDFs.",
};

export function ChatInterface() {
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
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
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
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold font-headline">Chat Inteligente</h2>
        <Button variant="ghost" size="icon" onClick={handleClear} title="Limpiar conversación">
          <Eraser className="h-5 w-5" />
        </Button>
      </div>
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isTyping={isLoading && index === messages.length - 1}
            />
          ))}
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu consulta aquí..."
            disabled={isLoading}
            autoComplete="off"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
         <p className="text-xs text-muted-foreground mt-2 text-center">
          FiscalFlow puede cometer errores. Considera verificar la información importante.
        </p>
      </div>
    </div>
  );
}
