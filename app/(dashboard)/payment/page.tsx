'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { STRIPE_PLANS } from '@/lib/constants/plans';
import { Plan } from '@/lib/types/billing';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>('lite'); // Default to lite/free if unknown
  const [billingPeriod, setBillingPeriod] = useState<{
    plan: string;
    status: string;
    minutesUsed: number;
    minutesTotal: number;
  } | null>(null);

  useEffect(() => {
    // Check for success/canceled params
    if (searchParams.get('success')) {
      toast({
        title: 'Subscription updated!',
        description: 'Your plan has been successfully updated.',
      });
      router.replace('/payment');
    }
    if (searchParams.get('canceled')) {
      toast({
        variant: 'destructive',
        title: 'Canceled',
        description: 'Payment process was canceled.',
      });
      router.replace('/payment');
    }
    
    fetchCurrentSubscription();
  }, [searchParams]);

  const fetchCurrentSubscription = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users')
      .select('organization_uuid')
      .eq('uuid', user.id)
      .single();

    if (userData?.organization_uuid) {
      const { data: org } = await supabase
        .from('organizations')
        .select('subscription_plan, subscription_status, time_remaining_seconds')
        .eq('uuid', userData.organization_uuid)
        .single();

      if (org) {
        setCurrentPlan(org.subscription_plan?.toLowerCase() || 'free');
        setBillingPeriod({
            plan: org.subscription_plan || 'Free',
            status: org.subscription_status || 'active',
            minutesUsed: 0, // We don't track used separately right now
            minutesTotal: Math.floor((org.time_remaining_seconds || 0) / 60)
        });
      }
    }
  };

  const handleSubscribe = async (planId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to start checkout');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to open portal');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plans & Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and view usage.
          </p>
        </div>
        {billingPeriod && billingPeriod.plan !== 'Free' && (
            <Button variant="outline" onClick={handleManageSubscription} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Manage Subscription
            </Button>
        )}
      </div>

      {billingPeriod && (
        <Card>
            <CardHeader>
                <CardTitle>Current Usage</CardTitle>
                <CardDescription>Your remaining minutes for this billing period</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold">
                    {billingPeriod.minutesTotal} <span className="text-lg text-muted-foreground font-normal">minutes remaining</span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                    Plan: <span className="font-medium text-foreground capitalize">{billingPeriod.plan}</span> • Status: <span className="font-medium text-foreground capitalize">{billingPeriod.status}</span>
              </div>
            </CardContent>
          </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STRIPE_PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id || (currentPlan === 'free' && plan.id === 'lite' && false); 
            // Adjust logic if 'lite' is paid. Assuming 'lite' is paid £50. 'Free' is purely no-sub.
                  
                  return (
          <Card key={plan.id} className={`flex flex-col ${plan.isActive ? 'border-primary shadow-lg' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                {plan.isActive && <Badge>Most Popular</Badge>}
                          </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-6">
                <span className="text-4xl font-bold">£{plan.price}</span>
                <span className="text-muted-foreground">/{plan.period}</span>
                          </div>
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                                  {feature.isEnabled ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={feature.isEnabled ? '' : 'text-muted-foreground'}>
                                  {feature.label}
                                </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
                          <Button 
                className="w-full" 
                variant={plan.isActive ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan.id)}
                disabled={isLoading || currentPlan === plan.id}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentPlan === plan.id ? 'Current Plan' : `Upgrade to ${plan.name}`}
                          </Button>
            </CardFooter>
                      </Card>
        )})}
                      </div>
                    </div>
  );
}
