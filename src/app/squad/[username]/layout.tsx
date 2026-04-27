import type { Metadata } from 'next';
import { getUserByUsername } from '@/lib/getUserByUsername';

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {

  const siteUrl = 'https://flixtrend.in';

  const { username: rawUsername } = await params;

  if (!rawUsername) {
    return {
      title: 'FlixTrend',
      robots: { index: false, follow: false },
    };
  }

  const username = rawUsername.toLowerCase();

  try {
    const profile = await getUserByUsername(username);

    if (!profile) {
      return {
        title: 'User Not Found | FlixTrend',
        robots: { index: false, follow: false },
      };
    }

    const name = profile.name || profile.username;

    return {
      metadataBase: new URL(siteUrl),

      title: `${name} (@${profile.username}) | FlixTrend`,
      description:
        profile.bio ||
        `Explore ${name} on FlixTrend.`,

      alternates: {
        canonical: `${siteUrl}/squad/${username}`,
      },

      openGraph: {
        title: `${name} (@${profile.username})`,
        url: `${siteUrl}/squad/${username}`,
        images: [
          {
            url: profile.avatar_url || `${siteUrl}/default-avatar.png`,
            width: 800,
            height: 800,
          },
        ],
      },

      robots: { index: true, follow: true },
    };

  } catch (error) {
    console.error('Metadata error:', error);

    return {
      title: 'FlixTrend',
      robots: { index: false, follow: false },
    };
  }
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}