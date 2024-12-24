document.addEventListener('DOMContentLoaded', function () {
  const toggleSwitch = document.getElementById('toggle-notice');

  chrome.storage.local.get('toggleState', (result) => {
    const isChecked = result.toggleState || false; 
    toggleSwitch.checked = isChecked;
  });

  toggleSwitch.addEventListener('change', function () {
    const isChecked = this.checked;

    chrome.storage.local.set({ toggleState: isChecked }, () => {
      console.log(`Global toggle state updated to: ${isChecked}`);

      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { action: 'toggleVisibility', isVisible: isChecked });
        });
      });
    });
  });
});
