'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, Video } from 'lucide-react';

export function CreatePost() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarImage
              src="https://picsum.photos/id/237/40/40"
              alt="User Avatar"
              width={40}
              height={40}
              data-ai-hint="user avatar"
            />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="What's on your mind?"
              className="mb-2 min-h-[60px] border-none bg-secondary focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Photo
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="mr-2 h-4 w-4" />
                  Video
                </Button>
              </div>
              <Button>Post</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
