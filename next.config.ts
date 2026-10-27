import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Pages that were removed or renamed, so old bookmarks and open tabs still land somewhere useful.
  async redirects() {
    return [
      { source: "/projects/:projectId/payments", destination: "/projects/:projectId/transport", permanent: false },
      { source: "/projects/:projectId/expenses", destination: "/projects/:projectId/materials", permanent: false },
      { source: "/projects/:projectId/vendors", destination: "/projects/:projectId", permanent: false },
      { source: "/editor/:path*", destination: "/", permanent: false },
      { source: "/preview/:path*", destination: "/", permanent: false },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
