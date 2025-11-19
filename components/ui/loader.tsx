import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface LoaderProps {
  text?: string;
  subtext?: string;
  className?: string;
}

export function Loader({ 
  text = "Processing...", 
  subtext = "This may take a moment",
  className 
}: LoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-2 border-purple-100 border-t-purple-600"
        />
        
        {/* Inner pulsing circle */}
        <motion.div
          animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 m-auto w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center"
        >
          <Sparkles className="w-5 h-5 text-purple-600" />
        </motion.div>
        
        {/* Orbiting particle */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 m-auto w-20 h-20"
        >
          <div className="w-2 h-2 bg-blue-400 rounded-full absolute top-0 left-1/2 -translate-x-1/2 blur-[1px]" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-center space-y-1"
      >
        <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          {text}
        </h3>
        {subtext && (
          <p className="text-sm text-gray-500">{subtext}</p>
        )}
      </motion.div>
    </div>
  );
}

