
import { MetadataRoute } from 'next';

const URL = 'https://flixtrend.in';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${URL}/`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${URL}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${URL}/premium`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
        url: `${URL}/ad-studio`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
    },
    {
        url: `${URL}/privacy`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
    },
    {
        url: `${URL}/terms`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
    }
  ];
}
