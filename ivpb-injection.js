/** @const {String} Selectors for the feed videos */
const FEED_VIDEOS_SELECTORS = "main[role=main] article video";

/** @const {String} Selectors for the reels videos */
const REELS_VIDEOS_SELECTORS =
  "main[role=main] video, article[role=presentation] video";

/** @const {String} Selectors for normal post videos */
const POST_VIDEO_SELECTORS =
  "main[role=main] video, article[role=presentation] video";

/** @const {String} Selectors for the bottom overlay of the reels video */
const VIDEO_REELS_BOTTOM_OVERLAY_SELECTORS =
  "div > div > div > div > div:nth-of-type(2) > div";

/** @const {String} Selectors for the sound button of the reels video */
const VIDEO_REELS_SOUND_BTN_SELECTORS = "div[role=button]:has(> svg)";

/** @const {String} Selectors for the sound button of the post video */
const VIDEO_POST_SOUND_BTN_SELECTORS = "div:has(> button)";

/**
 * The application's main class, used to monitor page changes and dynamically add controls to videos.
 */
class InstagramVideoProgressBar {
  /** @type {MutationObserver|null} Page observer instance */
  pageObserver = null;

  /** @type {Number} Volume level for videos, used for consistent volume control */
  volume = 1;

  /**
   * Initializes the application and starts monitoring for video elements.
   */
  start() {
    this.handleURLChanges();
    this.initializeObserver();
    console.log("Instagram Video Progress Bar started!");
  }

  /**
   * Stops the application, disconnecting observers and removing custom video controls.
   */
  stop() {
    if (this.pageObserver) {
      this.pageObserver.disconnect();
      this.pageObserver = null;
    }
    this.removeControls();
    console.log("Instagram Video Progress Bar stopped!");
  }

  /**
   * Watches for URL changes and reinitializes observers when a page transition occurs.
   */
  handleURLChanges() {
    let lastUrl = location.href;

    /**
     * Callback function for detecting URL changes.
     */
    const urlObserverCallback = () => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log("URL changed:", currentUrl);
        this.initializeObserver();
      }
    };

    const urlObserver = new MutationObserver(urlObserverCallback);
    urlObserver.observe(document, { subtree: true, childList: true });
  }

  /**
   * Initializes the page observer to watch for DOM changes and process new video elements.
   */
  initializeObserver() {
    if (this.pageObserver) {
      this.pageObserver.disconnect();
    }

    /**
     * Callback function for the page observer, handling new nodes.
     */
    const pageObserverCallback = (mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          this.handleNewContent();
        }
      });
    };

    this.pageObserver = new MutationObserver(pageObserverCallback);

    const observerConfig = {
      childList: true,
      subtree: true,
    };

    this.waitForContainer().then((container) => {
      this.pageObserver.observe(container, observerConfig);
      this.handleNewContent();
    });
  }

  /**
   * Waits for the main container element to be available in the DOM.
   *
   * @returns {Promise<HTMLDivElement>} Promise resolving to the container element.
   */
  async waitForContainer() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 30; // Retry up to 30 seconds

      /** Checks for the container element every second. */
      const checkContainer = () => {
        const container = document.querySelector(`div[id*="mount"]`);

        if (container) {
          resolve(container);
        } else if (attempts >= maxAttempts) {
          reject(new Error("Timeout waiting for main container"));
        } else {
          attempts++;
          setTimeout(checkContainer, 1000);
        }
      };

      checkContainer();
    });
  }

  /**
   * Determines the page type and applies the appropriate video processing logic.
   */
  handleNewContent() {
    if (this.isStories()) {
      this.handleStories();
    } else if (this.isReelsPage()) {
      this.handleReels();
    } else if (this.isReelPostPage()) {
      this.handleReelPost();
    } else if (this.isPostPage()) {
      this.handlePost();
    } else {
      this.handleFeed();
    }
  }

  /**
   * Checks if the current page is a Reels page by inspecting the URL.
   *
   * @returns {Boolean} True if the page is a Reels page.
   */
  isReelsPage() {
    return document.location.pathname.includes("/reels");
  }

  /**
   * Checks if the current page is a Reel Post page by inspecting the URL.
   *
   * @returns {Boolean} True if the page is a Reel Post page.
   */
  isReelPostPage() {
    return document.location.pathname.includes("/reel");
  }

  /**
   * Checks if the current page is a Post page by inspecting the URL.
   *
   * @returns {Boolean} True if the page is a Post page.
   */
  isPostPage() {
    return document.location.pathname.includes("/p");
  }

  /**
   * Checks if the current page is a Stories page by inspecting the URL.
   *
   * @returns {Boolean} True if the page is a Stories page.
   */
  isStories() {
    return document.location.pathname.includes("/stories");
  }

  /**
   * Processes a given video element by adding controls and handling overlays and volume.
   *
   * @param {Boolean} showControls Whether to display video controls.
   * @param {HTMLVideoElement} videoEl The video element to process.
   * @param {Boolean} editOverlay Whether to edit the overlay (default: true).
   */
  processVideo(showControls, videoEl, editOverlay = true) {
    if (!videoEl) return;

    if (videoEl.volume !== this.volume) {
      videoEl.volume = this.volume;
    }

    if (showControls) {
      const wasProcessed = videoEl.hasAttribute("data-controls-processed");
      if (!wasProcessed) {
        videoEl.controls = true;
        this.setupVideoListeners(videoEl);

        if (editOverlay) {
          const overlay = videoEl.nextElementSibling;
          if (overlay) {
            overlay.style.display = "none";
          }
        }

        videoEl.setAttribute("data-controls-processed", "true");
        videoEl.removeAttribute("data-reset-processed");
      }
    } else {
      const wasReseted = videoEl.hasAttribute("data-reset-processed");
      if (!wasReseted) {
        videoEl.controls = false;
        const overlay = videoEl.nextElementSibling;
        if (overlay) {
          overlay.style.display = "block";
        }

        videoEl.setAttribute("data-reset-processed", "true");
        videoEl.removeAttribute("data-controls-processed");
      }
    }
  }

  /**
   * Handles Stories videos, adjusting overlays and bottom controls positioning.
   *
   * @param {HTMLVideoElement} videoEl The video element to process.
   */
  processStories(videoEl) {
    if (!videoEl) return;

    if (videoEl.hasAttribute("data-stories-processed")) return;

    const overlay = videoEl.nextElementSibling;
    if (overlay) {
      overlay.style.display = "none";
    }

    // traverse up to find the bottom controls container
    let parentElement = videoEl;
    for (let i = 0; i < 10; i++) {
      if (parentElement) parentElement = parentElement.parentElement;
    }

    // move the bottom controls up if the it has a parent and it's parent has childrens
    const controlsContainer = parentElement?.nextElementSibling;
    if (controlsContainer && controlsContainer.children.length > 0) {
      const bottomControlsParent = controlsContainer.children[0];
      bottomControlsParent.style.backgroundImage =
        "linear-gradient(180deg, rgba(38, 38, 38, 0) 0%, rgba(38, 38, 38, .3) 25%)";

      const bottomControls = bottomControlsParent.children[0];
      bottomControls.style.marginBottom = "60px";

      videoEl.setAttribute("data-stories-processed", "true");
    }
  }

  /**
   * Processes new videos found with the given selectors.
   *
   * @param {String} selectors CSS selectors for the videos to process.
   */
  handleNewVideos(selectors) {
    const elements = document.querySelectorAll(selectors);
    elements.forEach((videoEl) => this.processVideo(true, videoEl));
  }

  /**
   * Handles Reels videos, adjusting overlays and sound button positioning.
   */
  handleReels() {
    const videos = document.querySelectorAll(REELS_VIDEOS_SELECTORS);
    videos.forEach((videoEl) => {
      this.processVideo(true, videoEl, false);
      this.processReels(videoEl);
    });
  }

  /**
   * Handles feed videos by applying controls to all matching elements.
   */
  handleFeed() {
    this.handleNewVideos(FEED_VIDEOS_SELECTORS);
  }

  /**
   * Handles videos on post pages, applying controls as necessary.
   */
  handlePost() {
    this.handleNewVideos(POST_VIDEO_SELECTORS);
  }

  /**
   * Handles Stories videos specifically by applying appropriate controls and adjustments.
   */
  handleStories() {
    const videos = document.querySelectorAll("video");
    videos.forEach((videoEl) => {
      this.processVideo(true, videoEl, false);
      this.processStories(videoEl);
    });
  }

  /**
   * Handles videos on Reel Post pages.
   */
  handleReelPost() {
    this.handleNewVideos(POST_VIDEO_SELECTORS);
  }

  /**
   * Updates the volume for all videos on the page, excluding a specific video element if provided.
   *
   * @param {HTMLVideoElement|null} excludeVideo Video element to exclude from volume update.
   */
  updateAllVideosVolume(excludeVideo = null) {
    const videos = document.querySelectorAll("video");
    videos.forEach((video) => {
      if (video !== excludeVideo && video.volume !== this.volume) {
        video.volume = this.volume;
      }
    });
  }

  /**
   * Sets up listeners for volume change and playback events on a video element.
   *
   * @param {HTMLVideoElement} videoEl Video element to set up listeners for.
   */
  setupVideoListeners(videoEl) {
    const volumeChangeHandler = (e) => {
      if (e.target.volume !== this.volume) {
        this.volume = e.target.volume;
        chrome.storage.local.set({ volume: this.volume });
        this.updateAllVideosVolume(videoEl);
      }
    };

    const playHandler = () => {
      if (videoEl.volume !== this.volume) {
        videoEl.volume = this.volume;
      }
    };

    videoEl.addEventListener("volumechange", volumeChangeHandler);
    videoEl.addEventListener("play", playHandler);

    videoEl.dataset.handlers = JSON.stringify({
      volumechange: volumeChangeHandler,
      play: playHandler,
    });
  }

  /**
   * Removes custom controls from all videos and resets their settings.
   */
  removeControls() {
    const videos = document.querySelectorAll("video");
    videos.forEach((video) => {
      if (video.dataset.handlers) {
        const handlers = JSON.parse(video.dataset.handlers);
        Object.entries(handlers).forEach(([event, handler]) => {
          video.removeEventListener(event, handler);
        });
        delete video.dataset.handlers;
      }
      this.processVideo(false, video);
    });

    chrome.storage.local.set({ volume: 1 });
    this.volume = 1;
    this.updateAllVideosVolume();
  }
}
/**
 * Initializes the application and listens for messages to toggle controls.
 */
window.addEventListener("load", () => {
  let enabled = true;
  const app = new InstagramVideoProgressBar();

  // get from memory the volume value and if the app is enabled
  chrome.storage.local.get(["enabled", "volume"], (data) => {
    enabled = data.enabled ?? true;
    app.volume = data.volume ?? 1;

    if (enabled) {
      app.start();
    }
  });

  // watch for popup events to start or stop the app
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
