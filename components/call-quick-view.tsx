"use client";

import { AnimatePresence,motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  Briefcase,
  ExternalLink,
  Frown,
  Globe,
  Mail,
  MapPin,
  Meh,
  MessageSquare,
  Phone,
  Star,
  User,
  Volume2,
  X} from "lucide-react";
import Link from "next/link";
import React, { useEffect } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AudioPlayer } from "@/components/ui/audio-player";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCallDetailsStore } from "@/lib/stores/call-details-store";
import { useAgentDetailsStore } from "@/lib/stores/agent-details-store";

interface CallQuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: string | null;
  agentUuid: string | null;
}

const slideInVariants: import('framer-motion').Variants = {
  hidden: { 
    x: "100%",
    opacity: 0
  },
  visible: { 
    x: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      damping: 25,
      stiffness: 200,
      duration: 0.5
    }
  },
  exit: { 
    x: "100%",
    opacity: 0,
    transition: {
      type: "spring" as const,
      damping: 25,
      stiffness: 200,
      duration: 0.3
    }
  }
};

const backdropVariants: import('framer-motion').Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

export function CallQuickView({ isOpen, onClose, recordId, agentUuid }: CallQuickViewProps) {
  const { user } = useAuthStore();
  const { 
    callDetails, 
    isLoading, 
    error, 
    getCallDetails, 
    clearCallDetails 
  } = useCallDetailsStore();
  
  const { 
    agentDetail,
    getAgentDetails 
  } = useAgentDetailsStore();

  useEffect(() => {
    if (isOpen && recordId && agentUuid && user?.organisation_uuid) {
      // Fetch agent details for agent name
      getAgentDetails(user.organisation_uuid, agentUuid);
      // Fetch call details
      getCallDetails(user.organisation_uuid, agentUuid, recordId);
    }
    
    // Clear when closing
    if (!isOpen) {
      clearCallDetails();
    }
  }, [isOpen, recordId, agentUuid, user?.organisation_uuid, getCallDetails, getAgentDetails, clearCallDetails]);

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Slide-out Panel */}
          <motion.div
            variants={slideInVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 h-full w-full max-w-2xl md:max-w-2xl bg-white shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 md:p-6 border-b bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-[#1AADF0] to-[#F52E60]">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">Call Quick View</h2>
                    <p className="text-xs md:text-sm text-gray-600">
                      {agentDetail?.name || callDetails?.characterName || 'Agent'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {recordId && agentUuid && (
                    <Link href={`/agents/${agentUuid}/calls/${recordId}`}>
                      <Button variant="outline" size="sm" className="gap-2 hidden md:flex">
                        <ExternalLink className="h-4 w-4" />
                        Full View
                      </Button>
                      <Button variant="outline" size="sm" className="md:hidden">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden">
                {isLoading ? (
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-64 w-full" />
                    </div>
                  </div>
                ) : error || !callDetails ? (
                  <div className="p-6">
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-700">
                        {error || "Call details could not be loaded."}
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                      {/* Call Info Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-600">
                            {callDetails.date.toLocaleDateString()} • {callDetails.date.toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`${getSentimentColor(callDetails.sentiment)} px-3 py-1 font-medium border`}>
                            {React.createElement(getSentimentIcon(callDetails.sentiment), { className: "w-3 h-3 mr-1" })}
                            {callDetails.sentiment}
                          </Badge>
                          <div className="text-sm font-medium text-gray-700">
                            {formatDuration(callDetails.duration)}
                          </div>
                        </div>
                      </div>

                      {/* Audio Player */}
                      {callDetails.audioUrl && (
                        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Volume2 className="h-4 w-4 text-blue-600" />
                              Audio Recording
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <AudioPlayer src={callDetails.audioUrl} className="w-full" />
                          </CardContent>
                        </Card>
                      )}

                      {/* Summary */}
                      {callDetails.summary && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <BarChart3 className="h-4 w-4 text-green-600" />
                              Call Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {formatSummary(callDetails.summary)}
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Caller Information */}
                      {callDetails.caller && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <User className="h-4 w-4 text-purple-600" />
                              Caller Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 gap-2 md:gap-3 text-sm">
                              {callDetails.caller.firstName && (
                                <InfoItem icon={User} label="First Name" value={callDetails.caller.firstName} />
                              )}
                              {callDetails.caller.surname && (
                                <InfoItem icon={User} label="Surname" value={callDetails.caller.surname} />
                              )}
                              {callDetails.caller.phone && (
                                <InfoItem icon={Phone} label="Phone" value={callDetails.caller.phone} />
                              )}
                              {callDetails.caller.email && (
                                <InfoItem icon={Mail} label="Email" value={callDetails.caller.email} />
                              )}
                              {callDetails.caller.businessName && (
                                <InfoItem icon={Briefcase} label="Business" value={callDetails.caller.businessName} />
                              )}
                              {callDetails.caller.domainUrl && (
                                <InfoItem icon={Globe} label="Domain" value={callDetails.caller.domainUrl} />
                              )}
                              {callDetails.caller.postcode && (
                                <InfoItem icon={MapPin} label="Postcode" value={callDetails.caller.postcode} />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Conversation Preview */}
                      {callDetails.messages.length > 0 && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between text-base">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-indigo-600" />
                                Conversation ({callDetails.messages.length} messages)
                              </div>
                              {recordId && agentUuid && (
                                <Link href={`/agents/${agentUuid}/records/${recordId}`}>
                                  <Button variant="ghost" size="sm" className="text-xs">
                                    View Full Transcript
                                  </Button>
                                </Link>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 md:space-y-3 max-h-60 md:max-h-80 overflow-y-auto">
                              {callDetails.messages.slice(0, 6).map((message, index) => (
                                <div
                                  key={index}
                                  className={`flex items-start gap-3 ${message.role === 'assistant' ? '' : 'justify-end'}`}
                                >
                                  {message.role === 'assistant' && (
                                    <Avatar className="w-6 h-6 border">
                                      <AvatarFallback className="text-xs">
                                        {(agentDetail?.name || callDetails.characterName || 'A').charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                  
                                  <div className={`flex-1 max-w-[80%] ${message.role === 'assistant' ? 'mr-auto' : 'ml-auto'}`}>
                                    <div className={`rounded-lg p-3 text-xs shadow-sm border ${
                                      message.role === 'assistant' 
                                        ? 'bg-blue-50 text-blue-900 border-blue-200' 
                                        : 'bg-gray-50 text-gray-800 border-gray-200'
                                    }`}>
                                      <p className="leading-relaxed">{message.message}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 px-3">
                                      {message.role === 'assistant' ? (agentDetail?.name || callDetails.characterName || 'Agent') : 'Caller'}
                                    </p>
                                  </div>

                                  {message.role === 'user' && (
                                    <Avatar className="w-6 h-6 border">
                                      <AvatarFallback className="text-xs">
                                        <User className="w-3 h-3" />
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                              ))}
                              
                              {callDetails.messages.length > 6 && (
                                <div className="text-center pt-2">
                                  <p className="text-xs text-gray-500">
                                    {callDetails.messages.length - 6} more messages...
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <span className="font-medium text-gray-900">{label}:</span>
        <span className="ml-2 text-gray-600">{value}</span>
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
    // ignore
  }
  return summary;
}
