"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";

const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
};

export default function VerifyEmailPage() {
  const { user } = useAuthStore();
  const [emailResent, setEmailResent] = useState(false);

  const handleResendEmail = async () => {
    // In a real implementation, you'd call an API to resend the email
    setEmailResent(true);
    setTimeout(() => setEmailResent(false), 3000);
  };

  return (
    <motion.div
      variants={fadeInVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="space-y-6">
        {/* Icon */}
        <motion.div
          className="flex justify-center mb-6"
          variants={fadeInVariants}
        >
          <div className="w-16 h-16 bg-gradient-to-r from-[#1AADF0]/20 to-[#F52E60]/20 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-[#1AADF0]" />
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          className="text-center"
          variants={fadeInVariants}
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Check your email
          </h2>
          <p className="text-gray-600 mb-4">
            We sent a verification link to
          </p>
          <p className="font-medium text-gray-900 mb-4">
            {user?.email || "your email"}
          </p>
          <p className="text-sm text-gray-500">
            Click the link in the email to verify your account and get started.
          </p>
        </motion.div>

        {/* Instructions */}
        <motion.div
          className="bg-gray-50 rounded-lg p-4 space-y-2"
          variants={fadeInVariants}
        >
          <p className="text-sm text-gray-700 font-medium">What to do next:</p>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Check your email inbox</li>
            <li>Look for an email from Neural Voice</li>
            <li>Click the verification link</li>
            <li>You'll be redirected to sign in</li>
          </ol>
        </motion.div>

        {/* Resend */}
        <motion.div
          className="text-center"
          variants={fadeInVariants}
        >
          {emailResent ? (
            <p className="text-sm text-green-600 mb-2">
              ✓ Verification email sent!
            </p>
          ) : (
            <p className="text-sm text-gray-600 mb-2">
              Didn&apos;t receive the email?
            </p>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResendEmail}
            disabled={emailResent}
            className="text-[#1AADF0] hover:text-[#0996d4] hover:bg-[#1AADF0]/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Resend verification email
          </Button>
        </motion.div>

        {/* Footer Links */}
        <motion.div
          className="text-center"
          variants={fadeInVariants}
        >
          <Link href="/auth/sign-in">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="w-4 w-4 mr-2" />
              Back to sign in
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
