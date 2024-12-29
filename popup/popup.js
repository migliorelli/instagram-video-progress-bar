document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggleControls");

  chrome.storage.local.get("enabled", (data) => {
    toggle.checked = data.enabled ?? true;
  });

  toggle.addEventListener("change", () => {
    chrome.storage.local.set({ enabled: toggle.checked });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleControls",
        enabled: toggle.checked,
      });
    });
  });
});
