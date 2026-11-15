import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Keep webpack in-process on Windows/OneDrive so worker failures surface
    // with actionable diagnostics and do not leave zero-byte route bundles.
    webpackBuildWorker: false,
    // OneDrive can race concurrent static-generation workers creating the same
    // route segment directories on Windows. Serial generation avoids EPERM.
    cpus: 1,
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
