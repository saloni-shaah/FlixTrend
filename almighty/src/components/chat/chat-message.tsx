"use client";

import { cn } from "../../lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Bot, User } from "lucide-react";
import LoadingDots from "./loading-dots";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export function ChatMessage({ role, content }: Message) {
  const isAssistant = role === "assistant";
  return (
    <div
      className={cn(
        "flex items-start gap-3 animate-fade-in",
        !isAssistant && "justify-end"
      )}
    >
      {isAssistant && (
        <Avatar className="h-8 w-8 border bg-background">
          <AvatarFallback className="bg-transparent">
            <Bot className="h-5 w-5 text-accent" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-sm md:max-w-md rounded-lg p-3 shadow-md",
          isAssistant
            ? "bg-card text-card-foreground"
            : "bg-primary text-primary-foreground"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content.split('\n\nAttached file:')[0]}</p>
      </div>
      {!isAssistant && (
        <Avatar className="h-8 w-8 border bg-background">
          <AvatarFallback className="bg-transparent">
            <User className="h-5 w-5 text-foreground" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

export function ChatMessageLoading() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <Avatar className="h-8 w-8 border bg-background">
        <AvatarFallback>
          <Bot className="h-5 w-5 text-accent" />
        </AvatarFallback>
      </Avatar>
      <div className="max-w-sm md:max-w-md rounded-lg bg-card p-3 text-card-foreground shadow-md">
        <LoadingDots />
      </div>
    </div>
  );
}
