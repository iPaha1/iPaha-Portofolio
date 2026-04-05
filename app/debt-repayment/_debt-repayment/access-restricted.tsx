// components/debt/AccessRestricted.tsx

import { UserButton } from "@clerk/nextjs";

export function AccessRestricted() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1714] text-[#f5f0e8]">
      <div className="text-center max-w-md px-6">
        <div className="text-6xl mb-6">🔒</div>
        <h1
          className="text-3xl mb-4"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
        >
          Access Restricted
        </h1>
        <p className="text-[#a09880] mb-8 leading-relaxed">
          This page is a private record between Isaac and Fokanta. It is not
          accessible to other accounts.
        </p>
        <div className="flex justify-center">
          <UserButton />
        </div>
      </div>
    </div>
  );
}