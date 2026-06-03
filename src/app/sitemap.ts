import { MetadataRoute } from 'next';
import { getFirestore } from '@/utils/firebaseAdmin';
import { helpCategories } from '@/data/help';

const URL = 'https://flixtrend.in';
const lastModified = new Date();
const daily = 'daily' as const;
const weekly = 'weekly' as const;
const monthly = 'monthly' as const;

type SitemapEntry = {
  id: string;
  username?: string;
  accountType?: string;
  updatedAt?: { toMillis: () => number };
  createdAt: { toMillis: () => number };
};

async function fetchCollection(collectionName: string): Promise<SitemapEntry[]> {
  const db = getFirestore();
  const collectionRef = db.collection(collectionName);
  const snapshot = collectionName === 'users'
    ? await collectionRef.where('accountType', '==', 'creator').get()
    : await collectionRef.get();
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
      '/', '/about', '/contact', '/faq', '/help', '/privacy', '/terms', '/premium',
      '/store', '/flix', '/vibespace', '/squad/explore', '/drop'
    ];

    const categoryPages = [
      '/flix?category=music', '/flix?category=gaming', '/flix?category=news',
      '/flix?category=sports', '/flix?category=learning'
    ];

    const staticEntries = staticPages.map(path => ({
      url: `${URL}${path}`,
      lastModified,
      changeFrequency: path === '/' ? daily : monthly,
      priority: path === '/' ? 1.0 : 0.7,
    }));

    const categoryEntries = categoryPages.map(path => ({
      url: `${URL}${path}`,
      lastModified,
      changeFrequency: weekly,
      priority: 0.8,
    }));

    const helpEntries = helpCategories.flatMap(category => {
      const categoryEntry = {
        url: `${URL}/help/${category.slug}`,
        lastModified,
        changeFrequency: monthly,
        priority: 0.7,
        alternates: {
          languages: {
            en: `${URL}/help/${category.slug}`,
          },
        },
      };

      const articleEntries = category.articles.map(article => ({
        url: `${URL}/help/${category.slug}/${article.slug}`,
        lastModified,
        changeFrequency: monthly,
        priority: 0.6,
        alternates: {
          languages: {
            en: `${URL}/help/${category.slug}/${article.slug}`,
          },
        },
      }));

      return [categoryEntry, ...articleEntries];
    });

    const createEntries = (
      items: SitemapEntry[],
      pathPrefix: string,
      priority: number,
      shouldInclude: (item: SitemapEntry) => boolean
    ) => {
      return items
        .filter(shouldInclude)
        .map(item => {
          const slug = pathPrefix.includes('post') ? item.id : item.username!.toLowerCase();
          const url = `${URL}${pathPrefix}${slug}`;
          const lastModified = item.updatedAt?.toMillis() ?? item.createdAt?.toMillis();
          return {
            url,
            lastModified: lastModified ? new Date(lastModified) : new Date(),
            changeFrequency: weekly,
            priority,
          };
        });
    };
    
    const userEntries = createEntries(
      users,
      '/squad/',
      0.8,
      item => Boolean(item.username && item.accountType === 'creator')
    );
    const postEntries = createEntries(
      posts,
      '/post/',
      0.9,
      () => true
    );

    return [
      ...staticEntries,
      ...categoryEntries,
      ...helpEntries,
      ...userEntries,
      ...postEntries,
    ];
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
    return [];
  }
}
