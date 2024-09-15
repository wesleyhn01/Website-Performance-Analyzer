console.log('Background script running');

// We don't need to inject the content script on icon click for the PageSpeed API functionality
// chrome.action.onClicked.addListener has been removed

// The background script doesn't need to handle any specific messages for the PageSpeed API
// However, we'll keep a basic listener in case we need to add functionality in the future
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  // No specific message handling needed for PageSpeed API
  return true; // Keeps the message channel open for asynchronous response
});

export {};