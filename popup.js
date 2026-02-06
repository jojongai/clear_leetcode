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
    const toggle = document.getElementById('deleteToggle');
    toggle.checked = isEnabled;
    updateUI(isEnabled);
  });
}

// Update UI based on toggle state
function updateUI(isEnabled) {
  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  const description = document.getElementById('description');
  
  if (isEnabled) {
    statusBadge.classList.add('active');
    statusText.textContent = 'On';
    description.textContent = 'Your code will be automatically cleared when you switch to a new problem.';
  } else {
    statusBadge.classList.remove('active');
    statusText.textContent = 'Off';
    description.textContent = 'When enabled, your code will be automatically cleared when you switch to a new problem.';
  }
}

// Setup toggle change listener
function setupToggleListener() {
  const toggle = document.getElementById('deleteToggle');
  toggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    
    // Update UI immediately for better UX
    updateUI(isEnabled);
    
    // Save to storage
    chrome.storage.local.set({ deleteResponses: isEnabled }, () => {
      // Notify content script of the change
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: 'updateDeleteSetting', 
            enabled: isEnabled 
          }).catch(() => {
            // Ignore errors if content script isn't loaded (e.g., not on LeetCode page)
            console.log('Content script not available');
          });
        }
      });
    });
  });
}

