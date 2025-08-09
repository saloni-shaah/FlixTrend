import type { Post } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle, BadgeCheck, MessageCircle, MoreHorizontal, Repeat2 } from "lucide-react";
import Image from 'next/image';

type PostCardProps = {
  post: Post;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <Card className="glassmorphism overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={post.user.avatar} alt={post.user.name} />
          <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="grid gap-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{post.user.name}</p>
            {post.isModerated && <BadgeCheck className="h-5 w-5 text-primary" />}
          </div>
          <p className="text-sm text-muted-foreground">@{post.user.handle} · {post.timestamp}</p>
        </div>
        <Button variant="ghost" size="icon" className="ml-auto">
          <MoreHorizontal />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        <p className="text-base">{post.content}</p>
        {post.image && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <Image src={post.image} alt="Post image" fill className="object-cover" data-ai-hint="social media lifestyle" />
          </div>
        )}
        {post.video && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black flex items-center justify-center">
            <p className="text-white">Video Placeholder</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="px-4 pb-4">
        <div className="flex justify-between w-full text-muted-foreground">
          <Button variant="ghost" className="flex items-center gap-2 hover:text-green-400">
            <ArrowUpCircle />
            <span>{post.stats.boosts}</span>
          </Button>
          <Button variant="ghost" className="flex items-center gap-2 hover:text-red-400">
            <ArrowDownCircle />
            <span>{post.stats.drops}</span>
          </Button>
           <Button variant="ghost" className="flex items-center gap-2 hover:text-primary">
            <Repeat2 />
            <span>{post.stats.relays}</span>
          </Button>
          <Button variant="ghost" className="flex items-center gap-2 hover:text-white">
            <MessageCircle />
            <span>{post.stats.comments}</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
