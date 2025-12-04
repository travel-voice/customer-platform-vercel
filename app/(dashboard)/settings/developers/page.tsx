"use client";

import {
  AlertCircle,
  Check,
  Code,
  Copy,
  Phone,
  Shield,
  BookOpen,
  Key,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Agent {
  uuid: string;
  name: string;
  vapi_assistant_id: string | null;
}

interface PhoneNumber {
  uuid: string;
  phone_number: string;
  agent_uuid: string | null;
}

export default function DevelopersPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Curl generator state
  const [selectedAssistant, setSelectedAssistant] = useState<string>("");
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [customerNumber, setCustomerNumber] = useState<string>("+1");
  const [variableName, setVariableName] = useState<string>("John");
  const [variableDate, setVariableDate] = useState<string>("January 15th");

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents");
      const data = await response.json();
      if (response.ok && data.agents) {
        const activeAgents = data.agents.filter((a: Agent) => a.vapi_assistant_id);
        setAgents(activeAgents);
        if (activeAgents.length > 0) {
          setSelectedAssistant(activeAgents[0].uuid);
        }
      }
    } catch (err) {
      console.error("Failed to load agents:", err);
    }
  };

  const fetchPhoneNumbers = async () => {
    try {
      const response = await fetch("/api/phone-numbers");
      const data = await response.json();
      if (response.ok && data.phoneNumbers) {
        setPhoneNumbers(data.phoneNumbers);
        if (data.phoneNumbers.length > 0) {
          setSelectedPhone(data.phoneNumbers[0].uuid);
        }
      }
    } catch (err) {
      console.error("Failed to load phone numbers:", err);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchPhoneNumbers();
  }, []);

  const copyToClipboard = async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (id) {
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const generateCurlCommand = () => {
    const domain = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
    return `curl -X POST ${domain}/api/calls/outbound \\
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "assistantId": "${selectedAssistant || 'your-assistant-uuid'}",
    "phoneNumberId": "${selectedPhone || 'your-phone-number-uuid'}",
    "customer": {
      "number": "${customerNumber}",
      "name": "Customer Name"
    },
    "variables": {
      "name": "${variableName}",
      "appointment_date": "${variableDate}"
    }
  }'`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">API Documentation</h1>
          <p className="text-muted-foreground">
            Learn how to integrate with our API to automate outbound calls
          </p>
        </div>
        <Link href="/settings/api-keys">
          <Button className="bg-[#1AADF0] hover:bg-[#0d8bc9] gap-2">
            <Key className="h-4 w-4" />
            Manage API Keys
          </Button>
        </Link>
      </div>

      {/* Quick Start Guide */}
      <Card className="border-[#1AADF0] bg-gradient-to-br from-[#1AADF0]/5 to-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1AADF0]">
            <BookOpen className="h-5 w-5" />
            Quick Start
          </CardTitle>
          <CardDescription>
            Get started with the API in 3 simple steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1AADF0] text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Create an API Key</h3>
                <p className="text-sm text-muted-foreground">
                  Generate a new API key with <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">calls:write</code> permission
                </p>
                <Link href="/settings/api-keys">
                  <Button variant="link" className="px-0 h-auto text-[#1AADF0] mt-1">
                    Go to API Keys <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1AADF0] text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Generate Your Command</h3>
                <p className="text-sm text-muted-foreground">
                  Use the interactive curl generator below to build your first API call
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1AADF0] text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Make Your First Call</h3>
                <p className="text-sm text-muted-foreground">
                  Copy the command, add your API key, and execute it to start making calls
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Documentation Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            API Reference
          </CardTitle>
          <CardDescription>
            Complete documentation for making outbound calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="quickstart" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
              <TabsTrigger value="authentication">Authentication</TabsTrigger>
              <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
            </TabsList>

            <TabsContent value="quickstart" className="space-y-4 mt-4">
              {/* Interactive Curl Generator */}
              <div className="space-y-4 p-4 border-2 border-[#1AADF0] rounded-lg bg-[#1AADF0]/5">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-[#1AADF0]" />
                  <h3 className="font-semibold text-lg">Interactive Command Generator</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Select your assistant and phone number to generate a ready-to-use curl command.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="curl-assistant">Assistant</Label>
                    <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                      <SelectTrigger id="curl-assistant">
                        <SelectValue placeholder="Select assistant" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.length > 0 ? (
                          agents.map((agent) => (
                            <SelectItem key={agent.uuid} value={agent.uuid}>
                              {agent.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No assistants available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="curl-phone">Phone Number</Label>
                    <Select value={selectedPhone} onValueChange={setSelectedPhone}>
                      <SelectTrigger id="curl-phone">
                        <SelectValue placeholder="Select phone number" />
                      </SelectTrigger>
                      <SelectContent>
                        {phoneNumbers.length > 0 ? (
                          phoneNumbers.map((phone) => (
                            <SelectItem key={phone.uuid} value={phone.uuid}>
                              {phone.phone_number}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No phone numbers available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="curl-customer">Customer Number (E.164)</Label>
                    <Input
                      id="curl-customer"
                      value={customerNumber}
                      onChange={(e) => setCustomerNumber(e.target.value)}
                      placeholder="+11231231234"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="curl-var-name">Variable: name</Label>
                    <Input
                      id="curl-var-name"
                      value={variableName}
                      onChange={(e) => setVariableName(e.target.value)}
                      placeholder="John"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="curl-var-date">Variable: appointment_date</Label>
                    <Input
                      id="curl-var-date"
                      value={variableDate}
                      onChange={(e) => setVariableDate(e.target.value)}
                      placeholder="January 15th"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Your Generated Command</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generateCurlCommand(), "generated-curl")}
                    >
                      {copiedCode === "generated-curl" ? (
                        <>
                          <Check className="h-3 w-3 text-green-600 mr-1" />
                          <span className="text-xs">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          <span className="text-xs">Copy Command</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-green-400 font-mono whitespace-pre">
                      {generateCurlCommand()}
                    </pre>
                  </div>
                  <Alert className="bg-amber-50 border-amber-300">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-sm text-amber-800">
                      <strong>Remember:</strong> Replace <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">YOUR_API_KEY_HERE</code> with your actual API key.
                      {' '}<Link href="/settings/api-keys" className="underline font-medium">Get your API key →</Link>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="authentication" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-lg">Authentication</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  All API requests must be authenticated using an API key.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Method 1: Bearer Token (Recommended)</Label>
                <div className="bg-slate-900 rounded-lg p-4 flex items-center justify-between">
                  <code className="text-sm text-green-400 font-mono">
                    Authorization: Bearer YOUR_API_KEY
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                    onClick={() => copyToClipboard("Authorization: Bearer YOUR_API_KEY", "auth-bearer")}
                  >
                    {copiedCode === "auth-bearer" ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Method 2: X-API-Key Header</Label>
                <div className="bg-slate-900 rounded-lg p-4 flex items-center justify-between">
                  <code className="text-sm text-green-400 font-mono">
                    X-API-Key: YOUR_API_KEY
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                    onClick={() => copyToClipboard("X-API-Key: YOUR_API_KEY", "auth-header")}
                  >
                    {copiedCode === "auth-header" ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  API keys start with <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">tvsk_</code> prefix.
                  You can create and manage your API keys in the{' '}
                  <Link href="/settings/api-keys" className="underline font-medium">API Keys page</Link>.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Required Scopes</Label>
                <div className="grid gap-2">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">calls:write</Badge>
                      <span className="text-sm font-medium">Make Outbound Calls</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Required to initiate outbound phone calls via the API
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">*</Badge>
                      <span className="text-sm font-medium">Full Access</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Complete access to all API endpoints and resources
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="endpoints" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-lg">Make an Outbound Call</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Initiate outbound phone calls programmatically using your AI assistants.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Endpoint</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("POST /api/calls/outbound", "endpoint")}
                  >
                    {copiedCode === "endpoint" ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="bg-slate-900 rounded-lg p-4">
                  <code className="text-sm text-green-400 font-mono">
                    POST /api/calls/outbound
                  </code>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Request Body</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`{
  "assistantId": "your-assistant-uuid",
  "phoneNumberId": "your-phone-number-uuid",
  "customer": {
    "number": "+11231231234",
    "name": "John Doe"
  },
  "variables": {
    "name": "John",
    "appointment_date": "January 15th"
  }
}`, "request-body")}
                  >
                    {copiedCode === "request-body" ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-green-400 font-mono">
{`{
  "assistantId": "your-assistant-uuid",
  "phoneNumberId": "your-phone-number-uuid",
  "customer": {
    "number": "+11231231234",
    "name": "John Doe"
  },
  "variables": {
    "name": "John",
    "appointment_date": "January 15th"
  }
}`}
                  </pre>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Parameters</Label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-3 font-medium">Parameter</th>
                        <th className="text-left p-3 font-medium">Type</th>
                        <th className="text-left p-3 font-medium">Required</th>
                        <th className="text-left p-3 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="p-3"><code className="bg-slate-100 px-1 py-0.5 rounded text-xs">assistantId</code></td>
                        <td className="p-3 text-muted-foreground">string</td>
                        <td className="p-3"><Badge variant="destructive" className="text-xs">Yes</Badge></td>
                        <td className="p-3 text-muted-foreground">UUID of your assistant</td>
                      </tr>
                      <tr>
                        <td className="p-3"><code className="bg-slate-100 px-1 py-0.5 rounded text-xs">phoneNumberId</code></td>
                        <td className="p-3 text-muted-foreground">string</td>
                        <td className="p-3"><Badge variant="destructive" className="text-xs">Yes</Badge></td>
                        <td className="p-3 text-muted-foreground">UUID of your phone number</td>
                      </tr>
                      <tr>
                        <td className="p-3"><code className="bg-slate-100 px-1 py-0.5 rounded text-xs">customer.number</code></td>
                        <td className="p-3 text-muted-foreground">string</td>
                        <td className="p-3"><Badge variant="destructive" className="text-xs">Yes</Badge></td>
                        <td className="p-3 text-muted-foreground">Phone number in E.164 format</td>
                      </tr>
                      <tr>
                        <td className="p-3"><code className="bg-slate-100 px-1 py-0.5 rounded text-xs">customer.name</code></td>
                        <td className="p-3 text-muted-foreground">string</td>
                        <td className="p-3"><Badge variant="secondary" className="text-xs">No</Badge></td>
                        <td className="p-3 text-muted-foreground">Customer&apos;s name</td>
                      </tr>
                      <tr>
                        <td className="p-3"><code className="bg-slate-100 px-1 py-0.5 rounded text-xs">variables</code></td>
                        <td className="p-3 text-muted-foreground">object</td>
                        <td className="p-3"><Badge variant="secondary" className="text-xs">No</Badge></td>
                        <td className="p-3 text-muted-foreground">Dynamic variables for the call</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Response (Success - 200 OK)</Label>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-blue-300 font-mono">
{`{
  "success": true,
  "callId": "vapi-call-id-here",
  "status": "queued",
  "assistant": {
    "id": "assistant-uuid",
    "name": "My Assistant"
  },
  "phoneNumber": {
    "id": "phone-uuid",
    "number": "+11231231234"
  }
}`}
                  </pre>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="variables" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-lg">Dynamic Variables</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pass custom data to personalize each call. Variables can be used in your assistant&apos;s prompts.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Step 1: Add Variables to Your Prompt</Label>
                <p className="text-sm text-muted-foreground">
                  Use double curly braces to add variable placeholders in your assistant&apos;s system prompt.
                </p>
                <div className="bg-slate-900 rounded-lg p-4">
                  <pre className="text-xs text-green-400 font-mono">
{`Hello {{name}}! 

I'm calling to remind you about your 
{{appointment_type}} on {{appointment_date}} 
at {{appointment_time}}.

Your appointment is with {{provider_name}}.`}
                  </pre>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Step 2: Pass Values in API Call</Label>
                <p className="text-sm text-muted-foreground">
                  Include the variables object in your API request with the actual values.
                </p>
                <div className="bg-slate-900 rounded-lg p-4">
                  <pre className="text-xs text-blue-300 font-mono">
{`{
  "assistantId": "uuid-here",
  "phoneNumberId": "uuid-here",
  "customer": {
    "number": "+11231231234"
  },
  "variables": {
    "name": "Sarah",
    "appointment_type": "dental checkup",
    "appointment_date": "January 15th",
    "appointment_time": "2:00 PM",
    "provider_name": "Dr. Smith"
  }
}`}
                  </pre>
                </div>
              </div>

              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-sm text-green-800">
                  <strong>Built-in Variables:</strong> Vapi automatically provides <code className="bg-green-100 px-1 py-0.5 rounded">{`{{now}}`}</code>, <code className="bg-green-100 px-1 py-0.5 rounded">{`{{date}}`}</code>, and <code className="bg-green-100 px-1 py-0.5 rounded">{`{{time}}`}</code>.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Example Use Cases</Label>
                <div className="grid gap-3">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-1">Appointment Reminders</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Personalize calls with patient name, appointment type, date, and location.
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">name</Badge>
                      <Badge variant="outline" className="text-xs">appointment_date</Badge>
                      <Badge variant="outline" className="text-xs">appointment_time</Badge>
                      <Badge variant="outline" className="text-xs">location</Badge>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-1">Order Confirmations</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Include order details, delivery date, and tracking information.
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">customer_name</Badge>
                      <Badge variant="outline" className="text-xs">order_number</Badge>
                      <Badge variant="outline" className="text-xs">delivery_date</Badge>
                      <Badge variant="outline" className="text-xs">tracking_number</Badge>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-1">Event Invitations</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Customize event details, venue, and special instructions.
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">guest_name</Badge>
                      <Badge variant="outline" className="text-xs">event_name</Badge>
                      <Badge variant="outline" className="text-xs">event_date</Badge>
                      <Badge variant="outline" className="text-xs">venue</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

