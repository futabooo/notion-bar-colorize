(() => {
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
    chrome.tabs.query({ url: "https://www.notion.so/*" }, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) chrome.tabs.sendMessage(tab.id, {}, (_) => {});
      });
    });
  });
})();
