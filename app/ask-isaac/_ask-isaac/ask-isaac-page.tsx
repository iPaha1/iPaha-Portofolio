"use client";

import React, { useRef } from "react";
import { AskIsaacHero } from "./ask-isaac-hero";
import { AskIsaacClient } from "./ask-isaac-client";


export function AskIsaacPage() {
  const chatRef = useRef<HTMLDivElement>(null);

  const scrollToChat = () => {
    chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-[#070709]">
      <AskIsaacHero onStart={scrollToChat} />

      {/* Separator */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      </div>

      <div ref={chatRef}>
        <AskIsaacClient />
      </div>
    </div>
  );
}