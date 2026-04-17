// Popup script for Quiet Interface

let currentSettings = null;

// Load settings on popup open
document.addEventListener("DOMContentLoaded", async () => {
  const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
  currentSettings = response;

  // Initialize UI with settings
  initializeUI();

  // Load stats
  loadStats();
});

function initializeUI() {
  // Main toggle
  const enabledToggle = document.getElementById("enabledToggle");
  enabledToggle.checked = currentSettings?.enabled || false;
  enabledToggle.addEventListener("change", updateSettings);

  // Scroll settings
  const scrollToggle = document.getElementById("scrollBlockToggle");
  if (scrollToggle) {
    scrollToggle.checked = currentSettings?.scrollBlockEnabled || false;
    scrollToggle.addEventListener("change", updateSettings);
  }

  // Notification settings
  const notificationToggle = document.getElementById("notificationBlockToggle");
  if (notificationToggle) {
    notificationToggle.checked =
      currentSettings?.notificationBlockEnabled || false;
    notificationToggle.addEventListener("change", updateSettings);
  }

  // Breathing settings
  const breathingToggle = document.getElementById("breathingToggle");
  if (breathingToggle) {
    breathingToggle.checked = currentSettings?.breathingSpaceEnabled || false;
    breathingToggle.addEventListener("change", updateSettings);
  }

  const breathingInterval = document.getElementById("breathingInterval");
  if (breathingInterval) {
    breathingInterval.value = currentSettings?.breathingInterval || 15;
    breathingInterval.addEventListener("change", updateSettings);
  }

  // Sound settings
  const soundSelect = document.getElementById("selectedSound");
  if (soundSelect) {
    soundSelect.value = currentSettings?.selectedSound || "gentle-chime";
    soundSelect.addEventListener("change", updateSettings);
  }

  const volumeSlider = document.getElementById("soundVolume");
  if (volumeSlider) {
    volumeSlider.value = (currentSettings?.soundVolume || 0.3) * 100;
    volumeSlider.addEventListener("input", (e) => {
      const volume = parseInt(e.target.value) / 100;
      document.getElementById("volumeValue").textContent = `${e.target.value}%`;
      updateSettings({ soundVolume: volume });
    });
  }

  // Section toggle functionality
  document.querySelectorAll(".section-header").forEach((header) => {
    header.addEventListener("click", () => {
      const content = header.nextElementSibling;
      if (content) {
        const isVisible = content.style.display !== "none";
        content.style.display = isVisible ? "none" : "block";
        header.querySelector("span:last-child").textContent = isVisible
          ? "▼"
          : "▲";
      }
    });
  });
}

function updateSettings(changes = {}) {
  // Get all current settings from UI
  const newSettings = {
    enabled:
      document.getElementById("enabledToggle")?.checked ??
      currentSettings?.enabled,
    scrollBlockEnabled:
      document.getElementById("scrollBlockToggle")?.checked ??
      currentSettings?.scrollBlockEnabled,
    notificationBlockEnabled:
      document.getElementById("notificationBlockToggle")?.checked ??
      currentSettings?.notificationBlockEnabled,
    breathingSpaceEnabled:
      document.getElementById("breathingToggle")?.checked ??
      currentSettings?.breathingSpaceEnabled,
    breathingInterval:
      parseInt(document.getElementById("breathingInterval")?.value) ??
      currentSettings?.breathingInterval,
    selectedSound:
      document.getElementById("selectedSound")?.value ??
      currentSettings?.selectedSound,
    soundVolume:
      parseInt(document.getElementById("soundVolume")?.value) / 100 ??
      currentSettings?.soundVolume,
    trackedSites: currentSettings?.trackedSites,
  };

  // Merge with any direct changes
  Object.assign(newSettings, changes);

  // Send to background
  chrome.runtime.sendMessage(
    { type: "UPDATE_SETTINGS", settings: newSettings },
    (response) => {
      if (response?.success) {
        currentSettings = newSettings;
      }
    },
  );
}

async function loadStats() {
  const { quietSettings } = await chrome.storage.sync.get("quietSettings");
  if (quietSettings?.trackedSites) {
    let totalToday = 0;
    for (const site in quietSettings.trackedSites) {
      totalToday += quietSettings.trackedSites[site].timeSpent || 0;
    }
    const minutesToday = Math.floor(totalToday / 60);
    document.getElementById("todayTime").textContent = minutesToday;
  }

  // Load pauses count from local storage
  chrome.storage.local.get(["pausesCount"], (result) => {
    document.getElementById("pausesCount").textContent =
      result.pausesCount || 0;
  });
}
