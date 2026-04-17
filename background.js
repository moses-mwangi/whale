// Background service worker for Quiet Interface

// Default settings
const defaultSettings = {
  enabled: true,
  scrollBlockEnabled: true,
  notificationBlockEnabled: true,
  breathingSpaceEnabled: true,
  breathingInterval: 15, // minutes
  soundVolume: 0.3,
  selectedSound: "gentle-chime",
  trackedSites: {
    twitter: { timeSpent: 0, lastActive: null },
    instagram: { timeSpent: 0, lastActive: null },
    facebook: { timeSpent: 0, lastActive: null },
    youtube: { timeSpent: 0, lastActive: null },
    reddit: { timeSpent: 0, lastActive: null },
  },
};

// Initialize storage on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Quiet Interface installed");

  const stored = await chrome.storage.sync.get("quietSettings");
  if (!stored.quietSettings) {
    await chrome.storage.sync.set({ quietSettings: defaultSettings });
  }

  // Set up alarm for breathing reminders
  chrome.alarms.create("breathingReminder", { periodInMinutes: 15 });
});

// Handle breathing reminders
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "breathingReminder") {
    const { quietSettings } = await chrome.storage.sync.get("quietSettings");

    if (quietSettings?.enabled && quietSettings?.breathingSpaceEnabled) {
      // Send reminder to active tabs
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "BREATHING_REMINDER",
          interval: quietSettings.breathingInterval,
        });
      }
    }
  }
});

// Track time spent on sites
let activeTabId = null;
let activeSite = null;
let startTime = null;

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await updateTimeSpent();

  const tab = await chrome.tabs.get(activeInfo.tabId);
  activeTabId = activeInfo.tabId;
  activeSite = getSiteFromUrl(tab.url);
  startTime = Date.now();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    await updateTimeSpent();
    activeSite = getSiteFromUrl(changeInfo.url);
    startTime = Date.now();
  }
});

async function updateTimeSpent() {
  if (activeSite && startTime) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const { quietSettings } = await chrome.storage.sync.get("quietSettings");

    if (quietSettings?.trackedSites[activeSite]) {
      quietSettings.trackedSites[activeSite].timeSpent += elapsed;
      await chrome.storage.sync.set({ quietSettings });
    }
  }
}

function getSiteFromUrl(url) {
  if (!url) return null;
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("facebook.com")) return "facebook";
  if (url.includes("youtube.com")) return "youtube";
  if (url.includes("reddit.com")) return "reddit";
  return null;
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_SETTINGS") {
    chrome.storage.sync.get("quietSettings", (data) => {
      sendResponse(data.quietSettings || defaultSettings);
    });
    return true;
  }

  if (request.type === "UPDATE_SETTINGS") {
    chrome.storage.sync.set({ quietSettings: request.settings }, () => {
      // Notify all content scripts to update
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, {
            type: "SETTINGS_UPDATED",
            settings: request.settings,
          });
        });
      });
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.type === "PLAY_SOUND") {
    // Forward to content script of active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "PLAY_SOUND",
          sound: request.sound,
        });
      }
    });
    sendResponse({ success: true });
    return true;
  }

  if (request.type === "LOG_INTERACTION") {
    console.log(`Interaction logged: ${request.site} - ${request.duration}`);
    sendResponse({ success: true });
    return true;
  }
});
