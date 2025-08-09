import { Flashes } from "@/components/flixtrend/flashes";
import { PostCard } from "@/components/flixtrend/post-card";
import { posts } from "@/lib/data";
import { Separator } from "@/components/ui/separator";

export default function VibeSpacePage() {
  return (
    <div className="container max-w-2xl mx-auto">
      <Flashes />
      <Separator className="bg-border/20"/>
      <div className="py-4 space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
