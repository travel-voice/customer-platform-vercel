import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Stripe secret key not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();

    // Preserve supported query params; maintain existing expand behavior
    const limit = searchParams.get("limit");
    if (limit) params.append("limit", limit);
    const starting_after = searchParams.get("starting_after");
    if (starting_after) params.append("starting_after", starting_after);
    const ending_before = searchParams.get("ending_before");
    if (ending_before) params.append("ending_before", ending_before);
    const expand = searchParams.getAll("expand[0]");
    if (expand.length > 0) {
      expand.forEach((v) => params.append("expand[0]", v));
    } else {
      params.append("expand[0]", "total_count");
    }

    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/invoices?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
        },
        // Do not cache sensitive responses
        cache: "no-store",
      }
    );

    const body = await stripeResponse.json();
    return NextResponse.json(body, { status: stripeResponse.status });
  } catch (error) {
    console.error("Error fetching Stripe invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
