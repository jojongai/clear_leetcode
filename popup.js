// Popup functionality for Clear LeetCode

// Load saved state when popup opens
document.addEventListener('DOMContentLoaded', () => {
  loadToggleState();
  setupToggleListener();
});

// Load the toggle state from storage
function loadToggleState() {
  chrome.storage.local.get(['deleteResponses'], (result) => {
    const isEnabled = result.deleteResponses || false;
    document.getElementById('deleteToggle').checked = isEnabled;
  });
}

// Setup toggle change listener
function setupToggleListener() {
  const toggle = document.getElementById('deleteToggle');
  toggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    chrome.storage.local.set({ deleteResponses: isEnabled }, () => {
      // Notify content script of the change
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: 'updateDeleteSetting', 
            enabled: isEnabled 
          });
        }
      });
    });
  });
}

