
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Paperclip, Send, Trash2, X } from "lucide-react";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Form, FormControl, FormField, FormItem } from "../ui/form";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getAlmightyResponse } from "../../app/actions";
import {
  ChatMessage,
  ChatMessageLoading,
  type Message,
} from "./chat-message";
import Image from 'next/image';
import { AlmightyLogo } from '@/components/ui/logo';

const formSchema = z.object({
  message: z.string(),
});

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [context, setContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [attachedFile, setAttachedFile] = useState<{name: string, dataUrl: string, type: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const messageValue = form.watch("message");
  const isSubmittable = !isLoading && (messageValue.trim() !== "" || !!attachedFile);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleClear = () => {
    setMessages([]);
    setContext("");
    setAttachedFile(null);
    toast({
      title: "Conversation cleared",
      description: "You can start a new conversation now.",
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachedFile({
          name: file.name,
          dataUrl: e.target?.result as string,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    }
    if (event.target) {
        event.target.value = '';
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isSubmittable) return;
    
    setIsLoading(true);
    let content = values.message;
    if (attachedFile) {
        content += `\n\nAttached file: ${attachedFile.name}`;
    }

    const userMessage: Message = { role: "user", content: content };
    setMessages((prev) => [...prev, userMessage]);
    form.reset({ message: '' });

    const response = await getAlmightyResponse({
      message: values.message,
      context: context,
      file: attachedFile ? { name: attachedFile.name, dataUrl: attachedFile.dataUrl } : undefined,
    });
    
    setAttachedFile(null);
    setIsLoading(false);

    if (response.success) {
      const assistantMessage: Message = {
        role: "assistant",
        content: response.success.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setContext(response.success.updatedContext);
    } else {
      setMessages((prev) => prev.slice(0, prev.length - 1));
      toast({
        variant: "destructive",
        title: "Error",
        description:
          response.failure || "There was a problem communicating with the AI.",
      });
    }
  }

  return (
    <Card className="w-full max-w-3xl h-full flex flex-col shadow-2xl rounded-xl bg-card/80 backdrop-blur-sm border-white/20">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <AlmightyLogo className="h-8 w-8" />
          <CardTitle className="font-headline text-xl md:text-2xl text-foreground">
            Almighty Chat
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="text-muted-foreground hover:text-destructive transition-colors duration-300"
          aria-label="Clear conversation"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="space-y-6 p-4 md:p-6">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground pt-16 flex flex-col items-center gap-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                   <AlmightyLogo className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-foreground">
                    Start a conversation
                  </p>
                  <p className="text-sm">
                    Ask me anything, or tell me about your day!
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => <ChatMessage key={index} {...msg} />)
            )}
            {isLoading && <ChatMessageLoading />}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t bg-card/80">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex w-full items-start space-x-2"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="text-muted-foreground"
            >
              <Paperclip className="h-5 w-5" />
              <span className="sr-only">Attach file</span>
            </Button>
             <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex-1 space-y-2">
            {attachedFile && (
              <div className="relative flex items-center gap-2 p-2 rounded-md bg-muted/50 border text-sm animate-fade-in">
                {attachedFile.type.startsWith('image/') ? (
                    <Image src={attachedFile.dataUrl} alt={attachedFile.name} width={24} height={24} className="rounded-sm" />
                ) : (
                    <Paperclip className="h-4 w-4" />
                )}
                <span className="truncate flex-1">{attachedFile.name}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachedFile(null)}>
                    <X className="h-4 w-4"/>
                    <span className="sr-only">Remove file</span>
                </Button>
              </div>
            )}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="Type a message..."
                      autoComplete="off"
                      disabled={isLoading}
                      className="text-base bg-transparent border-input focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all duration-300"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            </div>
            <Button
              type="submit"
              disabled={!isSubmittable}
              size="icon"
              aria-label="Send message"
              className="bg-accent hover:bg-accent/90 shrink-0 transition-transform duration-200 active:scale-90 self-end"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </Form>
      </CardFooter>
    </Card>
  );
}
