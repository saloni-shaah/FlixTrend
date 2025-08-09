export type User = {
  id: string;
  name: string;
  avatar: string;
  handle: string;
};

export type Flash = {
  id: string;
  user: User;
  image: string;
};

export type Post = {
  id: string;
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

// This will be replaced with Firebase data
export const users: User[] = [
    { id: 'user-1', name: 'AI Enthusiast', avatar: 'https://placehold.co/100x100.png', handle: 'ai_explorer' },
    { id: 'user-2', name: 'Synthwave Queen', avatar: 'https://placehold.co/100x100.png', handle: 'synthwave_q' },
];
export const flashes: Flash[] = users.map((u, i) => ({ id: `flash-${i+1}`, user: u, image: `https://placehold.co/300x500.png`}));
export const posts: Post[] = [
    {
        id: 'post-1',
        user: users[0],
        content: 'Just generated this amazing piece of art with the Almighty AI. The future is now! 🚀 #AIart #Flixtrend',
        image: 'https://placehold.co/600x400.png',
        stats: { boosts: 120, drops: 5, relays: 30, comments: 15 },
        timestamp: '2h ago',
        isModerated: true,
    },
    {
        id: 'post-2',
        user: users[1],
        content: 'Chasing neon sunsets and listening to my favorite synthwave tracks. What a vibe. 🎶',
        image: 'https://placehold.co/600x400.png',
        stats: { boosts: 250, drops: 2, relays: 80, comments: 42 },
        timestamp: '5h ago',
        isModerated: true,
    }
];


export type MessageThread = {
    id: string;
    user: User;
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
}

// This will be replaced with Firebase data
export const messageThreads: MessageThread[] = [
    {
        id: 'thread-1',
        user: users[0],
        lastMessage: 'Hey, did you see the latest AI update?',
        timestamp: '15m ago',
        unreadCount: 2,
    },
    {
        id: 'thread-2',
        user: users[1],
        lastMessage: 'Let\'s collab on a new track!',
        timestamp: '1h ago',
        unreadCount: 0,
    }
]

export const trendingTopics: {id: string, title: string, posts: string}[] = [
    { id: 'topic-1', title: '#AIrevolution', posts: '1.2k' },
    { id: 'topic-2', title: '#FutureFunk', posts: '980' },
    { id: 'topic-3', title: '#VFXMagic', posts: '750' },
    { id: 'topic-4', title: '#GenZDevs', posts: '500' },
];

export const shorts: {id: string, image: string, user: User, views: string}[] = users.map((u,i) => ({
    id: `short-${i+1}`,
    image: 'https://placehold.co/400x600.png',
    user: u,
    views: `${(Math.random() * 10).toFixed(1)}k`
}))
