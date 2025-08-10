import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTrendingTopics, getShorts, type Short } from "@/lib/data";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function ScopePage() {
  const trendingTopics = await getTrendingTopics();
  const shorts = await getShorts();

  return (
      <div className="container mx-auto py-4 px-4 space-y-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search Flixtrend..." className="pl-10" />
        </div>

        <div>
          <h2 className="text-2xl font-bold font-headline mb-4">Trending Now</h2>
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent>
              {trendingTopics.map((topic) => (
                <CarouselItem key={topic.id} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="glassmorphism">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-primary">{topic.title}</h3>
                      <p className="text-sm text-muted-foreground">{topic.posts} posts</p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </div>

        <div>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="music">Music</TabsTrigger>
              <TabsTrigger value="gaming">Gaming</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {shorts.map((short: Short) => (
                  <Card key={short.id} className="glassmorphism overflow-hidden group">
                    <div className="relative aspect-[9/16]">
                      <Image src={short.image} alt="Short" fill className="object-cover transition-transform group-hover:scale-105" data-ai-hint="portrait video" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-2 left-2 flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={short.user.avatar} />
                          <AvatarFallback>{short.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-white text-xs font-semibold">{short.user.handle}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );
}
