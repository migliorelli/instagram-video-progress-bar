const FEED_VIDEOS_SELECTORS = "main[role=main] article video";
const REELS_VIDEOS_SELECTORS = "main[role=main] video";
const POST_VIDEO_SELECTORS = "main[role=main] video";
const POST_MODAL_VIDEO_SELECTORS = "article[role=presentation] video";
const VIDEO_INFOS_SELECTORS =
  "div > div > div > div > div:nth-of-type(2) > div";
const VIDEO_SOUND_BTN_SELECTORS = "div[role=button]:has(> svg)";
const VIDEO_POST_SOUND_BTN_SELECTORS = "div:has(> button)";

class InstagramVideoProgressBar {
  /** @type {MutationObserver} */
  observer = null;

  start() {
    this.handleUrlChanges();
    this.initializeObserver();
    console.log("Instagram Video Progress Bar started!");
  }

  stop() {
    this.observer.disconnect();
    this.observer = null;
    this.removeControls();
    console.log("Instagram Video Progress Bar stoped!");
  }

  handleUrlChanges() {
    let lastUrl = location.href;

    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        console.log("URL changed:", url);
        this.initializeObserver();
      }
    }).observe(document, { subtree: true, childList: true });
  }

  initializeObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          this.handleNewContent();
        }
      });
    });

    const observerConfig = {
      childList: true,
      subtree: true,
    };

    this.waitForContent().then((container) => {
      this.observer.observe(container, observerConfig);
      this.handleNewContent();
    });
  }

  async waitForContent() {
    return new Promise((resolve) => {
      const checkContent = () => {
        const container = document.querySelector("main[role=main]");
        if (container) {
          resolve(container);
        } else {
          setTimeout(checkContent, 1000);
        }
      };
      checkContent();
    });
  }

  handleNewContent() {
    if (this.isReelsPage()) {
      this.handleReels();
    } else if (this.isReelPostPage()) {
      this.handleReelPost();
    } else if (this.isPostPage()) {
      this.handlePost();
    } else {
      this.handleFeed();
    }
  }

  isReelsPage() {
    return document.location.pathname.includes("/reels");
  }

  isReelPostPage() {
    return document.location.pathname.includes("/reel");
  }

  isPostPage() {
    return document.location.pathname.includes("/p");
  }

  isPostModal() {
    if (this.isPostPage()) {
      const postArticle = document.querySelector("article[role=presentation]");
      const isModal = Boolean(postArticle);

      return isModal;
    }

    return false;
  }

  toggleControls(showControls, videoEl, editOverlay = true) {
    const wasProcessed = videoEl.hasAttribute("data-controls-processed");

    if (showControls) {
      if (videoEl && !wasProcessed) {
        videoEl.controls = true;

        if (editOverlay) {
          const overlay = videoEl.nextElementSibling;
          const wasResetProcessedOnce = videoEl.hasAttribute(
            "data-reset-processed-once"
          );

          if (!wasResetProcessedOnce) {
            const soundBtn = overlay.querySelector(
              VIDEO_POST_SOUND_BTN_SELECTORS
            );

            const parent = videoEl.parentElement;
            parent.style.position = "relative";

            parent.appendChild(soundBtn);

            soundBtn.style.position = "absolute";
            soundBtn.style.left = "16px";
            soundBtn.style.right = "unset";
            soundBtn.style.top = "16px";
          }

          // overlay.remove();
          overlay.style.display = "none";
        }

        videoEl.setAttribute("data-controls-processed", "true");
        videoEl.removeAttribute("data-reset-processed");
      }
    } else {
      const wasReseted = videoEl.hasAttribute("data-reset-processed");

      if (videoEl && wasProcessed && !wasReseted) {
        videoEl.controls = false;
        const overlay = videoEl.nextElementSibling;
        overlay.style.display = "block";

        videoEl.setAttribute("data-reset-processed", "true");
        videoEl.setAttribute("data-reset-processed-once", "true");
        videoEl.removeAttribute("data-controls-processed");
      }
    }
  }

  handleNewVideos(selectors) {
    const elements = document.querySelectorAll(selectors);
    elements.forEach((videoEl) => this.toggleControls(true, videoEl));
  }

  editReelOverlay(videoEl) {
    const wasOverlayProcessed = videoEl.hasAttribute("data-reel-overlay-processed");

    if (videoEl && !wasOverlayProcessed) {
      const overlay = videoEl.nextElementSibling;
      const wasResetProcessedOnce = videoEl.hasAttribute(
        "data-reset-processed-once"
      );

      if (!wasResetProcessedOnce) {
        const soundBtn = overlay.querySelector(VIDEO_SOUND_BTN_SELECTORS);
        const infos = overlay.querySelector(VIDEO_INFOS_SELECTORS);

        const parent = videoEl.parentElement;
        parent.style.position = "relative";

        parent.appendChild(soundBtn);
        parent.appendChild(infos);

        soundBtn.style.position = "absolute";
        soundBtn.style.right = "16px";
        soundBtn.style.top = "16px";

        infos.style.position = "absolute";
        infos.style.left = "16px";
        infos.style.bottom = "80px";
        infos.style.width = `${parent.clientWidth - 32}px`;
      }

      // overlay.remove();
      overlay.style.display = "none";
      videoEl.removeAttribute("data-reset-processed");
      videoEl.setAttribute("data-reel-overlay-processed", "true");
    }
  }

  handleReels() {
    const videos = document.querySelectorAll(REELS_VIDEOS_SELECTORS);

    videos.forEach((videoEl) => {
      this.toggleControls(true, videoEl, false);
      this.editReelOverlay(videoEl);
    });
  }

  handleFeed() {
    this.handleNewVideos(FEED_VIDEOS_SELECTORS);
  }

  handlePost() {
    const selectors = this.isPostModal()
      ? POST_MODAL_VIDEO_SELECTORS
      : POST_VIDEO_SELECTORS;

    this.handleNewVideos(selectors);
  }

  handleReelPost() {
    this.handleNewVideos(POST_VIDEO_SELECTORS);
  }

  removeControls() {
    const videos = document.querySelectorAll("video");
    videos.forEach((video) => this.toggleControls(false, video));
  }
}

window.addEventListener("load", () => {
  let enabled = true;
  const app = new InstagramVideoProgressBar();

  chrome.storage.local.get("enabled", (data) => {
    enabled = data.enabled ?? true;

    if (data.enabled) {
      app.start();
    }
  });

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action == "toggleControls") {
      enabled = request.enabled ?? true;

      if (enabled) {
        app.start();
      } else {
        app.stop();
      }
    }
  });
});
