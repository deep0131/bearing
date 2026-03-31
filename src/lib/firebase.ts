/* ── Firebase Client Configuration ── */

import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, query, orderByChild, limitToLast, get, push, set } from "firebase/database";
import type { SensorReading } from "./types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const database = getDatabase(app);

export { app, database };

/* ── Database Helpers ── */

export async function getLatestReading(): Promise<SensorReading | null> {
  try {
    const readingsRef = ref(database, "bearingpulse/readings");
    const q = query(readingsRef, orderByChild("timestamp"), limitToLast(1));
    const snapshot = await get(q);

    if (!snapshot.exists()) return null;

    let latest: SensorReading | null = null;
    snapshot.forEach((child) => {
      latest = child.val() as SensorReading;
    });
    return latest;
  } catch (error) {
    console.error("Firebase read error:", error);
    return null;
  }
}

export async function getReadingHistory(limit: number = 50): Promise<SensorReading[]> {
  try {
    const readingsRef = ref(database, "bearingpulse/readings");
    const q = query(readingsRef, orderByChild("timestamp"), limitToLast(limit));
    const snapshot = await get(q);

    if (!snapshot.exists()) return [];

    const readings: SensorReading[] = [];
    snapshot.forEach((child) => {
      readings.push({ ...child.val(), id: child.key } as SensorReading);
    });
    return readings;
  } catch (error) {
    console.error("Firebase read error:", error);
    return [];
  }
}

export async function pushReading(reading: SensorReading): Promise<string | null> {
  try {
    const readingsRef = ref(database, "bearingpulse/readings");
    const newRef = push(readingsRef);
    await set(newRef, { ...reading, timestamp: reading.timestamp || Date.now() });
    return newRef.key;
  } catch (error) {
    console.error("Firebase write error:", error);
    return null;
  }
}

export function getReadingsRef() {
  return ref(database, "bearingpulse/readings");
}
