import Image from 'next/image';
import { Heart, MessageCircle, MoreHorizontal, Share2 } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';

export type Post = {
  id: number;
  author: {
    name: string;
    avatarUrl: string;
  };
  time: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
};

export function PostCard(post: Post) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar>
          <AvatarImage
            src={post.author.avatarUrl}
            alt={post.author.name}
            width={40}
            height={40}
            data-ai-hint="person face"
          />
          <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{post.author.name}</p>
          <p className="text-sm text-muted-foreground">{post.time}</p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-2">
        <p>{post.content}</p>
        {post.imageUrl && (
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg border">
            <Image
              src={post.imageUrl}
              alt="Post image"
              fill
              className="object-cover"
              data-ai-hint="social media post"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between p-2 pt-0">
        <div className="flex">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            <span>{post.likes}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments}</span>
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
