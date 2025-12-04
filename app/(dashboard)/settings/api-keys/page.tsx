"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Check,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Key,
  Loader2,
  MoreHorizontal,
  Plus,
  Shield,
  Trash2,
  X,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";

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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/lib/stores/auth-store";

const createKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  scopePreset: z.string(),
  expiresIn: z.string(),
});

type CreateKeyForm = z.infer<typeof createKeySchema>;

interface ApiKey {
  uuid: string;
  name: string;
  keyPrefix: string;
  keyHint: string;
  scopes: string[];
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  description: string | null;
  createdAt: string;
  createdBy: string;
}

const SCOPE_PRESETS = {
  full: { label: "Full Access", scopes: ["*"], description: "Complete access to all resources" },
  readonly: { label: "Read Only", scopes: ["agents:read", "calls:read", "org:read"], description: "View agents, calls, and organization info" },
  agents: { label: "Agents Only", scopes: ["agents:read", "agents:write"], description: "Manage agents" },
  calls: { label: "Calls Only", scopes: ["calls:read", "calls:write"], description: "View call logs and make outbound calls" },
  widget: { label: "Widget Integration", scopes: ["agents:read", "widget:config"], description: "Configure widgets on your website" },
};

const EXPIRY_OPTIONS = {
  never: { label: "Never expires", days: null },
  "30": { label: "30 days", days: 30 },
  "90": { label: "90 days", days: 90 },
  "180": { label: "6 months", days: 180 },
  "365": { label: "1 year", days: 365 },
};

export default function ApiKeysPage() {
  const { user } = useAuthStore();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ rawKey: string; name: string } | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);

  const form = useForm<CreateKeyForm>({
    resolver: zodResolver(createKeySchema),
    defaultValues: {
      name: "",
      description: "",
      scopePreset: "full",
      expiresIn: "never",
    },
  });

  const isAdmin = user?.role === "admin";

  const fetchApiKeys = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/api-keys");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load API keys");
      }

      setApiKeys(data.apiKeys || []);
    } catch (err: any) {
      setError(err.message || "Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleCreateKey = async (data: CreateKeyForm) => {
    setIsCreating(true);
    setError(null);
    try {
      const preset = SCOPE_PRESETS[data.scopePreset as keyof typeof SCOPE_PRESETS];
      const expiryOption = EXPIRY_OPTIONS[data.expiresIn as keyof typeof EXPIRY_OPTIONS];
      
      let expiresAt = null;
      if (expiryOption.days) {
        const date = new Date();
        date.setDate(date.getDate() + expiryOption.days);
        expiresAt = date.toISOString();
      }

      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          scopes: preset.scopes,
          expiresAt,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create API key");
      }

      // Show the new key (only time it's displayed!)
      setNewKeyData({ rawKey: result.rawKey, name: data.name });
      form.reset();
      await fetchApiKeys();
    } catch (err: any) {
      setError(err.message || "Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!keyToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/api-keys/${keyToDelete.uuid}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete API key");
      }

      await fetchApiKeys();
      setKeyToDelete(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete API key");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (key: ApiKey) => {
    try {
      const response = await fetch(`/api/api-keys/${key.uuid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !key.isActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update API key");
      }

      await fetchApiKeys();
    } catch (err: any) {
      setError(err.message || "Failed to update API key");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const getScopeLabel = (scopes: string[]) => {
    if (scopes.includes("*")) return "Full Access";
    if (scopes.length === 1) return scopes[0];
    return `${scopes.length} scopes`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage API keys for programmatic access to your organization
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-[#1AADF0] hover:bg-[#0d8bc9] gap-2"
          >
            <Plus className="h-4 w-4" />
            Create API Key
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-center">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security:</strong> API keys provide programmatic access to your organization&apos;s data. 
          Keep them secure and never share them publicly. Keys are shown only once at creation.
        </AlertDescription>
      </Alert>

      {/* Link to API Documentation */}
      <Card className="border-[#1AADF0] bg-gradient-to-br from-[#1AADF0]/5 to-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1AADF0]">
            <BookOpen className="h-5 w-5" />
            Need Help Using Your API Keys?
          </CardTitle>
          <CardDescription>
            Learn how to make outbound calls with your AI assistants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-3">
                Check out our comprehensive API documentation with interactive examples, 
                code snippets, and a curl command generator to get started quickly.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#1AADF0]" />
                  Authentication & authorization
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#1AADF0]" />
                  Outbound call API reference
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#1AADF0]" />
                  Dynamic variables & personalization
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#1AADF0]" />
                  Interactive curl command generator
                </li>
              </ul>
            </div>
            <Link href="/settings/developers">
              <Button className="bg-[#1AADF0] hover:bg-[#0d8bc9]">
                View Documentation
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Your API Keys
          </CardTitle>
          <CardDescription>
            {apiKeys.length} API key{apiKeys.length !== 1 ? "s" : ""} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length > 0 ? (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.uuid}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    key.isActive ? "hover:bg-slate-50" : "bg-slate-50 opacity-60"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{key.name}</span>
                      {!key.isActive && (
                        <Badge variant="secondary" className="text-xs">Revoked</Badge>
                      )}
                      {key.expiresAt && new Date(key.expiresAt) < new Date() && (
                        <Badge variant="destructive" className="text-xs">Expired</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm text-muted-foreground bg-slate-100 px-2 py-0.5 rounded font-mono">
                        {key.keyPrefix}...{key.keyHint}
                      </code>
                      <Badge variant="outline" className="text-xs">
                        {getScopeLabel(key.scopes)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Created {formatDate(key.createdAt)}</span>
                      {key.lastUsedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last used {getRelativeTime(key.lastUsedAt)}
                        </span>
                      )}
                      <span>{key.usageCount.toLocaleString()} requests</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleActive(key)}>
                          {key.isActive ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Revoke Key
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Reactivate Key
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setKeyToDelete(key)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Permanently
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <Key className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium mb-1">No API keys yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create an API key to access your data programmatically
              </p>
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Key
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Key Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for programmatic access.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleCreateKey)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Key Name</Label>
              <Input
                id="name"
                placeholder="e.g., Production Server, Webhook Integration"
                {...form.register("name")}
                disabled={isCreating}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What will this key be used for?"
                rows={2}
                {...form.register("description")}
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scopePreset">Permissions</Label>
              <Select
                value={form.watch("scopePreset")}
                onValueChange={(value) => form.setValue("scopePreset", value)}
                disabled={isCreating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SCOPE_PRESETS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      <div>
                        <div className="font-medium">{value.label}</div>
                        <div className="text-xs text-muted-foreground">{value.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresIn">Expiration</Label>
              <Select
                value={form.watch("expiresIn")}
                onValueChange={(value) => form.setValue("expiresIn", value)}
                disabled={isCreating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPIRY_OPTIONS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#1AADF0] hover:bg-[#0d8bc9]"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Create Key
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Key Display Dialog */}
      <Dialog open={!!newKeyData} onOpenChange={() => setNewKeyData(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              API Key Created
            </DialogTitle>
            <DialogDescription>
              Copy your API key now. You won&apos;t be able to see it again!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive" className="border-amber-500 bg-amber-50 text-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Important:</strong> This is the only time your API key will be displayed. 
                Store it securely - you cannot retrieve it later.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="relative">
                <div className="flex items-center gap-2 p-3 bg-slate-900 rounded-lg">
                  <code className="flex-1 text-sm text-green-400 font-mono break-all">
                    {showNewKey ? newKeyData?.rawKey : "•".repeat(48)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                    onClick={() => setShowNewKey(!showNewKey)}
                  >
                    {showNewKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                    onClick={() => copyToClipboard(newKeyData?.rawKey || "")}
                  >
                    {copiedKey ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Usage:</p>
              <code className="block p-2 bg-slate-100 rounded text-xs">
                curl -H &quot;Authorization: Bearer {showNewKey ? newKeyData?.rawKey?.slice(0, 20) : "tvsk_xxx"}...&quot; \<br />
                &nbsp;&nbsp;https://your-domain.com/api/calls/outbound
              </code>
              <p className="text-xs">
                <Link href="/settings/developers" className="text-[#1AADF0] hover:underline font-medium">
                  View full API documentation →
                </Link>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setNewKeyData(null);
                setIsCreateDialogOpen(false);
                setShowNewKey(false);
              }}
              className="bg-[#1AADF0] hover:bg-[#0d8bc9]"
            >
              I&apos;ve Saved My Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!keyToDelete} onOpenChange={() => setKeyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the API key &quot;{keyToDelete?.name}&quot;? 
              Any applications using this key will immediately lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteKey}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Key"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
