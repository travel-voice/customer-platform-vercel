"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  CreditCard,
  Home} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useBillingStore } from "@/lib/stores/billing-store";

export default function PaymentConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, getCurrentUser } = useAuthStore();
  const { getCurrentPeriod, formatCurrency } = useBillingStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract potential payment info from URL params
  const sessionId = searchParams.get('session_id');
  const planName = searchParams.get('plan');
  const amount = searchParams.get('amount');
  const currency = searchParams.get('currency') || 'gbp';

  useEffect(() => {
    const confirmPayment = async () => {
      setIsLoading(true);
      try {
        // Refresh user authentication status
        if (user?.organisation_uuid) {
          await getCurrentUser();
          
          // Refresh billing period to get updated usage
          await getCurrentPeriod(user.organisation_uuid);
          
          setPaymentSuccess(true);
        } else {
          setError('User authentication required');
        }
      } catch (error) {
        console.error('Failed to confirm payment:', error);
        setError('Failed to confirm payment status. Please contact support if this persists.');
      } finally {
        setIsLoading(false);
      }
    };

    confirmPayment();
  }, [user?.organisation_uuid, getCurrentUser, getCurrentPeriod]);

  const handleContinue = () => {
    router.push('/home');
  };

  const handleViewBilling = () => {
    router.push('/payment');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Payment Confirmation Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                If you believe this is an error, please contact our support team with your payment details.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/payment')} className="flex-1">
                View Billing
              </Button>
              <Button onClick={handleContinue} className="flex-1">
                Continue to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-green-600">Payment Successful!</CardTitle>
          <CardDescription>
            Your subscription has been activated and you now have access to all features.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Payment Summary */}
          {(planName || amount) && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">Payment Summary</h3>
              {planName && (
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-medium">{planName}</span>
                </div>
              )}
              {amount && (
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">
                    {formatCurrency(parseInt(amount), currency)}
                  </span>
                </div>
              )}
              {sessionId && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Transaction ID: {sessionId.slice(-8)}
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          <div className="text-center">
            <h3 className="font-medium mb-2">What&apos;s Next?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your subscription is now active. You can start creating AI assistants and manage your account from the dashboard.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button onClick={handleContinue} className="w-full gap-2">
              <Home className="h-4 w-4" />
              Continue to Dashboard
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleViewBilling} 
              className="w-full gap-2"
            >
              <CreditCard className="h-4 w-4" />
              View Billing Details
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>

          {/* Support Note */}
          <div className="text-xs text-center text-muted-foreground">
            Need help? Contact our support team at{" "}
            <a href="mailto:support@neuralvoice.ai" className="text-blue-600 hover:underline">
              support@neuralvoice.ai
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 