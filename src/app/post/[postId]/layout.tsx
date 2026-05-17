import { getPostById } from "@/lib/getPostById";
import { getUserByUsername } from "@/lib/getUserByUsername";
import { Metadata } from "next";

// Helper to truncate text
const truncate = (text: string, length: number) => {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

export async function generateMetadata(
  { params }: { params: Promise<{ postId: string }> }
): Promise<Metadata> {
  const siteUrl = 'https://flixtrend.in';
  const { postId } = await params;

  if (!postId) {
    return {
      title: "Post Not Found | FlixTrend",
      robots: { index: false, follow: false },
    };
  }

  try {
    const post = await getPostById(postId);

    if (!post) {
      return {
        title: "Post Not Found | FlixTrend",
        robots: { index: false, follow: false },
      };
    }

    const author = await getUserByUsername(post.username as string);
    const authorName = author?.name || post.username;
    
    let postTitle = "FlixTrend Post";
    let postDescription = "Join the conversation on FlixTrend.";

    switch (post.type) {
      case 'text':
        if (post.content) {
          postTitle = `${truncate(post.content, 50)} by ${authorName}`;
          postDescription = truncate(post.content, 160);
        } else {
          postTitle = `A Text Vibe by ${authorName}`;
          postDescription = `Check out this vibe by ${authorName} on FlixTrend.`
        }
        break;

      case 'media':
        const mediaType = post.isVideo ? "Video" : "Image";
        if (post.content) { // The caption
          postTitle = `${truncate(post.content, 40)} - ${mediaType} by ${authorName}`;
          postDescription = truncate(post.content, 160);
        } else {
          postTitle = `A ${mediaType} by ${authorName}`;
        }
        if (post.isVideo && post.description) {
          postDescription = truncate(post.description, 160);
        }
        break;

      case 'poll':
        if (post.question) {
          postTitle = `Poll by ${authorName}: ${truncate(post.question, 40)}`;
          const options = post.options.map((o: any) => o.text).join(', ');
          postDescription = `Poll: ${post.question} Options: ${truncate(options, 100)}`;
        } else {
          postTitle = `A Poll by ${authorName}`;
        }
        break;

      case 'live':
        if (post.content) {
          postTitle = `Live Stream: ${truncate(post.content, 40)} by ${authorName}`;
          postDescription = `Join the live stream by ${authorName} on FlixTrend!`;
        } else {
            postTitle = `Live Stream by ${authorName}`;
        }
        break;

      default:
        if (post.content) {
           postTitle = `${truncate(post.content, 50)} | FlixTrend`;
           postDescription = truncate(post.content, 160);
        }
        break;
    }

    const imageUrl = post.thumbnailUrl || post.mediaUrl || author?.avatar_url || `${siteUrl}/default-avatar.png`;

    return {
      metadataBase: new URL(siteUrl),
      title: postTitle,
      description: postDescription,
      alternates: { canonical: `${siteUrl}/post/${postId}` },
      openGraph: {
        title: postTitle,
        description: postDescription,
        url: `${siteUrl}/post/${postId}`,
        images: [{ url: imageUrl, width: 800, height: 600 }],
        type: "article",
      },
      robots: { index: true, follow: true },
    };
  } catch (error) {
    console.error("Metadata error:", error);
    return {
      title: "FlixTrend",
      robots: { index: false, follow: false },
    };
  }
}

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
