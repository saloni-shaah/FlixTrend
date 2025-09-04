import { AppShell } from '@/components/app-shell';
import { CreatePost } from '@/components/create-post';
import { PostCard, type Post } from '@/components/post-card';

const posts: Post[] = [
  {
    id: 1,
    author: {
      name: 'Alice',
      avatarUrl: 'https://picsum.photos/id/1027/40/40',
    },
    time: '2h ago',
    content: 'Just enjoying a beautiful day at the beach! ☀️🌊 #summer #beachlife',
    imageUrl: 'https://picsum.photos/seed/post1/600/400',
    likes: 128,
    comments: 12,
  },
  {
    id: 2,
    author: {
      name: 'Bob',
      avatarUrl: 'https://picsum.photos/id/1005/40/40',
    },
    time: '5h ago',
    content:
      'My new setup is finally complete! What do you guys think? #gamingsetup #pcgaming',
    imageUrl: 'https://picsum.photos/seed/post2/600/400',
    likes: 256,
    comments: 45,
  },
  {
    id: 3,
    author: {
      name: 'Charlie',
      avatarUrl: 'https://picsum.photos/id/1011/40/40',
    },
    time: '1d ago',
    content:
      'Exploring the city and found this hidden gem. The coffee here is amazing!',
    likes: 98,
    comments: 8,
  },
];

export default function Home() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <CreatePost />
        {posts.map((post) => (
          <PostCard key={post.id} {...post} />
        ))}
      </div>
    </AppShell>
  );
}
