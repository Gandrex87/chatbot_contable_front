"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, TestTube, MessageSquare } from "lucide-react";
import type { Message } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import Image from "next/image";

type AppSidebarProps = {
  messages: Message[];
};

export function AppSidebar({ messages }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const userMessages = messages.filter((m) => m.role === "user").length;
  const assistantMessages = messages.filter((m) => m.role === "assistant").length;

  return (
    <div className="flex h-full flex-col bg-card p-4">
      <div className="flex flex-col items-center gap-4">
        {/* Logo de la empresa */}
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          <Image 
            src="/logo.svg" 
            alt="Lion Capital Logo" 
            width={64} 
            height={64}
            className="object-contain"
          />
        </div>
        
        <div className="text-center">
          <p className="font-semibold text-lg">{user?.name}</p>
          <p className="text-sm text-muted-foreground">@{user?.username}</p>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="flex-grow">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-headline flex items-center gap-2">
              <MessageSquare className="w-4 h-4"/>
              Estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between">
              <span>Mensajes totales:</span>
              <span className="font-medium">{Math.max(0, messages.length - 1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tus mensajes:</span>
              <span className="font-medium">{userMessages}</span>
            </div>
            <div className="flex justify-between">
              <span>Respuestas IA:</span>
              <span className="font-medium">{assistantMessages}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-auto flex flex-col gap-2">
        <Button variant="ghost" className="w-full justify-start">
          <TestTube className="mr-2 h-4 w-4" />
          Test de conexión n8n
        </Button>
        <Button variant="destructive" onClick={logout} className="w-full">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}