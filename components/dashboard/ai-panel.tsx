"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAIPanel } from "./ai-panel-provider";
import { usePathname } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Sparkles, Send, Loader2, Bot, User } from "lucide-react";

export function AIPanel() {
  const { isOpen, close } = useAIPanel();
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { context: { pathname } },
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  }

  if (!isOpen) return null;

  return (
    <div className="flex h-full w-96 flex-col border-l border-[#2A2520] bg-[#0F0E0D]">
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-[#2A2520]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#D4734E]" />
          <span className="text-sm font-medium text-[#E8E0D4]">AI Assistant</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={close}
          className="h-8 w-8 text-[#8A817A] hover:text-[#E8E0D4] hover:bg-[#1A1816]"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-20">
            <Sparkles className="h-8 w-8 text-[#D4734E] opacity-50" />
            <p className="text-sm text-[#8A817A] max-w-[240px]">
              Ask me to customize your workspace — add fields, change views, update your theme, or create new entities.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <div className="flex-shrink-0 mt-1">
                {message.role === "user" ? (
                  <div className="h-6 w-6 rounded-full bg-[#2A2520] flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-[#8A817A]" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full bg-[rgba(212,115,78,0.1)] flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-[#D4734E]" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <p
                          key={i}
                          className="text-sm text-[#E8E0D4] whitespace-pre-wrap break-words leading-relaxed"
                        >
                          {part.text}
                        </p>
                      );
                    default: {
                      // Handle tool invocation parts (tool-addField, tool-removeField, etc.)
                      if (part.type.startsWith("tool-")) {
                        const toolPart = part as { type: string; state: string; toolName?: string };
                        const toolName = part.type.replace("tool-", "");
                        return (
                          <div
                            key={i}
                            className="mt-2 rounded-md border border-[#2A2520] bg-[#1A1816] px-3 py-2 text-xs"
                          >
                            <span className="text-[#D4734E]">{toolName}</span>
                            {toolPart.state === "output-available" && (
                              <span className="ml-2 text-[#5EC69A]">Done</span>
                            )}
                            {(toolPart.state === "input-available" || toolPart.state === "input-streaming") && (
                              <span className="ml-2 text-[#8A817A]">Running...</span>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }
                  }
                })}
              </div>
            </div>
          ))}

          {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-[rgba(212,115,78,0.1)] flex items-center justify-center flex-shrink-0">
                <Loader2 className="h-3.5 w-3.5 text-[#D4734E] animate-spin" />
              </div>
              <p className="text-sm text-[#8A817A]">Thinking...</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-[#2A2520] p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 min-h-[40px] max-h-[120px] resize-none rounded-md bg-[#1A1816] border border-[#2A2520] text-[#E8E0D4] placeholder:text-[#5A534D] text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#D4734E]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="h-10 w-10 flex-shrink-0 bg-[#D4734E] hover:bg-[#E8845D] text-[#0B0B0B]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export function AIFab() {
  const { isOpen, toggle } = useAIPanel();

  if (isOpen) return null;

  return (
    <Button
      onClick={toggle}
      className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[#D4734E] hover:bg-[#E8845D] text-[#0B0B0B] shadow-lg shadow-[rgba(212,115,78,0.25)] z-50"
      size="icon"
    >
      <Sparkles className="h-5 w-5" />
    </Button>
  );
}
