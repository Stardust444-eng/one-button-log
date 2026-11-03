import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The browser opens 127.0.0.1 while the dev server also answers as localhost.
  // Without this, Next blocks the dev websocket and the page never hydrates.
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  // Boards are live shared state. Leave Cache Components off so a tap is
  // never served from a prerendered shell.
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
