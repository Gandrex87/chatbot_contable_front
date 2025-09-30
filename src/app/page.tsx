"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { ChatInterface, ChatInterfaceHandle } from "@/components/chat/ChatInterface";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import type { Message } from "@/lib/types";
import { Toaster } from "@/components/ui/toaster";
import { getConversationMessages } from "@/app/actions/conversations";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const chatRef = useRef<ChatInterfaceHandle>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const handleNewConversation = () => {
    if (chatRef.current) {
      chatRef.current.clearConversation();
      setCurrentSessionId(null);
    }
  };

  const handleSelectConversation = async (sessionId: string) => {
    if (!user?.username) return;
    
    try {
      setLoadingConversation(true);
      
      // Cargar mensajes de la conversación seleccionada
      const conversationMessages = await getConversationMessages(sessionId, user.username);
      
      if (conversationMessages.length === 0) {
        toast({
          title: "Conversación vacía",
          description: "No se encontraron mensajes en esta conversación.",
          variant: "destructive"
        });
        return;
      }

      // Actualizar el sessionId actual
      setCurrentSessionId(sessionId);
      
      // Cargar los mensajes en el chat
      if (chatRef.current) {
        chatRef.current.loadConversation(conversationMessages, sessionId);
        
        toast({
          title: "Conversación cargada",
          description: `${conversationMessages.length} mensajes cargados.`,
        });
      }
      
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la conversación.",
        variant: "destructive"
      });
    } finally {
      setLoadingConversation(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar - Fijo sin scroll */}
      <aside className="hidden md:flex md:w-64 lg:w-72 border-r bg-card">
        <AppSidebar 
          messages={messages} 
          onNewConversation={handleNewConversation}
          currentSessionId={currentSessionId}
          onSelectConversation={handleSelectConversation}
        />
      </aside>
      
      {/* Área principal - Con estructura de flex columna */}
      <div className="flex flex-1 flex-col h-screen">
        {/* Header - Fijo en la parte superior */}
        <Header
          mobileMenuTrigger={
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <AppSidebar 
                  messages={messages} 
                  onNewConversation={handleNewConversation}
                  currentSessionId={currentSessionId}
                  onSelectConversation={handleSelectConversation}
                />
              </SheetContent>
            </Sheet>
          }
        />
        
        {/* Área del chat - Ocupa el espacio restante */}
        <main className="flex-1 overflow-hidden">
          <ChatInterface ref={chatRef} onMessagesUpdate={setMessages} />
        </main>
        
        {/* Footer - Fijo en la parte inferior */}
        <footer className="border-t p-4 text-center text-xs text-muted-foreground bg-card">
          © {new Date().getFullYear()} © 2025 Lion Capital Group · Términos de uso · Política de Cookies · Construido por Lion Capital Group
        </footer>
      </div>
    </div>
    <Toaster />
    </>
  );
}