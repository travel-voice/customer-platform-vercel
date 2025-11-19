"use client";

import {
  Phone,
  Plus,
  Trash2,
  Settings,
  AlertCircle,
  X,
  CreditCard
} from "lucide-react";
import { useState, useEffect } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getPhoneNumbers, generateCheckoutLink, deletePhoneNumber, updatePhoneNumber } from "@/lib/services/phone-numbers";
import { PhoneNumberRecord } from "@/lib/types/phone-numbers";
import { getAssistantDetails, Assistant } from "@/lib/services/assistants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PhoneNumbersPage() {
  const { user } = useAuthStore();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyLoading, setBuyLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [phoneNumberToDelete, setPhoneNumberToDelete] = useState<PhoneNumberRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [routingDialogOpen, setRoutingDialogOpen] = useState(false);
  const [phoneNumberForRouting, setPhoneNumberForRouting] = useState<PhoneNumberRecord | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState<string>("");
  const [routingLoading, setRoutingLoading] = useState(false);
  const [assistants, setAssistants] = useState<Assistant[]>([]);

  // Fetch phone numbers on component mount
  useEffect(() => {
    const fetchPhoneNumbers = async () => {
      if (!user) {
        setError('Please log in to view phone numbers');
        setLoading(false);
        return;
      }

      if (!user?.organisation_uuid) {
        setError('Organisation not found');
        setLoading(false);
        return;
      }

      try {
        const numbers = await getPhoneNumbers(user.organisation_uuid);
        setPhoneNumbers(numbers);
      } catch (error) {
        console.error('Failed to fetch phone numbers:', error);
        setError('Failed to load phone numbers');
      } finally {
        setLoading(false);
      }
    };

    fetchPhoneNumbers();
  }, [user?.organisation_uuid]);

  // Fetch assistants on component mount
  useEffect(() => {
    const fetchAssistants = async () => {
      if (!user?.organisation_uuid) return;

      try {
        const assistantData = await getAssistantDetails(user.organisation_uuid);
        setAssistants(assistantData);
      } catch (error) {
        console.error('Failed to fetch assistants:', error);
      }
    };

    fetchAssistants();
  }, [user?.organisation_uuid]);

  const handleBuyNumber = async () => {
    if (!user) {
      setError('Please log in to purchase a phone number');
      return;
    }

    if (!user?.organisation_uuid) {
      setError('Organisation not found');
      return;
    }

    setBuyLoading(true);
    try {
      const checkoutUrl = await generateCheckoutLink(user.organisation_uuid);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setError('Invalid checkout URL received');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to generate checkout link');
      console.error('Checkout error:', error);
    } finally {
      setBuyLoading(false);
    }
  };

  const openDeleteDialog = (phoneNumber: PhoneNumberRecord) => {
    setPhoneNumberToDelete(phoneNumber);
    setDeleteDialogOpen(true);
  };

  const handleDeleteNumber = async () => {
    if (!phoneNumberToDelete || !user?.organisation_uuid) {
      setError('Unable to delete phone number');
      return;
    }

    setDeleteLoading(true);
    try {
      await deletePhoneNumber(user.organisation_uuid, phoneNumberToDelete.uuid);
      setPhoneNumbers(prev => prev.filter(num => num.uuid !== phoneNumberToDelete.uuid));
      setDeleteDialogOpen(false);
      setPhoneNumberToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete phone number. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };


  const openRoutingDialog = async (phoneNumber: PhoneNumberRecord) => {
    setPhoneNumberForRouting(phoneNumber);
    // Use the assistant UUID directly from the phone number record
    setSelectedAssistant(phoneNumber.assistant_uuid || "none");
    setRoutingDialogOpen(true);
  };

  const handleSaveRouting = async () => {
    if (!phoneNumberForRouting || !user?.organisation_uuid) {
      setError('Unable to save routing configuration');
      return;
    }

    setRoutingLoading(true);
    try {
      // Always send update request - either with assistant UUID or null for removal
      const assistantUuid = selectedAssistant !== "none" ? selectedAssistant : null;
      await updatePhoneNumber(user.organisation_uuid, phoneNumberForRouting.uuid, assistantUuid);
      
      // Find the selected assistant details
      const selectedAssistantData = selectedAssistant !== "none" && Array.isArray(assistants) ? assistants.find(a => a.assistant_uuid === selectedAssistant) : null;
      
      // Update local state to reflect the change
      setPhoneNumbers(prev => prev.map(num => 
        num.uuid === phoneNumberForRouting.uuid 
          ? { 
              ...num, 
              assistant_uuid: assistantUuid,
              assistant_name: selectedAssistant === "none" 
                ? null 
                : selectedAssistantData 
                  ? selectedAssistantData.assistant_name 
                  : (assistantUuid === num.assistant_uuid ? num.assistant_name : null)
            }
          : num
      ));
      
      setRoutingDialogOpen(false);
      setPhoneNumberForRouting(null);
      setSelectedAssistant("none");
    } catch (err: any) {
      setError(err.message || 'Failed to save routing configuration');
    } finally {
      setRoutingLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Manage Phone Numbers</h1>
        <p className="text-muted-foreground">
          Configure phone numbers for your AI voice agents and call routing
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-center">
            {error}
            <Button variant="ghost" size="sm" onClick={clearError}>
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="max-w-5xl">
        {/* Phone Numbers Management Section */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Phone Numbers
            </CardTitle>
            <CardDescription>
              Add and manage phone numbers for your AI voice agents. Each number can be configured with different settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Buy Phone Number Button */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Add New Phone Number</Label>
                <Dialog open={isModalOpen} onOpenChange={(open) => {
                  setIsModalOpen(open);
                  if (open) setError(null);
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 w-full sm:w-auto">
                      <Plus className="h-4 w-4" />
                      Buy a Number
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>Buy a UK Mobile Number</DialogTitle>
                      <DialogDescription>
                        Purchase a UK mobile number for your AI agents to handle inbound and outbound calls.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="p-4 border rounded-lg bg-blue-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">UK Mobile Number (+44)</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          Best for SMS and voice calls with your AI agents
                        </p>
                      </div>
                      
                      <Alert className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          This will redirect you to a secure checkout page. UK mobile numbers cost £4 per month exc VAT.
                        </AlertDescription>
                      </Alert>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleBuyNumber} className="gap-2" disabled={buyLoading}>
                        <CreditCard className="h-4 w-4" />
                        {buyLoading ? 'Processing...' : 'Buy Now'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <p className="text-xs text-muted-foreground">
                  Purchase a phone number to start using your AI agents for inbound and outbound calls.
                </p>
              </div>
            </div>

            <Separator />

            {/* Phone Numbers List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Registered Numbers</h3>
                <Badge variant="secondary">
                  {loading ? 'Loading...' : `${phoneNumbers.length} numbers`}
                </Badge>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2 w-48"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                        <div className="h-8 bg-gray-200 rounded w-8"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : phoneNumbers.length > 0 ? (
                <div className="space-y-2">
                  {phoneNumbers.map((phoneNum) => (
                    <div key={phoneNum.uuid} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-lg">{phoneNum.phone_number}</span>
                          <Badge 
                            variant={phoneNum.assistant_uuid ? 'default' : 'secondary'}
                            className={phoneNum.assistant_uuid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                          >
                            {phoneNum.assistant_uuid ? 'active' : 'inactive'}
                          </Badge>
                          {phoneNum.assistant_name && (
                            <span className="text-sm text-muted-foreground">
                              → {phoneNum.assistant_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRoutingDialog(phoneNum)}
                          className="gap-2"
                        >
                          <Settings className="h-4 w-4" />
                          Setup
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(phoneNum)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed rounded-lg">
                  <Phone className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="font-medium mb-1">No phone numbers configured</h3>
                  <p className="text-sm text-muted-foreground">
                    Add your first phone number to start receiving calls from your AI agents
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Phone Number</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this phone number? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {phoneNumberToDelete && (
            <div className="py-4">
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-red-50">
                <Phone className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-900">{phoneNumberToDelete.phone_number}</span>
              </div>
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will cancel the associated subscription and release the phone number from your account.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setPhoneNumberToDelete(null);
              }}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteNumber}
              disabled={deleteLoading}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Routing Setup Dialog */}
      <Dialog open={routingDialogOpen} onOpenChange={setRoutingDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Setup Inbound Call Routing</DialogTitle>
            <DialogDescription>
              Configure which AI agent will handle incoming calls to this phone number.
            </DialogDescription>
          </DialogHeader>
          {phoneNumberForRouting && (
            <div className="py-4 space-y-4">
              <div className="p-3 border rounded-lg bg-blue-50">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">{phoneNumberForRouting.phone_number}</span>
                </div>
                <p className="text-sm text-blue-700">
                  All incoming calls to this number will be routed to the selected agent
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="agent-select">Select AI Agent</Label>
                <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <X className="h-3 w-3 text-gray-500" />
                        </div>
                        <span>No agent (disable routing)</span>
                      </div>
                    </SelectItem>
                    {Array.isArray(assistants) && assistants.map((assistant) => (
                      <SelectItem key={assistant.assistant_uuid} value={assistant.assistant_uuid}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={assistant.assistant_avatar_url} alt={assistant.assistant_name} />
                            <AvatarFallback>{assistant.assistant_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{assistant.assistant_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAssistant && selectedAssistant !== "none" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    All calls to {phoneNumberForRouting.phone_number} will be automatically answered by your selected agent.
                  </AlertDescription>
                </Alert>
              )}

              {(!selectedAssistant || selectedAssistant === "none") && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Without an assigned agent, this phone number will be inactive and won't answer calls.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRoutingDialogOpen(false);
                setPhoneNumberForRouting(null);
                setSelectedAssistant("none");
              }}
              disabled={routingLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveRouting}
              disabled={routingLoading}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              {routingLoading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}