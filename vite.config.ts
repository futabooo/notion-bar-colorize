import { crx, defineManifest } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const manifest = defineManifest({
  manifest_version: 3,
  description: "Change Notion topbar and sidebar color",
  name: "Notion Bar Colorize",
  version: "1.1.3",
  author: {
    email: "mail@futabooo.com",
  },
  icons: {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png",
  },
  action: {
    default_icon: "icons/icon-128.png",
    default_title: "Notion Bar Colorize",
    default_popup: "src/option.html",
  },
  background: {
    service_worker: "src/background.ts",
  },
  content_scripts: [
    {
      matches: ["https://www.notion.so/*"],
      js: ["src/content.ts"],
    },
  ],
  options_ui: {
    page: "src/option.html",
  },
  permissions: ["storage", "webNavigation"],
});

export default defineConfig({
  plugins: [crx({ manifest }), tailwindcss()],
});
