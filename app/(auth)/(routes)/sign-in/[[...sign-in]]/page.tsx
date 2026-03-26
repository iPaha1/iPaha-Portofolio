// app/sign-in/page.tsx
"use client";

import { motion } from "framer-motion";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {


  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-900 dark:to-gray-950 flex flex-col">
      {/* Background Elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-amber-200/30 dark:bg-amber-900/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-amber-300/30 dark:bg-amber-800/10 rounded-full blur-3xl -z-10"></div>      

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-2 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Left Column - Illustration/Message */}
          <div className="relative p-8 lg:p-12 hidden lg:flex flex-col justify-between bg-gradient-to-br from-amber-400 to-amber-600 text-white">
            {/* Abstract shapes */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mt-20 -mr-20"></div>
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/10 rounded-full -mb-32 -ml-32"></div>
            
          
          </div>
          
          {/* Right Column - Sign In Form */}
          <div className="p-2 md:p-12 lg:p-12 flex flex-col justify-center">
            <div className="mx-auto w-full max-w-md">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="mb-6 text-center lg:text-left"
              >
                <h1 className="hidden md:block text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Sign In to Your Account</h1>
                <p className="hidden md:block text-gray-600 dark:text-gray-300">
                  Enter your credentials to access your timeline and insights
                </p>
              </motion.div>
              
              {/* Clerk Sign In Component */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <SignIn 
                  appearance={{
                    elements: {
                      card: "shadow-none",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      formButtonPrimary: "bg-amber-500 hover:bg-amber-600",
                      footerAction: "text-amber-600",
                      formField: "mb-5",
                      formFieldRow: "mb-5",
                      formFieldLabel: "text-gray-700 dark:text-gray-300",
                      formFieldInput: "rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-800",
                      identityPreview: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
                      identityPreviewText: "text-amber-600 dark:text-amber-400",
                      identityPreviewEditButton: "text-amber-600 dark:text-amber-400",
                      formHeaderTitle: "hidden",
                      formHeaderSubtitle: "hidden",
                      socialButtonsBlockButton: "border-gray-300 dark:border-gray-700",
                      socialButtonsBlockButtonText: "text-gray-800 dark:text-gray-200",
                      socialButtonsBlockButtonArrow: "text-gray-800 dark:text-gray-200"
                    }
                  }}
                />
              </motion.div>
      
            </div>
          </div>
        </div>
      </main>
      
      
    </div>
  );
}