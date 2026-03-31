/* ── Health Check API ── */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "BearingPulse API",
    timestamp: new Date().toISOString(),
  });
}
