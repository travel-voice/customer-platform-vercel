"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Check,
  Code,
  Copy,
  ExternalLink,
  Globe,
  Key,
  Plus,
  Shield,
  Trash2,
  Users,
  X} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useDomainsStore } from "@/lib/stores/domains-store";

const addDomainSchema = z.object({
  domain: z.string().min(1, "Domain name is required"),
});

type AddDomainForm = z.infer<typeof addDomainSchema>;

export default function AccountSettingsPage() {
  const { user } = useAuthStore();
  const {
    domains,
    embedScript,
    isLoading,
    isAdding,
    isDeleting,
    error,
    getDomains,
    addDomain,
    deleteDomain,
    generateEmbedScript,
    copyToClipboard,
    clearError
  } = useDomainsStore();

  const [copySuccess, setCopySuccess] = useState(false);
  const [deletingDomainId, setDeletingDomainId] = useState<string | null>(null);

  const form = useForm<AddDomainForm>({
    resolver: zodResolver(addDomainSchema),
    defaultValues: {
      domain: "",
    },
  });

  // Load domains and generate embed script on page load
  useEffect(() => {
    if (user?.organisation_uuid) {
      getDomains(user.organisation_uuid);
      generateEmbedScript();
    }
  }, [user?.organisation_uuid, getDomains, generateEmbedScript]);

  // Clear copy success after 3 seconds
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  const handleAddDomain = async (data: AddDomainForm) => {
    if (!user?.organisation_uuid) return;

    try {
      await addDomain({
        organisationUuid: user.organisation_uuid,
        domain: data.domain.trim()
      });
      
      // Clear form on success
      form.reset();
    } catch (error) {
      // Error is handled by the store
      console.error('Failed to add domain:', error);
    }
  };

  const handleDeleteDomain = async (domainUuid: string) => {
    if (!user?.organisation_uuid) return;

    setDeletingDomainId(domainUuid);
    try {
      await deleteDomain({
        organisationUuid: user.organisation_uuid,
        domainUuid
      });
    } catch (error) {
      console.error('Failed to delete domain:', error);
    } finally {
      setDeletingDomainId(null);
    }
  };

  const handleCopyScript = async () => {
    if (!embedScript) return;

    const success = await copyToClipboard(embedScript.content);
    if (success) {
      setCopySuccess(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your domain registration and embed script for website integration
        </p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Team Management Card */}
        <Card className="border-[#1AADF0]/20 bg-gradient-to-r from-[#1AADF0]/5 to-transparent">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1AADF0]/10 rounded-lg">
                  <Users className="h-5 w-5 text-[#1AADF0]" />
                </div>
                <div>
                  <CardTitle className="text-lg">Team Management</CardTitle>
                  <CardDescription>
                    Invite team members and manage access
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild className="w-full bg-[#1AADF0] hover:bg-[#0d8bc9]">
              <Link href="/settings/team">
                <Users className="h-4 w-4 mr-2" />
                Manage Team
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* API Keys Card */}
        <Card className="border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Key className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">API Keys</CardTitle>
                  <CardDescription>
                    Manage programmatic access to your data
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild variant="outline" className="w-full border-amber-500/30 hover:bg-amber-50">
              <Link href="/settings/api-keys">
                <Key className="h-4 w-4 mr-2" />
                Manage API Keys
              </Link>
            </Button>
          </CardContent>
        </Card>
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

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Domain Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Domain Registration
            </CardTitle>
            <CardDescription>
              Add domains where your Travel Voice script will be used. Only registered domains can use your AI agents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Domain Form */}
            <form onSubmit={form.handleSubmit(handleAddDomain)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Add New Domain</Label>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <Input
                    id="domain"
                    placeholder="app.travelvoice.co.uk"
                    {...form.register("domain")}
                    disabled={isAdding}
                  />
                  <Button 
                    type="submit" 
                    disabled={isAdding || !form.watch("domain")}
                    className="gap-2 sm:self-auto"
                  >
                    <Plus className="h-4 w-4" />
                    {isAdding ? "Adding..." : "Add"}
                  </Button>
                </div>
                {form.formState.errors.domain && (
                  <p className="text-sm text-red-600">{form.formState.errors.domain.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter domain without protocol (e.g., app.travelvoice.co.uk, not https://app.travelvoice.co.uk)
                </p>
              </div>
            </form>

            <Separator />

            {/* Domains List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Registered Domains</h3>
                <Badge variant="secondary">{domains.length} domains</Badge>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : domains.length > 0 ? (
                <div className="space-y-2">
                  {domains.map((domain) => (
                    <div key={domain.uuid} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{domain.domain}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Added {formatDate(domain.created_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDomain(domain.uuid)}
                        disabled={deletingDomainId === domain.uuid}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deletingDomainId === domain.uuid ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed rounded-lg">
                  <Globe className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="font-medium mb-1">No domains registered</h3>
                  <p className="text-sm text-muted-foreground">
                    Add your first domain to start using Travel Voice on your website
                  </p>
                </div>
              )}
            </div>

            {/* Domain Security Info */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Security:</strong> Your AI agents will only work on registered domains. 
                This prevents unauthorized usage of your agents.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Embed Script Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Embed Script
            </CardTitle>
            <CardDescription>
              Copy this script and add it to your website to enable Travel Voice AI agents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Script Display */}
            <div className="space-y-2">
              <Label>Integration Script</Label>
              <div className="relative">
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <code>{embedScript?.content || 'Loading script...'}</code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyScript}
                  disabled={!embedScript}
                  className="absolute top-2 right-2 gap-2"
                >
                  {copySuccess ? (
                    <>
                      <Check className="h-3 w-3 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Usage Instructions */}
            <div className="space-y-3">
              <h3 className="font-medium">How to Use</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Copy the script code above</li>
                <li>Paste it into your website&apos;s HTML</li>
                <li>Place it just before the closing <code>&lt;/body&gt;</code> tag</li>
                <li>Your AI agents will automatically appear on registered domains</li>
              </ol>
            </div>

            {/* Link to full guide */}
            <Alert>
              <AlertDescription className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>
                  For a complete walkthrough, check out our{" "}
                  <a 
                    href="https://www.travelvoice.co.uk/blog/how-to-integrate-voice-agent-into-your-website-complete-guide" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    full integration guide
                  </a>
                  .
                </span>
              </AlertDescription>
            </Alert>

            {/* Domain Warning */}
            {domains.length === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> You must register at least one domain before the script will work.
                  Add a domain in the section above.
                </AlertDescription>
              </Alert>
            )}

            {/* Script URL Info */}
            {embedScript && (
              <div className="text-xs text-muted-foreground border-t pt-3">
                <strong>Script URL:</strong>{" "}
                <a 
                  href={embedScript.scriptUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  {embedScript.scriptUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Integration Help */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Examples</CardTitle>
          <CardDescription>
            Common ways to integrate Travel Voice into your website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-medium mb-2">WordPress</h3>
              <p className="text-sm text-muted-foreground">
                Add the script to your theme&apos;s footer.php file or use a plugin like &quot;Insert Headers and Footers&quot;
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Shopify</h3>
              <p className="text-sm text-muted-foreground">
                Go to Online Store → Themes → Actions → Edit Code, then add the script to theme.liquid
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">HTML/Static Sites</h3>
              <p className="text-sm text-muted-foreground">
                Paste the script just before the closing &lt;/body&gt; tag in your HTML files
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">React/Next.js</h3>
              <p className="text-sm text-muted-foreground">
                Add the script to your _document.js file or use a Script component in your layout
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 