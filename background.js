chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getActiveTab") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError || tabs.length === 0) {
          sendResponse({ error: "No active tab found or permission issue." });
        } else {
          sendResponse({ tab: tabs[0] });
        }
      });
      return true; // Keeps the message channel open for async response
    }
  });
  