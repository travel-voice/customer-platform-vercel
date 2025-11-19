"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence,motion } from "framer-motion";
import {
  AlertCircle,
  Bot,
  Camera,
  ChevronDown,
  ChevronUp,
  Mic,
  Play,
  Search,
  Sparkles,
  Upload,
  User,
  Volume2} from "lucide-react";
import { useRef,useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VOICES_LIST } from "@/lib/types/agents";

// Infer gender from the provided name using common name lists and simple heuristics
function inferGenderFromName(name: string): 'male' | 'female' | 'unknown' {
  const firstName = name.trim().split(/\s+/)[0]?.toLowerCase() || '';
  if (!firstName) return 'unknown';

  const femaleNames = new Set([
    'sarah','anna','anna','amelia','olivia','sophia','isabella','ava','mia','emily','abigail','harper','ella','grace','victoria','natalie','hannah','zoe','lily','samantha','charlotte','scarlett','violet','hazel','nora','aria','ella','madison','aurora','lucy','ruby','claire','eva','leah','alice','sophie','amelie','grace','bethany','charlotte'
  ]);
  const maleNames = new Set([
    'daniel','archibald','archie','joe','john','alex','alexander','james','william','michael','benjamin','jacob','logan','lucas','jackson','aiden','elijah','ethan','matthew','henry','leo','theo','noah','oliver','liam','robert','richard','edward','callum','jeremy','neil','gideon','justin','terry','frederick','george','hunter','william'
  ]);

  if (femaleNames.has(firstName)) return 'female';
  if (maleNames.has(firstName)) return 'male';

  // Heuristic fallbacks: common feminine/masculine endings
  if (/a$|ia$|na$|la$|ina$|ette$|ine$|ie$/i.test(firstName)) return 'female';
  if (/o$|os$|us$|io$|iano$|ius$/i.test(firstName)) return 'male';

  return 'unknown';
}

const createAgentSchema = z.object({
  name: z.string().min(1, "Agent name is required").max(50, "Name must be under 50 characters"),
  voice_id: z.string().min(1, "Please select a voice"),
  image: z.instanceof(File).optional()
});

type CreateAgentForm = z.infer<typeof createAgentSchema>;

interface AgentCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onCreateAgent: (data: { name: string; elevenlabs_voice_id: string; image_data?: string }) => Promise<void>;
  isCreating: boolean;
  error: string | null;
}

export function AgentCreationModal({
  open,
  onOpenChange,
  onSuccess,
  onCreateAgent,
  isCreating,
  error
}: AgentCreationModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Voice filtering state
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [accentFilter, setAccentFilter] = useState<string>("all");
  const [voiceSearch, setVoiceSearch] = useState<string>("");
  const [showAllVoices, setShowAllVoices] = useState<boolean>(false);

  const form = useForm<CreateAgentForm>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      name: "",
      voice_id: "",
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - accept common image formats
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

    form.setValue('image', file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const processImageToBlob = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Set canvas size to 500x500 (circular crop)
        canvas.width = 500;
        canvas.height = 500;
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

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
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png');
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const playVoicePreview = (voiceId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(`/voices/${voiceId}.mp3`);
    audio.onended = () => setPlayingVoiceId(null);
    audio.onerror = () => {
      console.warn(`Voice preview not available for ${voiceId}`);
      setPlayingVoiceId(null);
    };
    
    audio.play().catch(() => {
      console.warn(`Failed to play voice preview for ${voiceId}`);
      setPlayingVoiceId(null);
    });
    
    audioRef.current = audio;
    setPlayingVoiceId(voiceId);
  };

  const onSubmit = async (data: CreateAgentForm) => {
    try {
      let imageUrl: string | undefined = undefined;
      
      if (data.image) {
        try {
          // Process image (crop/resize)
          const processedBlob = await processImageToBlob(data.image);

          // Create form data for upload
          const formData = new FormData();
          formData.append('file', processedBlob, 'avatar.png');

          // Upload image
          const uploadResponse = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || 'Failed to upload image');
          }

          const uploadResult = await uploadResponse.json();
          imageUrl = uploadResult.url;
        } catch (error) {
          console.error('Image upload failed:', error);
          // If upload fails, we'll continue without the image
          // or we could throw an error to stop creation
        }
      }

      await onCreateAgent({
        name: data.name,
        elevenlabs_voice_id: data.voice_id,
        image_data: imageUrl
      });

      // Reset form and close modal on success
      form.reset();
      setPreviewUrl(null);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingVoiceId(null);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      // Error is handled by the store and passed via props
      console.error('Agent creation failed:', error);
    }
  };

  // Voice filtering logic
  const getUniqueValues = (key: keyof typeof VOICES_LIST[0]) => {
    return [...new Set(VOICES_LIST.map(voice => voice[key]))];
  };

  const filteredVoices = VOICES_LIST.filter(voice => {
    const matchesGender = genderFilter === "all" || voice.gender === genderFilter;
    const matchesAge = ageFilter === "all" || voice.age === ageFilter;
    const matchesAccent = accentFilter === "all" || voice.accent === accentFilter;
    const matchesSearch = voiceSearch === "" || 
      voice.name.toLowerCase().includes(voiceSearch.toLowerCase()) ||
      voice.gender.toLowerCase().includes(voiceSearch.toLowerCase()) ||
      voice.age.toLowerCase().includes(voiceSearch.toLowerCase()) ||
      voice.accent.toLowerCase().includes(voiceSearch.toLowerCase());
    
    return matchesGender && matchesAge && matchesAccent && matchesSearch;
  });

  const displayedVoices = showAllVoices ? filteredVoices : filteredVoices.slice(0, 6);
  const selectedVoice = VOICES_LIST.find(v => v.id === form.watch("voice_id"));

  const handleClose = () => {
    form.reset();
    setPreviewUrl(null);
    setGenderFilter("all");
    setAgeFilter("all");
    setAccentFilter("all");
    setVoiceSearch("");
    setShowAllVoices(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingVoiceId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden p-0 bg-gradient-to-br from-white to-gray-50/50 flex flex-col">
        {/* Header - Fixed */}
        <div className="relative p-4 pb-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b flex-shrink-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Create AI Agent
                </DialogTitle>
                <DialogDescription className="text-gray-600 text-sm">
                  Design your perfect AI voice agent
                </DialogDescription>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Agent Identity Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Name Input */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <Label htmlFor="name" className="text-lg font-semibold text-gray-900">Agent Name</Label>
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  </div>
                  <div className="relative">
                    <Input
                      id="name"
                      placeholder="Enter your agent's name..."
                      {...form.register("name")}
                      disabled={isCreating}
                      className="h-10 border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-all duration-200"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                </motion.div>

                {/* Avatar Upload */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-purple-600" />
                    <Label className="text-lg font-semibold text-gray-900">Avatar</Label>
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  </div>
                  <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-dashed border-purple-200 hover:border-purple-300 transition-colors duration-200">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 ring-4 ring-purple-100 shadow-lg">
                        <AvatarImage src={previewUrl || '/defaultcharacter.png'} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100">
                          <Bot className="h-12 w-12 text-purple-600" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isCreating}
                          className="h-10 gap-2 bg-white hover:bg-purple-50 border-purple-200 hover:border-purple-300 text-purple-700 font-medium rounded-lg transition-all duration-200"
                        >
                          <Upload className="h-5 w-5" />
                          Choose Image
                        </Button>
                        <p className="text-sm text-gray-600 mt-2">
                          PNG/JPG, max 2MB • Auto-cropped to circle
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* Voice Selection Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-green-600" />
                  <Label className="text-lg font-semibold text-gray-900">Voice Selection</Label>
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                </div>

                {/* Selected Voice Display */}
                {selectedVoice && (
                  <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-green-100">
                          <Mic className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-green-900">{selectedVoice.name}</div>
                          <div className="text-sm text-green-700">
                            {selectedVoice.gender} • {selectedVoice.age} • {selectedVoice.accent}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => playVoicePreview(selectedVoice.id)}
                        disabled={isCreating}
                        className="gap-2 bg-white hover:bg-green-50 border-green-200"
                      >
                        {playingVoiceId === selectedVoice.id ? (
                          <Volume2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Play className="h-4 w-4 text-green-600" />
                        )}
                        Preview
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Voice Filters */}
                <Card className="p-4 bg-gray-50/50 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search voices..."
                        value={voiceSearch}
                        onChange={(e) => setVoiceSearch(e.target.value)}
                        className="pl-10 h-10 bg-white border-gray-300 rounded-lg"
                      />
                    </div>
                    <Select value={genderFilter} onValueChange={setGenderFilter}>
                      <SelectTrigger className="h-10 bg-white border-gray-300 rounded-lg">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Genders</SelectItem>
                        {getUniqueValues("gender").map(gender => (
                          <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={ageFilter} onValueChange={setAgeFilter}>
                      <SelectTrigger className="h-10 bg-white border-gray-300 rounded-lg">
                        <SelectValue placeholder="Age" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ages</SelectItem>
                        {getUniqueValues("age").map(age => (
                          <SelectItem key={age} value={age}>{age}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={accentFilter} onValueChange={setAccentFilter}>
                      <SelectTrigger className="h-10 bg-white border-gray-300 rounded-lg">
                        <SelectValue placeholder="Accent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Accents</SelectItem>
                        {getUniqueValues("accent").map(accent => (
                          <SelectItem key={accent} value={accent}>{accent}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Card>

                {/* Voice Grid */}
                <RadioGroup
                  value={form.watch("voice_id")}
                  onValueChange={(value: string) => form.setValue("voice_id", value)}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  <AnimatePresence>
                    {displayedVoices.map((voice, index) => (
                      <motion.div
                        key={voice.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card 
                          className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                            form.watch("voice_id") === voice.id 
                              ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
                              : 'hover:bg-gray-50 border-gray-200'
                          }`}
                          onClick={() => form.setValue("voice_id", voice.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <RadioGroupItem 
                                value={voice.id} 
                                id={voice.id}
                                className="shrink-0"
                              />
                              <div>
                                <div className="font-semibold text-gray-900">{voice.name}</div>
                                <div className="text-xs text-gray-600 flex gap-1">
                                  <Badge variant="outline" className="text-xs">{voice.gender}</Badge>
                                  <Badge variant="outline" className="text-xs">{voice.age}</Badge>
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                playVoicePreview(voice.id);
                              }}
                              disabled={isCreating}
                              className="shrink-0 h-8 w-8 p-0 hover:bg-blue-100"
                            >
                              {playingVoiceId === voice.id ? (
                                <Volume2 className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Play className="h-4 w-4 text-gray-600" />
                              )}
                            </Button>
                          </div>
                          <div className="text-xs text-gray-500">{voice.accent}</div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </RadioGroup>

                {/* Show More/Less Button */}
                {filteredVoices.length > 6 && (
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAllVoices(!showAllVoices)}
                      className="gap-2 h-10 px-6 rounded-xl"
                    >
                      {showAllVoices ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Show All ({filteredVoices.length - 6} more)
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {form.formState.errors.voice_id && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {form.formState.errors.voice_id.message}
                  </p>
                )}
              </motion.div>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer - Sticky */}
          <div className="p-4 bg-gray-50/50 border-t flex-shrink-0">
            <div className="flex justify-between items-center">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isCreating}
                className="h-10 px-6 rounded-lg"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating || !form.watch("name") || !form.watch("voice_id")}
                className="h-10 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isCreating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Agent
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>


      </DialogContent>
    </Dialog>
  );
} 