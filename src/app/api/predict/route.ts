/* ── Predict API ── */
import { NextRequest, NextResponse } from "next/server";
import { predict } from "@/lib/ml/ensemble";
import type { SensorReading } from "@/lib/types";

// POST: predict from normalized sensor features
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const reading: SensorReading = {
      rms_norm: Number(body.rms_norm),
      crest_factor: Number(body.crest_factor),
      kurtosis: Number(body.kurtosis),
      temperature_delta: Number(body.temperature_delta),
      freq_ratio: Number(body.freq_ratio),
      spectral_energy: Number(body.spectral_energy),
      // Preserve optional raw values if provided
      ...(body.raw && { raw: body.raw }),
      ...(body.device_id && { device_id: body.device_id }),
      ...(body.timestamp && { timestamp: body.timestamp }),
    };

    // Validate normalized features
    const features = {
      rms_norm: reading.rms_norm,
      crest_factor: reading.crest_factor,
      kurtosis: reading.kurtosis,
      temperature_delta: reading.temperature_delta,
      freq_ratio: reading.freq_ratio,
      spectral_energy: reading.spectral_energy,
    };

    for (const [key, value] of Object.entries(features)) {
      if (typeof value === "number" && isNaN(value)) {
        return NextResponse.json(
          { error: `Invalid value for ${key}` },
          { status: 400 }
        );
      }
    }

    const prediction = await predict(reading);

    return NextResponse.json({
      success: true,
      reading,
      prediction,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Prediction error:", error);
    return NextResponse.json(
      { error: "Prediction failed", details: String(error) },
      { status: 500 }
    );
  }
}
