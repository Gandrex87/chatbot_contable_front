"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import type { Message } from "@/lib/types";
import { Toaster } from "@/components/ui/toaster";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]); // This state will be lifted up or managed differently

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

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
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:block md:w-80 lg:w-96 border-r">
        <AppSidebar messages={messages} />
      </aside>
      <div className="flex flex-1 flex-col">
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
                <AppSidebar messages={messages} />
              </SheetContent>
            </Sheet>
          }
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* A better way would be to lift state up to this component */}
          <ChatInterface />
        </main>
        <footer className="border-t p-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} LION CAPITAL GROUP S,L. All rights reserved.
        </footer>
      </div>
    </div>
    <Toaster />
    </>
  );
}
