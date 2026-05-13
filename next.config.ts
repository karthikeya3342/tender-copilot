import type { NextConfig } from "next";

// Dev-only: bypass TLS verification for Supabase calls in environments with SSL inspection
if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const nextConfig: NextConfig = {};

export default nextConfig;
