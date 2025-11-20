import React, { useEffect, useState } from "react";

// Configuration for the API URL
// Default to the production URL, but try to auto-detect
let BASE_URL = 'https://travel-voice-cp.vercel.app';

// Dynamic Base URL Detection
if (typeof window !== 'undefined') {
  // 1. If running on localhost, use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    BASE_URL = window.location.origin;
  } 
  // 2. Try to detect based on the script tag source (if served from the platform)
  else if (document.currentScript) {
    try {
      const scriptUrl = new URL(document.currentScript.src);
      // If the script is named widget.js, assume the API is at the same origin
      if (scriptUrl.pathname.includes('widget.js')) {
        BASE_URL = scriptUrl.origin;
      }
    } catch (e) {
      console.warn('Failed to detect script origin:', e);
    }
  }
}

export const fetchSettings = async () => {
  try {
    // Use window.location.href to get the full URL of the current page
    const fullUrl = window.location.href;
    
    // We send the origin/referer in the headers automatically in browsers
    // but we can also pass it in the body if needed.
    // The backend mainly relies on the Origin header.
    
    const apiUrl = `${BASE_URL}/api/widget/settings`;

    // Prepare the fetch options for a POST request
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // We don't strictly need the body for the new backend implementation
      // as it checks headers, but we'll keep sending the path just in case
      body: JSON.stringify({ page_path: new URL(fullUrl).pathname }),
    };

    const response = await fetch(apiUrl, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json(); // Convert response to JSON
    return data;
  } catch (error) {
    console.error("Error fetching settings:", error);
    return null; 
  }
};

export const postTranscript = async (call_id, collectedFields, char_name) => {
  try {
    // TODO: Migrate transcript storage to your new platform as well
    // For now, we keep the old endpoint or update it if you have a route for it
    // Assuming we want to use the new platform's call logging which happens via Vapi Webhooks
    
    // If you still need to manually post extra data:
    // const apiUrl = `${BASE_URL}/api/calls/transcript`; 
    
    // For this migration step, I will leave the old URL commented out and log a warning
    // because the new system relies on Vapi Webhooks to store transcripts.
    
    console.log("Transcript posting is handled by server-side webhooks in the new system.");
    return { success: true };

    /* 
    const apiUrl = "https://europe-west2-development-417014.cloudfunctions.net/transcript-store";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        call_ID: call_id,
        ...collectedFields,
        name: char_name,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json(); 
    */
  } catch (error) {
    console.error("Error updating transcript:", error);
    throw error;
  }
};
