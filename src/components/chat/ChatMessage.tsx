import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { TypingIndicator } from "./TypingIndicator";
import { PdfDownloader } from "../reports/PdfDownloader";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
        "flex items-start gap-2 md:gap-4 p-2 md:p-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border flex-shrink-0">
          <Image 
            src="/logo.svg" 
            alt="FiscalFlow AI" 
            width={20} 
            height={20}
            className="object-contain md:w-6 md:h-6"
          />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] sm:max-w-[75%] md:max-w-lg rounded-xl px-3 py-2 md:px-4 md:py-3 shadow-md",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground"
        )}
      >
        {isTyping ? (
          <TypingIndicator />
        ) : (
          <div className={cn(
            "prose prose-sm max-w-none",
            "prose-p:text-sm md:prose-p:text-base",
            "prose-headings:text-sm md:prose-headings:text-base",
            "prose-li:text-sm md:prose-li:text-base",
            isUser ? "prose-invert" : "dark:prose-invert"
          )}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Párrafos con espaciado adecuado
                p: ({ children }) => <p className="mb-2 md:mb-3 last:mb-0 text-sm md:text-base">{children}</p>,
                // Encabezados con tamaño apropiado
                h1: ({ children }) => <h1 className="text-base md:text-lg font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm md:text-base font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                // Tablas responsivas
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3 md:my-4 rounded-lg border border-border">
                    <table className="min-w-full divide-y divide-border">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-muted">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-border bg-background">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-muted/50 transition-colors">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="px-2 md:px-3 py-2 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-2 md:px-3 py-2 text-xs md:text-sm whitespace-normal break-words">
                    {children}
                  </td>
                ),
                // Listas con mejor espaciado
                ul: ({ children }) => <ul className="my-2 ml-3 md:ml-4 list-disc space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 ml-3 md:ml-4 list-decimal space-y-1">{children}</ol>,
                li: ({ children }) => <li className="ml-1 md:ml-2 text-sm md:text-base">{children}</li>,
                // Links con estilo apropiado
                a: ({ href, children }) => (
                  <a 
                    href={href} 
                    className="text-blue-500 hover:text-blue-600 underline text-sm md:text-base"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                // Código inline y bloques
                code: ({ children, ...props }) => {
                  const isInline = !('className' in props && typeof props.className === 'string' && props.className.includes('language-'));
                  if (isInline) {
                    return <code className="bg-muted px-1 py-0.5 rounded text-xs md:text-sm font-mono">{children}</code>;
                  }
                  return (
                    <pre className="bg-muted p-2 md:p-3 rounded-md overflow-x-auto my-2 md:my-3">
                      <code className="text-xs md:text-sm font-mono">{children}</code>
                    </pre>
                  );
                },
                // Bloques de código con lenguaje específico
                pre: ({ children }) => <>{children}</>,
                // Negritas y énfasis
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                // Líneas horizontales
                hr: () => <hr className="my-3 md:my-4 border-border" />,
                // Blockquotes
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 md:border-l-4 border-primary pl-3 md:pl-4 my-2 italic text-sm md:text-base opacity-90">
                    {children}
                  </blockquote>
                ),
                // Saltos de línea
                br: () => <br className="my-1" />,
              }}
            >
              {message.content}
            </ReactMarkdown>
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
        <Avatar className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm">
            {authUser?.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}