"use client";

import { AnimatePresence,motion } from "framer-motion";
import { 
  Activity,
  AlertCircle,
  ArrowRight,
  Bot,
  Clock, 
  Edit3,
  LayoutGrid,
  List as ListIcon,
  Phone, 
  Search,
  Sparkles,
  Timer,
  Users} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef,useState } from "react";

import { AgentQuickEdit } from "@/components/agent-quick-edit";
import { CallQuickView } from "@/components/call-quick-view";
import { AgentCreationModal } from "@/components/agent-creation-modal";
import { RecordingsList } from "@/components/calls-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useBillingStore } from "@/lib/stores/billing-store";
import { useAgentsStore } from "@/lib/stores/agents-store";

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

export default function CustomerDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    currentPeriod, 
    isLoadingPeriod, 
    error: billingError, 
    getCurrentPeriod 
  } = useBillingStore();
  const { agentPerformances, stats, isLoading: statsLoading, error: statsError, getAgents, isCreating, createAgent } = useAgentsStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [agentsLoadSettled, setAgentsLoadSettled] = useState(false);
  const prevStatsLoading = useRef<boolean>(false);
  const [agentsView, setAgentsView] = useState<'grid' | 'list'>('grid');
  const [showAllAgents, setShowAllAgents] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Quick view state
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedAgentUuid, setSelectedAgentUuid] = useState<string | null>(null);
  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [quickEditAgentUuid, setQuickEditAgentUuid] = useState<string | null>(null);
  
  // Handle quick view
  const handleQuickView = (recordId: string, agentUuid: string) => {
    setSelectedRecordId(recordId);
    setSelectedAgentUuid(agentUuid);
    setQuickViewOpen(true);
  };
  
  const handleCloseQuickView = () => {
    setQuickViewOpen(false);
    setSelectedRecordId(null);
    setSelectedAgentUuid(null);
  };

  const openQuickEdit = (agentUuid: string) => {
    setQuickEditAgentUuid(agentUuid);
    setQuickEditOpen(true);
  };
  const closeQuickEdit = () => {
    setQuickEditOpen(false);
    setQuickEditAgentUuid(null);
  };

  useEffect(() => {
    // Call both APIs in parallel
    if (user?.organisation_uuid) {
      getCurrentPeriod(user.organisation_uuid);
    }
    getAgents();
  }, [user?.organisation_uuid, getCurrentPeriod, getAgents]);

  // Detect first complete agents load (wait for a true -> false transition)
  useEffect(() => {
    if (prevStatsLoading.current && !statsLoading) {
      setAgentsLoadSettled(true);
    }
    prevStatsLoading.current = statsLoading;
  }, [statsLoading]);

  // Gate: show onboarding only after agents load has settled
  useEffect(() => {
    if (!agentsLoadSettled) return;
    if (agentPerformances.length === 0) {
      setShowOnboarding(true);
      setShowCreateModal(false);
    } else {
      setShowOnboarding(false);
    }
  }, [agentsLoadSettled, agentPerformances.length]);

  // Reset showAllAgents when agents data changes or component mounts
  useEffect(() => {
    setShowAllAgents(false);
  }, [agentPerformances]);

  // Listen for agent updates and refresh the list
  useEffect(() => {
    const handleAgentUpdate = async () => {
      console.log('Agent updated, refreshing list...');
      await getAgents();
    };

    window.addEventListener('agent-updated', handleAgentUpdate);
    return () => window.removeEventListener('agent-updated', handleAgentUpdate);
  }, [getAgents]);

  const handleCreateAgent = async (data: { name: string; elevenlabs_voice_id: string; image_data?: string }) => {
    // Map old field names to new API format
    await createAgent({
      name: data.name,
      voice_id: data.elevenlabs_voice_id,
      image: data.image_data ?? undefined
    });
    // Refresh agents after creation
    await getAgents();
  };

  // Debug logging for agents
  useEffect(() => {
    if (agentPerformances.length > 0) {
      console.log('Dashboard: Agent performances:', agentPerformances);
      agentPerformances.forEach((agent, index) => {
        console.log(`Agent ${index + 1}:`, {
          uuid: agent.assistant_uuid,
          name: agent.assistant_name,
          purpose: agent.assistant_purpose,
          totalCalls: agent.totalCount,
          successRate: `${Math.round((agent.successCount / agent.totalCount) * 100)}%`,
          positiveSentiment: `${agent.percentPositive}%`,
          hasAvatar: !!agent.assistant_avatar_url
        });
      });
    }
  }, [agentPerformances]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getRemainingTime = () => {
    if (!currentPeriod) return { mins: 0, secs: 0 };
    return { mins: currentPeriod.rMins, secs: currentPeriod.rSecs };
  };

  const isLoading = statsLoading || isLoadingPeriod;
  const error = statsError || billingError;

  const filteredAgents = useMemo(() => {
    if (!agentSearch.trim()) return agentPerformances;
    const query = agentSearch.toLowerCase();
    return agentPerformances.filter((c) =>
      c.assistant_name.toLowerCase().includes(query) ||
      (c.assistant_purpose || "").toLowerCase().includes(query)
    );
  }, [agentSearch, agentPerformances]);

  const visibleAgents = useMemo(() => {
    const base = filteredAgents;
    if (showAllAgents) return base;
    return agentsView === 'grid' ? base.slice(0, 6) : base.slice(0, 8);
  }, [filteredAgents, showAllAgents, agentsView]);

  const metricCards = [
    {
      title: "Total Calls",
      value: stats?.total_successful_calls || 0,
      description: "Calls handled by your agents",
      icon: Phone,
      color: "from-[#1AADF0] to-[#20b7f1]",
      bgColor: "from-[#1AADF0]/10 to-[#20b7f1]/5"
    },
    {
      title: "Average Duration",
      value: stats?.total_successful_calls && stats.total_successful_calls > 0
        ? formatDuration(Math.floor(stats.call_dur_avg))
        : '0m 0s',
      description: "Per call",
      icon: Clock,
      color: "from-[#F52E60] to-[#ff5e89]",
      bgColor: "from-[#F52E60]/10 to-[#ff5e89]/5"
    },
    {
      title: "Remaining Time",
      value: currentPeriod ? `${currentPeriod.rMins}m ${currentPeriod.rSecs}s` : '0m 0s',
      description: "On your current plan",
      icon: Timer,
      color: "from-[#28F16B] to-[#22c55e]",
      bgColor: "from-[#28F16B]/10 to-[#22c55e]/5"
    }
  ];

  return (
    <motion.div 
      variants={fadeInVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInVariants}>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#1AADF0] to-[#F52E60] bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-xl text-gray-600 mt-2">
          Welcome back, <span className="font-semibold text-gray-800">{user?.first_name}</span>! 
          <Sparkles className="inline w-5 h-5 ml-1 text-[#FFBC2B]" />
        </p>
      </motion.div>

      {error && (
        <motion.div variants={fadeInVariants}>
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div 
        variants={staggeredVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      >
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          const formattedTotalCalls = new Intl.NumberFormat().format(
            Number(metric.title === 'Total Calls' ? metric.value : 0)
          );

          return (
            <motion.div key={metric.title} variants={cardVariants}>
              <Card className="relative overflow-hidden border bg-white shadow-sm hover:shadow-md transition-all duration-300 py-0 min-h-[110px]">
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgColor} opacity-20`} />
                <div className="relative p-4">
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center justify-center rounded-lg p-2 bg-gradient-to-br ${metric.color} shadow-sm`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">{metric.title}</span>
                  </div>
                  <div className={`mt-1 text-3xl font-bold bg-gradient-to-r ${metric.color} bg-clip-text text-transparent leading-tight`}>
                    {metric.title === 'Total Calls' ? formattedTotalCalls : metric.value}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{metric.description}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Agents Section */}
      <motion.div variants={fadeInVariants}>
        <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-sm py-3 gap-1">
          <CardHeader className="pb-1 pt-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-[#1AADF0] to-[#F52E60]">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="whitespace-nowrap">Your AI Agents</span>
                <span className="text-sm font-normal text-gray-500">({agentPerformances.length})</span>
              </CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 w-full sm:w-auto">
                <div className="relative">
                  <input
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(e.target.value)}
                    placeholder="Search agents..."
                    className="h-10 w-full sm:w-64 rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#1AADF0] focus:ring-[3px] focus:ring-[#1AADF0]/20"
                  />
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
                <div className="inline-flex rounded-md border border-gray-200 bg-white p-1">
                  <button
                    className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-sm ${agentsView === 'grid' ? 'bg-[#1AADF0]/10 text-[#1AADF0]' : 'text-gray-600 hover:bg-gray-50'}`}
                    onClick={() => setAgentsView('grid')}
                    type="button"
                  >
                    <LayoutGrid className="h-4 w-4" /> Grid
                  </button>
                  <button
                    className={`ml-1 flex items-center gap-1.5 rounded px-2 py-1.5 text-sm ${agentsView === 'list' ? 'bg-[#1AADF0]/10 text-[#1AADF0]' : 'text-gray-600 hover:bg-gray-50'}`}
                    onClick={() => setAgentsView('list')}
                    type="button"
                  >
                    <ListIcon className="h-4 w-4" /> List
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap w-full sm:w-auto"
                  onClick={() => router.push('/agents')}
                >
                  Manage All
                </Button>
              </div>
            </div>
            <CardDescription className="mt-0">
              Performance overview of your AI agents
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            {statsLoading ? (
              <motion.div 
                variants={staggeredVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
              >
                {[1, 2, 3].map((i) => (
                  <motion.div key={i} variants={cardVariants} className="p-6 border rounded-xl bg-gray-50">
                    <Skeleton className="h-12 w-12 rounded-full mb-4" />
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24 mb-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : filteredAgents.length > 0 ? (
              agentsView === 'grid' ? (
                <motion.div 
                  variants={staggeredVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                >
                  {visibleAgents.map((agent) => (
                    <motion.div 
                      key={agent.assistant_uuid} 
                      variants={cardVariants}
                      className="group relative p-4 border rounded-xl hover:shadow-lg transition-all duration-300 bg-white border-gray-200"
                    >
                      <button
                        type="button"
                        onClick={() => openQuickEdit(agent.assistant_uuid)}
                        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:text-[#1AADF0] hover:bg-gray-50 border border-gray-200"
                        aria-label="Quick edit"
                        title="Quick edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <div className="flex items-center gap-3 mb-3">
                        {agent.assistant_avatar_url ? (
                          <img 
                            src={agent.assistant_avatar_url} 
                            alt={agent.assistant_name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#1AADF0] to-[#F52E60] flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {agent.assistant_name}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs mb-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#1AADF0]/10 text-[#1AADF0] px-2 py-1 font-medium">
                          <Phone className="h-3 w-3" /> {agent.totalCount} calls
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#28F16B]/10 text-[#28F16B] px-2 py-1 font-medium">
                          {agent.totalCount > 0 ? Math.round((agent.successCount / agent.totalCount) * 100) : 0}% success
                        </span>
                        <span className="ml-auto text-gray-500">{agent.percentPositive}% pos</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                        <div 
                          className="bg-gradient-to-r from-[#28F16B] to-[#22c55e] h-1.5 rounded-full"
                          style={{ width: `${agent.percentPositive}%` }}
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full gap-2"
                        onClick={() => router.push(`/agents/${agent.assistant_uuid}`)}
                      >
                        View Details
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="space-y-2">
                  <div className="hidden lg:grid grid-cols-12 gap-4 px-2 text-xs font-medium text-gray-500">
                    <div className="col-span-4">Agent</div>
                    <div className="col-span-2">Total Calls</div>
                    <div className="col-span-2">Success</div>
                    <div className="col-span-2">Positive</div>
                    <div className="col-span-2">Actions</div>
                  </div>
                  {visibleAgents.map((agent) => (
                    <div
                      key={agent.assistant_uuid}
                      className="relative grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:grid-cols-12 sm:items-center"
                    >
                      <div className="sm:col-span-4 flex items-center gap-3 min-w-0">
                        {agent.assistant_avatar_url ? (
                          <img 
                            src={agent.assistant_avatar_url} 
                            alt={agent.assistant_name}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#1AADF0] to-[#F52E60] flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{agent.assistant_name}</div>
                        </div>
                      </div>
                      <div className="sm:col-span-2 text-sm font-semibold text-gray-800">{agent.totalCount}</div>
                      <div className="sm:col-span-2 text-sm font-semibold text-gray-800">{agent.totalCount > 0 ? Math.round((agent.successCount / agent.totalCount) * 100) : 0}%</div>
                      <div className="sm:col-span-2 flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-gradient-to-r from-[#28F16B] to-[#22c55e] h-1.5 rounded-full" style={{ width: `${agent.percentPositive}%` }} />
                        </div>
                        <span className="text-xs text-gray-600 w-10 text-right">{agent.percentPositive}%</span>
                      </div>
                      <div className="sm:col-span-2 flex items-center sm:justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openQuickEdit(agent.assistant_uuid)}
                          className="border border-gray-200"
                          title="Quick edit"
                          aria-label="Quick edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full sm:w-auto"
                          onClick={() => router.push(`/agents/${agent.assistant_uuid}`)}
                        >
                          Open
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <motion.div variants={fadeInVariants} className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1AADF0]/20 to-[#F52E60]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-8 w-8 text-[#1AADF0]" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
                <p className="text-gray-600 mb-6">Create your first AI agent to get started</p>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-[#1AADF0] to-[#F52E60] hover:scale-105 transition-transform"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Create Agent
                </Button>
              </motion.div>
            )}
            {filteredAgents.length > (agentsView === 'grid' ? 6 : 8) && (
              <div className="flex justify-center pt-6 mt-4 border-t border-gray-100">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowAllAgents((v) => !v)} 
                  className="text-[#1AADF0] hover:bg-[#1AADF0]/10 px-6 py-2 rounded-lg transition-all duration-200"
                >
                  {showAllAgents ? 'Show less' : `Show all (${filteredAgents.length - (agentsView === 'grid' ? 6 : 8)} more)`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Call Recordings Section */}
      <motion.div variants={fadeInVariants}>
        <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-[#F52E60] to-[#ff5e89]">
                <Activity className="h-5 w-5 text-white" />
              </div>
              Recent Call Recordings
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefreshKey((v) => v + 1)}
                className="h-8 px-3 border-[#1AADF0] text-[#1AADF0] hover:bg-[#1AADF0] hover:text-white"
                title="Refresh recordings"
              >
                <Activity className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Refresh</span>
              </Button>
            </div>
            <CardDescription>
              Browse through all calls handled by your agents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RecordingsList 
              organisationUuid={user?.organisation_uuid || ""}
              pageSize={10}
              showTitle={false}
              title="Recent Calls"
              description="All calls handled by your agents"
              enableQuickView={true}
              onQuickView={handleQuickView}
              refreshKey={refreshKey}
            />
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Call Quick View */}
      <CallQuickView
        isOpen={quickViewOpen}
        onClose={handleCloseQuickView}
        recordId={selectedRecordId}
        agentUuid={selectedAgentUuid}
      />

      <AgentQuickEdit
        isOpen={quickEditOpen}
        onClose={closeQuickEdit}
        agentUuid={quickEditAgentUuid}
      />

      {/* Forced agent creation when none exist */}
      <AgentCreationModal
        open={showCreateModal}
        onOpenChange={(open) => {
          if (open) {
            setShowCreateModal(true);
          } else if (agentPerformances.length > 0) {
            setShowCreateModal(false);
          }
        }}
        onSuccess={() => {
          setShowCreateModal(false);
        }}
        onCreateAgent={handleCreateAgent}
        isCreating={isCreating}
        error={statsError}
      />

      {/* Onboarding overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Floating background accents */}
            <motion.div
              className="pointer-events-none absolute -top-20 -left-24 h-80 w-80 rounded-full bg-[#1AADF0]/15 blur-3xl"
              animate={{ y: [0, -12, 0], x: [0, 10, 0], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 10, repeat: Infinity }}
            />
            <motion.div
              className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#F52E60]/15 blur-3xl"
              animate={{ y: [0, 12, 0], x: [0, -12, 0], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 12, repeat: Infinity }}
            />
            <motion.div
              className="pointer-events-none absolute bottom-1/4 left-1/3 h-48 w-48 rounded-full bg-[#FFBC2B]/10 blur-2xl"
              animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 8, repeat: Infinity }}
            />

            {/* Card */}
            <motion.div
              className="relative z-10 w-full max-w-xl mx-6 rounded-3xl border border-white/50 bg-white/80 shadow-2xl backdrop-blur-xl p-10 text-center"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 90, damping: 16 }}
            >
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-r from-[#1AADF0] to-[#F52E60] shadow-md mb-5">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Welcome to Neural Voice</h2>
              <p className="mt-3 text-gray-600 text-base md:text-lg">
                Create your first voice AI agent to start handling calls and delighting your customers.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3">
                <div className="text-sm text-gray-500">Smooth setup • Beautiful voices • Real-time intelligence</div>
                <Button
                  className="mt-2 h-12 px-8 rounded-xl bg-gradient-to-r from-[#1AADF0] to-[#F52E60] text-white font-semibold hover:shadow-lg hover:scale-[1.01] transition-all"
                  onClick={() => {
                    setShowOnboarding(false);
                    setShowCreateModal(true);
                  }}
                >
                  Are you ready to create your first voice AI agent?
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 