import { getPostById } from "@/lib/getPostById";
import { notFound } from "next/navigation";
import PostClient from './PostClient';

async function getPageData(postId: string) {
  if (!postId || typeof postId !== 'string') {
    notFound();
  }

  const post = await getPostById(postId);
  if (!post) {
    notFound();
  }
  
  return { post };
}

export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
    const { postId } = await params;
    const { post } = await getPageData(postId);

  return <PostClient post={post} postId={postId} />;
}
