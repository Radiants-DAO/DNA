// DevTools entry point — creates the Flow panel.
// This runs in the hidden devtools page context (not visible to the user).
chrome.devtools.panels.create('Flow', '', '/panel.html');
