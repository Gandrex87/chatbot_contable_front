import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { ReactNode } from "react";

type HeaderProps = {
  mobileMenuTrigger?: ReactNode;
};

export function Header({ mobileMenuTrigger }: HeaderProps) {
  const logo = PlaceHolderImages.find((p) => p.id === "logo");

  return (
    <header className="flex h-16 items-center border-b bg-card px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2">
        {mobileMenuTrigger}
        {logo && (
          <Image
            src={logo.imageUrl}
            alt={logo.description}
            width={32}
            height={32}
            className="text-primary"
            data-ai-hint={logo.imageHint}
          />
        )}
        <h1 className="text-xl font-bold font-headline text-primary">
          LION CAPITAL GROUP S,L
        </h1>
      </div>
    </header>
  );
}
