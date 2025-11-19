import { NextResponse } from "next/server";

// Submissions API docs:
// POST https://api.hsforms.com/submissions/v3/integration/submit/:portalId/:formGuid

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any));

    const firstName: string = body.first_name || body.firstname || "";
    const lastName: string = body.last_name || body.lastname || "";
    const email: string = body.email || "";
    const companyName: string = body.organisation_name || body.companyname || body.company || "";

    if (!email || !firstName || !lastName || !companyName) {
      return NextResponse.json(
        { error: "Missing required fields: first_name, last_name, email, organisation_name/companyname" },
        { status: 400 }
      );
    }

    const portalId = process.env.HUBSPOT_PORTAL_ID;
    const formId = process.env.HUBSPOT_SIGNUP_FORM_ID || process.env.HUBSPOT_FORM_ID;
    const baseUrl = "https://api-eu1.hsforms.com";

    if (!portalId || !formId) {
      return NextResponse.json(
        { error: "HubSpot configuration missing (HUBSPOT_PORTAL_ID, HUBSPOT_SIGNUP_FORM_ID)" },
        { status: 500 }
      );
    }

    // Attempt to capture HubSpot tracking cookie and basic context
    const cookieHeader = request.headers.get("cookie") || "";
    const referer = request.headers.get("referer") || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;
    const xff = request.headers.get("x-forwarded-for") || undefined;

    const hutk = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("hubspotutk="))
      ?.split("=")[1];

    const submissionPayload = {
      submittedAt: Date.now(),
      fields: [
        { name: "firstname", value: firstName },
        { name: "lastname", value: lastName },
        { name: "email", value: email },
        { name: "company", value: companyName },
      ],
      context: {
        ...(hutk && { hutk }),
        ...(referer && { pageUri: referer }),
        pageName: "Sign Up",
        ...(xff && { ipAddress: xff }),
      },
    } as any;

    const url = `${baseUrl}/submissions/v3/integration/submit/${portalId}/${formId}`;

    const hsRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submissionPayload),
      // No auth required for Forms Submissions API
    });

    const hsText = await hsRes.text();

    if (!hsRes.ok) {
      console.error("HubSpot submission failed:", {
        status: hsRes.status,
        statusText: hsRes.statusText,
        url,
        body: safeJsonParse(hsText),
        payload: submissionPayload
      });
      return NextResponse.json(
        { 
          error: "HubSpot submission failed", 
          status: hsRes.status, 
          statusText: hsRes.statusText,
          url,
          body: safeJsonParse(hsText),
          sentPayload: submissionPayload
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, hubspot: safeJsonParse(hsText) });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unexpected error submitting to HubSpot", message: err?.message || String(err) },
      { status: 500 }
    );
  }
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch (_) {
    return text;
  }
}


