"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, User, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const acceptInviteSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AcceptInviteForm = z.infer<typeof acceptInviteSchema>;

interface InvitationInfo {
  email: string;
  role: string;
  organizationName: string;
}

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

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [userExists, setUserExists] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<AcceptInviteForm>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Validate the invitation token on load
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError("Invalid invitation link");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/team/accept-invite?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Invalid invitation");
          setIsLoading(false);
          return;
        }

        setInvitation(data.invitation);
        setUserExists(data.userExists);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to validate invitation");
        setIsLoading(false);
      }
    }

    validateToken();
  }, [token]);

  const handleAcceptInvite = async (data: AcceptInviteForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/team/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          first_name: data.first_name,
          last_name: data.last_name,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to accept invitation");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      
      // Redirect to sign in after a short delay
      setTimeout(() => {
        router.push("/auth/sign-in");
      }, 2000);
    } catch (err) {
      setError("Failed to accept invitation");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1AADF0]" />
        <p className="mt-4 text-muted-foreground">Validating invitation...</p>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <motion.div 
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
        className="text-center py-8"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button 
          className="w-full bg-[#1AADF0] hover:bg-[#0d8bc9]" 
          onClick={() => router.push("/auth/sign-in")}
        >
          Go to Sign In
        </Button>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div 
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
        className="text-center py-8"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to the Team!</h2>
        <p className="text-gray-600 mb-6">
          You&apos;ve successfully joined {invitation?.organizationName}. Redirecting to sign in...
        </p>
        <div className="flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[#1AADF0]" />
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
            Join {invitation?.organizationName}
          </h2>
          <p className="text-gray-600">
            You&apos;ve been invited to join as {invitation?.role === "admin" ? "an Administrator" : "a Team Member"}
          </p>
        </motion.div>

        {/* Content */}
        <motion.div 
          variants={staggeredVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {error && (
            <motion.div variants={fadeInVariants}>
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Email display */}
          <motion.div variants={fadeInVariants}>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-sm text-gray-500">Invitation for</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center space-x-2 text-gray-900 font-medium bg-slate-50 py-3 px-4 rounded-lg border border-slate-100">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>{invitation?.email}</span>
            </div>
          </motion.div>

          {userExists ? (
            <motion.div variants={fadeInVariants} className="space-y-4 pt-4">
              <p className="text-center text-gray-600">
                An account with this email already exists. Please contact support to join this organization.
              </p>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push("/auth/sign-in")}
              >
                Go to Sign In
              </Button>
            </motion.div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAcceptInvite)} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <motion.div variants={fadeInVariants}>
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">First Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                placeholder="John"
                                className="pl-10 h-12"
                                {...field}
                                disabled={isSubmitting}
                              />
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
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Last Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                placeholder="Doe"
                                className="pl-10 h-12"
                                {...field}
                                disabled={isSubmitting}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                </div>

                <motion.div variants={fadeInVariants}>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a password"
                              className="pl-10 pr-10 h-12"
                              {...field}
                              disabled={isSubmitting}
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
                        <FormLabel className="text-gray-700 font-medium">Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              className="pl-10 pr-10 h-12"
                              {...field}
                              disabled={isSubmitting}
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

                <motion.div variants={fadeInVariants}>
                  <Button 
                    type="submit" 
                    size="lg"
                    className="w-full font-bold bg-[#1AADF0] hover:bg-[#0d8bc9]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Joining Team...</span>
                      </div>
                    ) : (
                      "Accept Invitation"
                    )}
                  </Button>
                </motion.div>
              </form>
            </Form>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1AADF0]" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
