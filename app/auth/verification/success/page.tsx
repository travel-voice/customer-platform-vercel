"use client";

import { motion } from "framer-motion";
import { ArrowRight,CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";


const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

const successVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      delay: 0.2
    }
  }
};

const staggeredVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

export default function VerificationSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home after 5 seconds
    const timeout = setTimeout(() => {
      router.push("/home");
    }, 5000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <motion.div
      variants={fadeInVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="space-y-8 text-center">
        {/* Success Icon */}
        <motion.div 
          className="flex justify-center"
          variants={successVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-[#28F16B]/20 to-[#28F16B]/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-[#28F16B]" />
            </div>
            {/* Animated rings */}
            <div className="absolute inset-0 rounded-full border-2 border-[#28F16B]/30 animate-ping" />
            <div className="absolute inset-0 rounded-full border border-[#28F16B]/20 animate-pulse" />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div 
          variants={staggeredVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeInVariants}>
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
              Email verified!
            </h2>
          </motion.div>
          
          <motion.div variants={fadeInVariants}>
            <p className="text-xl text-gray-600 mb-2">
              Your email has been successfully verified.
            </p>
            <p className="text-gray-500">
              You can now access all Travel Voice features.
            </p>
          </motion.div>
        </motion.div>

        {/* Auto-redirect notice */}
        <motion.div 
          className="bg-gradient-to-r from-[#1AADF0]/10 to-[#F52E60]/10 rounded-xl p-4"
          variants={fadeInVariants}
        >
          <p className="text-sm text-gray-600">
            You will be redirected to the dashboard in a few seconds...
          </p>
        </motion.div>

        {/* Action Button */}
        <motion.div 
          variants={fadeInVariants}
        >
          <Link href="/home" className="inline-block">
            <Button size="lg" className="px-8 font-bold group">
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>

        {/* Decorative elements */}
        <div className="relative">
          <motion.div 
            className="absolute -top-10 left-1/4 w-3 h-3 bg-[#1AADF0] rounded-full opacity-60"
            animate={{
              y: [0, -10, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.5
            }}
          />
          <motion.div 
            className="absolute -top-6 right-1/3 w-2 h-2 bg-[#F52E60] rounded-full opacity-60"
            animate={{
              y: [0, -8, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: 1
            }}
          />
          <motion.div 
            className="absolute -bottom-4 left-1/3 w-1.5 h-1.5 bg-[#28F16B] rounded-full opacity-60"
            animate={{
              y: [0, -6, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 1.5
            }}
          />
        </div>
      </div>
    </motion.div>
  );
} 