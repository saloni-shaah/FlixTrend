import { getUserByUsername } from "@/lib/getUserByUsername";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import UserProfileClient from "./UserProfileClient";
import { getFirestore } from "@/utils/firebaseAdmin";

const POSTS_PER_PAGE = 10;
const SITE_URL = "https://flixtrend.in";

const getProfileImages = (profile: { avatar_url?: string; banner_url?: string }) => {
  const images = [];

  if (profile.banner_url) {
    images.push({
      url: profile.banner_url,
      width: 1200,
      height: 630,
      alt: "Profile banner",
    });
  }

  images.push({
    url: profile.avatar_url || `${SITE_URL}/default-avatar.png`,
    width: 800,
    height: 800,
    alt: "Profile avatar",
  });

  return images;
};

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username: rawUsername } = await params;

  if (!rawUsername) {
    return {
      title: "FlixTrend",
      robots: { index: false, follow: false },
    };
  }

  const username = rawUsername.toLowerCase();

  try {
    const profile = await getUserByUsername(username);

    if (!profile) {
      return {
        title: "User Not Found | FlixTrend",
        robots: { index: false, follow: false },
      };
    }

    const name = profile.name || profile.username;
    const title = `${name} (@${profile.username}) | FlixTrend`;
    const socialTitle = `${name} (@${profile.username})`;
    const description = profile.bio || `Explore ${name} on FlixTrend.`;
    const images = getProfileImages(profile);
    const profileUrl = `${SITE_URL}/squad/${username}`;
    const robots = profile.accountType === "creator"
      ? { index: true, follow: true }
      : { index: false, follow: false };

    return {
      metadataBase: new URL(SITE_URL),
      title,
      description,
      alternates: {
        canonical: profileUrl,
      },
      openGraph: {
        title: socialTitle,
        description,
        url: profileUrl,
        images,
      },
      twitter: {
        card: "summary_large_image",
        title: socialTitle,
        description,
        images: images.map(image => image.url),
      },
      robots,
    };
  } catch (error) {
    console.error("Metadata error:", error);

    return {
      title: "FlixTrend",
      robots: { index: false, follow: false },
    };
  }
}

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
