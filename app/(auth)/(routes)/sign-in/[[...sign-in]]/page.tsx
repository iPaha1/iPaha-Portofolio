// app/sign-in/page.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SignIn, useSignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Sparkles, 
  Shield, 
  Zap, 
  ArrowRight,
  Gamepad2,
  Users,
  Trophy,
  Coins,
  Drill,
  Lightbulb
} from "lucide-react";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirectUrl") || "/games";
  const { signIn } = useSignIn();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Features for the right panel
  const features = [
    { icon: Drill, title: "Powerful Tools", desc: "AI CV analyser, code generator & more" },
    { icon: Lightbulb, title: "Ideas Lab", desc: "Ideas worth building? Submit and vote on new ideas" },
    { icon: Gamepad2, title: "30+ Games", desc: "Play solo or challenge friends" },
    { icon: Users, title: "Multiplayer", desc: "Real-time 1v1 battles" },
    { icon: Trophy, title: "Leaderboards", desc: "Compete globally" },
    { icon: Coins, title: "Earn Tokens", desc: "Win and cash out" },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="absolute top-20 -right-40 w-80 h-80 bg-amber-200/30 dark:bg-amber-900/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 -left-40 w-80 h-80 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200/20 dark:bg-cyan-900/10 rounded-full blur-3xl"
        />
      </div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-5xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-xs overflow-hidden shadow-2xl">
          
          {/* LEFT COLUMN - Welcome Message (Desktop only) */}
          <div className="hidden lg:flex relative bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 p-8 flex-col justify-between min-h-[600px]">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full -ml-32 -mb-32" />
            
            {/* Animated floating particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 0.5, 0],
                  scale: [0, 1, 0],
                  y: [0, -100, -200],
                  x: [0, (i % 2 === 0 ? 50 : -50), 0],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 5 + i,
                  delay: i * 0.8,
                  ease: "easeOut"
                }}
                className="absolute w-2 h-2 bg-white/40 rounded-xs"
                style={{ left: `${20 + i * 15}%`, top: `${30 + i * 10}%` }}
              />
            ))}
            
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-14 h-14 bg-white/20 rounded-xs flex items-center justify-center mb-6 backdrop-blur-sm"
              >
                <Sparkles className="w-7 h-7 text-white" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-black text-white mb-3 tracking-tight"
              >
                Welcome Back
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/80 text-sm leading-relaxed mb-8"
              >
                Sign in to access your dashboard, track your progress, and compete with players worldwide.
              </motion.p>
            </div>

            {/* Features grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative z-10 grid grid-cols-2 gap-3"
            >
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02, x: 3 }}
                  className="flex items-center gap-2 p-2 rounded-xs bg-white/10 backdrop-blur-sm"
                >
                  <feature.icon className="w-4 h-4 text-white/80" />
                  <div>
                    <p className="text-xs font-bold text-white">{feature.title}</p>
                    <p className="text-[9px] text-white/60">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Bottom decorative text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="relative z-10 text-[10px] text-white/40 mt-8"
            >
              Secure authentication powered by Clerk
            </motion.p>
          </div>

          {/* RIGHT COLUMN - Sign In Form */}
          <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 md:p-10 flex items-center justify-center">
            <div className="w-full max-w-md">
              {/* Mobile header (only visible on small screens) */}
              <div className="lg:hidden text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                  className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xs flex items-center justify-center mx-auto mb-3"
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </motion.div>
                <h1 className="text-xl font-black text-gray-900 dark:text-white mb-1">
                  Welcome Back
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sign in to continue your journey
                </p>
              </div>

              {/* Clerk Sign In Component */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SignIn 
                  routing="path"
                  path="/sign-in"
                  signUpUrl="/sign-up"
                  forceRedirectUrl={redirectUrl}
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none bg-transparent w-full p-0",
                      header: "hidden",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      form: "space-y-4",
                      formButtonPrimary: 
                        "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-2.5 px-4 rounded-xs transition-all duration-200 shadow-md hover:shadow-lg text-sm",
                      formField: "mb-4",
                      formFieldRow: "mb-4",
                      formFieldLabel: "text-gray-700 dark:text-gray-300 text-xs font-semibold mb-1.5 block",
                      formFieldInput: 
                        "w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xs text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all",
                      formFieldInputShowPasswordButton: "text-gray-400 hover:text-gray-600",
                      identityPreview: 
                        "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xs p-3",
                      identityPreviewText: "text-amber-700 dark:text-amber-400 text-sm font-medium",
                      identityPreviewEditButton: "text-amber-600 dark:text-amber-400 text-xs hover:text-amber-700",
                      formHeaderTitle: "hidden",
                      formHeaderSubtitle: "hidden",
                      socialButtonsBlockButton: 
                        "w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xs text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200",
                      socialButtonsBlockButtonText: "text-sm",
                      socialButtonsBlockButtonArrow: "hidden",
                      footer: "mt-6",
                      footerActionLink: "text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold text-sm transition-colors",
                      dividerLine: "bg-gray-200 dark:bg-gray-700",
                      dividerText: "text-gray-400 dark:text-gray-500 text-xs",
                      formFieldAction: "text-amber-600 dark:text-amber-400 text-xs hover:text-amber-700",
                      formFieldError: "text-red-500 text-xs mt-1",
                      otpCodeFieldInput: "w-12 h-12 text-center text-lg font-bold border border-gray-200 dark:border-gray-700 rounded-xs",
                      backLink: "text-amber-600 dark:text-amber-400 text-sm",
                    },
                    layout: {
                      socialButtonsPlacement: "bottom",
                      showOptionalFields: false,
                    },
                  }}
                />
              </motion.div>

              {/* Redirect indicator */}
              {redirectUrl !== "/games" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-4 flex items-center justify-center gap-1"
                >
                  <ArrowRight className="w-3 h-3" />
                  You'll be redirected back to continue
                </motion.p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-4"
        >
          By signing in, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  );
}