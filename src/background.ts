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
})();
