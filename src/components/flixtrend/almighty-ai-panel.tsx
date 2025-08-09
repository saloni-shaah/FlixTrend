"use client"

import { useState } from "react"
import { Sparkles, Bot, Image as ImageIcon, Loader, BrainCircuit } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { createImage } from "@/ai/flows/image-creation"
import Image from 'next/image'
import { useToast } from "@/hooks/use-toast"

export function AlmightyAiPanel() {
  const [prompt, setPrompt] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleGenerateImage = async () => {
    if (!prompt) return
    setIsLoading(true)
    setImageUrl("")
    try {
      const result = await createImage({ prompt })
      setImageUrl(result.imageUrl)
    } catch (error) {
      console.error("Image generation failed:", error)
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-20 md:bottom-8 right-1/2 translate-x-1/2 md:right-8 md:translate-x-0 h-16 w-16 rounded-full animated-glow shadow-lg"
          size="icon"
        >
          <Sparkles className="h-8 w-8" />
        </Button>
      </SheetTrigger>
      <SheetContent className="glassmorphism w-full md:max-w-md p-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="flex items-center gap-2 text-2xl font-headline">
            <Bot className="h-8 w-8 text-primary animated-glow-sm" />
            Almighty AI Panel
          </SheetTitle>
          <SheetDescription>
            Your creative co-pilot. Generate, analyze, and build with the power of AI.
          </SheetDescription>
        </SheetHeader>
        <div className="p-6">
          <Tabs defaultValue="image-creator" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="image-creator"><ImageIcon className="mr-2" /> Image</TabsTrigger>
              <TabsTrigger value="content-gen" disabled><BrainCircuit className="mr-2"/> Content</TabsTrigger>
            </TabsList>
            <TabsContent value="image-creator" className="mt-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Image Creator</h3>
                <p className="text-sm text-muted-foreground">Describe the image you want to create. Be as specific as you want.</p>
                <Textarea
                  placeholder="e.g., A futuristic cityscape at night with neon lights and flying cars, synthwave style"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button onClick={handleGenerateImage} disabled={isLoading} className="w-full">
                  {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                  Generate
                </Button>
                {isLoading && <p className="text-sm text-center text-muted-foreground">AI is creating... this may take a moment.</p>}
                {imageUrl && (
                  <div className="relative aspect-square w-full mt-4 rounded-lg overflow-hidden border">
                     <Image src={imageUrl} alt="Generated image" layout="fill" objectFit="cover" />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
