import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { TypingIndicator } from "./TypingIndicator";
import { PdfDownloader } from "../reports/PdfDownloader";
import ReactMarkdown from "react-markdown";

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
        <Avatar className="h-8 w-8 border">
          <AvatarFallback>
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
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
          //<p className="whitespace-pre-wrap">{message.content}</p>
          <ReactMarkdown>{message.content}</ReactMarkdown>
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
          <AvatarImage src={`https://i.pravatar.cc/150?u=${authUser?.id}`} />
          <AvatarFallback>{authUser?.name.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
