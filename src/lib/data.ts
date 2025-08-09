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

export const users: User[] = [
  { id: 'u1', name: 'CyberNova', avatar: 'https://placehold.co/100x100/a259ff/fcfcfc', handle: 'cybernova' },
  { id: 'u2', name: 'SynthRider', avatar: 'https://placehold.co/100x100/00f7ff/0c0f1a', handle: 'synthrider' },
  { id: 'u3', name: 'GlitchWave', avatar: 'https://placehold.co/100x100/1df2e1/0c0f1a', handle: 'glitchwave' },
  { id: 'u4', name: 'EchoDrift', avatar: 'https://placehold.co/100x100/ff8c42/fcfcfc', handle: 'echodrift' },
];

export const flashes: Flash[] = users.map((user, i) => ({
  id: `f${i + 1}`,
  user,
  image: `https://placehold.co/400x700/0c0f1a/fcfcfc?text=Flash+${i+1}`,
}));

export const posts: Post[] = [
  {
    id: 'p1',
    user: users[0],
    content: "Just dropped a new track on my channel! It's a journey through neon-drenched cityscapes. Go give it a listen and let me know your vibe! 🌃🎶 #synthwave #newmusic",
    image: 'https://placehold.co/600x400/a259ff/0c0f1a',
    stats: { boosts: 1200, drops: 50, relays: 300, comments: 150 },
    timestamp: '2h ago',
    isModerated: true,
  },
  {
    id: 'p2',
    user: users[1],
    content: "Exploring the outer reaches of the digital frontier. The visuals out here are breathtaking. Can't wait to share more from this adventure. #digitalart #vfx",
    video: 'https://placehold.co/600x400/00f7ff/0c0f1a?text=Video',
    stats: { boosts: 2500, drops: 22, relays: 800, comments: 400 },
    timestamp: '5h ago',
    isModerated: false,
  },
  {
    id: 'p3',
    user: users[2],
    content: "Who's up for a live coding session later tonight? We'll be building a mini AI tool with the Almighty AI Panel. Bring your questions! 💻🤖 #livecoding #ai",
    stats: { boosts: 850, drops: 10, relays: 120, comments: 200 },
    timestamp: '1d ago',
    isModerated: true,
  },
    {
    id: 'p4',
    user: users[3],
    content: "Just discovered this hidden gem of a cafe downtown. The aesthetic is pure retro-futurism. 10/10 would recommend. ☕️✨",
    image: 'https://placehold.co/600x400/ff8c42/0c0f1a',
    stats: { boosts: 980, drops: 5, relays: 90, comments: 75 },
    timestamp: '2d ago',
    isModerated: true,
  },
];

export type MessageThread = {
    id: string;
    user: User;
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
}

export const messageThreads: MessageThread[] = [
    {
        id: "msg1",
        user: users[1],
        lastMessage: "Yeah, I'm down for the session tonight!",
        timestamp: "5m",
        unreadCount: 2,
    },
    {
        id: "msg2",
        user: users[2],
        lastMessage: "Did you see that new Flash from CyberNova?",
        timestamp: "1h",
        unreadCount: 0,
    },
    {
        id: "msg3",
        user: users[3],
        lastMessage: "Let's link up this weekend.",
        timestamp: "3h",
        unreadCount: 0,
    }
]

export const trendingTopics = [
  { id: 't1', title: '#FutureFunk', posts: '12k' },
  { id: 't2', title: 'AI Art Gallery', posts: '8.5k' },
  { id: 't3', title: '#GamerLife', posts: '22k' },
  { id: 't4', title: 'VR Experiences', posts: '5k' },
];

export const shorts = Array.from({ length: 12 }, (_, i) => ({
  id: `s${i + 1}`,
  image: `https://placehold.co/300x500/${['a259ff', '00f7ff', '1df2e1', 'ff8c42'][i%4]}/0c0f1a`,
  user: users[i % 4],
  views: `${(Math.random() * 100).toFixed(1)}k`,
}));
