import { db } from './firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';

export type User = {
  id: string;
  name: string;
  avatar: string;
  handle: string;
};

export type Flash = {
  id: string;
  userId: string;
  user: User;
  image: string;
};

export type Post = {
  id: string;
  userId: string;
  user: User;
  content: string;
  image?: string;
  video?: string;
  stats: {
    boosts: number;
    drops: number;
    relays: number;
    comments: number;
  };
  timestamp: string;
  isModerated: boolean;
};

export type MessageThread = {
    id: string;
    userId: string;
    user: User;
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
}

export type TrendingTopic = {
    id: string;
    title: string;
    posts: string;
}

export type Short = {
    id: string;
    image: string;
    userId: string;
    user: User;
    views: string;
}

// Fetch a single user by ID
export async function getUser(userId: string): Promise<User | null> {
    if (!userId) {
        console.warn("getUser called with no userId");
        return null;
    }
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return { id: userSnap.id, ...userSnap.data() } as User;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
}

// Fetch all posts and enrich with user data
export async function getPosts(): Promise<Post[]> {
  try {
    const postsCol = collection(db, 'posts');
    const postSnapshot = await getDocs(postsCol);
    const postsList = postSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    
    // Enrich posts with user data
    const enrichedPosts = await Promise.all(postsList.map(async (post) => {
        if (!post.userId) return post;
        const user = await getUser(post.userId);
        return { ...post, user: user! };
    }));

    return enrichedPosts;
  } catch (error) {
      console.error("Error fetching posts:", error);
      return [];
  }
}

// Fetch posts by a specific user
export async function getPostsByUser(userId: string): Promise<Post[]> {
    if (!userId) return [];
    try {
        const q = query(collection(db, "posts"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const postsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        
        const user = await getUser(userId);
        const enrichedPosts = postsList.map(post => ({ ...post, user: user! }));

        return enrichedPosts;
    } catch (error) {
        console.error("Error fetching user posts:", error);
        return [];
    }
}

// Fetch all flashes
export async function getFlashes(): Promise<Flash[]> {
    try {
        const flashesCol = collection(db, 'flashes');
        const flashSnapshot = await getDocs(flashesCol);
        const flashList = flashSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flash & { userId?: string }));

        const enrichedFlashes = await Promise.all(flashList.map(async (flash) => {
            if (!flash.userId) return flash;
            const user = await getUser(flash.userId);
            return { ...flash, user: user! };
        }));

        return enrichedFlashes as Flash[];
    } catch (error) {
        console.error("Error fetching flashes:", error);
        return [];
    }
}

// Fetch all message threads
export async function getMessageThreads(): Promise<MessageThread[]> {
    try {
        const threadsCol = collection(db, 'messageThreads');
        const threadSnapshot = await getDocs(threadsCol);
        const threadList = threadSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MessageThread));

        const enrichedThreads = await Promise.all(threadList.map(async (thread) => {
            if (!thread.userId) return thread;
            const user = await getUser(thread.userId);
            return { ...thread, user: user! };
        }));
        
        return enrichedThreads;
    } catch (error) {
        console.error("Error fetching message threads:", error);
        return [];
    }
}

// Fetch trending topics
export async function getTrendingTopics(): Promise<TrendingTopic[]> {
    try {
        const topicsCol = collection(db, 'trendingTopics');
        const topicSnapshot = await getDocs(topicsCol);
        return topicSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrendingTopic));
    } catch (error) {
        console.error("Error fetching trending topics:", error);
        return [];
    }
}

// Fetch shorts
export async function getShorts(): Promise<Short[]> {
    try {
        const shortsCol = collection(db, 'shorts');
        const shortSnapshot = await getDocs(shortsCol);
        const shortList = shortSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Short & { userId?: string }));

        const enrichedShorts = await Promise.all(shortList.map(async (short) => {
            if (!short.userId) return short;
            const user = await getUser(short.userId);
            return { ...short, user: user! };
        }));
        
        return enrichedShorts as Short[];
    } catch (error) {
        console.error("Error fetching shorts:", error);
        return [];
    }
}
