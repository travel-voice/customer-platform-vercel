"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Crown,
  Download,
  ExternalLink,
  FileText,
  Star,
  Timer,
  XCircle,
  Zap} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useBillingStore } from "@/lib/stores/billing-store";
import {IPlan } from "@/lib/types/billing";

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

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

const scaleHover = {
  scale: 1.05,
  transition: { duration: 0.2 }
};

export default function PaymentPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    currentPeriod, 
    isLoadingPeriod, 
    error,
    plans,
    isLoadingPlans,
    invoices,
    isLoadingInvoices,
    isGeneratingPaymentLink,
    getCurrentPeriod,
    getPlans,
    getInvoices,
    generatePaymentLink,
    setError
  } = useBillingStore();
  
  const [activeTab, setActiveTab] = useState("plans");
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.organisation_uuid) {
      getCurrentPeriod(user.organisation_uuid);
      getPlans();
      getInvoices({ limit: 10 });
    }
  }, [user?.organisation_uuid, getCurrentPeriod, getPlans, getInvoices]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency?.toUpperCase() || 'USD',
    }).format(amount / 100);
  };

  const handlePurchase = async (plan: IPlan) => {
    if (!user?.organisation_uuid) {
      setError('No organisation found for the current user. Please sign in again.');
      return;
    }
    
    setProcessingPlanId(plan.id);
    try {
      const link = await generatePaymentLink({
        organisationUuid: user.organisation_uuid,
        packageUuid: plan.id,
      });
      if (link) {
        window.open(link, '_self', 'noreferrer');
      }
    } catch (err) {
      console.error('Failed to initiate purchase:', err);
      setError('Failed to generate checkout link. Please try again.');
    } finally {
      setProcessingPlanId(null);
    }
  };

  const getPlanFeatureIcon = (isEnabled: boolean) => {
    return isEnabled ? (
      <CheckCircle className="h-4 w-4 text-[#28F16B]" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-400" />
    );
  };

  const getInvoiceStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: 'Paid', color: 'bg-gradient-to-r from-[#28F16B]/20 to-[#28F16B]/10 text-[#28F16B] border-[#28F16B]/30' },
      pending: { label: 'Pending', color: 'bg-gradient-to-r from-[#FFBC2B]/20 to-[#FFBC2B]/10 text-[#FFBC2B] border-[#FFBC2B]/30' },
      failed: { label: 'Failed', color: 'bg-gradient-to-r from-[#F52E60]/20 to-[#F52E60]/10 text-[#F52E60] border-[#F52E60]/30' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium border`}>
        {config.label}
      </Badge>
    );
  };

  const getUsedTime = () => {
    if (!currentPeriod) return "0m";
    const usedMinutes = Math.floor(currentPeriod.usage_seconds / 60);
    const usedSeconds = currentPeriod.usage_seconds % 60;
    return usedSeconds > 0 ? `${usedMinutes}m ${usedSeconds}s` : `${usedMinutes}m`;
  };

  const getRemainingTime = () => {
    if (!currentPeriod) return "0m";
    return `${currentPeriod.rMins}m ${currentPeriod.rSecs}s`;
  };

  const calculateUsagePercentage = () => {
    if (!currentPeriod) return 0;
    const totalMinutes = currentPeriod.tMins;
    const usedMinutes = Math.floor(currentPeriod.usage_seconds / 60);
    return Math.min(100, Math.max(0, (usedMinutes / totalMinutes) * 100));
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('pro') || name.includes('premium')) return Crown;
    if (name.includes('starter') || name.includes('basic')) return Star;
    return Zap;
  };

  const getPlanGradient = (index: number) => {
    const gradients = [
      'from-[#1AADF0] to-[#20b7f1]',
      'from-[#F52E60] to-[#ff5e89]',
      'from-[#7E57C2] to-[#9c88ff]'
    ];
    return gradients[index % gradients.length];
  };

  return (
    <motion.div 
      variants={fadeInVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeInVariants}>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#1AADF0] to-[#F52E60] bg-clip-text text-transparent">
          Billing & Payments
        </h1>
        <p className="text-xl text-gray-600 mt-2 flex items-center">
          Manage your subscription and view billing history
          <CreditCard className="inline w-5 h-5 ml-2 text-[#1AADF0]" />
        </p>
      </motion.div>

      {/* Current Usage Card */}
      {currentPeriod && (
        <motion.div variants={fadeInVariants}>
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1AADF0]/5 to-[#F52E60]/5" />
            
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-[#1AADF0] to-[#F52E60]">
                  <Timer className="h-5 w-5 text-white" />
                </div>
                Current Plan Usage
              </CardTitle>
              <CardDescription>
                Your usage for the current billing period
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-6">
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
                <div className="text-center p-4 bg-gradient-to-br from-[#F52E60]/10 to-[#F52E60]/5 rounded-xl border border-[#F52E60]/20">
                  <p className="text-sm font-medium text-gray-700 mb-2">Used Time</p>
                  <p className="text-3xl font-bold text-[#F52E60]">{getUsedTime()}</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-[#28F16B]/10 to-[#28F16B]/5 rounded-xl border border-[#28F16B]/20">
                  <p className="text-sm font-medium text-gray-700 mb-2">Remaining Time</p>
                  <p className="text-3xl font-bold text-[#28F16B]">{getRemainingTime()}</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-[#1AADF0]/10 to-[#1AADF0]/5 rounded-xl border border-[#1AADF0]/20">
                  <p className="text-sm font-medium text-gray-700 mb-2">Total Allowance</p>
                  <p className="text-3xl font-bold text-[#1AADF0]">{currentPeriod.tMins}m</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700">Usage Progress</span>
                  <span className="text-gray-600">{calculateUsagePercentage().toFixed(1)}%</span>
                </div>
                <div className="relative">
                  <Progress value={calculateUsagePercentage()} className="h-3 bg-gray-200" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#1AADF0]/20 to-[#F52E60]/20" />
                </div>
              </div>
              
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <strong>Billing period:</strong> {new Date(currentPeriod.period_start_utc).toLocaleDateString()} - {new Date(currentPeriod.period_end_utc).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div variants={fadeInVariants}>
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div variants={fadeInVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/70 backdrop-blur-sm border border-white/20">
            <TabsTrigger 
              value="plans"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1AADF0] data-[state=active]:to-[#F52E60] data-[state=active]:text-white"
            >
              Available Plans
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1AADF0] data-[state=active]:to-[#F52E60] data-[state=active]:text-white"
            >
              Billing History
            </TabsTrigger>
          </TabsList>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-8 mt-8">
            <motion.div variants={fadeInVariants} className="text-center mb-4">
              <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                Choose Your <span className="bg-gradient-to-r from-[#1AADF0] to-[#F52E60] bg-clip-text text-transparent">Perfect Plan</span>
              </h2>
              <p className="text-gray-600 text-xl leading-relaxed max-w-2xl mx-auto">
                Unlock the power of Travel Voice with plans designed to scale with your business growth
              </p>
            </motion.div>

            {isLoadingPlans ? (
              <motion.div 
                variants={staggeredVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-3 mt-10 md:mt-16"
              >
                {Array.from({ length: 3 }).map((_, i) => (
                  <motion.div key={i} variants={cardVariants}>
                    <Skeleton className="h-[480px] w-full rounded-2xl" />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                variants={staggeredVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-3 mt-10 md:mt-16"
              >
                {plans.map((plan, index) => {
                  const PlanIcon = getPlanIcon(plan.name);
                  const gradient = getPlanGradient(index);
                  const isLite = plan.name.toLowerCase() === 'lite';
                  const isProfessional = plan.name.toLowerCase() === 'professional';
                  
                  return (
                    <motion.div 
                      key={plan.id} 
                      variants={cardVariants}
                      className={`${plan.isActive ? 'md:scale-105 md:-translate-y-4' : ''}`}
                    >
                      <Card className={`group relative overflow-hidden transition-all duration-300 h-full ${
                        plan.isActive 
                          ? 'border-2 border-[#1AADF0] shadow-lg shadow-[#1AADF0]/10 bg-white/90 backdrop-blur-sm' 
                          : 'border border-gray-200/50 bg-white/80 backdrop-blur-sm hover:shadow-lg'
                      } hover:scale-[1.02] rounded-2xl`}>
                        
                        {/* Most Popular Badge */}
                        {plan.isActive && (
                          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                            <Badge className="bg-gradient-to-r from-[#1AADF0] to-[#F52E60] text-white px-4 py-1 font-semibold text-xs border-0 shadow-lg rounded-full">
                              <Star className="h-3 w-3 mr-1" />
                              Most Popular
                            </Badge>
                          </div>
                        )}
                        
                        {/* Subtle background gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}/3 opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
                        
                        <CardHeader className="relative text-center pt-6 pb-2">
                          {/* Plan Icon */}
                          <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                            <PlanIcon className="h-8 w-8 text-white" />
                          </div>
                          
                          {/* Plan Name */}
                          <CardTitle className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
                            {plan.name}
                          </CardTitle>
                          
                          {/* Plan Description */}
                          <CardDescription className="text-gray-600 text-base leading-relaxed px-2 mb-4">
                            {plan.description}
                          </CardDescription>
                          
                          {/* Pricing Section */}
                          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-gray-500 text-lg font-medium">£</span>
                              <span className={`text-4xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                                {plan.price}
                              </span>
                              <span className="text-gray-500 text-lg">/{plan.period}</span>
                            </div>
                            
                            {/* Value proposition */}
                            <div className="mt-2">
                              {isLite && (
                                <p className="text-xs text-gray-600">
                                  Perfect for getting started
                                </p>
                              )}
                              {plan.isActive && (
                                <p className="text-xs bg-gradient-to-r from-[#1AADF0] to-[#F52E60] bg-clip-text text-transparent font-semibold">
                                  Best value for growing teams
                                </p>
                              )}
                              {isProfessional && (
                                <p className="text-xs text-gray-600">
                                  Enterprise-grade solution
                                </p>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="relative px-6 pb-6">
                          {/* Features Section */}
                          <div className="space-y-3 mb-6">
                            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3 flex items-center">
                              <Activity className="h-3 w-3 mr-1 text-[#1AADF0]" />
                              What's included
                            </h4>
                            {plan.features.map((feature, featureIndex) => (
                              <div 
                                key={featureIndex} 
                                className="flex items-start gap-2"
                              >
                                <div className="flex-shrink-0 mt-0.5">
                                  {feature.isEnabled ? (
                                    <CheckCircle className="h-4 w-4 text-[#28F16B]" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                                <span className={`text-sm ${
                                  feature.isEnabled 
                                    ? 'text-gray-700' 
                                    : 'text-gray-400 line-through'
                                }`}>
                                  {feature.label}
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          {/* CTA Button */}
                          <Button 
                            className={`w-full h-11 font-semibold rounded-lg transition-all duration-200 ${
                              plan.isActive 
                                ? `bg-gradient-to-r ${gradient} text-white shadow-md hover:shadow-lg` 
                                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#1AADF0] hover:shadow-md'
                            }`}
                            onClick={() => handlePurchase(plan)}
                            disabled={processingPlanId === plan.id}
                            variant={plan.isActive ? "default" : "outline"}
                          >
                            <div className="flex items-center justify-center gap-2">
                              {processingPlanId === plan.id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CreditCard className="h-4 w-4" />
                                  {plan.isActive ? 'Get Started Now' : `Choose ${plan.name}`}
                                </>
                              )}
                            </div>
                          </Button>
                          
                          {/* Additional info for popular plan */}
                          {plan.isActive && (
                            <p className="text-center text-xs text-gray-500 mt-2">
                              ⚡ Most chosen by growing businesses
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
            
            
          </TabsContent>

          {/* Billing History Tab */}
          <TabsContent value="history" className="space-y-8 mt-8">
            <motion.div variants={fadeInVariants}>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Billing History</h2>
              <p className="text-gray-600 text-lg">
                View and download your past invoices
              </p>
            </motion.div>

            <motion.div variants={fadeInVariants}>
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-[#F52E60] to-[#ff5e89]">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    Invoice History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingInvoices ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : invoices.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-200">
                            <TableHead className="font-semibold text-gray-900">Invoice</TableHead>
                            <TableHead className="font-semibold text-gray-900">Amount</TableHead>
                            <TableHead className="font-semibold text-gray-900">Status</TableHead>
                            <TableHead className="font-semibold text-gray-900">Date</TableHead>
                            <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.map((invoice) => (
                            <TableRow key={invoice.id} className="border-gray-100 hover:bg-gray-50/50">
                              <TableCell className="font-medium text-gray-900">
                                {invoice.number}
                              </TableCell>
                              <TableCell className="font-semibold text-gray-700">
                                {invoice.amount}
                              </TableCell>
                              <TableCell>
                                {getInvoiceStatusBadge(invoice.status)}
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {invoice.createdDate}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(invoice.hostedUrl, '_blank')}
                                    className="hover:bg-[#1AADF0]/10 hover:text-[#1AADF0]"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(invoice.pdfUrl, '_blank')}
                                    className="hover:bg-[#1AADF0]/10 hover:text-[#1AADF0]"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-r from-[#1AADF0]/20 to-[#F52E60]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="h-8 w-8 text-[#1AADF0]" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No invoices yet</h3>
                      <p className="text-gray-600 text-base">
                        Your billing history will appear here once you make your first payment
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
} 