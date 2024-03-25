import { crx, defineManifest } from "@crxjs/vite-plugin";
import { defineConfig } from "vite";

const manifest = defineManifest({
  manifest_version: 3,
  description: "Change Notion sidebar and topbar color",
  name: "Notion Bar Colorize",
  version: "0.1.0",
  author: "futabooo",
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
  plugins: [crx({ manifest })],
});
