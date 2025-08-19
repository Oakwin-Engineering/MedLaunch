import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NODE_ENV === "production"
        ? "https://medlaunch-112161079039.us-central1.run.app"
        : "http://localhost:8080",
  },
};

export default nextConfig;
