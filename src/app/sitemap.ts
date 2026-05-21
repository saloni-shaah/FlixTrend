import { MetadataRoute } from 'next';
import { getFirestore } from '@/utils/firebaseAdmin';

const URL = 'https://flixtrend.in';

type SitemapEntry = {
  id: string;
  username?: string;
  updatedAt?: { toMillis: () => number };
  createdAt: { toMillis: () => number };
};

async function fetchCollection(collectionName: string): Promise<SitemapEntry[]> {
  const db = getFirestore();
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SitemapEntry));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [users, posts] = await Promise.all([
      fetchCollection('users'),
      fetchCollection('posts'),
    ]);

    const staticPages = [
      '/', '/about', '/contact', '/faq', '/privacy', '/terms', '/premium',
      '/store', '/flix', '/vibespace', '/squad/explore', '/drop'
    ];

    const categoryPages = [
      '/flix?category=music', '/flix?category=gaming', '/flix?category=news',
      '/flix?category=sports', '/flix?category=learning'
    ];

    const staticEntries = staticPages.map(path => ({
      url: `${URL}${path}`,
      lastModified: new Date(),
      changeFrequency: path === '/' ? 'daily' : 'monthly',
      priority: path === '/' ? 1.0 : 0.7,
    }));

    const categoryEntries = categoryPages.map(path => ({
      url: `${URL}${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const createEntries = (items: SitemapEntry[], pathPrefix: string, priority: number) => {
      const isPost = pathPrefix.includes('post');
      return items
        .filter(item => isPost || item.username)
        .map(item => {
          const slug = isPost 
            ? item.id 
            : item.username!.toLowerCase();
          const url = `${URL}${pathPrefix}${slug}`;
          const lastModified = item.updatedAt?.toMillis() ?? item.createdAt?.toMillis();
          return {
            url,
            lastModified: lastModified ? new Date(lastModified) : new Date(),
            changeFrequency: 'weekly',
            priority,
          };
        });
    };
    
    const userEntries = createEntries(users, '/squad/', 0.8);
    const postEntries = createEntries(posts, '/post/', 0.9);

    return [
      ...staticEntries,
      ...categoryEntries,
      ...userEntries,
      ...postEntries,
    ];
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
    return [];
  }
}
