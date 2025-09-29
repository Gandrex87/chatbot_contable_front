import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { TypingIndicator } from "./TypingIndicator";
import { PdfDownloader } from "../reports/PdfDownloader";
import ReactMarkdown from "react-markdown";
import Image from "next/image";

type ChatMessageProps = {
  message: Message;
  isTyping?: boolean;
};

export function ChatMessage({ message, isTyping = false }: ChatMessageProps) {
  const { user: authUser } = useAuth();
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border">
          <Image 
            src="/logo.svg" 
            alt="FiscalFlow AI" 
            width={24} 
            height={24}
            className="object-contain"
          />
        </div>
      )}

      <div
        className={cn(
          "max-w-lg rounded-xl px-4 py-3 shadow-md",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground"
        )}
      >
        {isTyping ? (
          <TypingIndicator />
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        {message.reportId && (
          <PdfDownloader
            reportId={message.reportId}
            onReportDataLoaded={(reportData) => {
              // This could be used to update the message state if needed
            }}
          />
        )}
      </div>

      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {authUser?.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}