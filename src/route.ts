import { NextRequest, NextResponse } from "next/server";
import { routeQuery } from "@/lib/router";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const result = await routeQuery(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Who-else route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
