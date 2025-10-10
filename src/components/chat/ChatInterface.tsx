"use client";

import { useAuth } from "@/hooks/use-auth";
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import type { Message } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, X, FileSpreadsheet } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { generateSessionId } from "@/ai/flows/generate-session-id";
import { extractReportId } from "@/ai/flows/extract-report-id";
import { useToast } from "@/hooks/use-toast";

const welcomeMessage: Message = {
  id: "0",
  role: "assistant",
  content: `Soy tu Asistente Financiero y Contable.

## 📚 Puedo ayudarte con:

**1. Consultas Expertas**
Respondo tus dudas sobre normativa contable y fiscal, desde el Plan General Contable hasta las últimas novedades del BOE.

**2. Reportes de Holded a Medida**
Genero reportes de **Pérdidas y Ganancias** o **Balance de Situación** para Lion Capital y Amon Estate de cualquier período.

**3. Análisis Inteligente de Archivos**
**Sube tu Excel de cashflow** y te daré un análisis completo con resumen ejecutivo, tendencias de gasto y recomendaciones.
*Límite actual: archivos .xlsx de hasta 5MB.*

## 💡 ¿Cómo puedes preguntarme?

- *"¿Cuál era el tipo de IVA para la hostelería en 2022?"*
- *"Genera el P&L de Lion Capital del último trimestre"*
- *"Dame el balance de Amon Estate de este año"*
- *Adjunta un archivo y escribe: "analiza este flujo de caja"*

¿En qué puedo ayudarte hoy?`,
};

type ChatInterfaceProps = {
  onMessagesUpdate?: (messages: Message[]) => void;
  onSessionIdUpdate?: (sessionId: string) => void;
};

export interface ChatInterfaceHandle {
  clearConversation: () => void;
  loadConversation: (messages: Message[], sessionId: string) => void;
}

export const ChatInterface = forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(
  ({ onMessagesUpdate, onSessionIdUpdate }, ref) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Exponer método para limpiar conversación
    useImperativeHandle(ref, () => ({
      clearConversation: async () => {
        const newId = await generateSessionId();
        setSessionId(newId);
        setMessages([welcomeMessage]);
        setInput("");
        setIsLoading(false);
        setSelectedFile(null);
        setFilePreview(null);
      },
      loadConversation: (loadedMessages: Message[], loadedSessionId: string) => {
        setMessages(loadedMessages);
        setSessionId(loadedSessionId);
        setInput("");
        setIsLoading(false);
        setSelectedFile(null);
        setFilePreview(null);
      }
    }), []);

    // Inicializar sessionId
    useEffect(() => {
      const initSession = async () => {
        const id = await generateSessionId();
        setSessionId(id);
        if (onSessionIdUpdate) {
          onSessionIdUpdate(id);
        }
      };
      initSession();
    }, [onSessionIdUpdate]);

    // Notificar cambios de mensajes al componente padre
    useEffect(() => {
      if (onMessagesUpdate) {
        onMessagesUpdate(messages);
      }
    }, [messages, onMessagesUpdate]);

    // Auto-scroll cuando hay nuevos mensajes
    useEffect(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, [messages]);

    // Función para manejar la selección de archivos
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Validar que sea un archivo Excel
        const validTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel'
        ];
        
        if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx')) {
          toast({
            title: "Archivo no válido",
            description: "Por favor selecciona un archivo Excel (.xlsx)",
            variant: "destructive"
          });
          return;
        }

        // Validar tamaño (5MB máximo)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Archivo muy grande",
            description: "El archivo no debe superar los 5MB",
            variant: "destructive"
          });
          return;
        }

        setSelectedFile(file);
        setFilePreview(file.name);
      }
    };

    // Función para eliminar el archivo seleccionado
    const handleRemoveFile = () => {
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if ((!input.trim() && !selectedFile) || isLoading) return;

      const messageText = input + (selectedFile ? `\n\n📎 Archivo adjunto: ${selectedFile.name}` : '');
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: messageText,
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      
      // Preparar el archivo si existe
      let fileData = null;
      if (selectedFile) {
        const reader = new FileReader();
        try {
          fileData = await new Promise((resolve, reject) => {
            reader.onload = (e) => resolve({
              name: selectedFile.name,
              type: selectedFile.type,
              data: e.target?.result?.toString().split(',')[1] // Obtener solo la parte base64
            });
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });
        } catch (error) {
          console.error("Error reading file:", error);
          toast({
            title: "Error al leer el archivo",
            description: "No se pudo procesar el archivo seleccionado",
            variant: "destructive"
          });
        }
      }

      setIsLoading(true);

      const assistantMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: "" },
      ]);

      try {
        const payload = {
          message: input || "Archivo adjunto para análisis",
          sessionId,
          username: user?.username,
          history: messages,
          ...(fileData && { file: fileData })
        };

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // Limpiar archivo después de enviar
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

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

        // Extraer ReportId si existe
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
        
        // Detectar si el error es por timeout
        let errorMessage = "Lo siento, ha ocurrido un error.";
        let isTimeout = false;
        
        if (error instanceof Error) {
          // Verificar si el mensaje contiene indicios de timeout
          if (error.message.includes('524') || 
              error.message.includes('timeout') || 
              error.message.includes('tardando')) {
            errorMessage = "⏱️ La búsqueda excedió el tiempo límite. Las búsquedas web complejas pueden tardar más de lo permitido por el servidor.";
            isTimeout = true;
          }
        }
        
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { 
                  ...msg, 
                  content: errorMessage, 
                  error: (error as Error).message,
                  isTimeout // Añadir flag para identificar timeouts
                }
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
          <h2 className="text-base md:text-lg font-semibold font-headline">Chat Inteligente</h2>
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
          {/* Mostrar preview del archivo si existe */}
          {filePreview && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-md max-w-4xl mx-auto">
              <FileSpreadsheet className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="text-sm flex-1 truncate">{filePreview}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRemoveFile}
                className="h-6 w-6 p-0"
                type="button"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
            {/* Input de archivo oculto */}
            <input
              ref={fileInputRef}
              type="file"
              id="file-upload"
              className="hidden"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileSelect}
            />
            
            {/* Botón para seleccionar archivo */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:h-10 md:w-10"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedFile ? "Añade un mensaje para el archivo..." : "Escribe tu consulta aquí..."}
              disabled={isLoading}
              autoComplete="off"
              className="flex-1 h-9 md:h-10 text-sm md:text-base"
            />
            
            <Button 
              type="submit" 
              disabled={isLoading || (!input.trim() && !selectedFile)}
              className="h-9 w-9 md:h-10 md:w-10 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            El Agente puede cometer errores. Considera verificar la información importante.
          </p>
        </div>
      </div>
    );
  }
);

ChatInterface.displayName = "ChatInterface";