import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the data/results JSON files are bundled into every
  // server route's function — Next.js's automatic file tracer
  // can't follow the dynamic path.join() in lib/data.ts.
  outputFileTracingIncludes: {
    "/*": ["./data/**/*"],
  },
};

export default nextConfig;
