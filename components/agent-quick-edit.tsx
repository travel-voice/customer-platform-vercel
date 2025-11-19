"use client";

import { AnimatePresence,motion } from "framer-motion";
import { Loader2, MessageSquare,Save, X } from "lucide-react";
import React, { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAgentDetailsStore } from "@/lib/stores/agent-details-store";

type AgentQuickEditProps = {
  isOpen: boolean;
  onClose: () => void;
  agentUuid: string | null;
};

const slideInVariants = {
  hidden: { x: "100%", opacity: 0 } as const,
  visible: { x: 0, opacity: 1, transition: { type: "spring" as const, damping: 25, stiffness: 200, duration: 0.5 } },
  exit: { x: "100%", opacity: 0, transition: { type: "spring" as const, damping: 25, stiffness: 200, duration: 0.3 } },
};

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } } as const;

export function AgentQuickEdit({ isOpen, onClose, agentUuid }: AgentQuickEditProps) {
  const { user } = useAuthStore();
  const {
    agentDetail,
    isLoading,
    isUpdating,
    error,
    getAgentDetails,
    updateAgent,
    clearAgent,
  } = useAgentDetailsStore();

  const [firstMessage, setFirstMessage] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen && agentUuid && user?.organisation_uuid) {
      getAgentDetails(user.organisation_uuid, agentUuid);
    }
    if (!isOpen) {
      clearAgent();
      setSaved(false);
    }
  }, [isOpen, agentUuid, user?.organisation_uuid, getAgentDetails, clearAgent]);

  useEffect(() => {
    if (agentDetail) {
      setFirstMessage(agentDetail.first_message || "");
      setSystemPrompt(agentDetail.system_prompt || "");
    }
  }, [agentDetail]);

  const handleSave = async () => {
    if (!user?.organisation_uuid || !agentUuid) return;
    setSaved(false);
    try {
      await updateAgent(user.organisation_uuid, agentUuid, {
        first_message: firstMessage,
        system_prompt: systemPrompt,
      });
      
      // Refresh agent details from server to get latest data
      await getAgentDetails(user.organisation_uuid, agentUuid);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      
      // Force refresh of the agents list on the parent component
      window.dispatchEvent(new CustomEvent('agent-updated', { 
        detail: { agentUuid, organisationUuid: user.organisation_uuid } 
      }));
    } catch (error) {
      console.error('Failed to save agent:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          <motion.div
            variants={slideInVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 md:p-5 border-b bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-[#1AADF0] to-[#F52E60]">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-gray-900">Quick Edit</h2>
                    <p className="text-xs text-gray-600">Edit message and prompt</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </Button>
                </div>

                {/* Identity */}
                <div className="mt-3 flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-white shadow">
                    <AvatarImage src={agentDetail?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-[#1AADF0] to-[#F52E60] text-white">
                      {(agentDetail?.name || "A").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate max-w-xs">{agentDetail?.name || "Agent"}</p>
                    {agentDetail?.description && (
                      <p className="text-xs text-gray-600 truncate max-w-sm">{agentDetail.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : error ? (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="first_message">First message</Label>
                      <Textarea
                        id="first_message"
                        value={firstMessage}
                        onChange={(e) => setFirstMessage(e.target.value)}
                        className="min-h-[60px] max-h-[100px] resize-none border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1AADF0]/30 focus:border-[#1AADF0]"
                        placeholder="Hello! I'm here to help. How can I assist you today?"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-[#F52E60] rounded-full" />
                        <Label htmlFor="system_prompt" className="text-base font-semibold">Agent instructions</Label>
                      </div>
                      <Textarea
                        id="system_prompt"
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="min-h-[200px] border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1AADF0]/30 focus:border-[#1AADF0]"
                        placeholder="Define your assistant's behavior and style..."
                      />
                    </div>

                    {saved && (
                      <div className="text-sm text-green-600">Saved</div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t bg-white flex items-center justify-end gap-2">
                <Button variant="outline" onClick={onClose}>Close</Button>
                <Button onClick={handleSave} disabled={isUpdating || isLoading} className="gap-2">
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


