import Image from 'next/image';
import { AppShell } from '@/components/app-shell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard, type Post } from '@/components/post-card';
import { CreatePost } from '@/components/create-post';

const userPosts: Post[] = [
  {
    id: 4,
    author: { name: 'Jane Doe', avatarUrl: 'https://picsum.photos/id/237/40/40' },
    time: '3d ago',
    content: "Throwback to my trip to the mountains. Can't wait to go back! #hiking #nature",
    imageUrl: 'https://picsum.photos/seed/post4/600/400',
    likes: 150,
    comments: 19,
  },
  {
    id: 5,
    author: { name: 'Jane Doe', avatarUrl: 'https://picsum.photos/id/237/40/40' },
    time: '5d ago',
    content: 'Tried a new recipe today and it was delicious! 🍝 #homecooking #foodie',
    likes: 201,
    comments: 32,
  },
];

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <Card className="overflow-hidden">
          <div className="relative h-48 w-full bg-muted">
            <Image
              src="https://picsum.photos/1200/300"
              alt="Cover photo"
              fill
              className="object-cover"
              data-ai-hint="abstract landscape"
            />
          </div>
          <CardContent className="relative p-6">
            <div className="absolute -top-16 left-6">
              <Avatar className="h-32 w-32 border-4 border-card">
                <AvatarImage
                  src="https://picsum.photos/id/237/128/128"
                  alt="User avatar"
                  width={128}
                  height={128}
                  data-ai-hint="user avatar"
                />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </div>
            <div className="pt-20">
              <h2 className="text-2xl font-bold">Jane Doe</h2>
              <p className="text-muted-foreground">
                "Living my best life, one post at a time. 🚀"
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button>Add Friend</Button>
              <Button variant="secondary">Message</Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="friends">Friends</TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="mt-6 space-y-6">
              <CreatePost />
              {userPosts.map((post) => (
                <PostCard key={post.id} {...post} />
              ))}
            </TabsContent>
            <TabsContent value="photos">
              <Card>
                <CardContent className="p-8">
                  <p className="text-center text-muted-foreground">
                    Photos will be displayed here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="friends">
              <Card>
                <CardContent className="p-8">
                  <p className="text-center text-muted-foreground">
                    Friends list will be displayed here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
