import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { agentRole, primaryGoal, companyName, keyInfo } = await req.json();

    if (!agentRole || !primaryGoal) {
      return NextResponse.json({ error: "Agent role and primary goal are required" }, { status: 400 });
    }

    const systemContent = `
You are an expert in creating system prompts for voice AI agents.
Your task is to generate a detailed, structured prompt based on the user's requirements.
The prompt must be divided into the following sections: PERSONALITY, ENVIRONMENT, TONE, GOAL, and GUARDRAILS.

**User Requirements:**
- **Agent Role**: ${agentRole}
- **Primary Goal**: ${primaryGoal}
- **Company Name**: ${companyName || 'the company'}
- **Key Information**: ${keyInfo || 'Not provided'}

**Instructions for the AI Agent (to be included in the generated prompt)**:
- Must be conversational and sound human.
- Must handle numbers, dates, and acronyms in a natural way (e.g., pronounce '$500' as 'five hundred dollars').
- Must have clear error handling and know when to escalate to a human.

Generate a comprehensive system prompt and a suitable first message for the voice AI agent.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemContent,
        },
        {
          role: "user",
          content: "Please generate the system prompt and first message.",
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message?.content;
    
    if (!content) {
      return NextResponse.json({ error: "Failed to generate prompt" }, { status: 500 });
    }

    const { system_prompt, first_message } = JSON.parse(content);

    return NextResponse.json({ system_prompt, first_message });

  } catch (error) {
    console.error("Error generating prompt:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
} 