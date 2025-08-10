import Image from "next/image";
import { getUser, getPostsByUser, type User, type Post } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/flixtrend/post-card";

// Mock current user ID. In a real app, this would come from the auth state.
const CURRENT_USER_ID = 'user-1';

export default async function SquadPage() {
  const user = await getUser(CURRENT_USER_ID);
  const userPosts = await getPostsByUser(CURRENT_USER_ID);

  if (!user) {
    return (
        <div className="text-center py-10">User not found.</div>
    );
  }

  return (
      <div className="flex flex-col">
        <div className="relative h-48 w-full">
          <Image
            src="https://placehold.co/1200x400/0c0f1a/1df2e1"
            alt="Profile banner"
            fill
            className="object-cover"
            data-ai-hint="abstract tech"
          />
        </div>
        <div className="container mx-auto px-4 pb-4 -mt-16">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute -inset-1 rounded-full animated-glow" />
          </div>
          
          <div className="flex justify-end -mt-12">
              <Button>Edit Profile</Button>
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-bold font-headline">{user.name}</h1>
            <p className="text-muted-foreground">@{user.handle}</p>
          </div>

          <div className="mt-4 flex gap-4 text-sm">
            <p><span className="font-bold text-foreground">1.2k</span> <span className="text-muted-foreground">Following</span></p>
            <p><span className="font-bold text-foreground">5.8k</span> <span className="text-muted-foreground">Followers</span></p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
              {['Synthwave', 'AI Enthusiast', 'VFX Artist', 'Music Producer'].map(tag => (
                  <div key={tag} className="px-3 py-1 text-sm rounded-full glassmorphism text-primary border-primary/50">{tag}</div>
              ))}
          </div>

          <Tabs defaultValue="posts" className="w-full mt-6">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="boosts">Boosts</TabsTrigger>
              <TabsTrigger value="drops">Drops</TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="mt-4 space-y-4">
              {userPosts.map((post: Post) => (
                  <PostCard key={post.id} post={post} />
              ))}
              {userPosts.length === 0 && <p className="text-center text-muted-foreground py-8">No posts yet.</p>}
            </TabsContent>
            <TabsContent value="boosts" className="mt-4">
              <p className="text-center text-muted-foreground py-8">Boosted content will appear here.</p>
            </TabsContent>
            <TabsContent value="drops" className="mt-4">
              <p className="text-center text-muted-foreground py-8">Dropped content will appear here.</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );
}
