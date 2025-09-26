"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@/components/auth/LoginForm";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, user, loading } = useAuth();
  const logo = PlaceHolderImages.find(p => p.id === 'logo');

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const handleLogin = async ({ username, password }: { username: string; password: string }) => {
    setIsLoading(true);
    const success = await login(username, password);
    setIsLoading(false);
    if (success) {
      router.push("/");
    }
    return success;
  };
  
  if(loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-4 mb-8">
        {logo && <Image src={logo.imageUrl} alt={logo.description} width={64} height={64} className="text-primary" data-ai-hint={logo.imageHint} />}
        <h1 className="text-3xl font-bold font-headline">FiscalFlow</h1>
        <p className="text-muted-foreground">Tu asistente fiscal y contable inteligente.</p>
      </div>
      <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
    </main>
  );
}
