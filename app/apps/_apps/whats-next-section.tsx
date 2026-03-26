"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Hammer, ArrowRight, Lightbulb } from "lucide-react";
import { APPS } from "@/lib/data/apps-data";

const inProgress = APPS.filter(a => a.status === "IN_DEVELOPMENT" || a.status === "COMING_SOON");

export function WhatsNextSection() {
  return (
    <section className="bg-[#080810] border-t border-white/[0.06] px-4 py-20">
      <div className="max-w-7xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <Hammer className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-blue-400">Building Next</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-3">
            What I&apos;m working on
            <br />
            <span className="text-white/25">right now.</span>
          </h2>
          <p className="text-white/35 max-w-xl leading-relaxed">
            These apps are in active development or launching soon. Follow along on the journey.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {inProgress.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative rounded border border-white/[0.07] bg-[#0d0d1a] p-6 overflow-hidden group"
            >
              {/* Glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle at 20% 50%, ${app.primaryColor}08, transparent)` }}
              />

              <div className="relative z-10 flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-lg border flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: `${app.primaryColor}10`, borderColor: `${app.primaryColor}20` }}
                >
                  {app.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-black text-white">{app.name}</h3>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${app.primaryColor}15`, color: app.primaryColor }}
                    >
                      {app.status === "IN_DEVELOPMENT" ? "In Dev" : "Coming Soon"}
                    </span>
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed mb-3">{app.tagline}</p>
                  {app.nextMilestone && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: app.primaryColor }}
                      />
                      <span className="text-[11px] text-white/30 font-medium">
                        Next: {app.nextMilestone}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Idea CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.07] rounded p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white mb-1">Have a problem worth solving?</p>
              <p className="text-sm text-white/35">
                I&apos;m always thinking about what to build next. If you have a genuine problem in an underserved market, I&apos;d love to hear about it.
              </p>
            </div>
          </div>
          <Link
            href="/contact"
            className="group flex items-center gap-2 text-sm font-semibold text-amber-400 border border-amber-400/25 hover:border-amber-400/50 bg-amber-400/5 hover:bg-amber-400/10 px-5 py-3 rounded transition-all flex-shrink-0"
          >
            Get in touch
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}