"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RotateCcw, Wand2, Check, ZoomIn } from "lucide-react";
import { getCroppedImg } from "@/lib/image-utils";
import { removeBackground } from "@imgly/background-removal";
import { Loader } from "@/components/ui/loader";

interface ImageEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

export function ImageEditorModal({
  open,
  onOpenChange,
  imageSrc,
  onSave,
  onCancel,
}: ImageEditorModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [processedImageSrc, setProcessedImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);

  // Use the processed image if available, otherwise original
  const currentImage = processedImageSrc || imageSrc;

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!currentImage || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(
        currentImage,
        croppedAreaPixels,
        rotation
      );
      onSave(croppedImage);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!currentImage) return;

    try {
      setIsRemovingBackground(true);
      
      // Configure to download simplified models if possible or just use defaults
      // Note: First run will download ~100MB of models which is cached
      const blob = await removeBackground(currentImage, {
        progress: (key, current, total) => {
           // console.log(`Downloading ${key}: ${current} of ${total}`);
        }
      });
      
      const url = URL.createObjectURL(blob);
      setProcessedImageSrc(url);
    } catch (error) {
      console.error("Failed to remove background:", error);
      // You might want to show a toast error here
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const handleReset = () => {
    setProcessedImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  if (!imageSrc) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full h-[400px] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
          <Cropper
            image={currentImage || undefined}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={3 / 4}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            showGrid={false}
          />
          
          {/* Loading overlay for background removal */}
          {isRemovingBackground && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10 backdrop-blur-sm">
               <Loader 
                 text="Removing Background" 
                 subtext="AI is processing your image..." 
               />
             </div>
          )}
        </div>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <Label className="min-w-[60px]">Zoom</Label>
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
              className="flex-1"
            />
          </div>
          
          <div className="flex items-center justify-between gap-2 pt-2">
             <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isRemovingBackground || isProcessing}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleRemoveBackground}
              disabled={isRemovingBackground || isProcessing || !!processedImageSrc}
              className="bg-purple-100 text-purple-900 hover:bg-purple-200 border-purple-200"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Remove Background
            </Button>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isProcessing || isRemovingBackground}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isProcessing || isRemovingBackground}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
          >
            {isProcessing ? (
              <Loader className="h-6 w-6 p-0" text="" subtext="" />
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Apply
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

