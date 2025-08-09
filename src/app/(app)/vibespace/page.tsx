import { Flashes } from "@/components/flixtrend/flashes";
import { PostCard } from "@/components/flixtrend/post-card";
import { getPosts, getFlashes, type Post } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PenSquare } from "lucide-react";
import Link from "next/link";

export default async function VibeSpacePage() {
  const posts = await getPosts();
  const flashes = await getFlashes();

  return (
    <div className="container max-w-2xl mx-auto relative">
       <Button asChild className="fixed top-20 right-8 z-10 animated-glow">
          <Link href="/create-post">
            <PenSquare className="h-5 w-5 mr-2" />
            Create
          </Link>
        </Button>
      <Flashes flashes={flashes}/>
      <Separator className="bg-border/20"/>
      <div className="py-4 space-y-4">
        {posts.map((post: Post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
