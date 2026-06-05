import type { Metadata } from "next";
import Link from "next/link";
import FaqExplorer from "@/components/help/FaqExplorer";
import { faqCategories, faqItems } from "@/data/faq";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://flixtrend.in";
const pageUrl = `${siteUrl}/faq`;

export const metadata: Metadata = {
  title: "FAQ",
  description: "Quick questions about FlixTrend accounts, posting, safety, creators, messaging, and support.",
  keywords: [
    "FlixTrend FAQ",
    "help center",
    "account help",
    "posting help",
    "creator support",
    "message support",
    "social media FAQ",
  ],
  alternates: {
    canonical: "/faq",
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
    title: "FlixTrend FAQ",
    description: "Quick questions about using FlixTrend.",
    url: pageUrl,
    siteName: "FlixTrend",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "FlixTrend FAQ" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlixTrend FAQ",
    description: "Quick questions about using FlixTrend.",
    images: [`${siteUrl}/og-image.png`],
  },
};

export default function FAQPage() {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "FAQ", item: pageUrl },
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_30%),linear-gradient(180deg,#09090b,#0f172a_60%,#09090b)] text-white">
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
              <Link href="/" className="hover:text-violet-200">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-zinc-200">
              FAQ
            </li>
          </ol>
        </nav>

        <header className="mt-8 max-w-3xl">
          <p className="font-sans text-sm font-semibold uppercase tracking-[0.24em] text-violet-300">Quick Answers</p>
          <h1 className="mt-3 font-sans text-4xl font-bold tracking-tight text-white md:text-6xl">FlixTrend FAQ</h1>
          <p className="mt-5 max-w-2xl font-sans text-lg leading-8 text-zinc-300">
            Short questions for launch support. Detailed walkthroughs live in the Help Center.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/help"
              className="rounded-lg bg-violet-300 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-violet-200"
            >
              Browse Help Center
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-violet-300 hover:text-violet-200"
            >
              Contact Support
            </Link>
          </div>
        </header>

        <FaqExplorer categories={faqCategories} />
      </div>
    </main>
  );
}
