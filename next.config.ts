import type { NextConfig } from "next";
const config: NextConfig = {
  distDir: process.env.NODE_ENV === "production" ? ".next-production" : ".next",
  serverExternalPackages: ["@node-rs/argon2", "postgres"],
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};
export default config;
