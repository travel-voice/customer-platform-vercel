"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  Anchor,
  BarChart3,
  Bed,
  Bot,
  Briefcase,
  Calendar,
  Car,
  ChevronLeft,
  Clock,
  CreditCard,
  FileText,
  Frown,
  MapPin,
  Meh,
  MessageSquare,
  PawPrint,
  Plane,
  RollerCoaster,
  Shield,
  Snowflake,
  Star,
  Ticket,
  Train,
  Trash2,
  User,
  Users,
  Volume2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AudioPlayer } from "@/components/ui/audio-player";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCallDetailsStore } from "@/lib/stores/call-details-store";
import { useAgentDetailsStore } from "@/lib/stores/agent-details-store";

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
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 }
  }
};

export default function CallDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const agentUuid = params.agentUuid as string;
  const callUuid = params.callUuid as string;
  
  const { user } = useAuthStore();
  const { 
    callDetails, 
    isLoading, 
    error, 
    getCallDetails, 
    deleteCall,
    clearCallDetails 
  } = useCallDetailsStore();
  
  const { 
    getAgentDetails,
    clearAgent 
  } = useAgentDetailsStore();

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user?.organisation_uuid && agentUuid && callUuid) {
      // Fetch agent details for agent name
      getAgentDetails(user.organisation_uuid, agentUuid);
      // Fetch call details immediately with default name
      getCallDetails(user.organisation_uuid, agentUuid, callUuid);
    }
    
    return () => {
      clearCallDetails();
      clearAgent();
    };
  }, [user?.organisation_uuid, agentUuid, callUuid, getAgentDetails, getCallDetails, clearCallDetails, clearAgent]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-gradient-to-r from-[#28F16B]/20 to-[#28F16B]/10 text-[#28F16B] border-[#28F16B]/30';
      case 'negative':
        return 'bg-gradient-to-r from-[#F52E60]/20 to-[#F52E60]/10 text-[#F52E60] border-[#F52E60]/30';
      default:
        return 'bg-gradient-to-r from-[#FFBC2B]/20 to-[#FFBC2B]/10 text-[#FFBC2B] border-[#FFBC2B]/30';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return Star;
      case 'negative':
        return Frown;
      default:
        return Meh;
    }
  };

  const getSentimentDescription = (score: number) => {
    if (score >= 0.8) return "Very Positive";
    if (score >= 0.6) return "Positive";
    if (score >= 0.4) return "Neutral";
    if (score >= 0.2) return "Negative";
    return "Very Negative";
  };

  const handleDeleteCall = async () => {
    if (!user?.organisation_uuid || !callDetails) return;
    
    setIsDeleting(true);
    try {
      // Use the MongoDB ObjectId for the delete API
      await deleteCall(user.organisation_uuid, agentUuid, callDetails.id);
      // Navigate back after successful deletion
      router.back();
    } catch (error) {
      console.error("Failed to delete call:", error);
      // Error is already set in the store
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#C9EEFE]/20">
        <motion.div 
          variants={staggeredVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8 p-8"
        >
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <motion.div variants={cardVariants}>
              <Skeleton className="h-64 md:col-span-2 rounded-2xl" />
            </motion.div>
            <motion.div variants={cardVariants}>
              <Skeleton className="h-64 rounded-2xl" />
            </motion.div>
          </div>
          <motion.div variants={cardVariants}>
            <Skeleton className="h-96 rounded-2xl" />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (error || !callDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#C9EEFE]/20">
        <motion.div 
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8 p-8"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="hover:bg-white/80 hover:shadow-md transition-all duration-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#1AADF0] to-[#F52E60] bg-clip-text text-transparent">
              Call Details
            </h1>
          </div>
          
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              {error || "Call not found or you don't have permission to view it."}
            </AlertDescription>
          </Alert>
        </motion.div>
      </div>
    );
  }

  const SentimentIcon = getSentimentIcon(callDetails.sentiment);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#C9EEFE]/20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-[#1AADF0]/5 to-[#F52E60]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-[#F52E60]/5 to-[#1AADF0]/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 space-y-6 p-4 md:space-y-8 md:p-8"
      >
        {/* Enhanced Header */}
        <motion.div variants={fadeInVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="hover:bg-white/80 hover:shadow-md hover:scale-105 transition-all duration-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#1AADF0] to-[#F52E60] bg-clip-text text-transparent">
                Call Details
              </h1>
              <p className="text-lg text-gray-600 mt-1 flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#1AADF0]" />
                <span className="font-medium text-gray-800">{callDetails.characterName}</span>
                <span className="text-gray-500">•</span>
                <span>{callDetails.date.toLocaleDateString()}</span>
                <span>{callDetails.date.toLocaleTimeString()}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className={`${getSentimentColor(callDetails.sentiment)} px-3 py-1 font-medium border transition-all duration-300`}>
              <SentimentIcon className="w-3 h-3 mr-1" />
              {callDetails.sentiment}
            </Badge>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  className="gap-2 hover:scale-105 transition-all duration-300"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white/90 backdrop-blur-xl border border-white/20">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl">Delete Call Recording</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600">
                    Are you sure you want to delete this call recording? This action cannot be undone.
                    The conversation transcript and audio recording will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteCall}
                    disabled={isDeleting}
                    className="bg-[#F52E60] text-white hover:bg-[#F52E60]/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete Recording"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>

        {/* Main Content Layout */}
        <motion.div
          className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3"
          variants={staggeredVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Audio Player & Summary */}
            <motion.div variants={cardVariants}>
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-[#1AADF0] to-[#F52E60]">
                      <Volume2 className="h-5 w-5 text-white" />
                    </div>
                    Call Recording
                  </CardTitle>
                  <CardDescription>
                    Listen to the full conversation and review the summary
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {callDetails.audioUrl ? (
                    <div className="p-4 bg-gradient-to-r from-[#1AADF0]/5 to-[#F52E60]/5 rounded-xl border border-white/20">
                      <AudioPlayer src={callDetails.audioUrl} className="w-full" />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <Volume2 className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                      <p className="text-center">No audio recording available</p>
                    </div>
                  )}
                  
                  {callDetails.summary && (
                    <div className="p-4 bg-white/50 rounded-xl border border-white/30">
                      <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#1AADF0]" />
                        Call Summary
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {formatSummary(callDetails.summary)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Conversation Transcript */}
            <motion.div variants={cardVariants}>
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-[#7E57C2] to-[#9c88ff]">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    Conversation Transcript
                  </CardTitle>
                  <CardDescription>
                    Full conversation between the caller and agent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[60vh] md:h-[600px] pr-2 md:pr-4">
                    <div className="space-y-4">
                      {callDetails.messages.length > 0 ?
                        callDetails.messages.map((message, index) => (
                          <motion.div
                            key={index}
                            variants={fadeInVariants}
                            className={`flex items-start gap-4 ${message.role === 'assistant' ? '' : 'justify-end'}`}
                          >
                            {message.role === 'assistant' && (
                              <Avatar className="w-8 h-8 border-2 border-white">
                                <AvatarFallback>{callDetails.characterName.charAt(0)}</AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div className={`flex-1 max-w-[80%] ${message.role === 'assistant' ? 'mr-auto' : 'ml-auto'}`}>
                              <div className={`rounded-2xl p-4 shadow-sm border transition-all duration-300 hover:shadow-md ${
                                message.role === 'assistant' 
                                  ? 'bg-gradient-to-br from-[#1AADF0]/10 to-[#1AADF0]/5 text-[#1AADF0] border-[#1AADF0]/20' 
                                  : 'bg-gradient-to-br from-gray-50 to-white text-gray-800 border-gray-200'
                              }`}>
                                <p className="text-sm leading-relaxed">{message.message}</p>
                                {message.timestamp && (
                                  <p className="text-xs opacity-70 mt-2 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {message.timestamp.toLocaleTimeString()}
                                  </p>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-2 px-4 font-medium">
                                {message.role === 'assistant' ? callDetails.characterName : 'Caller'}
                              </p>
                            </div>

                            {message.role === 'user' && (
                              <Avatar className="w-8 h-8 border-2 border-white">
                                <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                              </Avatar>
                            )}
                          </motion.div>
                        ))
                      :
                        <motion.div 
                          variants={fadeInVariants}
                          className="text-center py-16"
                        >
                          <div className="w-16 h-16 bg-gradient-to-r from-[#1AADF0]/20 to-[#F52E60]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="h-8 w-8 text-[#1AADF0]" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No transcript available</h3>
                          <p className="text-gray-600">The conversation transcript will appear here when available</p>
                        </motion.div>
                      }
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-6">
            {/* Call Information */}
            <motion.div variants={cardVariants}>
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-[#F52E60] to-[#ff5e89]">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    Call Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-white/50 rounded-lg border border-white/30">
                    <div className="p-2 rounded-lg bg-[#1AADF0]/10">
                      <Clock className="h-4 w-4 text-[#1AADF0]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Duration</p>
                      <p className="text-sm text-gray-600">{formatDuration(callDetails.duration)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 bg-white/50 rounded-lg border border-white/30">
                    <div className="p-2 rounded-lg bg-[#F52E60]/10">
                      <Calendar className="h-4 w-4 text-[#F52E60]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Date & Time</p>
                      <p className="text-sm text-gray-600">
                        {callDetails.date.toLocaleDateString()}<br />
                        {callDetails.date.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Structured Data - Only show if data exists */}
            {callDetails.structuredData && Object.keys(callDetails.structuredData).length > 0 && (
              <motion.div variants={cardVariants}>
                <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-[#FFBC2B] to-[#FFD76B]">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      Extracted Data
                    </CardTitle>
                    <CardDescription>
                      Data extracted from the call, based on the assistant's data extraction configuration.
                      This data may not match the current assistant's data extraction configuration, if it has been updated since the call.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      {Object.entries(callDetails.structuredData).map(([key, value]) => (
                        <InfoItem 
                          key={key}
                          icon={getIconForKey(key)} 
                          label={formatLabel(key)} 
                          value={String(value)} 
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Helper function to get appropriate icon based on category (namespace before the dot)
const getIconForKey = (key: string): React.ElementType => {
  const category = key.split('.')[0].toLowerCase();
  
  switch (category) {
    case 'customer':
      return User; // Customer Basics & Customer Extras
    case 'trip':
      return MapPin; // Trip Basics & Trip Extras
    case 'flight':
      return Plane; // Flights & Flights - Expanded
    case 'hotel':
      return Bed; // Accommodation & Accommodation - Expanded
    case 'ground':
      return Car; // Ground Transport & Ground Transport - Expanded
    case 'preferences':
      return Star; // Activities & Preferences
    case 'compliance':
      return Shield; // Compliance & Docs & Compliance & Docs - Expanded
    case 'booking':
      return CreditCard; // Payment & Booking & Booking & Payment - Expanded
    case 'business':
      return Briefcase; // Business Travel
    case 'cruise':
      return Anchor; // Cruise
    case 'rail':
      return Train; // Rail
    case 'activities':
      return Ticket; // Activities & Experiences - Expanded
    case 'family':
      return Users; // Kids & Pets (Family)
    case 'pets':
      return PawPrint; // Kids & Pets (Pets)
    case 'ski':
      return Snowflake; // Ski & Snow
    case 'parks':
      return RollerCoaster; // Theme Parks
    case 'meta':
      return FileText; // Meta
    default:
      return User; // Default fallback
  }
};

// Helper function to format labels from snake_case keys
const formatLabel = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, l => l.toUpperCase());
};

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | null }) => {
  return (
    <div className="flex items-start gap-4 p-3 bg-white/50 rounded-lg border border-white/30">
      <div className="p-2 rounded-lg bg-gray-100">
        <Icon className="h-4 w-4 text-gray-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-sm text-gray-600">{value || '-'}</p>
      </div>
    </div>
  );
}; 

function formatSummary(summary?: string) {
  if (!summary) return '';
  try {
    const parsed = JSON.parse(summary);
    if (parsed && typeof parsed === 'object') {
      return (
        parsed.summary ||
        parsed.analysis?.summary ||
        parsed.transcriptText ||
        summary
      );
    }
  } catch {
    // ignore parse errors
  }
  return summary;
}
