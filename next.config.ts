import type { NextConfig } from "next";

const isGithubActions = Boolean(process.env.GITHUB_ACTIONS);

const nextConfig: NextConfig = {
  output: "export" as const,
  trailingSlash: true,
  basePath: isGithubActions ? "/sistemi-e-automazione" : "",
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
};

export default nextConfig;
