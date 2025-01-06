const FEED_VIDEOS_SELECTORS = "main[role=main] article video";
const REELS_VIDEOS_SELECTORS =
  "main[role=main] video, article[role=presentation] video";
const POST_VIDEO_SELECTORS =
  "main[role=main] video, article[role=presentation] video";
// const POST_MODAL_VIDEO_SELECTORS = "article[role=presentation] video";
const VIDEO_INFOS_SELECTORS =
  "div > div > div > div > div:nth-of-type(2) > div";
const VIDEO_SOUND_BTN_SELECTORS = "div[role=button]:has(> svg)";
const VIDEO_POST_SOUND_BTN_SELECTORS = "div:has(> button)";

class InstagramVideoProgressBar {
  /** @type {MutationObserver} */
  observer = null;
  volume = 1;

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

    const urlObserverCallback = () => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        console.log("URL changed:", url);
        this.initializeObserver();
      }
    };

    const urlObserver = new MutationObserver(urlObserverCallback);
    urlObserver.observe(document, { subtree: true, childList: true });
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
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 30; // 30 second timout

      const checkContent = () => {
        const container = document.querySelector(`div[id*="mount"]`);

        if (container) {
          resolve(container);
        } else if (attempts >= maxAttempts) {
          reject(new Error("Timeout waiting for main container"));
        } else {
          attempts++;
          setTimeout(checkContent, 1000);
        }
      };
      checkContent();
    });
  }

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

  isReelsPage() {
    return document.location.pathname.includes("/reels");
  }

  isReelPostPage() {
    return document.location.pathname.includes("/reel");
  }

  isPostPage() {
    return document.location.pathname.includes("/p");
  }

  isStories() {
    return document.location.pathname.includes("/stories");
  }

  isPostModal() {
    if (this.isPostPage()) {
      const postArticle = document.querySelector("article[role=presentation]");
      const isModal = Boolean(postArticle);

      return isModal;
    }

    return false;
  }

  processVideo(showControls, videoEl, editOverlay = true) {
    if (!videoEl) {
      return;
    }

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

  /**
   *
   * @param {HTMLVideoElement} videoEl
   */
  processStories(videoEl) {
    if (!videoEl) {
      return;
    }

    // check if stories have already been processed
    if (videoEl.hasAttribute("data-stories-processed")) {
      return;
    }

    // hide video overlay if exists
    const videoOverlay = videoEl.nextElementSibling;
    if (videoOverlay) {
      videoOverlay.style.display = "none";
    }

    // traverse up to find the bottom controls container
    let parentElement = videoEl;
    for (let i = 0; i < 10; i++) {
      if (parentElement) {
        parentElement = parentElement.parentElement;
      }
    }

    // validate controls container
    const controlsContainer = parentElement?.nextElementSibling;
    if (!controlsContainer || controlsContainer.children.length === 0) {
      return;
    }

    const bottomControls = controlsContainer.children[0];

    // adjust the position of the bottom controls
    if (bottomControls) {
      bottomControls.style.bottom = "80px";
      videoEl.setAttribute("data-stories-processed", "true");
    }
  }

  handleNewVideos(selectors) {
    const elements = document.querySelectorAll(selectors);
    elements.forEach((videoEl) => this.processVideo(true, videoEl));
  }

  processReels(videoEl) {
    const wasOverlayProcessed = videoEl.hasAttribute(
      "data-reel-overlay-processed"
    );

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
      this.processVideo(true, videoEl, false);
      this.processReels(videoEl);
    });
  }

  handleFeed() {
    this.handleNewVideos(FEED_VIDEOS_SELECTORS);
  }

  handlePost() {
    // const selectors = this.isPostModal()
    //   ? POST_MODAL_VIDEO_SELECTORS
    //   : POST_VIDEO_SELECTORS;

    this.handleNewVideos(POST_VIDEO_SELECTORS);
  }

  handleStories() {
    const videos = document.querySelectorAll("video");

    videos.forEach((videoEl) => {
      this.processVideo(true, videoEl, false);
      this.processStories(videoEl);
    });
  }

  handleReelPost() {
    this.handleNewVideos(POST_VIDEO_SELECTORS);
  }

  setVolume(volume) {
    this.volume = volume;
  }

  updateAllVideosVolume(excludeVideo = null) {
    const videos = document.querySelectorAll("video");
    videos.forEach((video) => {
      if (video !== excludeVideo && video.volume !== this.volume) {
        video.volume = this.volume;
      }
    });
  }

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

window.addEventListener("load", () => {
  let enabled = true;
  const app = new InstagramVideoProgressBar();

  chrome.storage.local.get(["enabled", "volume"], (data) => {
    enabled = data.enabled ?? true;
    app.setVolume(data.volume ?? 1);

    if (enabled) {
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
