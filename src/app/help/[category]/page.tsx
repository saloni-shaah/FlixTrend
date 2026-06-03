import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHelpCategory, helpCategories } from "@/data/help";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://flixtrend.in";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return helpCategories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getHelpCategory(categorySlug);

  if (!category) {
    return {};
  }

  const path = `/help/${category.slug}`;
  const url = `${siteUrl}${path}`;

  return {
    title: `${category.title} Help`,
    description: category.desc,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: `${category.title} Help | FlixTrend`,
      description: category.desc,
      url,
      siteName: "FlixTrend",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${category.title} Help` }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.title} Help | FlixTrend`,
      description: category.desc,
      images: [`${siteUrl}/og-image.png`],
    },
  };
}

export default async function HelpCategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const category = getHelpCategory(categorySlug);

  if (!category) {
    notFound();
  }

  const pageUrl = `${siteUrl}/help/${category.slug}`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${category.title} Help`,
      description: category.desc,
      url: pageUrl,
      hasPart: category.articles.map((article) => ({
        "@type": "Article",
        headline: article.title,
        description: article.desc,
        url: `${pageUrl}/${article.slug}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Help Center", item: `${siteUrl}/help` },
        { "@type": "ListItem", position: 3, name: category.title, item: pageUrl },
      ],
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

      <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6 md:py-16">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-400">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-cyan-200">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/help" className="hover:text-cyan-200">
                Help Center
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-zinc-200">
              {category.title}
            </li>
          </ol>
        </nav>

        <header className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Help Category</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{category.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">{category.desc}</p>
        </header>

        <section aria-labelledby="category-guides" className="mt-10">
          <h2 id="category-guides" className="text-2xl font-semibold">
            Guides
          </h2>
          <div className="mt-5 divide-y divide-white/10 rounded-lg border border-white/10 bg-white/[0.03]">
            {category.articles.map((article) => (
              <Link
                key={article.slug}
                href={`/help/${category.slug}/${article.slug}`}
                className="block px-4 py-5 transition hover:bg-white/[0.05] md:px-5"
              >
                <h3 className="text-lg font-semibold text-white">{article.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{article.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
