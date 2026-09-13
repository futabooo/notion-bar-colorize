import { isErrorReport, reportError } from "./error-reporting";
import { captureReportedError, initSentry } from "./sentry";

const NOTION_URLS = ["https://www.notion.so/*", "https://app.notion.com/*"];

(() => {
  initSentry();

  // content script / option page からのエラー報告を Sentry に転送
  chrome.runtime.onMessage.addListener((message) => {
    if (isErrorReport(message)) {
      captureReportedError(message);
    }
  });

  // send event to content_scripts to run a script on history change
  chrome.webNavigation.onHistoryStateUpdated.addListener((_) => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId) {
          chrome.tabs.sendMessage(tabId, {}, (_) => {});
        }
      }
    );
  });

  // sync storageが更新されたら全Notionタブに色の再適用を指示
  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area !== "sync") return;
    chrome.tabs.query({ url: NOTION_URLS }, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) chrome.tabs.sendMessage(tab.id, {}, (_) => {});
      });
    });
  });

  // background 自身の例外は globalHandlersIntegration が拾うが、
  // Sentry 無効時にもログには残す
  self.addEventListener("unhandledrejection", (e) => {
    reportError("background", (e as PromiseRejectionEvent).reason, "unhandledrejection");
  });
})();
