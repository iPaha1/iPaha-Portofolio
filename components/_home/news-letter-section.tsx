"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Check, Loader2 } from "lucide-react";
import { Section } from "@/components/shared/section";
import { staggerContainer, staggerItem } from "@/lib/animations";

export const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    // TODO: wire up to /api/newsletter/subscribe
    await new Promise((r) => setTimeout(r, 1200));
    setStatus("success");
  };

  return (
    <Section id="newsletter" className="bg-amber-50/60">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="max-w-2xl mx-auto text-center"
      >
        {/* Icon */}
        <motion.div variants={staggerItem} className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-xs bg-amber-100 border border-amber-200 flex items-center justify-center">
            <Mail className="w-6 h-6 text-amber-600" />
          </div>
        </motion.div>

        {/* Eyebrow */}
        <motion.p
          variants={staggerItem}
          className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-600 mb-4"
        >
          Newsletter
        </motion.p>

        <motion.h2
          variants={staggerItem}
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight"
        >
          Thinking Out Loud
        </motion.h2>

        <motion.p
          variants={staggerItem}
          className="text-gray-500 leading-relaxed mb-8 max-w-md mx-auto"
        >
          Weekly dispatches on AI, technology, entrepreneurship, and ideas worth
          thinking about. No fluff. No spam.
        </motion.p>

        {/* Form */}
        <motion.form
          variants={staggerItem}
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
        >
          {status === "success" ? (
            <div className="flex items-center justify-center gap-2 w-full py-3 bg-green-50 border border-green-200 rounded-xs text-green-700 font-medium text-sm">
              <Check className="w-4 h-4" />
              You&apos;re subscribed — welcome aboard!
            </div>
          ) : (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 px-4 py-3 border border-gray-200 bg-white rounded-xs text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all duration-200"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="group inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold text-sm px-6 py-3 rounded-xs transition-all duration-200 whitespace-nowrap"
              >
                {status === "loading" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </>
                )}
              </button>
            </>
          )}
        </motion.form>

        <motion.p variants={staggerItem} className="text-xs text-gray-400 mt-4">
          Join thoughtful readers. Unsubscribe anytime.
        </motion.p>
      </motion.div>
    </Section>
  );
};