"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bot,
  Plus,
  Sparkles,
  Star,
  TrendingUp,
  Users} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback,useEffect, useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAgentsStore } from "@/lib/stores/agents-store";
import { AgentCreationModal } from "@/components/agent-creation-modal";

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

export default function AgentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    agentPerformances, 
    isLoading, 
    isCreating,
    canCreate,
    isCheckingPermission,
    error, 
    getAgents,
    checkCreationPermission,
    createAgent
  } = useAgentsStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLimitsModal, setShowLimitsModal] = useState(false);

  const pageSize = 8; // Increased for better layout

    const loadAgents = useCallback(async () => {
    try {
      await getAgents();
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  }, [getAgents]);

  const checkPermission = useCallback(async () => {
    try {
      await checkCreationPermission();
    } catch (error) {
      console.error('Failed to check creation permission:', error);
    }
  }, [checkCreationPermission])

  // Load agents and check creation permission
  useEffect(() => {
    loadAgents();
    checkPermission();
  }, [checkPermission, loadAgents]);

  // Auto-open create modal instead of redirecting when zero agents
  useEffect(() => {
    if (!isLoading && agentPerformances.length === 0 && currentPage === 1) {
      setShowCreateModal(true);
    }
  }, [isLoading, agentPerformances.length, currentPage]);

  // Listen for agent updates and refresh the list
  useEffect(() => {
    const handleAgentUpdate = async () => {
      console.log('Agent updated, refreshing agents page...');
      await getAgents();
    };

    window.addEventListener('agent-updated', handleAgentUpdate);
    return () => window.removeEventListener('agent-updated', handleAgentUpdate);
  }, [getAgents]);

  const handleNewAgentClick = () => {
    if (canCreate) {
      setShowCreateModal(true);
    } else {
      setShowLimitsModal(true);
    }
  };

  const handleCreateAgent = async (data: { name: string; elevenlabs_voice_id: string; image_data?: string }) => {
    // Map old field names to new API format
    await createAgent({
      name: data.name,
      voice_id: data.elevenlabs_voice_id,
      image: data.image_data ?? undefined
    });
    // Success will be handled by the modal's onSuccess callback
  };

  const handleCreationSuccess = () => {
    setShowSuccessModal(true);
    // Reset to first page to see the new character
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getSentimentColor = (percentPositive: number) => {
    if (percentPositive >= 80) return 'bg-gradient-to-r from-[#28F16B]/20 to-[#28F16B]/10 text-[#28F16B] border-[#28F16B]/30';
    if (percentPositive >= 60) return 'bg-gradient-to-r from-[#1AADF0]/20 to-[#1AADF0]/10 text-[#1AADF0] border-[#1AADF0]/30';
    if (percentPositive >= 40) return 'bg-gradient-to-r from-[#FFBC2B]/20 to-[#FFBC2B]/10 text-[#FFBC2B] border-[#FFBC2B]/30';
    return 'bg-gradient-to-r from-[#F52E60]/20 to-[#F52E60]/10 text-[#F52E60] border-[#F52E60]/30';
  };

  const getSentimentIcon = (percentPositive: number) => {
    if (percentPositive >= 80) return Star;
    if (percentPositive >= 60) return TrendingUp;
    return Activity;
  };

  // Client-side pagination
  const totalAgents = agentPerformances.length;
  const totalPages = Math.ceil(totalAgents / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentAgents = agentPerformances.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <motion.div 
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-12 w-40" />
        </div>
        <motion.div 
          variants={staggeredVariants}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div key={i} variants={cardVariants}>
              <Skeleton className="h-96 w-full rounded-2xl" />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#1AADF0] to-[#F52E60] bg-clip-text text-transparent">
              Agents
            </h1>
            <p className="text-xl text-gray-600 mt-2">
              Manage your AI agents and their settings
            </p>
          </div>
          <Button onClick={handleNewAgentClick} className="gap-2 h-12 px-6">
            <Plus className="h-4 w-4" />
            New Agent
          </Button>
        </div>
        
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={fadeInVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeInVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#1AADF0] to-[#F52E60] bg-clip-text text-transparent">
            Agents
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mt-2 flex items-center">
            Manage your AI agents and their settings
            <Users className="inline w-5 h-5 ml-2 text-[#1AADF0]" />
          </p>
        </div>
        
        <motion.div whileHover={scaleHover}>
          <Button 
            onClick={handleNewAgentClick} 
            className="gap-2 h-10 px-4 md:h-12 md:px-6 bg-gradient-to-r from-[#1AADF0] to-[#F52E60] hover:shadow-xl md:hover:scale-105 transition-all duration-300 w-full sm:w-auto"
            disabled={isCheckingPermission}
          >
            <Plus className="h-4 w-4" />
            New Agent
          </Button>
        </motion.div>
      </motion.div>

      {/* Agents Grid */}
      {currentAgents.length > 0 ? (
        <>
          <motion.div 
            variants={staggeredVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          >
            {currentAgents.map((agent, index) => {
              const SentimentIcon = getSentimentIcon(agent.percentPositive);
              
              return (
                <motion.div key={agent.assistant_uuid} variants={cardVariants}>
                  <Card className="group relative overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 border-white/20 bg-white/70 backdrop-blur-sm h-full">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1AADF0]/5 to-[#F52E60]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <CardContent className="relative p-6 h-full flex flex-col">
                      {/* Avatar and Name */}
                      <div className="flex flex-col items-center text-center mb-6">
                        <div className="relative mb-4">
                          <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg group-hover:ring-[#1AADF0]/30 transition-all duration-300">
                            <AvatarImage src={agent.assistant_avatar_url} />
                            <AvatarFallback className="bg-gradient-to-r from-[#1AADF0] to-[#F52E60] text-white">
                              <Bot className="h-10 w-10" />
                            </AvatarFallback>
                          </Avatar>
                          <motion.div 
                            className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-[#28F16B] to-[#22c55e] rounded-full flex items-center justify-center"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </motion.div>
                        </div>
                        <h3 className="font-bold text-xl truncate w-full text-gray-900 group-hover:text-[#1AADF0] transition-colors duration-300">
                          {agent.assistant_name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-2 leading-relaxed">
                          {agent.assistant_uuid}
                        </p>
                      </div>

                      {/* Performance Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-6 flex-1">
                        <div className="text-center p-3 bg-gradient-to-br from-[#1AADF0]/10 to-[#1AADF0]/5 rounded-xl border border-[#1AADF0]/20">
                          <div className="text-2xl font-bold text-[#1AADF0] mb-1">
                            {agent.totalCount}
                          </div>
                          <div className="text-xs text-gray-600 font-medium">Total Calls</div>
                        </div>
                        
                        <div className="text-center p-3 bg-gradient-to-br from-[#28F16B]/10 to-[#28F16B]/5 rounded-xl border border-[#28F16B]/20">
                          <div className="text-2xl font-bold text-[#28F16B] mb-1">
                            {agent.totalCount > 0 
                              ? `${Math.round((agent.successCount / agent.totalCount) * 100)}%`
                              : '0%'
                            }
                          </div>
                          <div className="text-xs text-gray-600 font-medium">Success Rate</div>
                        </div>
                        
                        <div className="text-center p-3 bg-gradient-to-br from-[#F52E60]/10 to-[#F52E60]/5 rounded-xl border border-[#F52E60]/20">
                          <div className="text-2xl font-bold text-[#F52E60] mb-1">
                            {agent.successCount}
                          </div>
                          <div className="text-xs text-gray-600 font-medium">Handled</div>
                        </div>
                        
                        <div className="text-center p-3 bg-gradient-to-br from-[#FFBC2B]/10 to-[#FFBC2B]/5 rounded-xl border border-[#FFBC2B]/20">
                          <div className="text-2xl font-bold text-[#FFBC2B] mb-1">
                            {agent.emptyCount}
                          </div>
                          <div className="text-xs text-gray-600 font-medium">Empty</div>
                        </div>
                      </div>

                      {/* Success Rate Progress */}
                      <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-2 font-medium">
                          <span>Performance</span>
                          <span>{agent.successCount}/{agent.totalCount}</span>
                        </div>
                        <div className="relative">
                          <Progress 
                            value={agent.totalCount > 0 ? (agent.successCount / agent.totalCount) * 100 : 0} 
                            className="h-3 bg-gray-200"
                          />
                        </div>
                      </div>

                      {/* Sentiment Badge */}
                      <div className="flex justify-center mb-6">
                        <Badge className={`${getSentimentColor(agent.percentPositive)} px-3 py-1 font-medium text-xs border`}>
                          <SentimentIcon className="w-3 h-3 mr-1" />
                          {agent.percentPositive}% Positive
                        </Badge>
                      </div>

                      {/* Manage Button */}
                      <motion.div whileHover={scaleHover}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full gap-2 group-hover:bg-[#1AADF0] group-hover:text-white group-hover:border-[#1AADF0] transition-all duration-300 h-10"
                          onClick={() => router.push(`/agents/${agent.assistant_uuid}`)}
                        >
                          Manage
                          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div variants={fadeInVariants} className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[#1AADF0]/10"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={page === currentPage}
                        className={`cursor-pointer ${page === currentPage ? 'bg-[#1AADF0] text-white' : 'hover:bg-[#1AADF0]/10'}`}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[#1AADF0]/10"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div variants={fadeInVariants} className="text-center py-16">
          <motion.div 
            className="w-24 h-24 bg-gradient-to-r from-[#1AADF0]/20 to-[#F52E60]/20 rounded-full flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Bot className="h-12 w-12 text-[#1AADF0]" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">No agents yet</h3>
          <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
            Create your first AI agent to start handling calls and providing excellent customer service
          </p>
          <motion.div whileHover={scaleHover}>
            <Button 
              onClick={handleNewAgentClick} 
              className="gap-3 h-12 px-8 bg-gradient-to-r from-[#1AADF0] to-[#F52E60] hover:shadow-xl text-base font-semibold"
            >
              <Sparkles className="h-5 w-5" />
              Create Your First Agent
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* Agent Creation Modal */}
      <AgentCreationModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleCreationSuccess}
        onCreateAgent={handleCreateAgent}
        isCreating={isCreating}
        error={error}
      />

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-white/90 backdrop-blur-xl border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-[#1AADF0] to-[#F52E60] bg-clip-text text-transparent">
              Character Created Successfully!
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-base">
              Your new AI assistant has been created and is ready to handle calls.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={() => setShowSuccessModal(false)}
              className="bg-gradient-to-r from-[#1AADF0] to-[#F52E60] hover:scale-105 transition-transform"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Limits Reached Modal */}
      <AlertDialog open={showLimitsModal} onOpenChange={setShowLimitsModal}>
        <AlertDialogContent className="bg-white/90 backdrop-blur-xl border border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Agent Limit Reached</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              You&apos;ve reached the maximum number of agents for your current plan. 
              Please upgrade your subscription to create more AI agents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => router.push('/payment')}
              className="bg-gradient-to-r from-[#1AADF0] to-[#F52E60]"
            >
              Upgrade Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
} 