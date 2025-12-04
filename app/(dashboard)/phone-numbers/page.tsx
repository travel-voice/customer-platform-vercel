"use client";

import {
  Phone,
  Plus,
  Trash2,
  Settings,
  AlertCircle,
  X,
  Search,
  MapPin,
  Loader2,
  Smartphone,
  Check,
  Globe,
  CreditCard
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getPhoneNumbers, deletePhoneNumber, updatePhoneNumber, searchPhoneNumbers, buyPhoneNumber } from "@/lib/services/phone-numbers";
import { PhoneNumberRecord } from "@/lib/types/phone-numbers";
import { getAssistantDetails, Assistant } from "@/lib/services/assistants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { STRIPE_PLANS } from "@/lib/constants/plans";
import { Progress } from "@/components/ui/progress";

export default function PhoneNumbersPage() {
  const { user } = useAuthStore();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Quota State
  const [quota, setQuota] = useState<{ used: number; total: number; planName: string }>({ used: 0, total: 0, planName: '' });

  // Search & Buy State
  const [searchCountry, setSearchCountry] = useState("US");
  const [searchAreaCode, setSearchAreaCode] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [buyingNumber, setBuyingNumber] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [phoneNumberToDelete, setPhoneNumberToDelete] = useState<PhoneNumberRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [routingDialogOpen, setRoutingDialogOpen] = useState(false);
  const [phoneNumberForRouting, setPhoneNumberForRouting] = useState<PhoneNumberRecord | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState<string>("");
  const [routingLoading, setRoutingLoading] = useState(false);
  const [assistants, setAssistants] = useState<Assistant[]>([]);

  // Fetch phone numbers and quota on component mount
  useEffect(() => {
    const fetchData = async () => {
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
        // 1. Fetch Phone Numbers
        const numbers = await getPhoneNumbers(user.organisation_uuid);
        setPhoneNumbers(numbers);

        // 2. Fetch Quota Info
        const supabase = createClient();
        const { data: org } = await supabase
            .from('organizations')
            .select('subscription_plan')
            .eq('uuid', user.organisation_uuid)
            .single();
        
        const planName = org?.subscription_plan || 'Free';
        const planDetails = STRIPE_PLANS.find(p => p.name === planName);
        const included = planDetails?.phoneNumbersIncluded || 0;

        setQuota({
            used: numbers.length,
            total: included,
            planName: planName
        });

      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load phone numbers');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  const handleSearchNumbers = async () => {
    setSearchLoading(true);
    setError(null);
    try {
        const data = await searchPhoneNumbers(searchCountry, searchAreaCode || undefined);
        setSearchResults(data.phoneNumbers || []);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setSearchLoading(false);
    }
  };

  const handleBuyNumber = async (phoneNumber: string) => {
    if (!user?.organisation_uuid) return;

    setBuyingNumber(phoneNumber);
    try {
      const result = await buyPhoneNumber(phoneNumber);
      
      // Refresh list
      const numbers = await getPhoneNumbers(user.organisation_uuid);
      setPhoneNumbers(numbers);
      
      // Update usage count locally
      setQuota(prev => ({ ...prev, used: numbers.length }));

      setIsModalOpen(false);
      setSearchResults([]);
      // Optional: Show success toast or notification
    } catch (error: any) {
      setError(error.message || 'Failed to purchase number');
      console.error('Purchase error:', error);
    } finally {
      setBuyingNumber(null);
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
      const newNumbers = phoneNumbers.filter(num => num.uuid !== phoneNumberToDelete.uuid);
      setPhoneNumbers(newNumbers);
      setQuota(prev => ({ ...prev, used: newNumbers.length }));

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

  const isOverQuota = quota.used >= quota.total;

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Professional Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Phone Numbers</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Manage your virtual numbers and route calls to AI assistants
          </p>
        </div>
        
        <div className="flex items-center gap-4">
            {/* Quota Display */}
            <div className="hidden md:block text-right mr-2">
                <div className="text-sm font-medium text-gray-900">
                    {quota.used} / {quota.total} Included Numbers
                </div>
                <div className="text-xs text-muted-foreground">
                    {quota.planName} Plan
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={(open) => {
                setIsModalOpen(open);
                if (open) {
                    setError(null);
                    setSearchResults([]);
                    setSearchAreaCode("");
                }
            }}>
                <DialogTrigger asChild>
                <Button size="lg" className="gap-2 shadow-sm bg-black text-white hover:bg-gray-800 transition-all">
                    <Plus className="h-5 w-5" />
                    Add Phone Number
                </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden rounded-xl gap-0">
                <DialogHeader className="p-6 pb-4 bg-gray-50/50 border-b">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Globe className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Get a New Number</DialogTitle>
                            <DialogDescription className="text-sm mt-1">
                            Search and acquire a phone number for your AI agents.
                            </DialogDescription>
                        </div>
                    </div>
                    
                    {/* Quota Info in Modal */}
                    <div className="mt-4 p-3 bg-white border rounded-lg flex items-center justify-between shadow-sm">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Your Plan</span>
                            <span className="text-sm font-bold text-gray-900">{quota.planName}</span>
                        </div>
                        <div className="flex flex-col items-end">
                             <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Included Numbers</span>
                             <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${isOverQuota ? 'text-orange-600' : 'text-green-600'}`}>
                                    {quota.used} used
                                </span>
                                <span className="text-sm text-gray-400">/</span>
                                <span className="text-sm font-bold text-gray-900">{quota.total} total</span>
                             </div>
                        </div>
                    </div>

                    {isOverQuota && (
                        <Alert className="mt-3 bg-blue-50 border-blue-200 text-blue-800">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="ml-2 text-xs font-medium">
                                You have used all your included numbers. Additional numbers are £4/mo.
                            </AlertDescription>
                        </Alert>
                    )}
                </DialogHeader>
                
                <div className="p-6 space-y-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Country</Label>
                            <Select value={searchCountry} onValueChange={setSearchCountry}>
                                <SelectTrigger className="h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="US">🇺🇸 United States</SelectItem>
                                    <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                                    <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                                    <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Area Code</Label>
                            <div className="relative">
                                <Input 
                                    className="h-11 pl-9"
                                    placeholder="e.g. 415" 
                                    value={searchAreaCode} 
                                    onChange={(e) => setSearchAreaCode(e.target.value)} 
                                />
                                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                            </div>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={handleSearchNumbers} 
                        className="w-full h-11 text-base font-medium" 
                        disabled={searchLoading}
                        size="lg"
                    >
                        {searchLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Searching Available Numbers...
                            </>
                        ) : (
                            <>
                                <Search className="h-4 w-4 mr-2" />
                                Find Available Numbers
                            </>
                        )}
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-muted-foreground">Results</span>
                        </div>
                    </div>

                    <div className="min-h-[200px] max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {searchResults.map((result, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={idx} 
                                        className="flex items-center justify-between p-4 border rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                                                <Phone className="h-4 w-4 text-gray-600" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-lg text-gray-900">{result.phoneNumber}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {result.locality}, {result.region}
                                                </div>
                                            </div>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleBuyNumber(result.phoneNumber)}
                                            disabled={buyingNumber !== null}
                                            className={`${buyingNumber === result.phoneNumber ? "w-32" : "w-24"} ${isOverQuota ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                        >
                                            {buyingNumber === result.phoneNumber ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : isOverQuota ? (
                                                "Buy £4/mo"
                                            ) : (
                                                "Get Free"
                                            )}
                                        </Button>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            !searchLoading && (
                                <div className="flex flex-col items-center justify-center h-[200px] text-center space-y-3 border-2 border-dashed rounded-xl bg-gray-50/50">
                                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                                        <Search className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-900">No numbers found yet</p>
                                        <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                                            Enter an area code and click search to find available phone numbers.
                                        </p>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
            >
                <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex justify-between items-center ml-2">
                        {error}
                        <Button variant="ghost" size="sm" onClick={clearError} className="h-6 w-6 p-0 hover:bg-red-100 rounded-full">
                        <X className="h-3 w-3" />
                        </Button>
                    </AlertDescription>
                </Alert>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b bg-gray-50/40 pb-4">
          <div className="flex items-center justify-between">
            <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-gray-500" />
                Your Numbers
                </CardTitle>
                <CardDescription className="mt-1">
                    All phone numbers currently active in your organization.
                </CardDescription>
            </div>
            <Badge variant="outline" className="bg-white px-3 py-1">
                {loading ? '...' : `${phoneNumbers.length} Active`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-xl bg-white animate-pulse">
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-100 rounded w-48"></div>
                    <div className="h-4 bg-gray-100 rounded w-32"></div>
                  </div>
                  <div className="h-10 bg-gray-100 rounded w-24"></div>
                </div>
              ))}
            </div>
          ) : phoneNumbers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {phoneNumbers.map((phoneNum) => (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={phoneNum.uuid} 
                    className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 border rounded-xl hover:shadow-md transition-all bg-white group gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        phoneNum.assistant_uuid ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                        <Phone className={`h-6 w-6 ${
                            phoneNum.assistant_uuid ? 'text-green-600' : 'text-gray-500'
                        }`} />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-xl tracking-tight text-gray-900">{phoneNum.phone_number}</h3>
                            <Badge 
                                variant={phoneNum.assistant_uuid ? 'default' : 'secondary'}
                                className={phoneNum.assistant_uuid 
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'}
                            >
                                {phoneNum.assistant_uuid ? 'Active' : 'Unassigned'}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {phoneNum.assistant_name ? (
                                <>
                                    <span className="flex items-center gap-1.5">
                                        Connected to <span className="font-medium text-gray-900">{phoneNum.assistant_name}</span>
                                    </span>
                                </>
                            ) : (
                                <span className="text-yellow-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> No assistant assigned
                                </span>
                            )}
                        </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto pl-16 md:pl-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRoutingDialog(phoneNum)}
                      className="gap-2 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Settings className="h-4 w-4" />
                      Configure
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(phoneNum)}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
              <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                <Phone className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No phone numbers yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                Get started by adding a dedicated phone number for your AI assistants to handle inbound and outbound calls.
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Get Your First Number
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] gap-0 p-0 overflow-hidden rounded-xl">
          <div className="p-6 pb-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Release Number?</DialogTitle>
            <DialogDescription className="text-base text-gray-600">
              Are you sure you want to release <span className="font-semibold text-gray-900">{phoneNumberToDelete?.phone_number}</span>?
            </DialogDescription>
          </div>
          
          <div className="px-6 pb-6">
            <Alert className="bg-red-50 border-red-100 text-red-800">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-sm ml-2">
                    This action cannot be undone. The number will be released immediately and any associated configuration will be lost.
                </AlertDescription>
            </Alert>
          </div>

          <div className="bg-gray-50 p-4 flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setPhoneNumberToDelete(null);
              }}
              disabled={deleteLoading}
              className="bg-white"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteNumber}
              disabled={deleteLoading}
              className="gap-2 bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Releasing...
                  </>
              ) : (
                  <>
                    Delete Number
                  </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Routing Setup Dialog */}
      <Dialog open={routingDialogOpen} onOpenChange={setRoutingDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-xl gap-0">
          <DialogHeader className="p-6 pb-2 bg-white border-b">
            <DialogTitle className="text-xl flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-500" />
                Call Routing
            </DialogTitle>
            <DialogDescription>
              Configure incoming call handling for this number.
            </DialogDescription>
          </DialogHeader>
          
          {phoneNumberForRouting && (
            <div className="p-6 space-y-6 bg-gray-50/30">
              <div className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm">
                <div>
                    <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Selected Number</span>
                    <div className="text-lg font-bold text-gray-900 font-mono mt-0.5">{phoneNumberForRouting.phone_number}</div>
                </div>
                <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <Phone className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="agent-select" className="text-sm font-medium text-gray-700">
                    Route calls to
                </Label>
                <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                  <SelectTrigger className="h-12 bg-white border-gray-200">
                    <SelectValue placeholder="Select an assistant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                          <X className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium">No Agent</span>
                            <span className="text-xs text-muted-foreground">Calls will not be answered</span>
                        </div>
                      </div>
                    </SelectItem>
                    {Array.isArray(assistants) && assistants.map((assistant) => (
                      <SelectItem key={assistant.assistant_uuid} value={assistant.assistant_uuid} className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-gray-200">
                            <AvatarImage src={assistant.assistant_avatar_url} alt={assistant.assistant_name} />
                            <AvatarFallback className="bg-blue-50 text-blue-600 text-xs">
                                {assistant.assistant_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                              <span className="font-medium">{assistant.assistant_name}</span>
                              <span className="text-xs text-muted-foreground">AI Assistant</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                {selectedAssistant && selectedAssistant !== "none" ? (
                    <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-green-900">Active Routing</p>
                            <p className="text-xs text-green-700 mt-0.5">
                                Calls will be automatically answered by your selected AI assistant.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-yellow-900">Inactive Number</p>
                            <p className="text-xs text-yellow-700 mt-0.5">
                                This number is currently not routed to any agent and will not pick up calls.
                            </p>
                        </div>
                    </div>
                )}
              </div>
            </div>
          )}
          <div className="bg-white p-4 border-t flex justify-end gap-3">
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
              className="gap-2 min-w-[100px]"
            >
              {routingLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                  <>Save Changes</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
