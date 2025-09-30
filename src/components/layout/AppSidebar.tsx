"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, MessageSquare, MessageSquarePlus } from "lucide-react";
import type { Message } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import Image from "next/image";
import { ConversationsList } from "./ConversationsList";

type AppSidebarProps = {
  messages: Message[];
  onNewConversation?: () => void;
  currentSessionId?: string | null;
  onSelectConversation?: (sessionId: string) => void;
};

export function AppSidebar({ messages, onNewConversation, currentSessionId, onSelectConversation }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const userMessages = messages.filter((m) => m.role === "user").length;
  const assistantMessages = messages.filter((m) => m.role === "assistant").length;

  return (
    <div className="flex h-full w-full min-w-0 flex-col bg-card">
      {/* Logo y usuario - Con padding solo en los lados y arriba */}
      <div className="flex flex-col items-center gap-2 px-3 pt-3 min-w-0">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
          <Image 
            src="/logo.svg" 
            alt="Lion Capital Logo" 
            width={48} 
            height={48}
            className="object-contain"
          />
        </div>
        
        <div className="text-center min-w-0 w-full">
          <p className="font-semibold text-base truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">@{user?.username}</p>
        </div>
      </div>

      <Separator className="my-3 mx-3" />

      {/* Botón Nueva Conversación */}
      <div className="px-3 pb-2 min-w-0">
        <Button 
          onClick={onNewConversation}
          variant="outline"
          className="w-full justify-start min-w-0"
          size="sm"
        >
          <MessageSquarePlus className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">Nueva Conversación</span>
        </Button>
      </div>

      {/* Lista de conversaciones */}
      {onSelectConversation && (
        <>
          <Separator className="mb-3 mx-3" />
          <div className="px-2 flex-grow overflow-hidden min-w-0">
            <ConversationsList 
              currentSessionId={currentSessionId}
              onSelectConversation={onSelectConversation}
            />
          </div>
        </>
      )}

      <Separator className="my-3 mx-3" />

      {/* Estadísticas - Con menos padding lateral */}
      <div className="px-2 min-w-0">
        <Card className="bg-secondary/50 border-0 shadow-sm">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-headline flex items-center gap-2 min-w-0">
              <MessageSquare className="w-3.5 h-3.5 shrink-0"/>
              <span className="truncate">Estadísticas Actuales</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1.5 px-3 pb-3">
            <div className="flex justify-between items-center min-w-0">
              <span className="text-muted-foreground shrink-0">Total:</span>
              <span className="font-semibold text-base">{Math.max(0, messages.length - 1)}</span>
            </div>
            <div className="flex justify-between items-center min-w-0">
              <span className="text-muted-foreground shrink-0">Tus mensajes:</span>
              <span className="font-semibold text-primary">{userMessages}</span>
            </div>
            <div className="flex justify-between items-center min-w-0">
              <span className="text-muted-foreground shrink-0">Respuestas IA:</span>
              <span className="font-semibold text-green-600">{assistantMessages}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botón de logout - Con padding consistente */}
      <div className="p-3 min-w-0">
        <Button variant="destructive" onClick={logout} className="w-full min-w-0" size="sm">
          <LogOut className="mr-2 h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Cerrar Sesión</span>
        </Button>
      </div>
    </div>
  );
}