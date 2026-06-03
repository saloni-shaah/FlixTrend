import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHelpArticle, helpCategories } from "@/data/help";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://flixtrend.in";

type ArticlePageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export function generateStaticParams() {
  return helpCategories.flatMap((category) =>
    category.articles.map((article) => ({
      category: category.slug,
      slug: article.slug,
    }))
  );
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { category: categorySlug, slug } = await params;
  const result = getHelpArticle(categorySlug, slug);

  if (!result) {
    return {};
  }

  const { category, article } = result;
  const path = `/help/${category.slug}/${article.slug}`;
  const url = `${siteUrl}${path}`;

  return {
    title: article.title,
    description: article.desc,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: `${article.title} | FlixTrend Help`,
      description: article.desc,
      url,
      siteName: "FlixTrend",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: article.title }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} | FlixTrend Help`,
      description: article.desc,
      images: [`${siteUrl}/og-image.png`],
    },
  };
}

export default async function HelpArticlePage({ params }: ArticlePageProps) {
  const { category: categorySlug, slug } = await params;
  const result = getHelpArticle(categorySlug, slug);

  if (!result) {
    notFound();
  }

  const { category, article } = result;
  const pageUrl = `${siteUrl}/help/${category.slug}/${article.slug}`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.desc,
      url: pageUrl,
      isPartOf: {
        "@type": "CollectionPage",
        name: `${category.title} Help`,
        url: `${siteUrl}/help/${category.slug}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Help Center", item: `${siteUrl}/help` },
        { "@type": "ListItem", position: 3, name: category.title, item: `${siteUrl}/help/${category.slug}` },
        { "@type": "ListItem", position: 4, name: article.title, item: pageUrl },
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

      <article className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6 md:py-16">
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
            <li>
              <Link href={`/help/${category.slug}`} className="hover:text-cyan-200">
                {category.title}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-zinc-200">
              {article.title}
            </li>
          </ol>
        </nav>

        <header className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Help Guide</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{article.title}</h1>
          <p className="mt-5 text-lg leading-8 text-zinc-300">{article.desc}</p>
        </header>

        <section aria-labelledby="article-content" className="mt-10 rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 id="article-content" className="sr-only">
            Article content
          </h2>
          <div className="min-h-40 whitespace-pre-wrap text-zinc-300">{article.content}</div>
        </section>
      </article>
    </main>
  );
}
