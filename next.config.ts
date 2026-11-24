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
  experimental: {
    // Going back to a project tab you saw in the last 30 s shows it at once instead of rendering it
    // again on the server. Saving anything calls router.refresh(), which clears this, so your own
    // changes always show straight away.
    staleTimes: { dynamic: 30 },
    // The stylesheet (~16 KB) goes inside the page instead of a separate request that holds up the first paint.
    inlineCss: true,
  },
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
