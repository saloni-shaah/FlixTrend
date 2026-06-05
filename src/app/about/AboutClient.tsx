'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

/* ─── DATA ─────────────────────────────────────────────────────────────── */

const nav = ['What', 'Features', 'Why', 'Audience', 'Safety', 'Roadmap', 'FAQ'];

const products = [
  {
    name: 'Drops',
    size: 'large',
    desc: 'Respond to prompts, moments or ideas. A Drop can expire — but engagement keeps momentum alive. Attention disappears. Signals remain. Drops are where trends begin: a single reaction can pull a moment into something larger.',
  },
  {
    name: 'Almighty',
    size: 'large',
    desc: 'AI assistance for learning, studying, creation, planning, productivity and exploration. Built for people who want to turn ideas into action. Almighty reduces friction between what you imagine and what you actually build.',
  },
  {
    name: 'Fast Checking',
    size: 'medium',
    desc: 'Extra context tools that help users understand content before sharing. Not to tell you what to think — to help you think with more context.',
  },
  {
    name: 'Vibes',
    size: 'normal',
    desc: 'The core feed. Share thoughts, photos, videos, polls, updates and discussions — expressive without becoming overwhelming.',
  },
  {
    name: 'Flashes',
    size: 'normal',
    desc: 'Short moments built for spontaneity. Less pressure. Not everything needs to become permanent.',
  },
  {
    name: 'Pings',
    size: 'normal',
    desc: 'Simple messaging designed around connection. Fast. Clean. Human.',
  },
];

const problemCards = [
  {
    title: 'Pressure to perform',
    text: 'Every post becomes a metric. Likes, views, reach — numbers that quietly shape what you choose to share.',
  },
  {
    title: 'Pressure to stay visible',
    text: 'Algorithms reward consistency, not creativity. Staying relevant starts to feel like a second job.',
  },
  {
    title: 'Too much optimization',
    text: 'You stop creating for yourself and start creating for the feed. The original impulse gets lost somewhere.',
  },
  {
    title: 'Low discovery',
    text: 'New voices struggle to be found. Popularity compounds. The same content surfaces again and again.',
  },
  {
    title: 'Invisible algorithms',
    text: 'You cant tell whats being promoted, suppressed, or why. The rules feel opaque by design.',
  },
  {
    title: 'Endless consumption',
    text: 'Scroll. Watch. Repeat. Platforms are optimised to keep you looking — not to help you do something.',
  },
];

const trendFlow = [
  {
    label: '01',
    title: 'Drop',
    desc: 'A moment, idea or reaction is shared as a Drop — a temporary signal that something matters right now.',
  },
  {
    label: '02',
    title: 'React',
    desc: 'Others engage — not just with likes, but through layered reactions that show depth of response.',
  },
  {
    label: '03',
    title: 'Signal',
    desc: 'Engagement patterns form a signal. The system recognises momentum without suppressing smaller voices.',
  },
  {
    label: '04',
    title: 'Momentum',
    desc: 'A Drop gains weight. It surfaces to wider audiences. Context and origin stay attached to the moment.',
  },
  {
    label: '05',
    title: 'Trend',
    desc: 'The moment becomes a trend. People shaped it — not an opaque ranking engine.',
  },
];

const experience = [
  {
    title: 'Discover',
    desc: 'FlixTrend surfaces content based on genuine interest signals, not just popularity. Discovery feels earned — you find things because they matter to people like you, not because they paid to be there.',
  },
  {
    title: 'Create',
    desc: 'Multiple formats — Vibes, Flashes, Drops — mean different moods get different containers. You can be spontaneous or considered. Permanent or temporary. The pressure to be consistent drops.',
  },
  {
    title: 'Connect',
    desc: 'Pings keeps communication clean and direct. No algorithm between you and the people you want to talk to. Conversations stay conversations.',
  },
  {
    title: 'Express',
    desc: 'Your identity on FlixTrend is built from what you actually do — what you share, respond to, and care about. Less curation. More presence.',
  },
  {
    title: 'Build',
    desc: 'Almighty helps you move from idea to output. Whether youre learning, writing, planning or creating — you have assistance that adapts to what youre actually trying to do.',
  },
  {
    title: 'Grow',
    desc: 'Growth on FlixTrend comes from genuine engagement. Consistency matters, but so does participation. The system is designed to reward people who show up authentically.',
  },
];

const audience = [
  {
    title: 'Students',
    problem: 'Social feels performative. Academic tools feel disconnected.',
    goal: 'Learn and explore interests while actually connecting with others.',
    why: 'Almighty supports learning. Vibes makes sharing feel lower-stakes. Discovery surfaces things worth knowing.',
  },
  {
    title: 'Creators',
    problem: 'Platforms reward optimisation over originality. Growth is unpredictable.',
    goal: 'Build consistently without burning out on metrics.',
    why: 'Multiple formats reduce the need to always produce peak content. Drops create new paths to discovery.',
  },
  {
    title: 'Small Communities',
    problem: 'Niche interests get buried. Finding the right people is difficult.',
    goal: 'Start conversations, share ideas and build together around specific interests.',
    why: 'Interest-based discovery means communities form naturally around what people actually care about.',
  },
  {
    title: 'Builders',
    problem: 'Showing work-in-progress feels risky. Feedback is noisy.',
    goal: 'Launch projects, show progress, find collaborators and keep improving.',
    why: 'Drops create low-pressure ways to share early. Almighty helps move faster.',
  },
  {
    title: 'Early Adopters',
    problem: 'Established platforms feel saturated and hard to break into.',
    goal: 'Be part of something thats still being shaped.',
    why: 'Early presence on FlixTrend means influence over what the culture becomes.',
  },
];

const beliefs = [
  { b: 'People shape culture.', t: 'Trends should emerge from real participation — not algorithmic prediction or promoted placement.' },
  { b: 'Good tools reduce pressure.', t: 'The best social experiences lower the cost of creating, not raise it.' },
  { b: 'Discovery should feel earned.', t: 'Finding something new should feel like a genuine moment — not a targeted injection.' },
  { b: 'Technology should help.', t: 'AI exists to reduce friction between what you want to do and what you actually do.' },
  { b: 'Transparency builds trust.', t: 'Users deserve to understand what theyre seeing and why theyre seeing it.' },
  { b: 'Simple products age better.', t: 'Complexity accumulates. Restraint is a design decision worth protecting.' },
];

const faq = [
  {
    q: 'What is FlixTrend?',
    a: 'FlixTrend is a social platform focused on creation, interests and participation. It combines posts, temporary moments, trend systems, AI assistance and context tools into one connected experience built around the idea that people — not algorithms — should shape what becomes popular.',
  },
  {
    q: 'Do I need an account?',
    a: 'You can explore some experiences before creating one. An account lets you create, participate in Drops, use Almighty and connect with people through Signal.',
  },
  {
    q: 'What are Drops?',
    a: 'Drops are temporary moments that can become larger conversations. You respond to a prompt, idea or moment — it can expire, but the engagement signals it generates dont. Drops are one of the core ways trends form on FlixTrend.',
  },
  {
    q: 'What is Fast Checking?',
    a: 'Fast Checking helps users understand content before sharing it. It provides extra context — source signals, related information, clarity on claims — without telling you what to think. The goal is better decisions, not restrictions.',
  },
  {
    q: 'What is Almighty?',
    a: 'Almighty is FlixTrends AI assistance layer. It helps you learn, create, plan, study and explore ideas. Its built for people who want to turn ideas into output — not just consume suggestions.',
  },
];

const roadmap = [
  {
    phase: 'Now',
    items: ['Core feed experience', 'Flashes & Drops', 'Pings messaging', 'Fast Checking tools'],
  },
  {
    phase: 'Next',
    items: ['Better creation tools', 'Richer communities', 'Stronger discovery', 'Creator systems'],
  },
  {
    phase: 'Future',
    items: ['Advanced AI experiences', 'New content formats', 'Participatory features', 'Deeper transparency tools'],
  },
];

/* ─── COMPONENTS ────────────────────────────────────────────────────────── */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-[28px] border border-white/10 bg-white/[0.02] overflow-hidden transition-all"
      onClick={() => setOpen(!open)}
    >
      <button className="w-full flex justify-between items-center px-8 py-6 text-left">
        <span className="text-lg font-light text-white">{q}</span>
        <span className={`text-violet-400 text-xl transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="px-8 pb-6 text-gray-400 leading-7 text-base font-light">{a}</div>
      )}
    </div>
  );
}

/* ─── PAGE ──────────────────────────────────────────────────────────────── */

export default function AboutClient() {
  return (
    <main className="bg-[#0b0b0c] text-white min-h-screen overflow-hidden">

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet-600/8 blur-[160px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-pink-500/8 blur-[140px]" />
        <div className="absolute top-1/2 left-0 h-[300px] w-[300px] rounded-full bg-violet-800/6 blur-[120px]" />
      </div>

      <div className="relative z-10">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section id="what" className="max-w-6xl mx-auto px-6 pt-32 pb-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-2 text-sm text-violet-300 mb-10">
              About FlixTrend
            </div>
            <h1 className="text-5xl md:text-[72px] font-light leading-[1.08] max-w-4xl tracking-tight">
              Built for people who want to{' '}
              <span className="font-semibold text-white">create —</span>
              <br />
              <span className="text-violet-400 font-semibold">not just scroll.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg text-gray-400 leading-8 font-light">
              FlixTrend is a social platform designed around ideas, interests and real participation.
              A place where trends start from people. Where discovery feels intentional.
              Where creating feels possible.
            </p>
            <div className="flex flex-wrap gap-4 mt-10">
              <Link
                href="/"
                className="rounded-[14px] px-6 py-4 bg-white text-black font-semibold text-sm hover:bg-gray-100 transition"
              >
                Explore FlixTrend
              </Link>
              <Link
                href="/signup"
                className="rounded-[14px] border border-white/10 px-6 py-4 text-sm hover:border-violet-500/40 transition"
              >
                Get Early Access
              </Link>
            </div>
          </motion.div>
        </section>

        {/* ── STICKY NAV ───────────────────────────────────────────────── */}
        <section className="sticky top-0 z-40 backdrop-blur-xl bg-[#0b0b0c]/70 border-y border-white/5">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex gap-8 overflow-auto py-4 scrollbar-none">
              {nav.map((x) => (
                <a
                  key={x}
                  href={`#${x.toLowerCase()}`}
                  className="text-sm text-gray-500 hover:text-violet-400 transition whitespace-nowrap"
                >
                  {x}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── THE PROBLEM ──────────────────────────────────────────────── */}
        <section id="why" className="max-w-6xl mx-auto px-6 py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex rounded-full border border-pink-500/20 bg-pink-500/5 px-4 py-2 text-sm text-pink-300 mb-8">
              The Problem
            </div>
            <h2 className="text-4xl md:text-5xl font-light mb-4 max-w-2xl leading-tight">
              Why FlixTrend <span className="font-semibold">exists</span>
            </h2>
            <p className="text-gray-500 mb-14 max-w-xl font-light leading-7">
              Platforms evolved to optimise for engagement. That created something harder to name — a steady pressure that makes social feel like work.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-14">
              {problemCards.map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-[28px] border border-white/8 bg-white/[0.02] p-7"
                >
                  <span className="text-pink-400/60 text-xs mb-4 block">0{i + 1}</span>
                  <h3 className="text-base font-semibold mb-3">{card.title}</h3>
                  <p className="text-gray-500 text-sm leading-6 font-light">{card.text}</p>
                </motion.div>
              ))}
            </div>
            <div className="rounded-[28px] border border-violet-500/20 bg-violet-500/5 p-8 text-center">
              <p className="text-lg text-violet-300 font-light">
                FlixTrend explores another direction.
              </p>
            </div>
          </motion.div>
        </section>

        {/* ── WHAT IS FLIXTREND ─────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-10 pb-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-light mb-4">What is FlixTrend</h2>
            <p className="text-gray-400 max-w-3xl mb-16 leading-8 font-light">
              FlixTrend combines posts and conversations, temporary moments, trend creation systems,
              interest discovery, context tools and AI assistance into one connected experience —
              all built around one idea: people should have more influence over what becomes popular.
            </p>
          </motion.div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────────────── */}
        <section id="features" className="max-w-6xl mx-auto px-6 pb-28">
          <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-auto gap-4">
            {products.map((item) => {
              const isLarge = item.size === 'large';
              const isMedium = item.size === 'medium';
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`
                    rounded-[28px] border border-white/10 bg-white/[0.02] p-8
                    hover:border-violet-500/30 transition group flex flex-col justify-between
                    ${isLarge ? 'col-span-2 row-span-2' : ''}
                    ${isMedium ? 'col-span-2' : ''}
                  `}
                >
                  <div>
                    <h3 className={`font-semibold mb-4 ${isLarge ? 'text-3xl' : 'text-xl'}`}>
                      {item.name}
                    </h3>
                    <p className={`text-gray-400 leading-7 font-light ${isLarge ? 'text-base' : 'text-sm'}`}>
                      {item.desc}
                    </p>
                  </div>
                  <div className="mt-6">
                    <button className="text-xs text-violet-400 border border-violet-500/20 rounded-full px-4 py-2 hover:bg-violet-500/10 transition">
                      Learn more →
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── HOW A TREND IS CREATED ───────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-2 text-sm text-violet-300 mb-8">
              How it works
            </div>
            <h2 className="text-4xl font-light mb-16">How FlixTrend works</h2>
            <div className="grid md:grid-cols-5 gap-4">
              {trendFlow.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-[28px] border border-white/10 bg-white/[0.02] p-7 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-violet-400/60 text-xs font-light">{step.label}</span>
                    {i < trendFlow.length - 1 && (
                      <span className="text-white/10 text-lg hidden md:block">→</span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-6 font-light flex-1">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── THE FLIXTREND EXPERIENCE ──────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-light mb-4">The FlixTrend experience</h2>
            <p className="text-gray-500 max-w-xl mb-16 font-light leading-7">
              Everything on the platform is built around a few core experiences that compound together.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {experience.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-8"
                >
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center mb-6">
                    <span className="text-violet-400 text-xs">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-7 font-light">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── WHO JOINS FLIXTREND ───────────────────────────────────────── */}
        <section id="audience" className="max-w-6xl mx-auto px-6 py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-light mb-4">Who FlixTrend is built for</h2>
            <p className="text-gray-500 max-w-xl mb-16 font-light leading-7">
              Different people. Same underlying need: a place where showing up actually means something.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {audience.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-[28px] border border-white/10 bg-white/[0.02] p-8 flex flex-col gap-5"
                >
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <div>
                    <span className="text-xs text-pink-400/70 uppercase tracking-widest mb-2 block font-light">Problem</span>
                    <p className="text-gray-500 text-sm leading-6 font-light">{item.problem}</p>
                  </div>
                  <div>
                    <span className="text-xs text-violet-400/70 uppercase tracking-widest mb-2 block font-light">Goal</span>
                    <p className="text-gray-500 text-sm leading-6 font-light">{item.goal}</p>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-400/70 uppercase tracking-widest mb-2 block font-light">Why FlixTrend</span>
                    <p className="text-gray-400 text-sm leading-6 font-light">{item.why}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── OUR BELIEFS ──────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-light mb-16">Our beliefs</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {beliefs.map((item, i) => (
                <motion.div
                  key={item.b}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-[28px] border border-white/10 p-8 flex gap-6 items-start"
                >
                  <span className="text-violet-400/40 text-xs mt-1 font-light shrink-0">0{i + 1}</span>
                  <div>
                    <p className="font-semibold mb-2 text-white">{item.b}</p>
                    <p className="text-gray-500 text-sm leading-6 font-light">{item.t}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── SAFETY ───────────────────────────────────────────────────── */}
        <section id="safety" className="max-w-6xl mx-auto px-6 py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-light mb-4">Trust, safety and control</h2>
            <p className="text-gray-400 max-w-3xl mb-14 leading-8 font-light">
              FlixTrend is designed around the idea that users should understand and control more
              of their experience. Good social experiences should feel understandable.
            </p>
            <div className="grid md:grid-cols-4 gap-4">
              {['Privacy controls', 'Reporting tools', 'User control', 'Transparency features'].map((item) => (
                <div
                  key={item}
                  className="rounded-[28px] border border-white/10 bg-white/[0.02] p-7 text-sm text-gray-300 font-light"
                >
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── ROADMAP ──────────────────────────────────────────────────── */}
        <section id="roadmap" className="max-w-6xl mx-auto px-6 py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-light mb-4">What comes next</h2>
            <p className="text-gray-400 max-w-3xl mb-14 leading-8 font-light">
              FlixTrend is still early. We believe the next generation of social products will feel
              more participatory, more transparent and more creative.
            </p>
            <div className="space-y-4">
              {roadmap.map((phase) => (
                <div key={phase.phase} className="rounded-[28px] border border-white/10 p-8">
                  <h3 className="text-xl font-semibold mb-6">{phase.phase}</h3>
                  <div className="flex flex-wrap gap-3">
                    {phase.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-400 font-light"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section id="faq" className="max-w-6xl mx-auto px-6 py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-4xl font-light">Common questions</h2>
              <Link href="/faq" className="text-violet-400 text-sm hover:text-violet-300 transition">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {faq.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-[28px] border border-violet-500/20 bg-gradient-to-b from-violet-500/8 to-transparent p-16 text-center"
          >
            <h2 className="text-5xl md:text-6xl font-light leading-tight mb-6 max-w-2xl mx-auto">
              Ready to create{' '}
              <span className="font-semibold text-violet-400">instead of scroll?</span>
            </h2>
            <p className="text-gray-400 mb-12 text-lg font-light max-w-md mx-auto leading-7">
              Join early and help shape FlixTrend.
            </p>
            <div className="flex justify-center flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-[14px] bg-white text-black px-8 py-4 font-semibold text-sm hover:bg-gray-100 transition"
              >
                Get Early Access
              </Link>
              <Link
                href="/help"
                className="rounded-[14px] border border-white/10 px-8 py-4 text-sm hover:border-violet-500/40 transition"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
        </section>

      </div>

      {/* ── JSON-LD ────────────────────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'FlixTrend',
            url: 'https://www.flixtrend.in',
            description: 'Social built around interests and participation.',
          }),
        }}
      />
    </main>
  );
}
