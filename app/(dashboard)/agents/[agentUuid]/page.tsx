"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronLeft,
  Copy,
  ExternalLink,
  Hash,
  Loader2,
  MessageSquare,
  Mic,
  Phone,
  Play,
  Save,
  Settings,
  Sparkles,
  Users,
  Search,
  Filter,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Volume2,
  Edit3,
  Upload,
  Camera,
  Trash2,
  X,
  Link,
  FileText,
  Download,
  Eye
} from "lucide-react";
import { RecordingsList } from "@/components/calls-list";
import { VOICES_LIST } from "@/lib/types/agents";
import { TRAVEL_DATAPOINTS, TRAVEL_CATEGORIES } from "@/lib/constants/travel-datapoints";
import type { IDataPoint } from "@/lib/types/agents";
import { useForm } from "react-hook-form";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter,CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {PROMPT_TEMPLATES } from "@/lib/constants/prompt-templates";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAgentDetailsStore } from "@/lib/stores/agent-details-store";
import { AgentCallModal } from "@/components/agent-call-modal";

const BACKGROUND_SOUNDS = ["office", "off"];

// Form schemas
const contentFormSchema = z.object({
  first_message: z.string().min(1, "First message is required"),
  system_prompt: z.string().min(1, "System prompt is required"),
});

const voiceFormSchema = z.object({
  voice_id: z.string().min(1, "Please select a voice"),
});

const advancedSettingsSchema = z.object({
  firstMessageMode: z.enum(["assistant-speaks-first", "assistant-waits-for-user"]),
  waitTimeBeforeSpeaking: z.number().min(0).max(5),
  interruptionThreshold: z.number().min(0).max(10),
  maxDuration: z.number().min(10).max(43200),
  transcriptionLanguage: z.string(),
  confidenceThreshold: z.number().min(0).max(1),
  modelTemperature: z.number().min(0).max(1),
  maxTokens: z.number().min(10).max(4096),
  voicemailDetectionEnabled: z.boolean(),
  voicemailMessage: z.string().optional(),
  beepMaxAwaitSeconds: z.number().min(0).max(60),
  backgroundSound: z.string().optional(),
  notificationEmails: z.array(z.string().email("Invalid email address")).optional(),
});

type ContentFormData = z.infer<typeof contentFormSchema>;
type VoiceFormData = z.infer<typeof voiceFormSchema>;
type AdvancedSettingsFormData = z.infer<typeof advancedSettingsSchema>;


export default function AgentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const agentUuid = params.agentUuid as string;
  
  const { user } = useAuthStore();
    const { 
    agentDetail, 
    agentStats, 
    isLoading, 
    isUpdating,
    error,
    getAgentDetails, 
    getAgentStats,
    updateAgent,
    updateDataExtraction,
    getDataExtraction,
    deleteAgent,
    clearAgent,
    getAgentFiles,
    uploadAgentFile,
    deleteAgentFile,
    isUploading
  } = useAgentDetailsStore();

  const [activeTab, setActiveTab] = useState("content");
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [accentFilter, setAccentFilter] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [aiPromptDescription, setAiPromptDescription] = useState({
    agentRole: "",
    primaryGoal: "",
    companyName: "",
    keyInfo: ""
  });
  
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  // Knowledge Base state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRefKB = useRef<HTMLInputElement>(null);

  // Knowledge Base Handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let files: FileList | null = null;
    
    if ('dataTransfer' in event) {
      files = event.dataTransfer.files;
    } else {
      files = event.target.files;
    }

    if (!files || files.length === 0 || !user?.organisation_uuid || !agentUuid) return;

    // Handle only the first file for now
    const file = files[0];
    
    // Validation
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be under 10MB");
      return;
    }

    const allowedTypes = [
      'text/plain', 
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert("Only PDF, DOCX, DOC, and TXT files are allowed.");
      return;
    }

    try {
      await uploadAgentFile(agentUuid, file);
      // Success - reload files handled by store
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload file.");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e);
  };

  const handleFileDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      await deleteAgentFile(agentUuid, fileId);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete file.");
    }
  };

  // Data tab state
  const [dataSearch, setDataSearch] = useState("");
  const [dataCategory, setDataCategory] = useState("all");
  const [isCollapsed, setIsCollapsed] = useState<Record<string, boolean>>({});
  const [selectedDataIds, setSelectedDataIds] = useState<string[]>([]);
  const [savedDataIds, setSavedDataIds] = useState<string[]>([]);
  
  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  
  // Image upload state
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Email notification state
  const [newEmail, setNewEmail] = useState("");

  // Feature flags
  const ADVANCED_COMING_SOON = false;

  // Form hooks
  const contentForm = useForm<ContentFormData>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      first_message: "",
      system_prompt: "",
    },
  });

  const voiceForm = useForm<VoiceFormData>({
    resolver: zodResolver(voiceFormSchema),
    defaultValues: {
      voice_id: "",
    },
  });

  const advancedSettingsForm = useForm<AdvancedSettingsFormData>({
    resolver: zodResolver(advancedSettingsSchema),
    defaultValues: {
      firstMessageMode: "assistant-speaks-first",
      waitTimeBeforeSpeaking: 0.4,
      interruptionThreshold: 2,
      maxDuration: 600,
      transcriptionLanguage: "en-US",
      confidenceThreshold: 0.7,
      modelTemperature: 0.7,
      maxTokens: 256,
      voicemailDetectionEnabled: true,
      voicemailMessage: "Sorry we missed you. Please leave a message and we'll get back to you shortly.",
      beepMaxAwaitSeconds: 10,
      backgroundSound: "office",
    },
  });

  // Load agent data
  useEffect(() => {
    if (user?.organisation_uuid && agentUuid) {
      getAgentDetails(user.organisation_uuid, agentUuid);
      getAgentStats(user.organisation_uuid, agentUuid);
    }
    
    return () => {
      clearAgent();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [user?.organisation_uuid, agentUuid, getAgentDetails, getAgentStats, clearAgent]);

  // Update form values when character data loads
  useEffect(() => {
    if (agentDetail) {
      contentForm.reset({
        first_message: agentDetail.first_message || "",
        system_prompt: agentDetail.system_prompt || "",
      });
      voiceForm.reset({
        voice_id: agentDetail.voice_id || "",
      });
      setEditedName(agentDetail.name || "");

      // Reset advanced settings form
      advancedSettingsForm.reset({
        firstMessageMode: agentDetail.firstMessageMode || "assistant-speaks-first",
        waitTimeBeforeSpeaking: agentDetail.waitTimeBeforeSpeaking ?? 0.4,
        interruptionThreshold: agentDetail.interruptionThreshold ?? 2,
        maxDuration: agentDetail.maxDuration || 600,
        transcriptionLanguage: agentDetail.transcriptionLanguage || "en-US",
        confidenceThreshold: agentDetail.confidenceThreshold ?? 0.7,
        modelTemperature: agentDetail.modelTemperature ?? 0.7,
        maxTokens: agentDetail.maxTokens || 256,
        voicemailDetectionEnabled: agentDetail.voicemailDetectionEnabled ?? true,
        voicemailMessage: agentDetail.voicemailMessage || "Sorry we missed you. Please leave a message and we'll get back to you shortly.",
        beepMaxAwaitSeconds: agentDetail.beepMaxAwaitSeconds || 10,
        backgroundSound: agentDetail.backgroundSound || "office",
        notificationEmails: agentDetail.notificationEmails || [],
      });
    }
  }, [agentDetail, contentForm, voiceForm, advancedSettingsForm]);

  // Load existing data extraction configuration when data tab is accessed
  useEffect(() => {
    if (activeTab === 'data' && user?.organisation_uuid && agentUuid) {
      const loadDataExtraction = async () => {
        try {
          const existingProperties = await getDataExtraction(user.organisation_uuid, agentUuid);
          // Filter to only include properties that exist in our TRAVEL_DATAPOINTS
          const validProperties = existingProperties.filter(prop => 
            TRAVEL_DATAPOINTS.some(dp => dp.id === prop)
          );
          setSelectedDataIds(validProperties);
          setSavedDataIds(validProperties);
        } catch (error) {
          console.error('Failed to load existing data extraction configuration:', error);
          // If loading fails, start with empty selection
          setSelectedDataIds([]);
          setSavedDataIds([]);
        }
      };
      loadDataExtraction();
    }
  }, [activeTab, user?.organisation_uuid, agentUuid, getDataExtraction]);

  // Load files when knowledge base tab is active
  useEffect(() => {
    if (activeTab === 'knowledge-base' && agentUuid) {
      getAgentFiles(agentUuid);
    }
  }, [activeTab, agentUuid, getAgentFiles]);

  // Cleanup image preview URL on component unmount
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Handle agent deletion
  const handleDeleteAgent = async () => {
    if (!user?.organisation_uuid || !agentUuid) return;
    
    try {
      await deleteAgent(user.organisation_uuid, agentUuid);
      router.push('/home');
    } catch (error) {
      console.error("Failed to delete agent:", error);
    }
  };

  // Handle content form submission
  const onContentSubmit = async (data: ContentFormData) => {
    if (!user?.organisation_uuid || !agentUuid) return;
    
    try {
      await updateAgent(user.organisation_uuid, agentUuid, {
        first_message: data.first_message,
        system_prompt: data.system_prompt,
      });
      
      // Refresh agent details from server to get latest data
      await getAgentDetails(user.organisation_uuid, agentUuid);
      
      setLastSaved("content");
      setTimeout(() => setLastSaved(null), 3000);
      
      // Notify other components that agent was updated
      window.dispatchEvent(new CustomEvent('agent-updated', { 
        detail: { agentUuid, organisationUuid: user.organisation_uuid } 
      }));
    } catch (error) {
      console.error("Failed to update character content:", error);
    }
  };

  // Handle voice form submission
  const onVoiceSubmit = async (data: VoiceFormData) => {
    if (!user?.organisation_uuid || !agentUuid) return;
    
    try {
      await updateAgent(user.organisation_uuid, agentUuid, {
        voice_id: data.voice_id,
      });
      
      // Refresh agent details from server to get latest data
      await getAgentDetails(user.organisation_uuid, agentUuid);
      
      setLastSaved("voice");
      setTimeout(() => setLastSaved(null), 3000);
    } catch (error) {
      console.error("Failed to update character voice:", error);
    }
  };

  // Handle advanced settings submission
  const onAdvancedSubmit = async (data: AdvancedSettingsFormData) => {
    if (!user?.organisation_uuid || !agentUuid) return;
    
    try {
      await updateAgent(user.organisation_uuid, agentUuid, {
        ...data,
      });
      
      // Refresh agent details from server to get latest data
      await getAgentDetails(user.organisation_uuid, agentUuid);
      
      setLastSaved("advanced");
      setTimeout(() => setLastSaved(null), 3000);
    } catch (error) {
      console.error("Failed to update advanced settings:", error);
    }
  };

  // Handle data schema save
  const onDataSave = async () => {
    if (!user?.organisation_uuid || !agentUuid) return;
    try {
      // Always persist, even when empty (clears server-side schema)
      const selectedDatapoints = TRAVEL_DATAPOINTS.filter(dp => selectedDataIds.includes(dp.id));
      await updateDataExtraction(user.organisation_uuid, agentUuid, selectedDatapoints);
      
      setSavedDataIds(selectedDataIds);
      setLastSaved("data");
      setTimeout(() => setLastSaved(null), 3000);
    } catch (error: any) {
      console.error("Failed to update data extraction schema:", error);
      // The error state is already handled by the store, 
      // but we could add a toast notification here if needed
      // intentionally do not rethrow to avoid unhandled errors in event handlers
      }
  };

  // Image processing function
  const processImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        // Set canvas size to 500x500 (circular crop)
        canvas.width = 500;
        canvas.height = 500;
        
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Configure canvas for higher quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Create circular clipping path
        ctx.beginPath();
        ctx.arc(250, 250, 250, 0, Math.PI * 2);
        ctx.clip();

        // Calculate dimensions to maintain aspect ratio
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;

        // Draw and crop image
        ctx.drawImage(img, x, y, size, size, 0, 0, 500, 500);
        
        // Convert to base64 and remove data URL prefix
        const base64 = canvas.toDataURL('image/webp', 0.85);
        const base64String = base64.split(',')[1]; // Remove data URL prefix
        
        URL.revokeObjectURL(objectUrl);
        resolve(base64String);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };
      
      img.src = objectUrl;
    });
  };

  // Data tab helpers
  const filteredDataPoints = useMemo<IDataPoint[]>(() => {
    return TRAVEL_DATAPOINTS.filter(d => {
      const search = dataSearch.trim().toLowerCase();
      const matchesSearch = !search ||
        d.label.toLowerCase().includes(search) ||
        d.id.toLowerCase().includes(search) ||
        d.category.toLowerCase().includes(search);
      const matchesCategory = dataCategory === 'all' || d.category === dataCategory;
      return matchesSearch && matchesCategory;
    });
  }, [dataSearch, dataCategory]);

  const isSelected = (id: string) => selectedDataIds.includes(id);
  const toggleSelect = (id: string) => {
    setSelectedDataIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const selectAllFiltered = () => {
    const add = filteredDataPoints.map(d => d.id);
    setSelectedDataIds(prev => Array.from(new Set([...prev, ...add])));
  };
  const clearAll = () => setSelectedDataIds([]);

  // Name editing handlers
  const handleNameEdit = () => {
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (!user?.organisation_uuid || !agentUuid || !editedName.trim()) return;
    
    try {
      await updateAgent(user.organisation_uuid, agentUuid, {
        name: editedName.trim(),
      });
      
      // Refresh agent details from server to get latest data
      await getAgentDetails(user.organisation_uuid, agentUuid);
      
      setIsEditingName(false);
      setLastSaved("name");
      setTimeout(() => setLastSaved(null), 3000);
    } catch (error) {
      console.error("Failed to update agent name:", error);
    }
  };

  const handleNameCancel = () => {
    setEditedName(agentDetail?.name || "");
    setIsEditingName(false);
  };

  // Image upload handlers
  const handleImageClick = () => {
    setShowImageUploadModal(true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (PNG, JPG, GIF, WebP)');
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB');
      return;
    }

    setSelectedImage(file);
    
    // Revoke previous preview URL to prevent memory leak
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    
    // Create new preview URL
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  };

  const handleImageSave = async () => {
    if (!user?.organisation_uuid || !agentUuid || !selectedImage) return;
    
    try {
      const imageData = await processImageToBase64(selectedImage);
      
      await updateAgent(user.organisation_uuid, agentUuid, {
        image_data: imageData,
      });
      
      // Refresh agent details from server to get latest data
      await getAgentDetails(user.organisation_uuid, agentUuid);
      
      // Clean up and revoke preview URL to prevent memory leak
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setSelectedImage(null);
      setImagePreviewUrl(null);
      setShowImageUploadModal(false);
      
      setLastSaved("image");
      setTimeout(() => setLastSaved(null), 3000);
    } catch (error) {
      console.error("Failed to update agent image:", error);
    }
  };

  const handleImageCancel = () => {
    // Revoke preview URL to prevent memory leak
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setShowImageUploadModal(false);
  };

  // AI Prompt Generation
  const handleGeneratePrompt = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiPromptDescription),
      });

      if (!response.ok) {
        throw new Error("Failed to generate prompt");
      }

      const { system_prompt, first_message } = await response.json();
      contentForm.setValue("system_prompt", system_prompt, { shouldDirty: true });
      contentForm.setValue("first_message", first_message, { shouldDirty: true });
      setIsGenerateDialogOpen(false);
    } catch (error) {
      setGenerationError("Failed to generate prompt. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Play voice preview
  const playVoicePreview = (voiceId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(`/voices/${voiceId}.mp3`);
    audio.onended = () => setPlayingVoiceId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingVoiceId(voiceId);
  };

  // Filtered and grouped voices
  const { maleVoices, femaleVoices } = useMemo(() => {
    const filtered = VOICES_LIST.filter(voice => {
      const nameMatch = voice.name.toLowerCase().includes(searchTerm.toLowerCase());
      const genderMatch = genderFilter === 'all' || voice.gender.toLowerCase() === genderFilter;
      const ageMatch = ageFilter === 'all' || voice.age.toLowerCase().replace(/ /g, '') === ageFilter;
      const accentMatch = accentFilter === 'all' || voice.accent.toLowerCase() === accentFilter;
      return nameMatch && genderMatch && ageMatch && accentMatch;
    });

    const male = filtered
      .filter(v => v.gender === 'Male')
      .sort((a, b) => a.name.localeCompare(b.name));

    const female = filtered
      .filter(v => v.gender === 'Female')
      .sort((a, b) => a.name.localeCompare(b.name));

    return { maleVoices: male, femaleVoices: female };
  }, [searchTerm, genderFilter, ageFilter, accentFilter]);

  // Unique filter options
  const genderOptions = ['all', ...Array.from(new Set(VOICES_LIST.map(v => v.gender.toLowerCase())))];
  const ageOptions = ['all', ...Array.from(new Set(VOICES_LIST.map(v => v.age.toLowerCase().replace(/ /g, ''))))];
  const accentOptions = ['all', ...Array.from(new Set(VOICES_LIST.map(v => v.accent.toLowerCase())))];


  // Calculate if we should show sentiment tab
  const showSentimentTab = agentStats && 
    ((agentStats.pieChart.pos + agentStats.pieChart.neu + agentStats.pieChart.neg) > 0);

  const getSentimentData = () => {
    if (!agentStats?.pieChart) return [];
    
    return [
      { name: 'Positive', value: agentStats.pieChart.pos, color: '#10b981' },
      { name: 'Neutral', value: agentStats.pieChart.neu, color: '#6b7280' },
      { name: 'Negative', value: agentStats.pieChart.neg, color: '#ef4444' },
    ].filter(item => item.value > 0);
  };

  const getSelectedVoice = () => {
    return VOICES_LIST.find(voice => voice.id === voiceForm.watch("voice_id"));
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      // Add "nv-" prefix for button ID (activation_id)
      const textToCopy = type === 'activation' ? `nv-${text}` : text;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim();
    if (!email) return;
    
    // Simple validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return;
    }

    const currentEmails = advancedSettingsForm.getValues("notificationEmails") || [];
    if (!currentEmails.includes(email)) {
      advancedSettingsForm.setValue("notificationEmails", [...currentEmails, email], { shouldDirty: true });
    }
    setNewEmail("");
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    const currentEmails = advancedSettingsForm.getValues("notificationEmails") || [];
    advancedSettingsForm.setValue(
      "notificationEmails", 
      currentEmails.filter(e => e !== emailToRemove),
      { shouldDirty: true }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!agentDetail) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Character not found or you don't have permission to view it.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 p-8">
        <div className="relative z-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/home')}
              className="hover:bg-white/50 dark:hover:bg-black/20"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            
            {/* Try Now Button */}
            {agentDetail.activation_id && (
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1AADF0] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#0996d4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1AADF0] focus-visible:ring-offset-2 transition-all duration-200 hover:scale-105 cursor-pointer"
                onClick={() => setIsCallModalOpen(true)}
              >
                <Phone className="h-4 w-4" />
                Try Now
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="relative group cursor-pointer" onClick={handleImageClick}>
              <Avatar className="h-20 w-20 ring-4 ring-white/50 shadow-xl group-hover:ring-blue-400 transition-all duration-200">
                <AvatarImage src={agentDetail.avatar_url} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl font-semibold">
                  <Bot className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <Edit3 className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 ring-2 ring-white flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-white"></div>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-3xl font-bold h-12 border-2 border-blue-400 focus:border-blue-600"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleNameSave();
                        } else if (e.key === 'Escape') {
                          handleNameCancel();
                        }
                      }}
                      autoFocus
                    />
                    <Button 
                      size="sm" 
                      onClick={handleNameSave}
                      disabled={isUpdating || !editedName.trim()}
                      className="h-8"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleNameCancel}
                      className="h-8"
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {agentDetail.name}
                    </h1>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleNameEdit}
                      className="p-1 h-8 w-8 hover:bg-white/50 dark:hover:bg-black/20"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Badge variant="secondary" className="bg-white/50 text-gray-700 dark:bg-black/20 dark:text-gray-300">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Agent
                </Badge>
                {lastSaved === "name" && (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">Saved</span>
                  </div>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                {agentDetail.description || "Your intelligent AI agent"}
              </p>
              
              {/* ID Information */}
              <div className="space-y-3 mb-4">
                {/* Button ID (Activation ID) */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Button ID</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Use this as your button ID to activate the agent</p>
                    </div>
                  </div>
                  {agentDetail.activation_id ? (
                    <div className="flex items-center gap-2 bg-white/60 dark:bg-black/20 rounded-lg px-3 py-2 border">
                      <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
                        nv-{agentDetail.activation_id}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        onClick={() => copyToClipboard(agentDetail.activation_id!, 'activation')}
                      >
                        {copied === 'activation' ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                      Not configured
                    </Badge>
                  )}
                </div>

                {/* Agent UUID */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <Hash className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Agent UUID</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Internal identifier for this agent</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 dark:bg-black/20 rounded-lg px-3 py-2 border">
                    <code className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate max-w-[160px] sm:max-w-[200px]">
                      {agentUuid}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                      onClick={() => copyToClipboard(agentUuid, 'uuid')}
                    >
                      {copied === 'uuid' ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Voice Info */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Voice</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Selected voice for this agent</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-white/60 dark:bg-black/20">
                    {getSelectedVoice()?.name || "Not selected"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-1/4 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Modern Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div>
            <TabsList className="flex w-full gap-2 bg-white/70 dark:bg-black/20 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
              <TabsTrigger 
                value="content" 
                className="flex-1 justify-center rounded-lg text-sm font-medium px-3 py-2 transition-colors border border-transparent hover:bg-[#1AADF0]/10 data-[state=active]:bg-[#1AADF0] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:border-[#1AADF0]"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Content
              </TabsTrigger>
              <TabsTrigger 
                value="voice" 
                className="flex-1 justify-center rounded-lg text-sm font-medium px-3 py-2 transition-colors border border-transparent hover:bg-[#1AADF0]/10 data-[state=active]:bg-[#1AADF0] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:border-[#1AADF0]"
              >
                <Mic className="h-4 w-4 mr-2" />
                Voice
              </TabsTrigger>
              {showSentimentTab && (
                <TabsTrigger 
                  value="sentiment" 
                  className="flex-1 justify-center rounded-lg text-sm font-medium px-3 py-2 transition-colors border border-transparent hover:bg-[#1AADF0]/10 data-[state=active]:bg-[#1AADF0] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:border-[#1AADF0]"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Sentiment
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="calls" 
                className="flex-1 justify-center rounded-lg text-sm font-medium px-3 py-2 transition-colors border border-transparent hover:bg-[#1AADF0]/10 data-[state=active]:bg-[#1AADF0] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:border-[#1AADF0]"
              >
                <Phone className="h-4 w-4 mr-2" />
                Calls
              </TabsTrigger>
              <TabsTrigger 
                value="knowledge-base" 
                className="flex-1 justify-center rounded-lg text-sm font-medium px-3 py-2 transition-colors border border-transparent hover:bg-[#1AADF0]/10 data-[state=active]:bg-[#1AADF0] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:border-[#1AADF0]"
              >
                <FileText className="h-4 w-4 mr-2" />
                Knowledge Base
              </TabsTrigger>
              <TabsTrigger 
                value="data" 
                className="flex-1 justify-center rounded-lg text-sm font-medium px-3 py-2 transition-colors border border-transparent hover:bg-[#1AADF0]/10 data-[state=active]:bg-[#1AADF0] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:border-[#1AADF0]"
              >
                <ListChecks className="h-4 w-4 mr-2" />
                Data
              </TabsTrigger>
              <TabsTrigger 
                value="advanced" 
                className="flex-1 justify-center rounded-lg text-sm font-medium px-3 py-2 transition-colors border border-transparent hover:bg-[#1AADF0]/10 data-[state=active]:bg-[#1AADF0] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:border-[#1AADF0]"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Advanced
              </TabsTrigger>
              <TabsTrigger 
                value="integrations" 
                className="flex-1 justify-center rounded-lg text-sm font-medium px-3 py-2 transition-colors border border-transparent hover:bg-[#1AADF0]/10 data-[state=active]:bg-[#1AADF0] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:border-[#1AADF0]"
              >
                <Link className="h-4 w-4 mr-2" />
                Integrations
              </TabsTrigger>
            </TabsList>
          </div>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <form onSubmit={contentForm.handleSubmit(onContentSubmit)}>
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900/20 dark:to-teal-900/20">
                      <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Content</CardTitle>
                      <CardDescription className="text-base">Define your assistant's personality and purpose</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="shrink-0">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Templates
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[650px]">
                        <DialogHeader>
                          <DialogTitle>Prompt Templates</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          {PROMPT_TEMPLATES.map((template) => (
                            <div
                              key={template.name}
                              className="p-4 rounded-lg border hover:bg-gray-50/50 cursor-pointer"
                              onClick={() => {
                                contentForm.setValue("first_message", template.first_message, { shouldDirty: true });
                                contentForm.setValue("system_prompt", template.system_prompt, { shouldDirty: true });
                                setIsTemplateDialogOpen(false);
                              }}
                            >
                              <h4 className="font-semibold">{template.name}</h4>
                              <p className="text-sm text-muted-foreground">{template.description}</p>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="shrink-0">
                          <Bot className="h-4 w-4 mr-2" />
                          Generate with AI
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Generate Prompt with AI</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <div className="space-y-2">
                            <Label>Agent Role</Label>
                            <Input
                              placeholder="e.g., 'a friendly hotel concierge'"
                              value={aiPromptDescription.agentRole}
                              onChange={(e) => setAiPromptDescription({ ...aiPromptDescription, agentRole: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Primary Goal</Label>
                            <Input
                              placeholder="e.g., 'to book rooms and answer questions'"
                              value={aiPromptDescription.primaryGoal}
                              onChange={(e) => setAiPromptDescription({ ...aiPromptDescription, primaryGoal: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Company Name (Optional)</Label>
                            <Input
                              placeholder="e.g., 'The Grand Budapest Hotel'"
                              value={aiPromptDescription.companyName}
                              onChange={(e) => setAiPromptDescription({ ...aiPromptDescription, companyName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Key Information (Optional)</Label>
                            <Textarea
                              placeholder="e.g., 'The hotel has a pool, a spa, and a Michelin-star restaurant.'"
                              className="h-24"
                              value={aiPromptDescription.keyInfo}
                              onChange={(e) => setAiPromptDescription({ ...aiPromptDescription, keyInfo: e.target.value })}
                            />
                          </div>
                          {generationError && <p className="text-sm text-red-500 mt-2">{generationError}</p>}
                        </div>
                        <Button
                          onClick={handleGeneratePrompt}
                          disabled={isGenerating || !aiPromptDescription.agentRole || !aiPromptDescription.primaryGoal}
                        >
                          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="first_message">First Message</Label>
                  <Textarea
                    id="first_message"
                    placeholder="Hello! I'm here to help. How can I assist you today?"
                    className="min-h-[60px] max-h-[80px] resize-none border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    {...contentForm.register("first_message")}
                  />
                  {contentForm.formState.errors.first_message && (
                    <p className="text-sm text-red-500 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {contentForm.formState.errors.first_message.message}
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700"></div>

                {/* Character Instructions Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                    <Label htmlFor="system_prompt" className="text-lg font-semibold text-gray-900 dark:text-white">
                      Character Instructions
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Define your assistant's personality, behavior, and how it should respond to users
                  </p>
                  <Textarea
                    id="system_prompt"
                    placeholder="You are a helpful and friendly AI assistant. You should be professional, knowledgeable, and always aim to provide accurate and useful information..."
                    className="min-h-[200px] border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    {...contentForm.register("system_prompt")}
                  />
                  {contentForm.formState.errors.system_prompt && (
                    <p className="text-sm text-red-500 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {contentForm.formState.errors.system_prompt.message}
                    </p>
                  )}
                </div>

                {/* Save Section */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    {lastSaved === "content" && (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Changes saved successfully</span>
                      </div>
                    )}
                  </div>
                  <Button 
                    type="submit"
                    disabled={isUpdating || !contentForm.formState.isDirty}
                    className="px-8 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Voice Tab */}
        <TabsContent value="voice" className="space-y-6">
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <Mic className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">Voice Selection</CardTitle>
                  <CardDescription className="text-base">Choose the perfect voice for your assistant's personality</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Voice Filters */}
              <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs h-9 bg-white dark:bg-gray-800"
                />
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="w-[150px] h-9 bg-white dark:bg-gray-800">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map(option => (
                      <SelectItem key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={ageFilter} onValueChange={setAgeFilter}>
                  <SelectTrigger className="w-[150px] h-9 bg-white dark:bg-gray-800">
                    <SelectValue placeholder="Age" />
                  </SelectTrigger>
                  <SelectContent>
                    {ageOptions.map(option => (
                      <SelectItem key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={accentFilter} onValueChange={setAccentFilter}>
                  <SelectTrigger className="w-[150px] h-9 bg-white dark:bg-gray-800">
                    <SelectValue placeholder="Accent" />
                  </SelectTrigger>
                  <SelectContent>
                    {accentOptions.map(option => (
                      <SelectItem key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-8">
                {femaleVoices.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight pb-2 border-b mb-4 dark:text-white dark:border-gray-700">Female Voices</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {femaleVoices.map((voice) => (
                        <div
                          key={voice.id}
                          className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 group ${
                            voiceForm.watch("voice_id") === voice.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-400/50 hover:bg-blue-50/20 dark:hover:bg-gray-800/30'
                          }`}
                          onClick={() => voiceForm.setValue("voice_id", voice.id, { shouldDirty: true })}
                        >
                          {voiceForm.watch("voice_id") === voice.id && (
                            <div className="absolute -top-2 -right-2">
                              <div className="bg-blue-500 text-white rounded-full p-1">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-md text-gray-900 dark:text-white">{voice.name}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{voice.accent} accent</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className={`h-9 w-9 rounded-full transition-colors ${
                                playingVoiceId === voice.id
                                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                playVoicePreview(voice.id);
                              }}
                            >
                              {playingVoiceId === voice.id ? (
                                <Volume2 className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs font-normal border-gray-300 dark:border-gray-600">{voice.gender}</Badge>
                            <Badge variant="outline" className="text-xs font-normal border-gray-300 dark:border-gray-600">{voice.age}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {maleVoices.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight pb-2 border-b mb-4 dark:text-white dark:border-gray-700">Male Voices</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {maleVoices.map((voice) => (
                        <div
                          key={voice.id}
                          className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 group ${
                            voiceForm.watch("voice_id") === voice.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-400/50 hover:bg-blue-50/20 dark:hover:bg-gray-800/30'
                          }`}
                          onClick={() => voiceForm.setValue("voice_id", voice.id, { shouldDirty: true })}
                        >
                          {voiceForm.watch("voice_id") === voice.id && (
                            <div className="absolute -top-2 -right-2">
                              <div className="bg-blue-500 text-white rounded-full p-1">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-md text-gray-900 dark:text-white">{voice.name}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{voice.accent} accent</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className={`h-9 w-9 rounded-full transition-colors ${
                                playingVoiceId === voice.id
                                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                playVoicePreview(voice.id);
                              }}
                            >
                              {playingVoiceId === voice.id ? (
                                <Volume2 className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs font-normal border-gray-300 dark:border-gray-600">{voice.gender}</Badge>
                            <Badge variant="outline" className="text-xs font-normal border-gray-300 dark:border-gray-600">{voice.age}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {(maleVoices.length === 0 && femaleVoices.length === 0) && (
                <div className="text-center text-gray-500 py-8 col-span-full">
                  No voices found matching your criteria.
                </div>
              )}

              {voiceForm.formState.errors.voice_id && (
                <p className="text-sm text-red-500 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {voiceForm.formState.errors.voice_id.message}
                </p>
              )}

              {/* Save Section */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  {lastSaved === "voice" && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Voice saved successfully</span>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={voiceForm.handleSubmit(onVoiceSubmit)}
                  disabled={isUpdating || !voiceForm.formState.isDirty}
                  className="px-8 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Voice
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sentiment Tab */}
        {showSentimentTab && (
          <TabsContent value="sentiment">
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
                    <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Call Sentiment Analysis</CardTitle>
                    <CardDescription className="text-base">Breakdown of call sentiments for this assistant</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {getSentimentData().length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={getSentimentData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${percent !== undefined ? (percent * 100).toFixed(0) : 0}%`}
                      >
                        {getSentimentData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No sentiment data available</p>
                    <p className="text-sm">Analytics will appear here once your assistant handles some calls</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Calls Tab */}
        <TabsContent value="calls" className="space-y-6">
          <RecordingsList
            organisationUuid={user?.organisation_uuid || ""}
            agentUuid={agentUuid}
            pageSize={10}
            showTitle={true}
            title="Recent Calls"
            description="All calls handled by this assistant"
          />
        </TabsContent>
        
        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge-base" className="space-y-6">
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20">
                  <FileText className="h-6 w-6 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">Knowledge Base</CardTitle>
                  <CardDescription className="text-base">Upload documents to give your agent specific knowledge.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                  ${isDragging 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRefKB.current?.click()}
              >
                <input
                  ref={fileInputRefKB}
                  type="file"
                  className="hidden"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800">
                    <Upload className="h-8 w-8 text-gray-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PDF, DOCX, TXT (max 10MB)</p>
                  </div>
                  {isUploading && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Files List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Uploaded Documents</h3>
                {!agentDetail?.knowledge_base || agentDetail.knowledge_base.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border rounded-xl bg-gray-50 dark:bg-gray-900/20 border-dashed">
                    No documents uploaded yet.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {agentDetail.knowledge_base.map((file: any) => (
                      <div key={file.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{file.file_name}</p>
                            <p className="text-xs text-gray-500">{(file.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(file.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {file.download_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              onClick={() => window.open(file.download_url, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleFileDelete(file.id)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/20 dark:to-blue-900/20">
                    <ListChecks className="h-6 w-6 text-cyan-700 dark:text-cyan-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Data Extraction</CardTitle>
                    <CardDescription className="text-base">Choose the datapoints your assistant should extract after each call</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {lastSaved === 'data' && (
                    <div className="hidden sm:flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Saved</span>
                    </div>
                  )}
                  <Button variant="outline" onClick={clearAll} className="shrink-0">Clear All</Button>
                  <Button onClick={onDataSave} disabled={isUpdating} className="shrink-0">
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Selection
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Saved summary (what's currently stored) */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Saved: {savedDataIds.length}</Badge>
                {savedDataIds.slice(0, 8).map(id => (
                  <Badge key={id} className="bg-[#28F16B] text-white hover:bg-[#28F16B] max-w-[220px] truncate">
                    {TRAVEL_DATAPOINTS.find(d => d.id === id)?.label || id}
                  </Badge>
                ))}
                {savedDataIds.length > 8 && (
                  <Badge variant="outline">+{savedDataIds.length - 8} more</Badge>
                )}
              </div>

              {/* Top controls */}
              <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search datapoints..."
                    value={dataSearch}
                    onChange={(e) => setDataSearch(e.target.value)}
                    className="pl-9 h-9 bg-white dark:bg-gray-800 w-[260px]"
                  />
                </div>
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500"><Filter className="h-4 w-4" /> Quick Filters</div>
                <Select value={dataCategory} onValueChange={setDataCategory}>
                  <SelectTrigger className="w-[220px] h-9 bg-white dark:bg-gray-800">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {TRAVEL_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={selectAllFiltered} className="ml-auto">Select All Filtered ({filteredDataPoints.length})</Button>
              </div>

              <div className="flex gap-4">
                {/* Sidebar categories */}
                <div className="w-full sm:w-64 flex-shrink-0">
                  <div className="sticky top-20 space-y-2">
                    <button
                      type="button"
                      onClick={() => setDataCategory('all')}
                      className={`w-full text-left px-3 py-2 rounded-md border transition ${dataCategory==='all' ? 'border-[#28F16B] bg-[#28F16B]/10' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'}`}
                    >
                      <span className="font-medium">All Categories</span>
                      <span className="ml-2 text-xs text-gray-500">{TRAVEL_DATAPOINTS.length}</span>
                    </button>
                    {TRAVEL_CATEGORIES.map(category => {
                      const count = TRAVEL_DATAPOINTS.filter(d => d.category === category).length;
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setDataCategory(category)}
                          className={`w-full text-left px-3 py-2 rounded-md border transition ${dataCategory===category ? 'border-[#28F16B] bg-[#28F16B]/10' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'}`}
                        >
                          <span className="font-medium">{category}</span>
                          <span className="ml-2 text-xs text-gray-500">{count}</span>
                        </button>
                      );
                    })}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="w-1/2" onClick={() => {
                        const ids = (dataCategory==='all' ? filteredDataPoints : filteredDataPoints.filter(d=>d.category===dataCategory)).map(d=>d.id);
                        setSelectedDataIds(prev => Array.from(new Set([...prev, ...ids])));
                      }}>Select All</Button>
                      <Button variant="outline" size="sm" className="w-1/2" onClick={() => {
                        if (dataCategory==='all') { clearAll(); return; }
                        setSelectedDataIds(prev => prev.filter(id => !TRAVEL_DATAPOINTS.some(d => d.id===id && d.category===dataCategory)));
                      }}>Clear</Button>
                    </div>
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 space-y-4">
                  {Array.from(new Set(filteredDataPoints.map(d => d.category))).map(category => (
                    <div key={category} className="border rounded-lg">
                      <button
                        type="button"
                        onClick={() => setIsCollapsed(prev => ({...prev, [category]: !prev[category]}))}
                        className="w-full flex items-center justify-between px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{category}</span>
                          <span className="text-xs text-gray-500">{filteredDataPoints.filter(d => d.category===category).length}</span>
                        </div>
                        {isCollapsed[category] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </button>
                      {!isCollapsed[category] && (
                        <div className="px-3 pb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Button variant="outline" size="sm" onClick={() => {
                              const ids = filteredDataPoints.filter(d=>d.category===category).map(d=>d.id);
                              setSelectedDataIds(prev => Array.from(new Set([...prev, ...ids])));
                            }}>Select All</Button>
                            <Button variant="outline" size="sm" onClick={() => {
                              setSelectedDataIds(prev => prev.filter(id => !filteredDataPoints.some(d => d.id===id && d.category===category)));
                            }}>Clear</Button>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredDataPoints.filter(d => d.category === category).map(d => {
                              const selected = isSelected(d.id);
                              return (
                                <button
                                  key={d.id}
                                  type="button"
                                  onClick={() => toggleSelect(d.id)}
                                  className={`text-left rounded-lg border p-3 transition-all duration-200 hover:shadow-sm ${
                                    selected ? 'border-[#28F16B] bg-[#28F16B]/10 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="font-semibold text-gray-900 dark:text-white truncate">{d.label}</div>
                                    {selected && <div className="h-2.5 w-2.5 rounded-full bg-[#28F16B]" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredDataPoints.length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No datapoints match your filters.</div>
                  )}
                </div>
              </div>

              
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-6">
          <form onSubmit={advancedSettingsForm.handleSubmit(onAdvancedSubmit)}>
            <div className="relative">
              {ADVANCED_COMING_SOON && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                  <div className="rounded-xl bg-white/80 dark:bg-black/60 backdrop-blur-sm border px-5 py-4 text-center shadow-md">
                    <Badge variant="secondary" className="mb-1">Coming soon</Badge>
                    <div className="text-sm text-gray-700 dark:text-gray-300">These advanced features are on the way.</div>
                  </div>
                </div>
              )}
              <Card className={`border-0 shadow-lg rounded-2xl ${ADVANCED_COMING_SOON ? "pointer-events-none select-none opacity-60 blur-[2px]" : ""}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                    <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Advanced Settings</CardTitle>
                    <CardDescription className="text-base">Fine-tune your assistant's behavior and performance</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 pt-4">
                {/* Speech & Conversation Flow */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold tracking-tight pb-2 border-b dark:text-white dark:border-gray-700">Speech & Conversation</h3>
                  <div className="grid md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-2">
                      <Label>First Message Mode</Label>
                      <Select 
                        onValueChange={(value) => advancedSettingsForm.setValue('firstMessageMode', value as "assistant-speaks-first" | "assistant-waits-for-user")} 
                        value={advancedSettingsForm.watch('firstMessageMode')}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assistant-speaks-first">Assistant Speaks First</SelectItem>
                          <SelectItem value="assistant-waits-for-user">Assistant Waits for User</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">Control who speaks first in the conversation.</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Wait Before Speaking (seconds)</Label>
                      <Slider
                        defaultValue={[advancedSettingsForm.watch('waitTimeBeforeSpeaking')]}
                        onValueChange={(value) => advancedSettingsForm.setValue('waitTimeBeforeSpeaking', value[0])}
                        min={0} max={5} step={0.1}
                      />
                      <p className="text-sm text-right font-mono">{advancedSettingsForm.watch('waitTimeBeforeSpeaking').toFixed(1)}s</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Interruption Threshold (words)</Label>
                      <Slider
                        defaultValue={[advancedSettingsForm.watch('interruptionThreshold')]}
                        onValueChange={(value) => advancedSettingsForm.setValue('interruptionThreshold', value[0])}
                        min={0} max={10} step={1}
                      />
                      <p className="text-sm text-right font-mono">{advancedSettingsForm.watch('interruptionThreshold')} words</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Max Call Duration (seconds)</Label>
                      <Slider
                        defaultValue={[advancedSettingsForm.watch('maxDuration')]}
                        onValueChange={(value) => advancedSettingsForm.setValue('maxDuration', value[0])}
                        min={10} max={1800} step={10}
                      />
                      <p className="text-sm text-right font-mono">{advancedSettingsForm.watch('maxDuration')}s</p>
                    </div>
                  </div>
                </div>

                {/* Background Sound */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold tracking-tight pb-2 border-b dark:text-white dark:border-gray-700">Ambient Environment</h3>
                  <div className="space-y-2">
                    <Label>Background Sound</Label>
                    <Select
                      onValueChange={(value) => advancedSettingsForm.setValue('backgroundSound', value)}
                      value={advancedSettingsForm.watch('backgroundSound')}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BACKGROUND_SOUNDS.map(sound => (
                          <SelectItem key={sound} value={sound}>{sound.charAt(0).toUpperCase() + sound.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">Add subtle background noise to make the call feel more realistic.</p>
                  </div>
                </div>

                {/* Voicemail Settings */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold tracking-tight pb-2 border-b dark:text-white dark:border-gray-700">Voicemail Handling</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Voicemail Detection</Label>
                        <p className="text-sm text-muted-foreground">Automatically detect if a call goes to voicemail.</p>
                      </div>
                      <Switch
                        checked={advancedSettingsForm.watch('voicemailDetectionEnabled')}
                        onCheckedChange={(checked) => advancedSettingsForm.setValue('voicemailDetectionEnabled', checked)}
                      />
                    </div>
                    {advancedSettingsForm.watch('voicemailDetectionEnabled') && (
                      <>
                        <div className="space-y-2">
                          <Label>Voicemail Message</Label>
                          <Textarea
                            {...advancedSettingsForm.register('voicemailMessage')}
                            placeholder="Enter the message to leave on voicemail..."
                            className="h-24"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Wait for Beep (seconds)</Label>
                          <Slider
                            defaultValue={[advancedSettingsForm.watch('beepMaxAwaitSeconds')]}
                            onValueChange={(value) => advancedSettingsForm.setValue('beepMaxAwaitSeconds', value[0])}
                            min={0} max={60} step={1}
                          />
                          <p className="text-sm text-right font-mono">{advancedSettingsForm.watch('beepMaxAwaitSeconds')}s</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Transcription & Language */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold tracking-tight pb-2 border-b dark:text-white dark:border-gray-700">Transcription &amp; Language</h3>
                  <div className="grid md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-2">
                      <Label>Transcription Language</Label>
                      <Input {...advancedSettingsForm.register('transcriptionLanguage')} />
                      <p className="text-sm text-muted-foreground">e.g., &quot;en-US&quot;, &quot;es-ES&quot;, &quot;fr-FR&quot;</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Confidence Threshold</Label>
                      <Slider
                        defaultValue={[advancedSettingsForm.watch('confidenceThreshold')]}
                        onValueChange={(value) => advancedSettingsForm.setValue('confidenceThreshold', value[0])}
                        min={0} max={1} step={0.05}
                      />
                      <p className="text-sm text-right font-mono">{advancedSettingsForm.watch('confidenceThreshold').toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                {/* AI Model & Behavior */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold tracking-tight pb-2 border-b dark:text-white dark:border-gray-700">AI Model Behavior</h3>
                  <div className="grid md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-2">
                      <Label>Model Temperature</Label>
                      <Slider
                        defaultValue={[advancedSettingsForm.watch('modelTemperature')]}
                        onValueChange={(value) => advancedSettingsForm.setValue('modelTemperature', value[0])}
                        min={0} max={1} step={0.05}
                      />
                      <p className="text-sm text-right font-mono">{advancedSettingsForm.watch('modelTemperature').toFixed(2)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Max Tokens</Label>
                      <Slider
                        defaultValue={[advancedSettingsForm.watch('maxTokens')]}
                        onValueChange={(value) => advancedSettingsForm.setValue('maxTokens', value[0])}
                        min={10} max={1024} step={8}
                      />
                      <p className="text-sm text-right font-mono">{advancedSettingsForm.watch('maxTokens')}</p>
                    </div>
                  </div>
                </div>

                {/* Email Notifications */}
                {/* Moved to Integrations tab */}
              </CardContent>
              <CardFooter className="flex justify-end pt-6 border-t dark:border-gray-700">
                <Button
                  type="submit"
                  disabled={isUpdating || ADVANCED_COMING_SOON}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                >
                  {isUpdating && lastSaved === 'advanced' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : lastSaved === 'advanced' ? (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {lastSaved === 'advanced' ? 'Saved' : 'Save Settings'}
                </Button>
              </CardFooter>
              </Card>
            </div>
          </form>
          
          {/* Danger Zone */}
          <div className="pt-8 mt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 p-6">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 flex items-center gap-2 mb-2">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                Deleting this agent will permanently remove it and all associated data, including call logs and recordings. This action cannot be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white border-none">
                    Delete Agent
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the agent
                      <span className="font-semibold text-foreground"> {agentDetail.name} </span>
                      and all associated data including call history and recordings.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAgent}
                      className="bg-red-600 hover:bg-red-700 text-white border-none"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Agent"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <form onSubmit={advancedSettingsForm.handleSubmit(onAdvancedSubmit)}>
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20">
                    <Link className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Integrations</CardTitle>
                    <CardDescription className="text-base">Connect your agent with other tools and services</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Email Notifications Card */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 overflow-hidden transition-all hover:shadow-md">
                  <div className="p-6 flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Notifications</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive a detailed summary, transcript, and recording link via email immediately after every call.</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input 
                            placeholder="name@example.com" 
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddEmail(e);
                              }
                            }}
                            className="max-w-md"
                          />
                          <Button 
                            type="button" 
                            variant="secondary"
                            onClick={handleAddEmail}
                            disabled={!newEmail.trim()}
                          >
                            Add Email
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {advancedSettingsForm.watch("notificationEmails")?.map((email) => (
                            <Badge key={email} variant="outline" className="pl-3 pr-1 py-1.5 flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800/50">
                              {email}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-red-100 hover:text-red-600 rounded-full"
                                onClick={() => handleRemoveEmail(email)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                          {(!advancedSettingsForm.watch("notificationEmails")?.length) && (
                            <p className="text-sm text-gray-400 italic pt-1">No email recipients added yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                      Active
                    </div>
                    {/* We use the main form submission, but user might expect "Save" here too. 
                        Actually, since this is inside the form, we can add a save button specific to this tab if we want, 
                        or just rely on the main save button at the bottom. 
                        Let's add a specific save button for clarity since tabs separate content.
                    */}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end pt-6 border-t dark:border-gray-700">
                <Button 
                  type="submit"
                  disabled={isUpdating || !advancedSettingsForm.formState.isDirty}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Integrations
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
      </Tabs>

      {/* Image Upload Modal */}
      <Dialog open={showImageUploadModal} onOpenChange={(open) => {
        if (!open) {
          // When closing modal via overlay or ESC, run cleanup
          handleImageCancel();
        } else {
          setShowImageUploadModal(true);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Update Agent Image
            </DialogTitle>
            <DialogDescription>
              Choose a new image for your agent. Images will be automatically cropped to a circle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current Image Preview */}
            <div className="flex justify-center">
              <Avatar className="h-24 w-24 ring-4 ring-gray-200">
                <AvatarImage 
                  src={imagePreviewUrl || agentDetail?.avatar_url} 
                  className="object-cover" 
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <Bot className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
            </div>

            {/* File Input */}
            <div className="space-y-2">
              <Label>Select Image</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </Button>
              <p className="text-xs text-muted-foreground">
                Accepted formats: PNG, JPG, GIF, WebP. Max size: 2MB
              </p>
            </div>

            {/* Image Info */}
            {selectedImage && (
              <div className="text-sm text-green-600 dark:text-green-400">
                <span>Selected: </span>
                <span className="truncate inline-block max-w-[200px]" title={selectedImage.name}>
                  {selectedImage.name}
                </span>
                <span> ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}

            {/* Success Message */}
            {lastSaved === "image" && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Image updated successfully</span>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleImageCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleImageSave}
              disabled={!selectedImage || isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Image
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vapi Call Modal */}
      <AgentCallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        assistantId={agentDetail.activation_id || ""}
        agentName={agentDetail.name}
        agentImage={agentDetail.avatar_url}
      />
    </div>
  );
} 
