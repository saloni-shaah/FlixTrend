import type { Metadata } from "next";
import Link from "next/link";
import { helpCategories } from "@/data/help";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://flixtrend.in";
const pageUrl = `${siteUrl}/help`;

export const metadata: Metadata = {
  title: "Help Center",
  description: "Deep FlixTrend guides for accounts, privacy, posting, Flashes, Drops, messaging, creators, and support.",
  alternates: {
    canonical: "/help",
  },
  openGraph: {
    title: "FlixTrend Help Center",
    description: "Deep guides for using FlixTrend.",
    url: pageUrl,
    siteName: "FlixTrend",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "FlixTrend Help Center" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlixTrend Help Center",
    description: "Deep guides for using FlixTrend.",
    images: [`${siteUrl}/og-image.png`],
  },
};

export default function HelpCenterPage() {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "FlixTrend Help Center",
      description: metadata.description,
      url: pageUrl,
      hasPart: helpCategories.map((category) => ({
        "@type": "CollectionPage",
        name: category.title,
        url: `${siteUrl}/help/${category.slug}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Help Center", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "FlixTrend",
      url: siteUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-16">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-400">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-cyan-200">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-zinc-200">
              Help Center
            </li>
          </ol>
        </nav>

        <header className="mt-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Deep Guides</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">FlixTrend Help Center</h1>
          <p className="mt-5 text-lg leading-8 text-zinc-300">
            Category-based guide shells for launch support. Article bodies are intentionally empty until founder-written content is added.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/faq"
              className="rounded-lg bg-cyan-300 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
            >
              Browse FAQ
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-cyan-300 hover:text-cyan-200"
            >
              Contact Support
            </Link>
          </div>
        </header>

        <section aria-labelledby="help-categories" className="mt-12">
          <h2 id="help-categories" className="text-2xl font-semibold">
            Help Categories
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {helpCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/help/${category.slug}`}
                className="group rounded-lg border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-300 hover:bg-white/[0.06]"
              >
                <h3 className="text-xl font-semibold text-white group-hover:text-cyan-200">{category.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{category.desc}</p>
                <p className="mt-4 text-sm font-medium text-cyan-300">{category.articles.length} guides</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
