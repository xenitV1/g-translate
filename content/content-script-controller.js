/**
 * Content Script Controller
 * Ana content script kontrolcüsü
 */

// Constants import (webpack ile bundle edilecek)
const APP_CONSTANTS = {
  MESSAGE_TYPES: {
    TRANSLATE_TEXT: "translate_text",
    DETECT_LANGUAGE: "detect_language",
    GET_HISTORY: "get_history",
    SAVE_HISTORY: "save_history",
    CLEAR_HISTORY: "clear_history",
    GET_SETTINGS: "get_settings",
    SAVE_SETTINGS: "save_settings",
    SHOW_NOTIFICATION: "show_notification",
    OPEN_POPUP: "open_popup",
    CLOSE_POPUP: "close_popup",
    GET_AVAILABLE_APIS: "get_available_apis",
    SWITCH_API: "switch_api",
    SET_API_KEY: "set_api_key",
    GET_CURRENT_API: "get_current_api",
  }
};

class ContentScriptController {
  constructor() {
    this.isInitialized = false;
    this.selectionHandler = null;
    this.instantTranslator = null;
    this.contextMenu = null;
    this.translationOverlay = null;
    this.isTranslating = false;
    this.currentSelection = null;

    this.init();
  }

  /**
   * Content script'i başlat
   */
  async init() {
    try {
      // Cross-browser compatibility layer yükle
      await this.loadCompatibilityLayer();

      // DOM hazır olana kadar bekle
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () =>
          this.initializeComponents(),
        );
      } else {
        this.initializeComponents();
      }
    } catch (error) {
      console.error("Content script başlatma hatası:", error);
    }
  }

  /**
   * Compatibility layer yükle
   */
  async loadCompatibilityLayer() {
    // Cross-browser compatibility için gerekli polyfill'ler
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
   * Extension context kontrolü
   */
  async checkExtensionContext() {
    const compatibilityLayer = window.compatibilityLayer || chrome;

    if (!compatibilityLayer || !compatibilityLayer.runtime) {
      throw new Error("Extension context invalidated");
    }

    if (!compatibilityLayer.runtime.id) {
      throw new Error("Extension context invalidated");
    }

    // Extension context'i kontrol et
    try {
      const contextValid = await this.testExtensionContext(compatibilityLayer);
      if (!contextValid) {
        throw new Error("Extension context invalidated");
      }
    } catch (error) {
      console.error("Extension context kontrolü hatası:", error);
      if (error.message.includes("Extension context invalidated") ||
          error.message.includes("context invalidated") ||
          error.message.includes("Could not establish connection")) {
        throw new Error("Extension context invalidated");
      }
      // Diğer hatalar için devam et (background henüz hazır olmayabilir)
    }
  }

  /**
   * Extension context'ini test et
   */
  async testExtensionContext(compatibilityLayer) {
    return new Promise((resolve) => {
      try {
        compatibilityLayer.runtime.sendMessage(
          { type: "EXTENSION_CONTEXT_TEST" },
          (response) => {
            // Chrome runtime error kontrolü
            if (chrome.runtime.lastError) {
              const errorMessage = chrome.runtime.lastError.message;
              if (errorMessage.includes("Extension context invalidated") ||
                  errorMessage.includes("Could not establish connection")) {
                resolve(false);
              } else {
                // Diğer hatalar için true döndür (background henüz hazır olmayabilir)
                resolve(true);
              }
            } else {
              resolve(true);
            }
          }
        );
      } catch (error) {
        resolve(false);
      }
    });
  }

  /**
   * Component'leri başlat
   */
  async initializeComponents() {
    if (this.isInitialized) return;

    try {
      // Extension context kontrolü
      await this.checkExtensionContext();

      // Selection handler'ı başlat (global olarak mevcut olmalı)
      if (typeof window !== "undefined" && window.SelectionHandler) {
        this.selectionHandler = new window.SelectionHandler();
      } else {
        console.warn("SelectionHandler not available");
      }

      // Instant translator'ı başlat (global olarak mevcut olmalı)
      console.log("ContentScriptController: InstantTranslator kontrol ediliyor", typeof window !== "undefined", !!window.InstantTranslator);
      if (typeof window !== "undefined" && window.InstantTranslator) {
        this.instantTranslator = new window.InstantTranslator();
        console.log("ContentScriptController: InstantTranslator başlatıldı");
      } else {
        console.warn("InstantTranslator not available");
      }

      // Context menu'yu başlat (global olarak mevcut olmalı)
      if (typeof window !== "undefined" && window.ContextMenuHandler) {
        this.contextMenu = new window.ContextMenuHandler();
      } else {
        console.warn("ContextMenuHandler not available");
      }

      // Translation overlay'ı başlat (global olarak mevcut olmalı)
      if (typeof window !== "undefined" && window.TranslationOverlay) {
        this.translationOverlay = new window.TranslationOverlay();
      } else {
        console.warn("TranslationOverlay not available");
      }

      // Event listener'ları ekle
      this.attachEventListeners();

      // Background script ile iletişimi başlat
      this.setupBackgroundCommunication();

      this.isInitialized = true;
      console.log("Content script başlatıldı");
    } catch (error) {
      console.error("Component başlatma hatası:", error);

      // Extension context kaybı durumunda sayfayı yenile
      if (error.message.includes("Extension context invalidated")) {
        console.warn(
          "Extension context kaybı tespit edildi, sayfa yenileniyor...",
        );
        setTimeout(() => window.location.reload(), 1000);
      }
    }
  }

  /**
   * Event listener'ları ekle
   */
  attachEventListeners() {
    // Metin seçimi olayları
    document.addEventListener("mouseup", this.handleTextSelection.bind(this));
    document.addEventListener("keyup", this.handleTextSelection.bind(this));

    // Mouse pozisyonunu takip et
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));

    // Click outside to close
    document.addEventListener("click", this.handleDocumentClick.bind(this));

    // Keyboard shortcuts
    document.addEventListener(
      "keydown",
      this.handleKeyboardShortcuts.bind(this),
    );

    // Scroll events (popup pozisyonunu güncelle)
    window.addEventListener("scroll", this.handleScroll.bind(this));
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  /**
   * Mouse hareketi işleyici
   */
  handleMouseMove(event) {
    // Mouse pozisyonunu global olarak sakla
    window.mouseX = event.clientX;
    window.mouseY = event.clientY;
  }

  /**
   * Metin seçimi işleyici
   */
  handleTextSelection(event) {
    // Kısa bir gecikme ile seçimi kontrol et (debounce)
    clearTimeout(this.selectionTimeout);
    this.selectionTimeout = setTimeout(() => {
      this.processTextSelection();
    }, 150);
  }

  /**
   * Seçilen metni işle
   */
  processTextSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    // Önceki seçimi temizle
    if (this.currentSelection) {
      this.clearCurrentSelection();
    }

    if (selectedText.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Rect'in geçerli olduğundan emin ol
      const validRect =
        rect && typeof rect.left === "number" && typeof rect.top === "number"
          ? rect
          : null;

      this.currentSelection = {
        text: selectedText,
        range: range,
        rect: validRect,
        timestamp: Date.now(),
      };

      // Instant translation popup'ı göster
      this.showInstantTranslationPopup();
    }
  }

  /**
   * Instant translation popup'ı göster
   */
  showInstantTranslationPopup() {
    console.log("ContentScriptController: showInstantTranslationPopup çağrıldı", this.currentSelection);
    
    if (!this.currentSelection || this.isTranslating) {
      console.log("ContentScriptController: popup gösterilmedi - selection:", !!this.currentSelection, "translating:", this.isTranslating);
      return;
    }

    try {
      console.log("ContentScriptController: instantTranslator var mı:", !!this.instantTranslator);
      // Popup'ı oluştur ve göster
      this.instantTranslator.showPopup(this.currentSelection);
    } catch (error) {
      console.error("Instant popup gösterme hatası:", error);
    }
  }

  /**
   * Mevcut seçimi temizle
   */
  clearCurrentSelection() {
    if (this.currentSelection) {
      // Popup'ları kapat
      this.instantTranslator.hidePopup();
      this.translationOverlay.hideOverlay();

      this.currentSelection = null;
    }
  }

  /**
   * Document click işleyici
   */
  handleDocumentClick(event) {
    // Popup dışına tıklandığında kapat
    if (
      !event.target.closest(".gemini-translate-popup") &&
      !event.target.closest(".gemini-translate-overlay")
    ) {
      this.clearCurrentSelection();
    }
  }

  /**
   * Klavye kısayolları
   */
  handleKeyboardShortcuts(event) {
    // Ctrl+Z ile hızlı çeviri
    if (event.ctrlKey && !event.shiftKey && event.key === "z") {
      event.preventDefault();
      this.quickTranslate();
    }

    // Escape ile popup'ları kapat
    if (event.key === "Escape") {
      this.clearCurrentSelection();
    }
  }

  /**
   * Hızlı çeviri
   */
  quickTranslate() {
    if (this.currentSelection && this.currentSelection.text) {
      this.translateSelectedText(this.currentSelection.text);
    }
  }

  /**
   * Seçilen metni çevir
   */
  async translateSelectedText(text) {
    if (this.isTranslating) return;

    try {
      this.isTranslating = true;

      // Background script'e çeviri isteği gönder
      const response = await this.sendMessageToBackground({
        type: APP_CONSTANTS.MESSAGE_TYPES.TRANSLATE_TEXT,
        data: { text: text },
      });

      if (response.success) {
        // Çeviri sonucunu göster
        this.translationOverlay.showOverlay(response.data);
      } else {
        console.error("Çeviri hatası:", response.error);
      }
    } catch (error) {
      console.error("Çeviri işlemi hatası:", error);
    } finally {
      this.isTranslating = false;
    }
  }

  /**
   * Scroll olayı işleyici
   */
  handleScroll() {
    // Popup pozisyonunu güncelle
    if (this.instantTranslator && this.instantTranslator.isVisible()) {
      this.instantTranslator.updatePosition();
    }

    if (this.translationOverlay && this.translationOverlay.isOverlayVisible()) {
      this.translationOverlay.updatePosition();
    }
  }

  /**
   * Resize olayı işleyici
   */
  handleResize() {
    // Popup pozisyonunu güncelle
    if (this.instantTranslator && this.instantTranslator.isVisible()) {
      this.instantTranslator.updatePosition();
    }

    if (this.translationOverlay && this.translationOverlay.isOverlayVisible()) {
      this.translationOverlay.updatePosition();
    }
  }

  /**
   * Background iletişimi kur
   */
  setupBackgroundCommunication() {
    // Background mesajları için listener ekle
    const compatibilityLayer = window.compatibilityLayer || chrome;

    if (compatibilityLayer && compatibilityLayer.runtime) {
      compatibilityLayer.runtime.onMessage.addListener(
        (message, sender, sendResponse) => {
          this.handleBackgroundMessage(message, sender, sendResponse);
          return true; // Async response için
        },
      );
    }
  }

  /**
   * Background mesaj işleyici
   */
  handleBackgroundMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case "UPDATE_SETTINGS":
          // Ayarlar güncellendi
          console.log("Ayarlar güncellendi:", message.data);
          break;

        case "TRANSLATION_COMPLETE":
          // Çeviri tamamlandı
          if (message.data && this.translationOverlay) {
            this.translationOverlay.showOverlay(message.data);
          }
          break;

        case "SHORTCUTS_UPDATED":
          // Kısayollar güncellendi
          console.log("Kısayollar güncellendi:", message.data);
          this.updateShortcuts(message.data);
          break;

        default:
          console.log("Bilinmeyen background mesajı:", message.type);
      }

      sendResponse({ success: true });
    } catch (error) {
      console.error("Background mesaj işleme hatası:", error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Background script'e mesaj gönder
   */
  async sendMessageToBackground(message) {
    try {
      const compatibilityLayer = window.compatibilityLayer || chrome;

      // Extension context kontrolü
      if (!compatibilityLayer || !compatibilityLayer.runtime) {
        console.warn("Extension context invalidated - compatibilityLayer yok");
        this.handleContextLoss();
        return {
          success: false,
          error: "Extension context invalidated",
          contextLost: true,
        };
      }

      // Extension ID kontrolü
      if (!compatibilityLayer.runtime.id) {
        console.warn("Extension context invalidated - runtime.id yok");
        this.handleContextLoss();
        return {
          success: false,
          error: "Extension context invalidated",
          contextLost: true,
        };
      }

      return await new Promise((resolve, reject) => {
        compatibilityLayer.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            const errorMessage = chrome.runtime.lastError.message;
            
            // Context invalidation kontrolü
            if (errorMessage.includes("Extension context invalidated") || 
                errorMessage.includes("context invalidated") ||
                errorMessage.includes("Could not establish connection")) {
              this.handleContextLoss();
              resolve({
                success: false,
                error: "Extension context invalidated",
                contextLost: true,
              });
            } else {
              reject(new Error(errorMessage));
            }
          } else {
            resolve(response);
          }
        });
      });
    } catch (error) {
      console.error("Background mesaj gönderme hatası:", error);
      
      // Context invalidation kontrolü
      if (error.message.includes("Extension context invalidated") || 
          error.message.includes("context invalidated")) {
        this.handleContextLoss();
        return {
          success: false,
          error: "Extension context invalidated",
          contextLost: true,
        };
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Context kaybı durumunu handle et
   */
  handleContextLoss() {
    console.log("Content script controller: Extension context kaybı handle ediliyor...");
    
    // Tüm popup'ları kapat
    if (this.instantTranslator) {
      this.instantTranslator.hidePopup();
    }
    if (this.translationOverlay) {
      this.translationOverlay.hideOverlay();
    }
    
    // Kullanıcıya bildirim göster
    this.showContextLossNotification();
    
    // Sayfayı yenile (3 saniye sonra)
    setTimeout(() => {
      console.log("Extension context kaybı nedeniyle sayfa yenileniyor...");
      window.location.reload();
    }, 3000);
  }

  /**
   * Context kaybı bildirimi göster
   */
  showContextLossNotification() {
    // Mevcut bildirimleri temizle
    const existingNotification = document.querySelector('.gemini-context-loss-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // Yeni bildirim oluştur
    const notification = document.createElement('div');
    notification.className = 'gemini-context-loss-notification';
    notification.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      background: #ff6b6b !important;
      color: white !important;
      padding: 16px 20px !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      z-index: 2147483648 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important;
      max-width: 300px !important;
      animation: slideInRight 0.3s ease !important;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">⚠️</span>
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">Extension Güncellendi</div>
          <div style="font-size: 12px; opacity: 0.9;">Sayfa 3 saniye içinde yenilenecek...</div>
        </div>
      </div>
    `;

    // CSS animasyonu ekle
    if (!document.querySelector('#gemini-context-loss-styles')) {
      const style = document.createElement('style');
      style.id = 'gemini-context-loss-styles';
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // 3 saniye sonra bildirimi kaldır
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  /**
   * Kısayolları güncelle
   */
  updateShortcuts(shortcuts) {
    // Kısayol ayarlarını güncelle
    console.log("Kısayollar güncellendi:", shortcuts);
    // Bu fonksiyon gelecekte kısayol yönetimi için genişletilebilir
  }

  /**
   * Content script'i temizle
   */
  destroy() {
    // Event listener'ları kaldır
    document.removeEventListener("mouseup", this.handleTextSelection);
    document.removeEventListener("keyup", this.handleTextSelection);
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("click", this.handleDocumentClick);
    document.removeEventListener("keydown", this.handleKeyboardShortcuts);
    window.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener("resize", this.handleResize);

    // Component'leri temizle
    if (this.selectionHandler && this.selectionHandler.destroy) {
      this.selectionHandler.destroy();
    }
    if (this.instantTranslator && this.instantTranslator.destroy) {
      this.instantTranslator.destroy();
    }
    if (this.contextMenu && this.contextMenu.destroy) {
      this.contextMenu.destroy();
    }
    if (this.translationOverlay && this.translationOverlay.destroy) {
      this.translationOverlay.destroy();
    }

    this.isInitialized = false;
    console.log("Content script temizlendi");
  }
}

// Export for different module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = ContentScriptController;
}

if (typeof window !== "undefined" && !window.ContentScriptController) {
  window.ContentScriptController = ContentScriptController;
}
