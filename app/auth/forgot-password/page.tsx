"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle,Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/stores/auth-store";


const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword, error, clearError, isLoading, isEmailSent } = useAuthStore();
  const [showError, setShowError] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setShowError(false);
    clearError();
    
    try {
      await forgotPassword(data.email);
    } catch (err) {
      setShowError(true);
    }
  };

  if (isEmailSent) {
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
              Check your email
            </h2>
            <p className="text-gray-600 mb-4">
              We&apos;ve sent a password reset link to your email address
            </p>
            <p className="text-sm text-gray-500">
              If an account exists for <span className="font-medium text-gray-700">{form.getValues("email")}</span>, you will receive an email with instructions on how to reset your password.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div 
            className="space-y-4"
            variants={fadeInVariants}
          >
            <Link href="/auth/sign-in" className="w-full block">
              <Button variant="outline" className="w-full h-12">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to sign in
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    );
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
            Forgot your password?
          </h2>
          <p className="text-gray-600">
            Enter your email address and we&apos;ll send you a link to reset your password
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 font-medium">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            type="email"
                            placeholder="name@example.com"
                            className="pl-10 h-12"
                            {...field}
                            disabled={isLoading}
                          />
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
                      <span>Sending email...</span>
                    </div>
                  ) : (
                    "Send reset email"
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