"use client";

// =============================================================================
// isaacpaha.com — Navbar (enhanced UI/UX)
// components/_home/navbar.tsx
//
// Enhancements:
//   • Smooth glass morphism effect on scroll
//   • Micro-interactions (hover animations, ripple effects)
//   • Active indicator with glow
//   • User avatar with status indicator
//   • Dashboard button with gradient
//   • Mobile menu with slide animations
//   • Keyboard shortcuts (press 'M' for mobile menu)
//   • Focus states for accessibility
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, X, Pen, LayoutDashboard, 
  Sparkles, ChevronRight, Circle, 
  Zap, Crown, Award 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton, useUser } from "@clerk/nextjs";
import Logo from "../global/logo";

const NAV_LINKS = [
  { label: "Blog",      href: "/blog", icon: Pen, glow: "#f59e0b" },
  { label: "Apps",      href: "/apps", icon: Zap, glow: "#06b6d4" },
  { label: "Ideas Lab", href: "/ideas", icon: Sparkles, glow: "#a855f7" },
  { label: "Tools",     href: "/tools", icon: Crown, glow: "#10b981" },
  { label: "Games",     href: "/games", icon: Award, glow: "#ef4444" },
  { label: "Now",       href: "/now", icon: Circle, glow: "#6366f1" },
];

interface NavbarProps {
  isAdmin: boolean;
  userId: string | null;
}

export const Navbar = ({ isAdmin, userId }: NavbarProps) => {
  const pathname    = usePathname();
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const { user } = useUser();

  // Scroll handler with throttling
  useEffect(() => {
    let ticking = false;
    const handler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [pathname]);

  // Keyboard shortcut: 'M' to toggle mobile menu
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        setMobileOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const dashboardHref = userId ? `/admin/${userId}/dashboard` : "/sign-in";

  // Animation variants
  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring" as const, 
        damping: 20, 
        stiffness: 300,
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  const mobileItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-b border-gray-100/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]"
            : "bg-transparent"
        )}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">

            {/* ── Logo with hover animation ── */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative"
            >
              <Logo />
              {/* Decorative ring */}
              {!scrolled && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                  className="absolute -inset-2 rounded-full border border-amber-500/20"
                  style={{ pointerEvents: "none" }}
                />
              )}
            </motion.div>

            {/* ── Desktop navigation ── */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = link.href === "/" 
                  ? pathname === "/" 
                  : pathname.startsWith(link.href);
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onMouseEnter={() => setHoveredLink(link.href)}
                    onMouseLeave={() => setHoveredLink(null)}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium rounded-xs transition-all duration-200 group",
                      isActive
                        ? "text-amber-600"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    {/* Background hover effect */}
                    <motion.span
                      initial={false}
                      animate={{ 
                        opacity: hoveredLink === link.href ? 1 : 0,
                        scale: hoveredLink === link.href ? 1 : 0.9
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-amber-50 to-transparent rounded-xs -z-0"
                      style={{ pointerEvents: "none" }}
                    />
                    
                    <span className="relative z-10 flex items-center gap-1.5">
                      {/* Icon on hover */}
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ 
                          opacity: hoveredLink === link.href ? 1 : 0,
                          width: hoveredLink === link.href ? "auto" : 0
                        }}
                        className="overflow-hidden"
                      >
                        <link.icon className="w-3.5 h-3.5" />
                      </motion.span>
                      {link.label}
                    </span>

                    {/* Active indicator with glow */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                        style={{ boxShadow: "0 0 8px rgba(245,158,11,0.5)" }}
                      />
                    )}
                    
                    {/* Hover underline */}
                    {!isActive && hoveredLink === link.href && (
                      <motion.span
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-300/50 rounded-full"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* ── Right section: User + CTAs ── */}
            <div className="flex items-center gap-3">
              {/* User button with enhanced styling */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 rounded-full ring-2 ring-amber-200/50 hover:ring-amber-400 transition-all duration-300",
                      userButtonPopoverCard: "rounded-xs shadow-xl",
                    },
                  }}
                />
                {/* Online status indicator (if user is signed in) */}
                {user && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white" />
                )}
              </motion.div>

              {/* Admin Dashboard Button - Enhanced */}
              {isAdmin && (
                <motion.div
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="hidden md:block"
                >
                  <Link
                    href={dashboardHref}
                    className="relative overflow-hidden group flex items-center gap-2 bg-gradient-to-r from-stone-800 to-stone-900 hover:from-stone-700 hover:to-stone-800 text-white text-sm font-semibold px-4 py-2 rounded-xs transition-all duration-300"
                  >
                    {/* Shimmer effect */}
                    <motion.div
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    />
                    <LayoutDashboard className="w-3.5 h-3.5 group-hover:rotate-3 transition-transform duration-300" />
                    <span>Dashboard</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0 transition-all duration-300" />
                  </Link>
                </motion.div>
              )}

              {/* Subscribe Button - Enhanced */}
              {!isAdmin && (
                <motion.div
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="hidden md:block"
                >
                  <Link
                    href="/newsletter"
                    className="relative overflow-hidden group flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-xs transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    {/* Animated sparkle */}
                    <motion.span
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </motion.span>
                    <span>Subscribe</span>
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </motion.span>
                  </Link>
                </motion.div>
              )}

              {/* Mobile menu toggle - Enhanced */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
                className="md:hidden relative w-9 h-9 flex items-center justify-center rounded-xs border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-amber-200 transition-all duration-300"
              >
                <AnimatePresence mode="wait">
                  {mobileOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Bottom gradient line when scrolled */}
        {scrolled && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"
          />
        )}
      </header>

      {/* ── Mobile Menu (Enhanced) ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-xl rounded-b-2xl mx-4 md:hidden overflow-hidden"
          >
            <nav className="flex flex-col gap-1 p-4">
              {NAV_LINKS.map((link) => {
                const isActive = link.href === "/" 
                  ? pathname === "/" 
                  : pathname.startsWith(link.href);
                
                return (
                  <motion.div
                    key={link.href}
                    variants={mobileItemVariants}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xs transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-amber-50 to-transparent text-amber-600 border-l-2 border-amber-500"
                          : "text-gray-700 hover:bg-gray-50 hover:pl-5"
                      )}
                    >
                      <link.icon className={cn(
                        "w-4 h-4 transition-all",
                        isActive ? "text-amber-500" : "text-gray-400"
                      )} />
                      {link.label}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto"
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                        </motion.div>
                      )}
                    </Link>
                  </motion.div>
                );
              })}

              {/* Divider */}
              <div className="my-2 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

              {/* Mobile CTAs */}
              {isAdmin ? (
                <motion.div
                  variants={mobileItemVariants}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={dashboardHref}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-stone-800 to-stone-900 hover:from-stone-700 hover:to-stone-800 text-white text-sm font-semibold px-4 py-3 rounded-xs transition-all duration-300"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin Dashboard
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  variants={mobileItemVariants}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href="/newsletter"
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-semibold px-4 py-3 rounded-xs transition-all duration-300 shadow-md"
                  >
                    <Sparkles className="w-4 h-4" />
                    Subscribe to Newsletter
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>
              )}

              {/* Keyboard hint */}
              <motion.p
                variants={mobileItemVariants}
                className="hidden md:block text-center text-[10px] text-gray-400 mt-3 pt-2 border-t border-gray-100"
              >
                Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-xs text-[9px] font-mono">M</kbd> to close
              </motion.p>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;





// "use client";

// // =============================================================================
// // isaacpaha.com — Navbar (updated)
// // components/_home/navbar.tsx
// //
// // Changes:
// //   • Accepts isAdmin + userId props from the server layout
// //   • Shows "Dashboard" button (amber, with grid icon) when isAdmin === true
// //   • Shows "Subscribe" button when not admin
// //   • UserButton always visible (Clerk — shows sign-in/out)
// //   • All existing mobile + scroll behaviour preserved
// // =============================================================================

// import React, { useState, useEffect } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import { Menu, X, Pen, LayoutDashboard } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { UserButton } from "@clerk/nextjs";
// import Logo from "../global/logo";

// const NAV_LINKS = [
//   { label: "Blog",      href: "/blog" },
//   { label: "Apps",      href: "/apps" },
//   { label: "Ideas Lab", href: "/ideas" },
//   { label: "Tools",     href: "/tools" },
//   { label: "Games",     href: "/games" },
//   { label: "Now",     href: "/now" },
// ];

// interface NavbarProps {
//   isAdmin: boolean;
//   userId: string | null;
// }

// export const Navbar = ({ isAdmin, userId }: NavbarProps) => {
//   const pathname    = usePathname();
//   const [scrolled,    setScrolled]    = useState(false);
//   const [mobileOpen,  setMobileOpen]  = useState(false);

//   useEffect(() => {
//     const handler = () => setScrolled(window.scrollY > 20);
//     window.addEventListener("scroll", handler, { passive: true });
//     return () => window.removeEventListener("scroll", handler);
//   }, []);

//   useEffect(() => setMobileOpen(false), [pathname]);

//   const dashboardHref = userId ? `/admin/${userId}/dashboard` : "/sign-in";

//   return (
//     <>
//       <header
//         className={cn(
//           "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
//           scrolled
//             ? "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm"
//             : "bg-transparent"
//         )}
//       >
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16">

//             {/* ── Logo ─────────────────────────────────────────────────── */}
//             <Logo/>
//             {/* <Link href="/" className="flex items-center gap-2 group">
//               <div className="w-8 h-8 bg-amber-500 rounded-xs flex items-center justify-center">
//                 <Pen className="w-4 h-4 text-white" />
//               </div>
//               <span className="font-black text-gray-900 tracking-tight text-lg">
//                 Isaac<span className="text-amber-500">.</span>
//               </span>
//             </Link> */}

//             {/* ── Desktop nav ──────────────────────────────────────────── */}
//             <nav className="hidden md:flex items-center gap-1">
//               {NAV_LINKS.map((link) => {
//                 const isActive =
//                   link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
//                 return (
//                   <Link
//                     key={link.href}
//                     href={link.href}
//                     className={cn(
//                       "relative px-4 py-2 text-sm font-medium rounded-xs transition-all duration-200",
//                       isActive
//                         ? "text-amber-600"
//                         : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
//                     )}
//                   >
//                     {link.label}
//                     {isActive && (
//                       <motion.span
//                         layoutId="nav-active"
//                         className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-500 rounded-full"
//                       />
//                     )}
//                   </Link>
//                 );
//               })}
//             </nav>

//             {/* ── CTA + Auth ───────────────────────────────────────────── */}
//             <div className="flex items-center gap-2.5">
//               {/* Clerk user button — shows avatar if signed in, sign-in if not */}
//               <UserButton
//                 appearance={{
//                   elements: {
//                     avatarBox: "w-8 h-8 rounded-full border-2 border-amber-200",
//                   },
//                 }}
//               />

//               {/* Admin: Dashboard button */}
//               {isAdmin && (
//                 <Link
//                   href={dashboardHref}
//                   className="hidden md:inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold px-4 py-2 rounded-xs transition-all duration-200 group"
//                 >
//                   <LayoutDashboard className="w-3.5 h-3.5 group-hover:rotate-3 transition-transform" />
//                   Dashboard
//                 </Link>
//               )}

//               {/* Non-admin (or signed out): Subscribe button */}
//               {!isAdmin && (
//                 <Link
//                   href="/newsletter"
//                   className="hidden md:inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xs transition-all duration-200"
//                 >
//                   Subscribe
//                 </Link>
//               )}

//               {/* Mobile menu toggle */}
//               <button
//                 onClick={() => setMobileOpen(!mobileOpen)}
//                 aria-label="Toggle menu"
//                 className="md:hidden w-9 h-9 flex items-center justify-center rounded-xs border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
//               >
//                 {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* ── Mobile menu ──────────────────────────────────────────────────── */}
//       <AnimatePresence>
//         {mobileOpen && (
//           <motion.div
//             initial={{ opacity: 0, y: -12 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -12 }}
//             transition={{ duration: 0.2 }}
//             className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-lg px-4 py-4 md:hidden"
//           >
//             <nav className="flex flex-col gap-1">
//               {NAV_LINKS.map((link) => {
//                 const isActive =
//                   link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
//                 return (
//                   <Link
//                     key={link.href}
//                     href={link.href}
//                     className={cn(
//                       "px-4 py-3 text-sm font-medium rounded-xs transition-all duration-200",
//                       isActive
//                         ? "bg-amber-50 text-amber-600 border border-amber-100"
//                         : "text-gray-700 hover:bg-gray-50"
//                     )}
//                   >
//                     {link.label}
//                   </Link>
//                 );
//               })}

//               {/* Mobile CTA — admin vs subscriber */}
//               {isAdmin ? (
//                 <Link
//                   href={dashboardHref}
//                   className="mt-2 flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold px-4 py-3 rounded-xs transition-all duration-200"
//                 >
//                   <LayoutDashboard className="w-4 h-4" />
//                   Admin Dashboard
//                 </Link>
//               ) : (
//                 <Link
//                   href="/newsletter"
//                   className="mt-2 text-center bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-3 rounded-xs transition-all duration-200"
//                 >
//                   Subscribe to Newsletter
//                 </Link>
//               )}
//             </nav>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </>
//   );
// };

// export default Navbar;





// "use client";

// import React, { useState, useEffect } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import { Menu, X, Pen } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { UserButton } from "@clerk/nextjs";

// const NAV_LINKS = [
//   // { label: "Home", href: "/" },
//   { label: "Blog", href: "/blog" },
//   { label: "Apps", href: "/apps" },
//   { label: "Ideas Lab", href: "/ideas" },
//   { label: "Tools", href: "/tools" },
//   { label: "Now", href: "/now" },
// ];

// export const Navbar = () => {
//   const pathname = usePathname();
//   const [scrolled, setScrolled] = useState(false);
//   const [mobileOpen, setMobileOpen] = useState(false);

//   useEffect(() => {
//     const handler = () => setScrolled(window.scrollY > 20);
//     window.addEventListener("scroll", handler, { passive: true });
//     return () => window.removeEventListener("scroll", handler);
//   }, []);

//   // Close mobile menu on route change
//   useEffect(() => setMobileOpen(false), [pathname]);

//   return (
//     <>
//       <header
//         className={cn(
//           "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
//           scrolled
//             ? "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm"
//             : "bg-transparent"
//         )}
//       >
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16">
//             {/* Logo */}
//             <Link href="/" className="flex items-center gap-2 group">
//               <div className="w-8 h-8 bg-amber-500 rounded-xs flex items-center justify-center">
//                 <Pen className="w-4 h-4 text-white" />
//               </div>
//               <span className="font-black text-gray-900 tracking-tight text-lg">
//                 Isaac<span className="text-amber-500">.</span>
//               </span>
//             </Link>

//             {/* Desktop nav */}
//             <nav className="hidden md:flex items-center gap-1">
//               {NAV_LINKS.map((link) => {
//                 const isActive =
//                   link.href === "/"
//                     ? pathname === "/"
//                     : pathname.startsWith(link.href);
//                 return (
//                   <Link
//                     key={link.href}
//                     href={link.href}
//                     className={cn(
//                       "relative px-4 py-2 text-sm font-medium rounded-xs transition-all duration-200",
//                       isActive
//                         ? "text-amber-600"
//                         : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
//                     )}
//                   >
//                     {link.label}
//                     {isActive && (
//                       <motion.span
//                         layoutId="nav-active"
//                         className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-500 rounded-full"
//                       />
//                     )}
//                   </Link>
//                 );
//               })}
//             </nav>

//             {/* CTA + mobile toggle */}
//             <div className="flex items-center gap-3">
//               {/* add clerk user button nicely */}
//               <UserButton />
//               <Link
//                 href="/newsletter"
//                 className="hidden md:inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xs transition-all duration-200"
//               >
//                 Subscribe
//               </Link>

//               <button
//                 onClick={() => setMobileOpen(!mobileOpen)}
//                 aria-label="Toggle menu"
//                 className="md:hidden w-9 h-9 flex items-center justify-center rounded-xs border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
//               >
//                 {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Mobile menu */}
//       <AnimatePresence>
//         {mobileOpen && (
//           <motion.div
//             initial={{ opacity: 0, y: -12 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -12 }}
//             transition={{ duration: 0.2 }}
//             className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-lg px-4 py-4 md:hidden"
//           >
//             <nav className="flex flex-col gap-1">
//               {NAV_LINKS.map((link) => {
//                 const isActive =
//                   link.href === "/"
//                     ? pathname === "/"
//                     : pathname.startsWith(link.href);
//                 return (
//                   <Link
//                     key={link.href}
//                     href={link.href}
//                     className={cn(
//                       "px-4 py-3 text-sm font-medium rounded-xs transition-all duration-200",
//                       isActive
//                         ? "bg-amber-50 text-amber-600 border border-amber-100"
//                         : "text-gray-700 hover:bg-gray-50"
//                     )}
//                   >
//                     {link.label}
//                   </Link>
//                 );
//               })}
//               <Link
//                 href="/newsletter"
//                 className="mt-2 text-center bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-3 rounded-xs transition-all duration-200"
//               >
//                 Subscribe to Newsletter
//               </Link>
//             </nav>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </>
//   );
// };

// export default Navbar;