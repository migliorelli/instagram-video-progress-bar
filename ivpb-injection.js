const FEED_VIDEOS_SELECTORS = "main[role=main] article video";
const REELS_VIDEOS_SELECTORS = "main[role=main] video";
const POST_VIDEOS_SELECTOR = "main[role=main] video";
const VIDEO_INFOS_SELECTORS =
  "div > div > div > div > div:nth-of-type(2) > div";
const VIDEO_SOUND_BTN_SELECTORS = "div[role=button] :has(svg) div";

class InstagramVideoProgressBar {
  /** @type {MutationObserver} */
  observer = null;

  initialize() {
    console.log("Instagram Video Progress Bar intialized!");
    this.handleUrlChanges();
    this.initializeObserver();
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
    } else if (this.isReelPost()) {
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

  isReelPost() {
    return document.location.pathname.includes("/reel");
  }

  isPostPage() {
    return document.location.pathname.includes("/p");
  }

  addVideoProgressBar(videoEl, deleteOverlay = true) {
    if (videoEl && !videoEl.hasAttribute("data-processed")) {
      videoEl.controls = true;

      if (deleteOverlay) {
        const videoOverlay = videoEl.nextElementSibling;
        if (videoOverlay) videoOverlay.remove();
      }

      videoEl.setAttribute("data-processed", "true");
    }
  }

  handleNewVideos(selectors) {
    const elements = document.querySelectorAll(selectors);
    elements.forEach((videoEl) => this.addVideoProgressBar(videoEl));
  }

  editReelOverlay(videoEl) {
    if (videoEl.hasAttribute("data-processed")) {
      return;
    }

    const overlay = videoEl.nextElementSibling;
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

    overlay.remove();
    videoEl.setAttribute("data-processed", "true");
  }

  handleReels() {
    const videos = document.querySelectorAll(REELS_VIDEOS_SELECTORS);

    videos.forEach((videoEl) => {
      this.addVideoProgressBar(videoEl, false);
      this.editReelOverlay(videoEl);
    });
  }

  handleFeed() {
    this.handleNewVideos(FEED_VIDEOS_SELECTORS);
  }

  handlePost() {
    this.handleNewVideos(POST_VIDEOS_SELECTOR);
  }

  handleReelPost() {
    this.handleNewVideos(POST_VIDEOS_SELECTOR);
  }
}

window.addEventListener("load", () => {
  const IVP = new InstagramVideoProgressBar();
  IVP.initialize();
});
