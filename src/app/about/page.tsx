import type { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: 'About FlixTrend | Social Platform for Creators and Communities',
  description:
    'Discover why FlixTrend exists and how Vibes, Flashes, Drops and Almighty help people create, connect and shape trends — a different way to participate online.',
  keywords: [
    'FlixTrend',
    'creator platform',
    'social network',
    'content discovery',
    'student social app',
    'creator tools',
    'ai social platform',
    'community platform',
    'social media alternative',
  ],
  alternates: {
    canonical: 'https://www.flixtrend.in/about',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: 'About FlixTrend',
    description: 'Built for people who want to create — not just scroll.',
    url: 'https://www.flixtrend.in/about',
    siteName: 'FlixTrend',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About FlixTrend',
    description: 'Social built around interests.',
  },
};

export default function Page() {
  return <AboutClient />;
}
