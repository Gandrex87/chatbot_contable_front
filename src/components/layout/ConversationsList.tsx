"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getConversationsList, type Conversation } from "@/app/actions/conversations";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { MessageSquare, Clock, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ConversationsListProps {
  currentSessionId?: string | null;
  onSelectConversation: (sessionId: string) => void;
}

export function ConversationsList({ 
  currentSessionId, 
  onSelectConversation 
}: ConversationsListProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConversations() {
      if (!user?.username) return;
      
      try {
        setLoading(true);
        setError(null);
        const convos = await getConversationsList(user.username);
        setConversations(convos);
      } catch (err) {
        console.error("Error loading conversations:", err);
        setError("Error al cargar las conversaciones");
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
    
    // Recargar cada 30 segundos para ver nuevas conversaciones
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, [user?.username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No hay conversaciones previas</p>
      </div>
    );
  }

  // Agrupar conversaciones por fecha
  const groupedConversations = conversations.reduce((groups, conversation) => {
    const date = new Date(conversation.updatedAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let groupKey: string;
    
    if (date.toDateString() === today.toDateString()) {
      groupKey = "Hoy";
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = "Ayer";
    } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      groupKey = "Esta semana";
    } else if (date > new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)) {
      groupKey = "Este mes";
    } else {
      groupKey = "Anteriores";
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(conversation);
    
    return groups;
  }, {} as Record<string, Conversation[]>);

  const groupOrder = ["Hoy", "Ayer", "Esta semana", "Este mes", "Anteriores"];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground px-2">
        Conversaciones Recientes
      </h3>
      
      <ScrollArea className="h-[400px]">
        <div className="space-y-4 pr-4">
          {groupOrder.map(groupName => {
            const convos = groupedConversations[groupName];
            if (!convos || convos.length === 0) return null;
            
            return (
              <div key={groupName} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                  {groupName}
                </p>
                {convos.map((conversation) => (
                  <Card
                    key={conversation.sessionId}
                    className={cn(
                      "p-3 cursor-pointer hover:bg-accent/50 transition-colors",
                      "border-l-2 border-l-transparent",
                      currentSessionId === conversation.sessionId && 
                      "bg-accent border-l-primary"
                    )}
                    onClick={() => onSelectConversation(conversation.sessionId)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {conversation.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conversation.lastMessage}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {conversation.messageCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(conversation.updatedAt, { 
                              addSuffix: true,
                              locale: es 
                            })}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}