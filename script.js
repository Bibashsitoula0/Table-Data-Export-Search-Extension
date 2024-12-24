document.addEventListener('DOMContentLoaded', async function () {
  const toggleSwitch = document.getElementById('toggle-notice');
  chrome.storage.sync.get('toggleState', (data) => {
    const isChecked = data.toggleState || false; // Default to false if no state exists
    toggleSwitch.checked = isChecked;
  });

  toggleSwitch.addEventListener('change', function () {
    const isChecked = this.checked;

    chrome.storage.sync.set({ toggleState: isChecked }, () => {

      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.url && tab.url.startsWith('http')) { // Ensure the tab has a valid URL
            chrome.tabs.sendMessage(tab.id, { action: 'toggleVisibility', isVisible: isChecked }, (response) => {
              if (chrome.runtime.lastError) {
                console.warn(`Could not send message to tab ${tab.id}:`, chrome.runtime.lastError.message);
              } else {
                console.log('Message sent to tab:', tab.id, response);
              }
            });
          }
        });
      });
    });
  });
});
