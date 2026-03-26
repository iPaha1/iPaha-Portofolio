"use client";

import React from "react";
import Link from "next/link";
import { Github, Linkedin, Twitter, Mail, ArrowUpRight, Pen } from "lucide-react";
import { COMPANIES, PERSONAL } from "@/lib/data/site-data";

const FOOTER_LINKS = {
  Explore: [
    { label: "Blog", href: "/blog" },
    { label: "Apps", href: "/apps" },
    { label: "Ideas Lab", href: "/ideas" },
    { label: "Tools", href: "/tools" },
    { label: "Podcast", href: "/podcast" },
  ],
  Connect: [
    { label: "About", href: "/about" },
    { label: "Newsletter", href: "/newsletter" },
    { label: "Ask Isaac", href: "/ask-isaac" },
    { label: "Now", href: "/now" },
    { label: "Contact", href: "/contact" },
  ],
};

const SOCIAL = [
  { icon: Github, href: PERSONAL.social.github, label: "GitHub" },
  { icon: Linkedin, href: PERSONAL.social.linkedin, label: "LinkedIn" },
  { icon: Twitter, href: PERSONAL.social.twitter, label: "Twitter" },
  { icon: Mail, href: `mailto:${PERSONAL.email}`, label: "Email" },
];

export const Footer = () => (
  <footer className="relative bg-gray-900 text-white overflow-hidden">
    {/* Subtle dot grid */}
    <div
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
        backgroundSize: "32px 32px",
      }}
    />

    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">
        {/* Brand column */}
        <div className="md:col-span-1">
          <Link href="/" className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-amber-500 rounded-xs flex items-center justify-center">
              <Pen className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-white tracking-tight text-lg">
              Isaac<span className="text-amber-400">.</span>
            </span>
          </Link>
          <p className="text-sm text-white/50 leading-relaxed mb-6">
            {PERSONAL.tagline}
          </p>
          {/* Social icons */}
          <div className="flex items-center gap-2">
            {SOCIAL.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-9 h-9 rounded-xs border border-white/10 flex items-center justify-center text-white/40 hover:border-amber-400/50 hover:text-amber-400 transition-all duration-200"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Nav columns */}
        {Object.entries(FOOTER_LINKS).map(([group, links]) => (
          <div key={group}>
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-white/30 mb-5">
              {group}
            </p>
            <ul className="space-y-3">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Companies column */}
        <div>
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-white/30 mb-5">
            Companies
          </p>
          <ul className="space-y-3">
            {COMPANIES.map((co) => (
              <li key={co.id}>
                <a
                  href={co.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors duration-200"
                >
                  <span>{co.flag}</span>
                  <span>{co.name}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30">
        <p>© {new Date().getFullYear()} Isaac Paha · iPaha Ltd. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="hover:text-white/60 transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white/60 transition-colors">
            Terms
          </Link>
          <span className="flex items-center gap-1.5">
            Built with
            <span className="text-amber-500">♥</span>
            in the UK
          </span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;