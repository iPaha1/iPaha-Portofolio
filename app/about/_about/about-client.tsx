"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Github, Twitter, Linkedin, Mail } from "lucide-react";
import Image from "next/image";

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "2019", label: "Started building" },
  { value: "3",    label: "Companies founded" },
  { value: "7",    label: "Products shipped" },
  { value: "2",    label: "Countries operating" },
];

const COMPANIES = [
  {
    name: "iPaha Ltd",
    flag: "🇬🇧",
    year: "2019",
    tagline: "IT consultancy & custom software",
    href: "https://ipahait.com",
    color: "#f59e0b",
  },
  {
    name: "iPahaStores Ltd",
    flag: "🇬🇧",
    year: "2021",
    tagline: "SaaS & e-commerce platforms",
    href: "https://ipahastore.com",
    color: "#3b82f6",
  },
  {
    name: "Okpah Ltd",
    flag: "🇬🇭",
    year: "2022",
    tagline: "Digital platforms for Ghana",
    href: "https://okpah.com",
    color: "#10b981",
  },
];

const BELIEFS = [
  "Technology is most valuable when it solves problems that matter to people who are often overlooked.",
  "Africa has every ingredient for a technology revolution. What's been missing is narrative.",
  "Craft over grind. The question is never 'how hard are you working?' — it's 'what are you building?'",
  "The best product decisions come from watching real people, not reading analytics dashboards.",
  "Slow, honest thinking compounds better than fast, reactive opinions.",
];

const STACK = [
  "Next.js", "TypeScript", "React", "Tailwind CSS",
  "Node.js", "Prisma", "MySQL", "Python",
  "OpenAI", "Stripe", "Clerk", "AWS",
];

const SOCIAL = [
  { icon: Github,   href: "https://github.com/iPaha1",                             label: "GitHub" },
  { icon: Linkedin, href: "https://www.linkedin.com/in/isaac-paha-578911a9/",      label: "LinkedIn" },
  { icon: Twitter,  href: "https://twitter.com/iPaha3",                            label: "Twitter / X" },
  { icon: Mail,     href: "mailto:pahaisaac@gmail.com",                            label: "Email" },
];

// ─── Stagger helpers ──────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export function AboutClient() {
  return (
    <div className="min-h-screen bg-[#fafaf7]">

      {/* ── HERO — SPLIT SCREEN ─────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[90vh]">

        {/* LEFT — dark identity panel */}
        <div className="relative bg-[#111110] flex flex-col justify-between px-10 py-16 lg:px-14 lg:py-20 overflow-hidden">
          {/* Amber line top */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 via-amber-500 to-transparent" />

          {/* Noise texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Top: name + eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[11px] font-black tracking-[0.3em] uppercase text-amber-500 block mb-4">
              About
            </span>
            <h1 className="text-5xl lg:text-6xl font-black text-white leading-[0.9] tracking-tight">
              Isaac
              <br />
              <span
                className="italic"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#f59e0b" }}
              >
                Paha.
              </span>
            </h1>
          </motion.div>

          {/* Centre: photo + title */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="my-10"
          >
            {/* Photo placeholder — replace with actual <Image> when photo exists */}
            <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-sm overflow-hidden mb-6 border border-white/10">
              {/* <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-stone-700/40 flex items-center justify-center">
                <span className="text-5xl">👤</span>
              </div> */}
              
              <Image src="/images/isaac-paha-og-image.png" alt="Isaac Paha" width={160} height={160} className="object-cover w-full h-full" />
              
            </div>

            <p className="text-base text-white/55 leading-relaxed max-w-xs font-serif">
              Technologist, entrepreneur, and thinker. Building companies and
              products from London to Accra since 2019.
            </p>
          </motion.div>

          {/* Bottom: social + location */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-4 mb-6">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("mailto") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white border border-white/10 hover:border-white/30 rounded-sm transition-all duration-200"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/20">
              <span className="text-sm">🇬🇧</span>
              <span>London, UK</span>
              <span className="text-white/10">·</span>
              <span className="text-sm">🇬🇭</span>
              <span>Accra, Ghana</span>
            </div>
          </motion.div>
        </div>

        {/* RIGHT — light bio panel */}
        <div className="flex flex-col justify-center px-10 py-16 lg:px-14 lg:py-20">
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4 mb-12 pb-12 border-b border-stone-100">
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                >
                  <p className="text-3xl font-black text-stone-900 leading-none mb-1">
                    {s.value}
                  </p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold leading-tight">
                    {s.label}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Bio paragraphs */}
            <div className="space-y-5 mb-12">
              {[
                "I'm a First-Class Computing & IT graduate from The Open University. I started building in 2019 with iPaha Ltd — a consultancy that taught me how to ship real software for real clients. Since then I've founded two more companies and built seven products across employment, e-commerce, fintech, logistics, and education.",
                "Most of what I build targets markets that larger companies overlook. Ghana and West Africa, specifically. The opportunity there is enormous — not in spite of the challenges, but partly because of them. Problems that haven't been solved yet are where the interesting work lives.",
                "I write, think out loud, and build in public. The newsletter, the blog, and this site are part of the same project: making sense of what it means to build things that matter, and sharing what I learn along the way.",
              ].map((text, i) => (
                <motion.p
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  className="text-[15px] text-stone-600 leading-relaxed font-serif"
                >
                  {text}
                </motion.p>
              ))}
            </div>

            {/* CTA links */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex flex-wrap gap-3"
            >
              <Link
                href="/contact"
                className="group inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold px-5 py-3 rounded-sm transition-all"
              >
                Get in touch
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/apps"
                className="inline-flex items-center gap-2 border border-stone-200 hover:border-stone-400 text-stone-700 hover:text-stone-900 text-sm font-semibold px-5 py-3 rounded-sm transition-all"
              >
                See my work
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── COMPANIES ───────────────────────────────────────────────────── */}
      <section className="px-10 py-20 lg:px-14 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <span className="text-[11px] font-black tracking-[0.3em] uppercase text-stone-400">
            Companies
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-400/30 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COMPANIES.map((co, i) => (
            <motion.a
              key={co.name}
              href={co.href}
              target="_blank"
              rel="noopener noreferrer"
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="group relative bg-white border border-stone-100 rounded-sm p-6 hover:border-stone-300 hover:shadow-sm transition-all duration-200 overflow-hidden"
            >
              {/* Top colour accent */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: co.color }}
              />
              <div className="flex items-start justify-between mb-5">
                <span className="text-2xl">{co.flag}</span>
                <div className="flex items-center gap-1.5 text-[10px] text-stone-300 font-mono">
                  Est. {co.year}
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <h3 className="text-base font-black text-stone-900 mb-1">{co.name}</h3>
              <p className="text-xs text-stone-400">{co.tagline}</p>
            </motion.a>
          ))}
        </div>
      </section>

      {/* ── BELIEFS ─────────────────────────────────────────────────────── */}
      <section className="bg-[#111110] px-10 py-20 lg:px-14">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <span className="text-[11px] font-black tracking-[0.3em] uppercase text-amber-500">
              What I believe
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
          </div>

          <div className="space-y-0 divide-y divide-white/[0.05]">
            {BELIEFS.map((belief, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="group flex items-start gap-6 py-6"
              >
                <span
                  className="text-2xl font-black tabular-nums flex-shrink-0 leading-none mt-0.5 transition-colors"
                  style={{ color: "rgba(245,158,11,0.2)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[15px] text-white/50 group-hover:text-white/80 leading-relaxed font-serif transition-colors duration-300">
                  {belief}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STACK ───────────────────────────────────────────────────────── */}
      <section className="px-10 py-16 lg:px-14 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-[11px] font-black tracking-[0.3em] uppercase text-stone-400">
            Tech stack
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-400/30 to-transparent" />
        </div>
        <div className="flex flex-wrap gap-2">
          {STACK.map((tech, i) => (
            <motion.span
              key={tech}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="text-sm font-semibold text-stone-600 bg-white border border-stone-100 px-3.5 py-2 rounded-sm hover:border-stone-300 hover:text-stone-900 transition-all cursor-default"
            >
              {tech}
            </motion.span>
          ))}
        </div>
      </section>

      {/* ── CTA STRIP ───────────────────────────────────────────────────── */}
      <section className="border-t border-stone-100 px-10 py-14 lg:px-14">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-xl font-black text-stone-900 leading-tight">
              Want to build something together?
            </p>
            <p className="text-sm text-stone-400 mt-1">
              Open to consulting, collaboration, and conversations worth having.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            {[
              { href: "/contact",    label: "Get in touch", primary: true },
              { href: "/newsletter", label: "The Signal",   primary: false },
              { href: "/ask-isaac",  label: "Ask me anything", primary: false },
            ].map(({ href, label, primary }) => (
              <Link
                key={href}
                href={href}
                className={`group inline-flex items-center gap-1.5 text-sm font-bold px-5 py-3 rounded-sm transition-all ${
                  primary
                    ? "bg-stone-900 hover:bg-stone-800 text-white"
                    : "border border-stone-200 hover:border-stone-400 text-stone-600 hover:text-stone-900"
                }`}
              >
                {label}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}