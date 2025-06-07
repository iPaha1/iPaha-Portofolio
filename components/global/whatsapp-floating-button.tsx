// components/ui/whatsapp-floating-button.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { openWhatsApp } from '@/lib/whatsapp';

export const WhatsAppFloatingButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => openWhatsApp(undefined, "Hi Isaac! I'd like to get in touch about a potential project.")}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
        title="Chat with Isaac on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
      
      {isHovered && (
        <div className="absolute bottom-16 right-0 bg-black text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
          Chat on WhatsApp
          <div className="absolute top-full right-4 w-2 h-2 bg-black rotate-45 transform"></div>
        </div>
      )}
    </div>
  );
};