/**
 * Context Menu Handler
 * Content script'te context menu mesajlarını işler
 */

class ContextMenuHandler {
  constructor() {
    this.isInitialized = false;
    this.isEnabled = true;

    this.init();
  }

  /**
   * Context menu handler'ı başlat
   */
  async init() {
    try {
      // Cross-browser compatibility layer yükle
      await this.loadCompatibilityLayer();

      // Event listener'ları ekle
      this.attachEventListeners();

      this.isInitialized = true;
      console.log("Context menu handler başlatıldı");
    } catch (error) {
      console.error("Context menu handler başlatma hatası:", error);
    }
  }

  /**
   * Compatibility layer yükle
   */
  async loadCompatibilityLayer() {
    if (!window.compatibilityLayer) {
      // Browser detection
      const isFirefox = typeof browser !== "undefined" && browser.runtime;
      const isChrome = typeof chrome !== "undefined" && chrome.runtime;

      // API seçimi - Chrome öncelikli, Firefox fallback
      const api = isChrome ? chrome : isFirefox ? browser : chrome;

      window.compatibilityLayer = {
        runtime: api.runtime,
        storage: api.storage,
        contextMenus: api.contextMenus,
        tabs: api.tabs,
        scripting: api.scripting,
        isChrome: isChrome,
        isFirefox: isFirefox,
      };
    }
  }


  /**
   * Event listener'ları ekle
   */
  attachEventListeners() {
    const compatibilityLayer = window.compatibilityLayer || chrome;

    // Background script'ten gelen mesajları dinle
    compatibilityLayer.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });
  }

  /**
   * Mesaj işleyici
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case "SHOW_TRANSLATION_RESULT":
          await this.showTranslationResult(message.data);
          break;
        case "SHOW_LANGUAGE_DETECTION_RESULT":
          await this.showLanguageDetectionResult(message.data);
          break;
        case "SHOW_ERROR":
          await this.showError(message.data.message);
          break;
        default:
          // Diğer mesajları işleme
          break;
      }
    } catch (error) {
      console.error("Mesaj işleme hatası:", error);
    }
  }


  /**
   * Çeviri sonucunu göster
   */
  async showTranslationResult(translation) {
    try {
      // Instant translator'ı kullanarak sonucu göster
      if (window.contentScriptController && window.contentScriptController.instantTranslator) {
        window.contentScriptController.instantTranslator.showTranslationResult(translation);
      } else {
        console.warn("Instant translator mevcut değil");
      }
    } catch (error) {
      console.error("Çeviri sonucu gösterme hatası:", error);
    }
  }

  /**
   * Dil tespiti sonucunu göster
   */
  async showLanguageDetectionResult(language) {
    try {
      // Instant translator'ı kullanarak sonucu göster
      if (window.contentScriptController && window.contentScriptController.instantTranslator) {
        window.contentScriptController.instantTranslator.showLanguageDetectionResult(language);
      } else {
        console.warn("Instant translator mevcut değil");
      }
    } catch (error) {
      console.error("Dil tespiti sonucu gösterme hatası:", error);
    }
  }

  /**
   * Hata göster
   */
  async showError(message) {
    try {
      // Instant translator'ı kullanarak hatayı göster
      if (window.contentScriptController && window.contentScriptController.instantTranslator) {
        window.contentScriptController.instantTranslator.showError(message);
      } else {
        console.warn("Instant translator mevcut değil");
      }
    } catch (error) {
      console.error("Hata gösterme hatası:", error);
    }
  }

  /**
   * Context menu handler'ı etkinleştir/devre dışı bırak
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * Context menu handler'ı temizle
   */
  async destroy() {
    try {
      this.isInitialized = false;
    } catch (error) {
      console.error("Context menu handler temizleme hatası:", error);
    }
  }
}

// Export for different module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = ContextMenuHandler;
}

if (typeof window !== "undefined" && !window.ContextMenuHandler) {
  window.ContextMenuHandler = ContextMenuHandler;
}
