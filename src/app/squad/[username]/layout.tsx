import type { Metadata } from 'next';
import { getFirestore, collection, query, where, getDocs, limit } from "firebase/firestore";
import { app } from "@/utils/firebaseClient";

const db = getFirestore(app);

type Props = {
  params: { username: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = params.username;
  const siteUrl = 'https://flixtrend.in';

  if (!username || typeof username !== 'string') {
    return {
        title: 'FlixTrend',
        description: 'The clean side of the internet. Discover posts, vibes, and connections.',
    };
  }

  const usersCollection = collection(db, 'users');
  const q = query(usersCollection, where('username', '==', username), limit(1));
  
  try {
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        title: 'User Not Found',
        description: 'This user does not exist on FlixTrend.',
      };
    }

    const profile = querySnapshot.docs[0].data();

    const pageTitle = `${profile.name} (@${profile.username}) | FlixTrend`;
    const pageDescription = profile.bio || `Check out the profile of ${profile.name} on FlixTrend. Discover their posts, vibes, and connections in the clean side of the internet.`;

    return {
      title: pageTitle,
      description: pageDescription,
      openGraph: {
        title: pageTitle,
        description: pageDescription,
        url: `${siteUrl}/squad/${username}`,
        siteName: 'FlixTrend',
        images: [
          {
            url: profile.avatar_url || `${siteUrl}/default-avatar.png`,
            width: 800,
            height: 800,
            alt: `${profile.name}'s profile picture`,
          },
        ],
        locale: 'en_IN',
        type: 'profile',
        profile: {
            username: profile.username,
        }
      },
      twitter: {
        card: 'summary_large_image',
        title: pageTitle,
        description: pageDescription,
        creator: '@FlxTrnd',
        images: [profile.avatar_url || `${siteUrl}/default-avatar.png`],
      },
    };

  } catch (error) {
    // --- FIX: Make the error log useful --- 
    console.error("Error fetching user metadata:", {error});
    return {
      title: 'Server Error',
      description: 'Could not fetch user profile at this time.',
    };
  }
}

export default function ProfileLayout({ children }: Props) {
  return children;
}
