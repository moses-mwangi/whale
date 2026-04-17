// Content script - Injects into web pages

let settings = null;
let observer = null;
let scrollTimeout = null;
let lastScrollPosition = 0;

// Initialize
(async function init() {
  const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
  settings = response;

  if (settings?.enabled) {
    applyModifications();
  }
})();

// Listen for settings updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SETTINGS_UPDATED") {
    settings = request.settings;
    if (settings.enabled) {
      applyModifications();
    } else {
      removeModifications();
    }
  }

  if (request.type === "PLAY_SOUND") {
    playAmbientSound(request.sound);
  }

  if (request.type === "BREATHING_REMINDER") {
    showBreathingSpace(request.interval);
  }
});

// Apply all modifications
function applyModifications() {
  if (settings.scrollBlockEnabled) {
    blockInfiniteScroll();
  }

  if (settings.notificationBlockEnabled) {
    blockNotifications();
  }

  if (settings.breathingSpaceEnabled) {
    addBreathingObserver();
  }

  injectQuietStyles();
}

// Remove all modifications
function removeModifications() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  // Remove injected elements
  document
    .querySelectorAll(".quiet-interface-overlay")
    .forEach((el) => el.remove());
  document
    .querySelectorAll(".quiet-breathing-space")
    .forEach((el) => el.remove());
}

// BLOCK INFINITE SCROLL
function blockInfiniteScroll() {
  // Method 1: Intercept scroll events
  window.addEventListener("scroll", handleScroll, { passive: false });

  // Method 2: Watch for DOM mutations (new content loading)
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // Check if this is likely infinite scroll content
        const isInfiniteScrollContent = checkForInfiniteScrollPattern(mutation);
        if (isInfiniteScrollContent) {
          // Remove the new content
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && isScrollContent(node)) {
              node.remove();
              showPaginationPrompt();
            }
          });
        }
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function handleScroll() {
  if (!settings.scrollBlockEnabled) return;

  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    const scrollPosition = window.scrollY + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;

    // If user is near bottom (potential infinite scroll trigger)
    if (scrollPosition > pageHeight - 500) {
      // Show pagination prompt instead of auto-loading
      showPaginationPrompt();

      // Scroll back up slightly
      window.scrollTo({
        top: window.scrollY - 100,
        behavior: "smooth",
      });
    }
  }, 100);
}

function checkForInfiniteScrollPattern(mutation) {
  // Check for common infinite scroll patterns
  const patterns = [
    "load-more",
    "infinite-scroll",
    "next-page",
    "scroll-loader",
    "loadMore",
    "pagination-loader",
    "stream-content",
  ];

  for (const node of mutation.addedNodes) {
    if (node.nodeType === 1) {
      const className = node.className?.toString() || "";
      const id = node.id || "";

      for (const pattern of patterns) {
        if (className.includes(pattern) || id.includes(pattern)) {
          return true;
        }
      }
    }
  }
  return false;
}

function isScrollContent(node) {
  // Heuristic: new content that appears after scroll is likely infinite scroll
  const rect = node.getBoundingClientRect();
  return rect.top > window.innerHeight * 0.8;
}

function showPaginationPrompt() {
  // Check if prompt already exists
  if (document.querySelector(".quiet-pagination-prompt")) return;

  const prompt = document.createElement("div");
  prompt.className = "quiet-pagination-prompt quiet-interface-overlay";
  prompt.innerHTML = `
    <div class="quiet-prompt-content">
      <div class="quiet-prompt-icon">🌿</div>
      <div class="quiet-prompt-text">You've reached a natural pause.</div>
      <div class="quiet-prompt-subtext">Would you like to continue or take a moment?</div>
      <div class="quiet-prompt-buttons">
        <button class="quiet-btn quiet-btn-continue">Continue →</button>
        <button class="quiet-btn quiet-btn-pause">Take a breath</button>
      </div>
    </div>
  `;

  prompt.querySelector(".quiet-btn-continue")?.addEventListener("click", () => {
    prompt.remove();
    // Log intentional choice
    chrome.runtime.sendMessage({
      type: "LOG_INTERACTION",
      site: window.location.hostname,
      duration: "continued",
    });
  });

  prompt.querySelector(".quiet-btn-pause")?.addEventListener("click", () => {
    prompt.remove();
    showBreathingSpace(1);
    chrome.runtime.sendMessage({
      type: "LOG_INTERACTION",
      site: window.location.hostname,
      duration: "paused",
    });
  });

  document.body.appendChild(prompt);

  // Play gentle sound
  playAmbientSound("gentle-chime");
}

// BLOCK NOTIFICATIONS
function blockNotifications() {
  // Remove existing notification elements
  const removeNotifications = () => {
    const selectors = [
      '[role="notification"]',
      ".notification",
      ".alert",
      ".toast",
      '[data-testid="notification"]',
      ".Notice",
      ".notification-bell",
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (isNotificationElement(el)) {
          replaceWithAmbientIndicator(el);
        }
      });
    });
  };

  // Watch for new notifications
  const notificationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && isNotificationElement(node)) {
          replaceWithAmbientIndicator(node);
        }
      });
    });
  });

  notificationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial cleanup
  removeNotifications();
  setInterval(removeNotifications, 2000);
}

function isNotificationElement(element) {
  const text = element.textContent?.toLowerCase() || "";
  const notificationKeywords = [
    "notification",
    "alert",
    "new",
    "update",
    "message",
    "like",
    "follow",
  ];

  for (const keyword of notificationKeywords) {
    if (text.includes(keyword) && element.children.length < 3) {
      return true;
    }
  }
  return false;
}

function replaceWithAmbientIndicator(notificationElement) {
  // Don't replace if already replaced
  if (notificationElement.hasAttribute("data-quiet-replaced")) return;

  const indicator = document.createElement("div");
  indicator.className = "quiet-ambient-indicator quiet-interface-overlay";
  indicator.setAttribute("data-quiet-replaced", "true");
  indicator.innerHTML = `
    <div class="quiet-ambient-dot"></div>
    <div class="quiet-ambient-message">✨ ambient presence</div>
  `;

  notificationElement.style.display = "none";
  notificationElement.parentNode?.insertBefore(indicator, notificationElement);

  // Play ambient sound
  playAmbientSound("gentle-chime");

  // Remove indicator after a few seconds
  setTimeout(() => {
    indicator.remove();
    notificationElement.style.display = "";
  }, 3000);
}

// BREATHING SPACE
function showBreathingSpace(minutes = 1) {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "quiet-breathing-space quiet-interface-overlay";
  overlay.innerHTML = `
    <div class="quiet-breathing-content">
      <div class="quiet-breathing-animation">
        <div class="quiet-breathing-circle"></div>
      </div>
      <div class="quiet-breathing-text">Breathe in...</div>
      <div class="quiet-breathing-timer">${minutes}:00</div>
      <button class="quiet-breathing-skip">Skip</button>
    </div>
  `;

  document.body.appendChild(overlay);

  let timeLeft = minutes * 60;
  const timerElement = overlay.querySelector(".quiet-breathing-timer");
  const textElement = overlay.querySelector(".quiet-breathing-text");
  const circleElement = overlay.querySelector(".quiet-breathing-circle");

  // Breathing animation
  const breathePhases = [
    { text: "Breathe in...", duration: 4, scale: 1.5 },
    { text: "Hold...", duration: 4, scale: 1.5 },
    { text: "Breathe out...", duration: 4, scale: 1 },
    { text: "Rest...", duration: 2, scale: 1 },
  ];

  let phaseIndex = 0;

  function updateBreathing() {
    const phase = breathePhases[phaseIndex];
    textElement.textContent = phase.text;

    circleElement.style.transform = `scale(${phase.scale})`;
    circleElement.style.transition = `transform ${phase.duration}s ease-in-out`;

    phaseIndex = (phaseIndex + 1) % breathePhases.length;
  }

  const breathingInterval = setInterval(updateBreathing, 14000);
  updateBreathing();

  // Timer countdown
  const timerInterval = setInterval(() => {
    timeLeft--;
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    timerElement.textContent = `${mins}:${secs.toString().padStart(2, "0")}`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      clearInterval(breathingInterval);
      overlay.remove();
    }
  }, 1000);

  // Skip button
  overlay
    .querySelector(".quiet-breathing-skip")
    ?.addEventListener("click", () => {
      clearInterval(timerInterval);
      clearInterval(breathingInterval);
      overlay.remove();
    });

  // Play ambient sound
  playAmbientSound("water-drop");
}

function addBreathingObserver() {
  // Observe user activity to suggest breathing breaks
  let lastActivity = Date.now();
  let warningShown = false;

  const activityHandler = () => {
    lastActivity = Date.now();
    warningShown = false;
  };

  window.addEventListener("scroll", activityHandler);
  window.addEventListener("click", activityHandler);
  window.addEventListener("keydown", activityHandler);

  setInterval(() => {
    const inactiveTime = (Date.now() - lastActivity) / 1000 / 60;
    if (
      inactiveTime > settings.breathingInterval &&
      !warningShown &&
      settings.breathingSpaceEnabled
    ) {
      warningShown = true;
      showSubtleReminder();
    }
  }, 60000);
}

function showSubtleReminder() {
  const reminder = document.createElement("div");
  reminder.className = "quiet-subtle-reminder quiet-interface-overlay";
  reminder.innerHTML = `
    <div class="quiet-reminder-content">
      <span>🌿</span>
      <span>Take a breath?</span>
      <button>Later</button>
    </div>
  `;

  reminder.querySelector("button")?.addEventListener("click", () => {
    reminder.remove();
  });

  reminder.addEventListener("click", () => {
    reminder.remove();
    showBreathingSpace(1);
  });

  document.body.appendChild(reminder);

  setTimeout(() => {
    if (document.body.contains(reminder)) {
      reminder.remove();
    }
  }, 10000);
}

// AMBIENT SOUNDS
function playAmbientSound(soundName) {
  const audio = new Audio(chrome.runtime.getURL(`sounds/${soundName}.mp3`));
  audio.volume = settings?.soundVolume || 0.3;
  audio.play().catch((e) => console.log("Audio play failed:", e));
}

// INJECT STYLES
function injectQuietStyles() {
  if (document.querySelector("#quiet-interface-styles")) return;

  const style = document.createElement("link");
  style.id = "quiet-interface-styles";
  style.rel = "stylesheet";
  style.href = chrome.runtime.getURL("quiet-styles.css");
  document.head.appendChild(style);
}

// Generate ambient sounds using Web Audio API (no external files needed)
function generateAmbientSound(type) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const now = audioContext.currentTime;

  switch (type) {
    case "gentle-chime":
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.frequency.value = 440;
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 1.5);
      oscillator.start();
      oscillator.stop(now + 1.5);
      break;

    case "water-drop":
      const buffer = audioContext.createBuffer(
        1,
        audioContext.sampleRate * 0.3,
        audioContext.sampleRate,
      );
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] =
          Math.sin(i * 0.05) * Math.exp(-i / (audioContext.sampleRate * 0.1));
      }
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
      break;
  }
}
