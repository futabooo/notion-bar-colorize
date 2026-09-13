import {
  BrowserClient,
  Scope,
  dedupeIntegration,
  defaultStackParser,
  eventFiltersIntegration,
  functionToStringIntegration,
  globalHandlersIntegration,
  linkedErrorsIntegration,
  makeFetchTransport,
} from "@sentry/browser";
import type { ErrorReport } from "./error-reporting";

// background (service worker) 専用。
// Sentry.init() はグローバルを汚染するため、拡張向けガイドに従い
// BrowserClient + Scope を明示的に組み立てる。
// DSN が未設定 (VITE_SENTRY_DSN が空) の場合は何も送らない。

let scope: Scope | null = null;

export const initSentry = (): boolean => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return false;

  const manifest = chrome.runtime.getManifest();
  const client = new BrowserClient({
    dsn,
    release: `${manifest.name}@${manifest.version}`,
    environment: import.meta.env.MODE,
    transport: makeFetchTransport,
    stackParser: defaultStackParser,
    sendDefaultPii: false,
    integrations: [
      dedupeIntegration(),
      functionToStringIntegration(),
      eventFiltersIntegration(),
      linkedErrorsIntegration(),
      // service worker 内の未捕捉例外 / unhandledrejection を拾う
      globalHandlersIntegration(),
    ],
    beforeSend(event) {
      // 念のため URL / ユーザー情報は送らない
      delete event.request;
      delete event.user;
      return event;
    },
  });

  scope = new Scope();
  scope.setClient(client);
  scope.setTag("source", "background");
  client.init();
  return true;
};

// content script / option page から転送されたエラーを送信する
export const captureReportedError = (report: ErrorReport): void => {
  if (!scope) return;
  const error = new Error(report.message);
  error.name = report.name;
  if (report.stack) error.stack = report.stack;

  scope.captureException(error, {
    captureContext: {
      tags: { source: report.source, operation: report.operation ?? "unknown" },
    },
  });
};
