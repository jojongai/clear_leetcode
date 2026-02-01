// Background service worker for Clear LeetCode extension
// Handles extension lifecycle and background tasks

console.log('Clear LeetCode background service worker initialized');

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Clear LeetCode installed successfully!');
    
    // Set default value for deleteResponses toggle
    chrome.storage.local.set({ deleteResponses: false }, () => {
      console.log('Clear LeetCode: Default toggle state set to false');
    });
  } else if (details.reason === 'update') {
    console.log('Clear LeetCode updated to version', chrome.runtime.getManifest().version);
  }
});

