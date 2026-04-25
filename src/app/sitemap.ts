import { MetadataRoute } from 'next';

const URL = 'https://flixtrend.in';
const BUILD_DATE = new Date();

// This function is where you will connect to your database
async function fetchData() {
  // In a real app, you would fetch this data from your database.
  // This is a placeholder.
  const users: any[] = []; 
  const posts: any[] = [];
  const videos: any[] = [];
  const drops: any[] = [];
  const songs: any[] = [];

  return { users, posts, videos, drops, songs };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  const { users, posts, videos, drops, songs } = await fetchData();

  const staticPages = [
    '/',
    '/about',
    '/contact',
    '/faq',
    '/privacy',
    '/terms',
    '/premium',
    '/store',
    '/flix',
    '/vibespace',
    '/squad/explore',
    '/drop'
  ];

  const categoryPages = [
    '/flix?category=music',
    '/flix?category=gaming',
    '/flix?category=news',
    '/flix?category=sports',
    '/flix?category=learning'
  ];

  const staticEntries = staticPages.map(path => ({
    url: `${URL}${path}`,
    lastModified: BUILD_DATE,
    changeFrequency: path === '/' ? 'daily' : 'monthly',
    priority: path === '/' ? 1.0 : 0.7,
  }));

  const categoryEntries = categoryPages.map(path => ({
    url: `${URL}${path}`,
    lastModified: BUILD_DATE,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const userEntries = users.map((user: any) => ({
    url: `${URL}/squad/${user.username}`,
    lastModified: new Date(user.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const postEntries = posts.map((post: any) => ({
    url: `${URL}/post/${post.id}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  const videoEntries = videos.map((video: any) => ({
    url: `${URL}/flow/${video.id}`,
    lastModified: new Date(video.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  const dropEntries = drops.map((drop: any) => ({
    url: `${URL}/drop/${drop.id}`,
    lastModified: new Date(drop.updatedAt),
    changeFrequency: 'daily', // Trends can be daily
    priority: 0.85,
  }));

  const songEntries = songs.map((song: any) => ({
    url: `${URL}/music/${song.id}`,
    lastModified: new Date(song.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    ...staticEntries,
    ...categoryEntries,
    ...userEntries,
    ...postEntries,
    ...videoEntries,
    ...dropEntries,
    ...songEntries,
  ];
}
