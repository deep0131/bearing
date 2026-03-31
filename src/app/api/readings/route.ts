/* ── Readings API ── */
import { NextRequest, NextResponse } from "next/server";
import { getLatestReading, getReadingHistory } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "history";
    const limit = parseInt(searchParams.get("limit") || "50");

    if (mode === "latest") {
      const reading = await getLatestReading();
      return NextResponse.json({ success: true, reading });
    }

    const readings = await getReadingHistory(limit);
    return NextResponse.json({ success: true, readings, count: readings.length });
  } catch (error) {
    console.error("Readings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch readings", details: String(error) },
      { status: 500 }
    );
  }
}
