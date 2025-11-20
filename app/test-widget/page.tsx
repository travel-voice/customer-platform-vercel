"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { createClient } from "@/lib/supabase/client";

export default function TestWidgetPage() {
  const { user } = useAuthStore();
  const [agentId, setAgentId] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch the first available agent for testing
  useEffect(() => {
    async function fetchAgent() {
      if (!user?.organisation_uuid) return;

      const supabase = createClient();
      const { data } = await supabase
        .from('agents')
        .select('uuid')
        .eq('organization_uuid', user.organisation_uuid)
        .limit(1)
        .single();
      
      if (data) {
        setAgentId(data.uuid);
      }
      setLoading(false);
    }

    fetchAgent();
  }, [user?.organisation_uuid]);

  // Inject the widget script manually for this test page
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/widget.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup if needed
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Widget Test Page</h1>
        <p className="text-gray-500">
          This page simulates an external website embedding your AI agent.
        </p>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 text-left">
          <strong>Setup Checklist:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Ensure <code>localhost</code> is added to your <strong>Account Settings &gt; Domains</strong>.</li>
            <li>Ensure you have at least one Agent created.</li>
          </ul>
        </div>

        {loading ? (
          <p>Loading agent info...</p>
        ) : agentId ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Found Agent ID: <code className="bg-gray-100 px-1 rounded">{agentId}</code>
            </p>
            
            {/* This is the button the widget will attach to */}
            <button
              id={agentId}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              Talk to AI Agent
            </button>
            
            <p className="text-xs text-gray-400 mt-4">
              Clicking above should open the widget popup.
            </p>
          </div>
        ) : (
          <div className="text-red-600">
            No agents found. Please create an agent in your dashboard first.
          </div>
        )}
      </div>
    </div>
  );
}

