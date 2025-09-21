/**
 * Browser Detection System
 * Cross-browser compatibility için tarayıcı tespiti
 */

class BrowserDetector {
  constructor() {
    this.browser = this.detectBrowser();
    this.version = this.detectVersion();
    this.isSupported = this.checkSupport();
  }

  /**
   * Tarayıcı türünü tespit et
   */
  detectBrowser() {
    const userAgent = navigator.userAgent.toLowerCase();

    // Chrome detection
    if (userAgent.includes("chrome") && !userAgent.includes("edg")) {
      return "chrome";
    }

    // Firefox detection
    if (userAgent.includes("firefox")) {
      return "firefox";
    }

    // Edge detection
    if (userAgent.includes("edg")) {
      return "edge";
    }

    // Safari detection
    if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
      return "safari";
    }

    // Opera detection
    if (userAgent.includes("opr") || userAgent.includes("opera")) {
      return "opera";
    }

    // Brave detection
    if (navigator.brave && typeof navigator.brave.isBrave === "function") {
      return "brave";
    }

    return "unknown";
  }

  /**
   * Tarayıcı versiyonunu tespit et
   */
  detectVersion() {
    const userAgent = navigator.userAgent;

    switch (this.browser) {
      case "chrome":
        const chromeMatch = userAgent.match(/chrome\/(\d+)/);
        return chromeMatch ? parseInt(chromeMatch[1]) : null;

      case "firefox":
        const firefoxMatch = userAgent.match(/firefox\/(\d+)/);
        return firefoxMatch ? parseInt(firefoxMatch[1]) : null;

      case "edge":
        const edgeMatch = userAgent.match(/edg\/(\d+)/);
        return edgeMatch ? parseInt(edgeMatch[1]) : null;

      case "safari":
        const safariMatch = userAgent.match(/version\/(\d+)/);
        return safariMatch ? parseInt(safariMatch[1]) : null;

      case "opera":
        const operaMatch = userAgent.match(/(?:opr|opera)\/(\d+)/);
        return operaMatch ? parseInt(operaMatch[1]) : null;

      default:
        return null;
    }
  }

  /**
   * Tarayıcı desteğini kontrol et
   */
  checkSupport() {
    const supportMatrix = {
      chrome: { minVersion: 88 },
      firefox: { minVersion: 78 },
      edge: { minVersion: 88 },
      safari: { minVersion: 14 },
      opera: { minVersion: 74 },
      brave: { minVersion: 88 },
    };

    const browserSupport = supportMatrix[this.browser];
    if (!browserSupport) {
      return false;
    }

    return this.version >= browserSupport.minVersion;
  }

  /**
   * Manifest versiyonunu döndür
   */
  getManifestVersion() {
    switch (this.browser) {
      case "chrome":
      case "edge":
      case "brave":
        return 3;
      case "firefox":
        return 2;
      case "safari":
        return 3; // Safari Web Extensions
      case "opera":
        return 3;
      default:
        return 3;
    }
  }

  /**
   * API uyumluluğunu kontrol et
   */
  checkAPICompatibility() {
    const apis = {
      chrome: {
        storage: typeof chrome !== "undefined" && chrome.storage,
        runtime: typeof chrome !== "undefined" && chrome.runtime,
        tabs: typeof chrome !== "undefined" && chrome.tabs,
        contextMenus: typeof chrome !== "undefined" && chrome.contextMenus,
        scripting: typeof chrome !== "undefined" && chrome.scripting,
      },
      firefox: {
        storage: typeof browser !== "undefined" && browser.storage,
        runtime: typeof browser !== "undefined" && browser.runtime,
        tabs: typeof browser !== "undefined" && browser.tabs,
        contextMenus: typeof browser !== "undefined" && browser.contextMenus,
      },
    };

    return apis[this.browser] || apis.chrome;
  }

  /**
   * Tarayıcı bilgilerini döndür
   */
  getInfo() {
    return {
      browser: this.browser,
      version: this.version,
      isSupported: this.isSupported,
      manifestVersion: this.getManifestVersion(),
      userAgent: navigator.userAgent,
      apis: this.checkAPICompatibility(),
    };
  }

  /**
   * Desteklenmeyen tarayıcı için uyarı göster
   */
  showUnsupportedWarning() {
    if (!this.isSupported) {
      console.warn(
        `Gemini Translate: ${this.browser} ${this.version} desteklenmiyor. Minimum versiyon gerekli.`,
      );

      // Kullanıcıya bildirim göster
      if (typeof chrome !== "undefined" && chrome.notifications) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "assets/icons/icon48.png",
          title: "Gemini Translate",
          message: `Tarayıcınız desteklenmiyor. Güncel versiyon kullanın.`,
        });
      }
    }
  }
}

// Global instance oluştur
window.browserDetector = new BrowserDetector();

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = BrowserDetector;
}

// Export for ES6 modules
if (typeof window !== "undefined") {
  window.BrowserDetector = BrowserDetector;
}
