import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Access your Travel Voice account and manage your AI voice experiences.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Layered gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F5FBFF] via-white to-[#FDECF2]" />

      {/* Subtle grid overlay */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(0,0,0,.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,.25)_1px,transparent_1px)] [background-size:40px_40px]"
      />

      {/* Ambient gradient orbs */}
      <div className="absolute -top-28 -right-28 w-[28rem] h-[28rem] bg-gradient-to-br from-[#1AADF0]/30 via-[#7CD3F7]/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute -bottom-28 -left-28 w-[28rem] h-[28rem] bg-gradient-to-tr from-[#F52E60]/25 via-[#FF7CA3]/20 to-transparent rounded-full blur-3xl" />

      {/* Animated floating orb */}
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 w-72 h-72 rounded-full bg-[radial-gradient(circle_at_30%_30%,#1AADF0_0%,transparent_60%)] opacity-30 blur-2xl animate-pulse" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="mb-6 flex flex-col items-center">
              <Image
                src="/logo/logo-travelvoice.png"
                alt="Travel Voice"
                width={300}
                height={60}
                className="h-10 w-auto drop-shadow-sm"
                unoptimized
                priority
              />
              <p className="mt-4 text-lg text-gray-700 font-semibold">
                AI-powered voice assistant platform
              </p>
            </div>
          </div>

          {/* Main Content - glass card with gradient border */}
          <div className="relative rounded-2xl">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[#1AADF0]/50 via-white/40 to-[#F52E60]/50 opacity-80 blur" />
            <div className="relative rounded-2xl bg-white/80 backdrop-blur-xl shadow-2xl border border-white/60">
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5" />
              <div className="relative z-10 p-8">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 