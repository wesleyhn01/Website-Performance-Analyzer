console.log('Content script running');

// The content script doesn't need to do anything specific for the PageSpeed Insights API
// as the API call is made from the popup script. However, we'll keep a basic structure
// in case we need to add functionality in the future.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  // We're not handling any specific messages now, but we'll keep the listener
  // in case we need to add functionality in the future.
  return true; // Keeps the message channel open for asynchronous response
});

console.log('Content script setup complete');

export {};