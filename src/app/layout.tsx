import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BearingPulse — Bearing Health Prediction System",
  description:
    "Real-time IoT bearing health monitoring and ML-based predictive maintenance dashboard. Uses weighted ensemble of Random Forest, KNN, and Logistic Regression.",
  keywords: [
    "bearing health",
    "predictive maintenance",
    "IoT",
    "machine learning",
    "vibration analysis",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
