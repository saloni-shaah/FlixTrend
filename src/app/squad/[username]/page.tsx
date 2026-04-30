import { getUserByUsername } from "@/lib/getUserByUsername";
import { notFound } from "next/navigation";
import UserProfileClient from "./UserProfileClient";
import { getFirestore } from "@/utils/firebaseAdmin";

const POSTS_PER_PAGE = 10;

async function getInitialPosts(uid: string) {
  const db = getFirestore();
  const postsQuery = db
    .collection("posts")
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(POSTS_PER_PAGE);

  const snapshot = await postsQuery.get();
  const posts = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || null,
        updatedAt: data.updatedAt?.toMillis() || null,
        publishAt: data.publishAt?.toMillis() || null,
    };
  });
  const hasMorePosts = posts.length === POSTS_PER_PAGE;

  return { posts, hasMorePosts };
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  if (!username) {
    notFound();
  }

  const profile = await getUserByUsername(username);

  if (!profile) {
    notFound();
  }

  const { posts, hasMorePosts } = await getInitialPosts(profile.uid);

  return (
    <UserProfileClient 
      initialProfile={profile} 
      initialPosts={posts} 
      hasMore={hasMorePosts} 
    />
  );
}
