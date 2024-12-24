document.addEventListener('DOMContentLoaded', function () {
  const toggleSwitch = document.getElementById('toggle-notice');

  if (toggleSwitch) {
    toggleSwitch.addEventListener('change', function () {
      const isChecked = this.checked;

      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const activeTab = tabs[0];
        if (!activeTab) {
          console.error('No active tab found.');
          return;
        }
        chrome.tabs.sendMessage(activeTab.id, { action: 'toggleVisibility', isVisible: isChecked }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError.message);
          } else {
            console.log('Content script responded:', response);
          }
        });
      });
    });
  } else {
    console.error('Toggle switch not found.');
  }
});
