import { MetadataRoute } from 'next';
import { getFirestore } from '@/utils/firebaseAdmin';
import { helpCategories } from '@/data/help';
import { getStaticSeoPaths, siteUrl } from '@/lib/seoUrls';

export const revalidate = 86400;

const daily   = 'daily'   as const;
const weekly  = 'weekly'  as const;
const monthly = 'monthly' as const;
const yearly  = 'yearly'  as const;

const HELP_LAST_UPDATED = new Date('2026-05-01');

const HIGH_PRIORITY_PATHS = ['/', '/about', '/faq', '/help'];

// TODO: When posts approach ~45k, switch to paginated sitemap index.
// Next.js supports generateSitemaps() → /sitemap/0.xml, /sitemap/1.xml etc.
// Google hard limit is 50k URLs / 50MB — keep a 10% safety margin.

// NOTE: If you later add .orderBy('createdAt') to the posts query,
// you'll need a composite Firestore index on (visibility, createdAt).

type SitemapEntry = {
  id: string;
  username?: string;
  accountType?: string;
  updatedAt?: { toMillis: () => number };
  createdAt?: { toMillis: () => number };
  visibility?: string;
  isDeleted?: boolean;
  isDraft?: boolean;
  isBanned?: boolean;
};

type Freq = typeof daily | typeof weekly | typeof monthly | typeof yearly;

async function fetchCollection(collectionName: string): Promise<SitemapEntry[]> {
  const db = getFirestore();
  let query = db.collection(collectionName) as FirebaseFirestore.Query;

  if (collectionName === 'users') {
    query = query.where('accountType', '==', 'creator');
  }
  // No visibility filter on posts — posts without the field were silently dropped by Firestore

  const snapshot = await query.get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SitemapEntry));
}

function getStaticPriority(path: string): number {
  if (path === '/') return 1.0;
  if (HIGH_PRIORITY_PATHS.includes(path)) return 0.9;
  return 0.7;
}

function getPostMeta(createdAt: number): { priority: number; changeFrequency: Freq } {
  const ageDays = (Date.now() - createdAt) / 86_400_000;
  if (ageDays < 30)  return { priority: 0.9, changeFrequency: weekly };
  if (ageDays < 365) return { priority: 0.7, changeFrequency: monthly };
  return { priority: 0.4, changeFrequency: yearly };
}

function getCreatorMeta(updatedAt?: number, createdAt?: number) {
  const timestamp = updatedAt ?? createdAt;
  const ageDays = timestamp ? (Date.now() - timestamp) / 86_400_000 : Infinity;
  return {
    priority: ageDays < 180 ? 0.8 : 0.5,
    lastModified: timestamp ? new Date(timestamp) : HELP_LAST_UPDATED,
  };
}

function createEntries<T extends SitemapEntry>(
  items: T[],
  pathFn: (item: T) => string,
  metaFn: (item: T) => { priority: number; changeFrequency: Freq; lastModified: Date } | null,
  filterFn: (item: T) => boolean = () => true
): MetadataRoute.Sitemap {
  return items.filter(filterFn).flatMap(item => {
    const meta = metaFn(item);
    if (!meta) return [];
    return [{ url: `${siteUrl}${pathFn(item)}`, ...meta }];
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [users, posts] = await Promise.all([
      fetchCollection('users'),
      fetchCollection('posts'),
    ]);

    const staticEntries: MetadataRoute.Sitemap = getStaticSeoPaths().map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: path === '/' ? new Date() : HELP_LAST_UPDATED,
      changeFrequency: path === '/' ? daily : monthly,
      priority: getStaticPriority(path),
    }));

    const helpEntries: MetadataRoute.Sitemap = helpCategories.flatMap((category) => [
      {
        url: `${siteUrl}/help/${category.slug}`,
        lastModified: HELP_LAST_UPDATED,
        changeFrequency: monthly,
        priority: 0.9,
      },
      ...category.articles.map((article) => ({
        url: `${siteUrl}/help/${category.slug}/${article.slug}`,
        lastModified: HELP_LAST_UPDATED,
        changeFrequency: monthly,
        priority: 0.9,
      })),
    ]);

    const userEntries = createEntries(
      users,
      (u) => `/squad/${encodeURIComponent(u.username!.toLowerCase())}`,
      (u) => {
        const { priority, lastModified } = getCreatorMeta(
          u.updatedAt?.toMillis(),
          u.createdAt?.toMillis()
        );
        return { priority, changeFrequency: weekly, lastModified };
      },
      (u) => Boolean(u.username && u.accountType === 'creator')
    );

    const postEntries = createEntries(
      posts,
      (p) => `/post/${p.id}`,
      (p) => {
        const createdAt = p.createdAt?.toMillis() ?? Date.now();
        const lastModified = new Date(p.updatedAt?.toMillis() ?? createdAt);
        const { priority, changeFrequency } = getPostMeta(createdAt);
        return { priority, changeFrequency, lastModified };
      },
      // Opt-out filter — only skip explicitly flagged posts, don't require visibility to be set
      (p) => p.isDeleted !== true && p.isBanned !== true && p.isDraft !== true
    );

    const seen = new Set<string>();
    return [...staticEntries, ...helpEntries, ...userEntries, ...postEntries]
      .filter(({ url }) => {
        if (seen.has(url)) return false;
        seen.add(url);
        return true;
      });

  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    return [];
  }
}