"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowLeft,CheckCircle, Eye, EyeOff, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense,useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/stores/auth-store";


const resetPasswordSchema = z.object({
  password: z.string()
    .min(12, "Password must be at least 12 characters long")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

const staggeredVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword, error, clearError, isLoading, isPasswordChanged } = useAuthStore();
  const [showError, setShowError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setShowError(false);
    clearError();

    try {
      // Supabase handles the token automatically from the email link
      await resetPassword({
        password: data.password,
        token: '', // Token not needed with Supabase - it's in the session
      });
    } catch (err) {
      setShowError(true);
    }
  };

  if (isPasswordChanged) {
    return (
      <motion.div
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="space-y-6 text-center">
          {/* Success Icon */}
          <motion.div 
            className="flex justify-center mb-6"
            variants={fadeInVariants}
          >
            <div className="w-16 h-16 bg-gradient-to-r from-[#28F16B]/20 to-[#28F16B]/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-[#28F16B]" />
            </div>
          </motion.div>

          {/* Header */}
          <motion.div variants={fadeInVariants}>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
              Password reset successful
            </h2>
            <p className="text-gray-600 mb-4">
              Your password has been successfully reset
            </p>
            <p className="text-sm text-gray-500">
              You can now sign in with your new password.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div 
            className="space-y-4"
            variants={fadeInVariants}
          >
            <Link href="/auth/sign-in" className="w-full block">
              <Button className="w-full h-12">
                Go to sign in
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <motion.div
      variants={fadeInVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="space-y-6">
        {/* Header */}
        <motion.div 
          className="text-center"
          variants={fadeInVariants}
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Reset your password
          </h2>
          <p className="text-gray-600">
            Enter your new password below
          </p>
        </motion.div>

        {/* Form */}
        <motion.div 
          variants={staggeredVariants}
          initial="hidden"
          animate="visible"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <motion.div variants={fadeInVariants}>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 font-medium">New password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your new password"
                            className="pl-10 pr-10 h-12"
                            {...field}
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
              
              <motion.div variants={fadeInVariants}>
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 font-medium">Confirm new password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your new password"
                            className="pl-10 pr-10 h-12"
                            {...field}
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
              
              {showError && error && (
                <motion.div 
                  variants={fadeInVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <motion.div variants={fadeInVariants}>
                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full font-bold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Resetting password...</span>
                    </div>
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </motion.div>
            </form>
          </Form>
        </motion.div>

        {/* Footer Links */}
        <motion.div 
          className="text-center"
          variants={fadeInVariants}
        >
          <Link href="/auth/sign-in" className="w-full block">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to sign in
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1AADF0] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
} 