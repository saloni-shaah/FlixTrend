"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { FaqCategory } from "@/data/faq";

type FaqExplorerProps = {
  categories: FaqCategory[];
};

export default function FaqExplorer({ categories }: FaqExplorerProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [openItems, setOpenItems] = useState<string[]>([]);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return categories
      .filter((category) => activeCategory === "all" || category.slug === activeCategory)
      .map((category) => ({
        ...category,
        questions: category.questions.filter((item) => item.q.toLowerCase().includes(normalizedQuery)),
      }))
      .filter((category) => category.questions.length > 0);
  }, [activeCategory, categories, query]);

  const visibleItemIds = filteredCategories.flatMap((category) =>
    category.questions.map((item) => `${category.slug}:${item.q}`)
  );
  const allVisibleOpen = visibleItemIds.length > 0 && visibleItemIds.every((id) => openItems.includes(id));

  function toggleItem(id: string) {
    setOpenItems((items) => (items.includes(id) ? items.filter((item) => item !== id) : [...items, id]));
  }

  function toggleVisibleItems() {
    setOpenItems((items) => {
      if (allVisibleOpen) {
        return items.filter((item) => !visibleItemIds.includes(item));
      }

      return Array.from(new Set([...items, ...visibleItemIds]));
    });
  }

  return (
    <section aria-label="FAQ questions" className="mt-10">
      <div className="sticky top-0 z-20 -mx-4 border-y border-violet-400/10 bg-zinc-950/90 px-4 py-4 backdrop-blur md:top-2 md:rounded-3xl md:border md:px-5">
        <label className="relative block">
          <span className="sr-only">Search frequently asked questions</span>
          <Search aria-hidden="true" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-violet-300" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search questions"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-12 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
          />
        </label>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="FAQ categories">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
              activeCategory === "all"
                ? "border-violet-300 bg-violet-300 text-zinc-950"
                : "border-white/10 bg-white/5 text-zinc-200 hover:border-white/25"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => setActiveCategory(category.slug)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                activeCategory === category.slug
                ? "border-violet-300 bg-violet-300 text-zinc-950"
                  : "border-white/10 bg-white/5 text-zinc-200 hover:border-white/25"
              }`}
            >
              {category.title}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-400">{visibleItemIds.length} questions</p>
        <button
          type="button"
          onClick={toggleVisibleItems}
          className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-violet-300 hover:text-violet-200"
        >
          {allVisibleOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="mt-6 space-y-8">
        {filteredCategories.map((category) => (
          <div key={category.slug} id={category.slug} className="scroll-mt-40">
            <h2 className="text-2xl font-semibold tracking-tight text-white">{category.title}</h2>
            <div className="mt-4 divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
              {category.questions.map((item) => {
                const id = `${category.slug}:${item.q}`;
                const isOpen = openItems.includes(id);

                return (
                  <article key={id}>
                    <h3>
                      <button
                        type="button"
                        onClick={() => toggleItem(id)}
                        aria-expanded={isOpen}
                        className="flex min-h-16 w-full items-center justify-between gap-4 px-4 py-4 text-left text-base font-medium text-zinc-100 outline-none transition hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-300 md:px-6"
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          aria-hidden="true"
                          className={`h-5 w-5 shrink-0 text-violet-300 transition ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    </h3>
                    {isOpen ? (
                      <div className="px-4 pb-5 md:px-6">
                        <p className="max-w-4xl text-sm leading-7 text-zinc-300 md:text-[15px]">
                          {item.a || "We are still adding an official answer for this question."}
                        </p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 ? (
        <div className="mt-10 rounded-lg border border-white/10 bg-white/[0.03] px-5 py-10 text-center text-zinc-300">
          No FAQ questions match your search.
        </div>
      ) : null}
    </section>
  );
}
