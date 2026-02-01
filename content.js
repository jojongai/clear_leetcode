// Content script for Clear LeetCode
// Runs on LeetCode pages to clear code when toggle is enabled

console.log('Clear LeetCode content script loaded');

// Check if delete responses is enabled and clear code on page load
function checkAndClearCode() {
  chrome.storage.local.get(['deleteResponses'], (result) => {
    const isEnabled = result.deleteResponses || false;
    
    if (isEnabled) {
      console.log('Clear LeetCode: Delete responses is enabled, clearing code...');
      clearLeetCodeCode();
    } else {
      console.log('Clear LeetCode: Delete responses is disabled');
    }
  });
}

// Placeholder function for clearing LeetCode code
// This will be implemented later
function clearLeetCodeCode() {
  // TODO: Implement the actual code clearing logic
  console.log('Clear LeetCode: clearLeetCodeCode() called - placeholder function');
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for LeetCode's dynamic content to load
    setTimeout(() => {
      checkAndClearCode();
    }, 1000);
  });
} else {
  // DOM already loaded
  setTimeout(() => {
    checkAndClearCode();
  }, 1000);
}

// Listen for messages from popup when toggle changes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateDeleteSetting') {
    const isEnabled = request.enabled;
    
    if (isEnabled) {
      console.log('Clear LeetCode: Toggle turned ON, clearing code...');
      clearLeetCodeCode();
    } else {
      console.log('Clear LeetCode: Toggle turned OFF');
    }
    
    sendResponse({ success: true });
  }
  
  return true; // Keep the message channel open for async response
});

