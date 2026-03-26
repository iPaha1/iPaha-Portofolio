"use client";

// =============================================================================
// isaacpaha.com — Navbar (updated)
// components/_home/navbar.tsx
//
// Changes:
//   • Accepts isAdmin + userId props from the server layout
//   • Shows "Dashboard" button (amber, with grid icon) when isAdmin === true
//   • Shows "Subscribe" button when not admin
//   • UserButton always visible (Clerk — shows sign-in/out)
//   • All existing mobile + scroll behaviour preserved
// =============================================================================

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Pen, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import Logo from "../global/logo";

const NAV_LINKS = [
  { label: "Blog",      href: "/blog" },
  { label: "Apps",      href: "/apps" },
  { label: "Ideas Lab", href: "/ideas" },
  { label: "Tools",     href: "/tools" },
  { label: "Games",     href: "/games" },
  { label: "Now",     href: "/now" },
];

interface NavbarProps {
  isAdmin: boolean;
  userId: string | null;
}

export const Navbar = ({ isAdmin, userId }: NavbarProps) => {
  const pathname    = usePathname();
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const dashboardHref = userId ? `/admin/${userId}/dashboard` : "/sign-in";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ─────────────────────────────────────────────────── */}
            <Logo/>
            {/* <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-amber-500 rounded-xs flex items-center justify-center">
                <Pen className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-gray-900 tracking-tight text-lg">
                Isaac<span className="text-amber-500">.</span>
              </span>
            </Link> */}

            {/* ── Desktop nav ──────────────────────────────────────────── */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive =
                  link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium rounded-xs transition-all duration-200",
                      isActive
                        ? "text-amber-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-500 rounded-full"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* ── CTA + Auth ───────────────────────────────────────────── */}
            <div className="flex items-center gap-2.5">
              {/* Clerk user button — shows avatar if signed in, sign-in if not */}
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 rounded-full border-2 border-amber-200",
                  },
                }}
              />

              {/* Admin: Dashboard button */}
              {isAdmin && (
                <Link
                  href={dashboardHref}
                  className="hidden md:inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold px-4 py-2 rounded-xs transition-all duration-200 group"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 group-hover:rotate-3 transition-transform" />
                  Dashboard
                </Link>
              )}

              {/* Non-admin (or signed out): Subscribe button */}
              {!isAdmin && (
                <Link
                  href="/newsletter"
                  className="hidden md:inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xs transition-all duration-200"
                >
                  Subscribe
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-xs border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
              >
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile menu ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-lg px-4 py-4 md:hidden"
          >
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const isActive =
                  link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-4 py-3 text-sm font-medium rounded-xs transition-all duration-200",
                      isActive
                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Mobile CTA — admin vs subscriber */}
              {isAdmin ? (
                <Link
                  href={dashboardHref}
                  className="mt-2 flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold px-4 py-3 rounded-xs transition-all duration-200"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Admin Dashboard
                </Link>
              ) : (
                <Link
                  href="/newsletter"
                  className="mt-2 text-center bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-3 rounded-xs transition-all duration-200"
                >
                  Subscribe to Newsletter
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;





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