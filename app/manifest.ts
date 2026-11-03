import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "One-Button Log",
    short_name: "One-Button",
    description: "Log a household task with one tap. No account.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3efe4",
    theme_color: "#f3efe4",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
