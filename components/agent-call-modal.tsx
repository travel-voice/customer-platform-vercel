"use client";

import React, { useEffect, useState, useRef } from "react";
import Vapi from "@vapi-ai/web";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, PhoneOff, Bot, Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  assistantId: string;
  agentName: string;
  agentImage?: string;
}

// Vapi instance should be singleton if possible, or cleanup properly
const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "");

export function AgentCallModal({
  isOpen,
  onClose,
  assistantId,
  agentName,
  agentImage,
}: AgentCallModalProps) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [agentVolume, setAgentVolume] = useState(0);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [activeTranscript, setActiveTranscript] = useState("");

  useEffect(() => {
    if (isOpen) {
        startCall();
    } else {
        endCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Event listeners
    const onCallStart = () => {
      setStatus("connected");
    };

    const onCallEnd = () => {
      setStatus("idle");
      onClose();
    };

    const onError = (error: any) => {
      console.error("Vapi error:", error);
      setStatus("error");
    };

    const onVolumeLevel = (volume: number) => {
      setAgentVolume(volume);
    };
    
    const onSpeechStart = () => {
        setIsUserSpeaking(true);
    };
    
    const onSpeechEnd = () => {
        setIsUserSpeaking(false);
    };
    
    const onMessage = (message: any) => {
        if (message.type === "transcript" && message.transcriptType === "partial") {
            setActiveTranscript(message.transcript);
        }
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("error", onError);
    vapi.on("volume-level", onVolumeLevel);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("message", onMessage);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("error", onError);
      vapi.off("volume-level", onVolumeLevel);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("message", onMessage);
    };
  }, [isOpen, onClose]);

  const startCall = async () => {
    setStatus("connecting");
    try {
      await vapi.start(assistantId);
    } catch (err) {
      console.error("Failed to start call:", err);
      setStatus("error");
    }
  };

  const endCall = () => {
    vapi.stop();
    setStatus("idle");
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    vapi.setMuted(newMutedState);
    setIsMuted(newMutedState);
  };

  // Calculate pulsing effect based on volume
  const pulseScale = 1 + Math.min(agentVolume, 1) * 0.2;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-0 bg-transparent shadow-none p-0 overflow-hidden focus:outline-none">
        {/* Glassmorphism Container */}
        <div className="relative flex flex-col items-center justify-center w-full h-[600px] rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
           <DialogTitle className="sr-only">Call with {agentName}</DialogTitle>
          
          {/* Background decorative elements */}
          <div className="absolute top-[-20%] left-[-20%] w-[300px] h-[300px] rounded-full bg-[#1AADF0]/30 blur-[80px]" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[300px] h-[300px] rounded-full bg-purple-500/30 blur-[80px]" />

          {/* Header */}
          <div className="absolute top-6 w-full px-6 flex justify-between items-start z-10">
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full">
              <div className={cn("w-2 h-2 rounded-full", 
                status === "connected" ? "bg-green-400 animate-pulse" : 
                status === "connecting" ? "bg-yellow-400" : "bg-red-400"
              )} />
              <span className="text-xs font-medium text-white/90">
                {status === "connected" ? "Live" : 
                 status === "connecting" ? "Connecting..." : "Disconnected"}
              </span>
            </div>
            <div className="bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                <span className="text-xs font-medium text-white/90">
                   AI Voice Agent
                </span>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col items-center justify-center z-10 w-full px-8">
            {/* Avatar with Pulse */}
            <div className="relative mb-8">
              {/* Ripple/Pulse Effect Rings */}
              {status === "connected" && agentVolume > 0.01 && (
                 <>
                    <div className="absolute inset-0 rounded-full bg-[#1AADF0]/30 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute inset-0 rounded-full bg-[#1AADF0]/20 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.5s' }} />
                 </>
              )}
              
              <div 
                className="relative h-32 w-32 rounded-full ring-4 ring-white/20 shadow-[0_0_40px_rgba(26,173,240,0.4)] transition-transform duration-100 ease-out"
                style={{ transform: `scale(${pulseScale})` }}
              >
                <Avatar className="h-full w-full">
                  <AvatarImage src={agentImage} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-[#1AADF0] to-indigo-600 text-white text-3xl">
                    {agentName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Agent Name & Status */}
            <h2 className="text-2xl font-bold text-white mb-2 text-center">{agentName}</h2>
            <p className="text-white/60 text-center h-6">
               {status === "connecting" && "Establishing connection..."}
               {status === "connected" && (agentVolume > 0.05 ? "Speaking..." : isUserSpeaking ? "Listening..." : "Ready")}
               {status === "error" && "Connection failed"}
            </p>

            {/* Live Transcript (Optional, simulated placement) */}
            <div className="mt-8 w-full h-24 flex items-center justify-center">
                {activeTranscript && (
                    <p className="text-white/80 text-center text-lg font-light animate-in fade-in slide-in-from-bottom-2">
                        "{activeTranscript}"
                    </p>
                )}
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-8 w-full px-8 flex justify-center items-center gap-6 z-10">
            {/* Mute Button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-14 w-14 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 hover:scale-105 transition-all duration-200",
                isMuted && "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
              )}
              onClick={toggleMute}
              disabled={status !== "connected"}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>

            {/* End Call Button */}
            <Button
              variant="destructive"
              size="icon"
              className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg hover:scale-105 transition-all duration-200 ring-4 ring-red-500/30"
              onClick={onClose}
            >
              <PhoneOff className="h-8 w-8 fill-white" />
            </Button>

            {/* Volume/Settings (Placeholder) */}
            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 hover:scale-105 transition-all duration-200"
              disabled
            >
              <Volume2 className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

