import type { NextConfig } from "next";
const config: NextConfig = {
  agentRules: false,
  distDir: process.env.SIGNAL_BUILD_DIR || ".next",
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  serverExternalPackages: ["postgres"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default config;
