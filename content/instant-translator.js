/**
 * Instant Translator
 * Instant translation popup for selected text
 */

class InstantTranslator {
  constructor() {
    this.popup = null;
    this._isVisible = false;
    this.isTranslating = false;
    this.currentSelection = null;
    this.autoHideTimeout = null;
    this.autoHideDelay = 3000; // 3 seconds - after hover ends
    this.popupOffset = 10;
    this.isHovered = false; // For hover state tracking

    this.init();
  }

  /**
   * Initialize instant translator
   */
  init() {
    this.createPopupElement();
    this.attachEventListeners();
  }

  /**
   * Create popup element
   */
  createPopupElement() {
    this.popup = document.createElement("div");
    this.popup.className = "gemini-translate-popup";
    this.popup.style.cssText = `
            position: fixed !important;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important;
            border: 1px solid rgba(66, 133, 244, 0.2) !important;
            border-radius: 16px !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(66, 133, 244, 0.05) !important;
            padding: 20px !important;
            z-index: 2147483647 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            font-size: 14px !important;
            max-width: 320px !important;
            min-width: 240px !important;
            display: none !important;
            opacity: 0 !important;
            transform: translateY(-10px) scale(0.95) !important;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
            pointer-events: auto !important;
            visibility: visible !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
        `;

    this.popup.innerHTML = `
            <div class="popup-header">
                <div class="popup-title">
                    <span class="icon">🔤</span>
                    <span class="text">Gemini Translate</span>
                </div>
                <button class="close-btn" aria-label="Close">×</button>
            </div>

            <div class="popup-content">
                <div class="selected-text">
                    <div class="text-label">Selected text:</div>
                    <div class="text-content"></div>
                </div>

                <div class="language-selection">
                    <div class="language-label">Translate to:</div>
                    <select class="target-language">
                        <option value="tr">🇹🇷 Türkçe</option>
                        <option value="en">🇺🇸 English</option>
                        <option value="es">🇪🇸 Español</option>
                        <option value="fr">🇫🇷 Français</option>
                        <option value="de">🇩🇪 Deutsch</option>
                        <option value="it">🇮🇹 Italiano</option>
                        <option value="pt">🇵🇹 Português</option>
                        <option value="ru">🇷🇺 Русский</option>
                        <option value="ja">🇯🇵 日本語</option>
                        <option value="ko">🇰🇷 한국어</option>
                        <option value="zh">🇨🇳 中文</option>
                        <option value="ar">🇸🇦 العربية</option>
                    </select>
                </div>

                <div class="detection-info">
                    <div class="detection-label">Source language:</div>
                    <div class="detection-content">
                        <span class="ai-icon">🤖</span>
                        <span class="detected-language">Detecting...</span>
                    </div>
                </div>

                <div class="action-buttons">
                    <button class="translate-btn" disabled>
                        <span class="btn-icon">🔤</span>
                        <span class="btn-text">Translate</span>
                    </button>
                    <button class="copy-btn" disabled>
                        <span class="btn-icon">📋</span>
                        <span class="btn-text">Copy</span>
                    </button>
                </div>

                <div class="translation-result" style="display: none;">
                    <div class="result-label">Translation:</div>
                    <div class="result-content"></div>
                </div>

                <div class="loading-indicator" style="display: none;">
                    <div class="spinner"></div>
                    <span class="loading-text">Translating...</span>
                </div>
            </div>
        `;

    // Add styles
    this.addPopupStyles();

    // Add to document
    document.body.appendChild(this.popup);
  }

  /**
   * Add popup styles
   */
  addPopupStyles() {
    const style = document.createElement("style");
    style.textContent = `
            .gemini-translate-popup {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .gemini-translate-popup .popup-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e8eaed;
            }
            
            .gemini-translate-popup .popup-title {
                display: flex;
                align-items: center;
                font-weight: 600;
                color: #202124;
            }
            
            .gemini-translate-popup .popup-title .icon {
                margin-right: 6px;
                font-size: 16px;
            }
            
            .gemini-translate-popup .close-btn {
                background: none;
                border: none;
                font-size: 18px;
                color: #5f6368;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            
            .gemini-translate-popup .close-btn:hover {
                background-color: #f1f3f4;
            }
            
            .gemini-translate-popup .popup-content > div {
                margin-bottom: 12px;
            }
            
            .gemini-translate-popup .text-label,
            .gemini-translate-popup .language-label,
            .gemini-translate-popup .detection-label,
            .gemini-translate-popup .result-label {
                font-size: 12px;
                color: #5f6368;
                margin-bottom: 4px;
                font-weight: 500;
            }
            
            .gemini-translate-popup .text-content {
                background: #f8f9fa;
                padding: 8px;
                border-radius: 4px;
                font-size: 13px;
                line-height: 1.4;
                max-height: 60px;
                overflow-y: auto;
                word-wrap: break-word;
            }
            
            .gemini-translate-popup .target-language {
                width: 100%;
                padding: 6px 8px;
                border: 1px solid #dadce0;
                border-radius: 4px;
                font-size: 13px;
                background: white;
                cursor: pointer;
            }
            
            .gemini-translate-popup .target-language:focus {
                outline: none;
                border-color: #4285f4;
                box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
            }
            
            .gemini-translate-popup .detection-content {
                display: flex;
                align-items: center;
                font-size: 13px;
                color: #5f6368;
            }
            
            .gemini-translate-popup .ai-icon {
                margin-right: 6px;
                font-size: 14px;
            }
            
            .gemini-translate-popup .action-buttons {
                display: flex;
                gap: 8px;
                margin-top: 16px;
            }
            
            .gemini-translate-popup .translate-btn,
            .gemini-translate-popup .copy-btn {
                flex: 1;
                padding: 8px 12px;
                border: none;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .gemini-translate-popup .translate-btn {
                background: #4285f4;
                color: white;
            }
            
            .gemini-translate-popup .translate-btn:hover:not(:disabled) {
                background: #3367d6;
            }
            
            .gemini-translate-popup .translate-btn:disabled {
                background: #dadce0;
                color: #5f6368;
                cursor: not-allowed;
            }
            
            .gemini-translate-popup .copy-btn {
                background: #f8f9fa;
                color: #5f6368;
                border: 1px solid #dadce0;
            }
            
            .gemini-translate-popup .copy-btn:hover:not(:disabled) {
                background: #e8eaed;
            }
            
            .gemini-translate-popup .copy-btn:disabled {
                background: #f8f9fa;
                color: #dadce0;
                cursor: not-allowed;
            }
            
            .gemini-translate-popup .result-content {
                background: #e8f5e8;
                padding: 8px;
                border-radius: 4px;
                font-size: 13px;
                line-height: 1.4;
                word-wrap: break-word;
            }
            
            .gemini-translate-popup .loading-indicator {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 12px;
            }
            
            .gemini-translate-popup .spinner {
                width: 16px;
                height: 16px;
                border: 2px solid #f3f3f3;
                border-top: 2px solid #4285f4;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-right: 8px;
            }
            
            .gemini-translate-popup .loading-text {
                font-size: 13px;
                color: #5f6368;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .gemini-translate-popup.show {
                display: block;
                opacity: 1;
                transform: translateY(0);
            }
        `;

    document.head.appendChild(style);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Listen for translate button click from SelectionHandler
    document.addEventListener("geminiTranslateButtonClicked", (event) => {
      console.log("InstantTranslator received translate button event", event.detail);
      this.showPopup(event.detail);
    });

    // Close button
    this.popup.querySelector(".close-btn").addEventListener("click", () => {
      this.hidePopup();
    });

    // Translate button
    this.popup.querySelector(".translate-btn").addEventListener("click", () => {
      this.translateText();
    });

    // Copy button
    this.popup.querySelector(".copy-btn").addEventListener("click", () => {
      this.copyResult();
    });

    // Language selection
    this.popup
      .querySelector(".target-language")
      .addEventListener("change", () => {
        this.onLanguageChange();
      });

    // Click outside to close
    document.addEventListener("click", (event) => {
      if (!this.popup.contains(event.target) && this._isVisible && !this.isHovered) {
        this.hidePopup();
      }
    });

    // Hover events - don't close popup when hovering
    this.popup.addEventListener("mouseenter", () => {
      this.isHovered = true;
      this.clearAutoHide(); // Stop auto-hide during hover
    });

    this.popup.addEventListener("mouseleave", () => {
      this.isHovered = false;
      this.startAutoHide(); // Restart auto-hide when hover ends
    });

    // Keyboard events
    document.addEventListener("keydown", (event) => {
      if (this._isVisible) {
        if (event.key === "Escape") {
          this.hidePopup();
        } else if (event.key === "Enter" && event.ctrlKey) {
          this.translateText();
        }
      }
    });
  }

  /**
   * Show popup
   */
  showPopup(selection) {
    console.log("showPopup called with selection:", selection);

    if (!selection || !selection.text) {
      console.error("Invalid selection passed to showPopup:", selection);
      return;
    }

    if (this._isVisible) {
      this.hidePopup();
    }

    this.currentSelection = selection;
    console.log("currentSelection set to:", this.currentSelection);

    this.updatePopupContent();

    // Set position first (before popup is visible)
    this.positionPopup();

    // Then show popup
    this.showPopupElement();
    this.startAutoHide();
  }

  /**
   * Hide popup
   */
  hidePopup() {
    if (!this._isVisible) return;

    this.clearAutoHide();
    this.hidePopupElement();
    this.currentSelection = null;
  }

  /**
   * Show popup element
   */
  showPopupElement() {
    // Show popup in initial state (invisible)
    this.popup.style.display = "block";
    this.popup.style.visibility = "visible";
    this.popup.style.opacity = "0";
    this.popup.style.transform = "translateY(-10px) scale(0.95)";
    this._isVisible = true;

    // Use requestAnimationFrame for smooth animation
    requestAnimationFrame(() => {
      this.popup.style.opacity = "1";
      this.popup.style.transform = "translateY(0) scale(1)";
      this.popup.classList.add("show");
    });
  }

  /**
   * Hide popup element
   */
  hidePopupElement() {
    // Smooth exit animation
    this.popup.style.opacity = "0";
    this.popup.style.transform = "translateY(-10px) scale(0.95)";
    this.popup.classList.remove("show");
    this._isVisible = false;

    // Hide after animation completes
    setTimeout(() => {
      this.popup.style.display = "none";
    }, 400); // Match CSS transition duration
  }

  /**
   * Update popup content
   */
  updatePopupContent() {
    if (!this.currentSelection) return;

    // Show selected text
    const textContent = this.popup.querySelector(".text-content");
    textContent.textContent = this.currentSelection.text;

    // Start language detection
    this.detectLanguage();

    // Enable buttons
    this.popup.querySelector(".translate-btn").disabled = false;
  }

  /**
   * Set popup position
   */
  positionPopup() {
    if (!this.currentSelection) return;

    const rect = this.currentSelection.rect;
    const popup = this.popup;
    
    // Popup'ı geçici olarak görünür yap ki getBoundingClientRect çalışsın
    const originalDisplay = popup.style.display;
    const originalVisibility = popup.style.visibility;
    const originalOpacity = popup.style.opacity;
    
    popup.style.display = "block";
    popup.style.visibility = "visible";
    popup.style.opacity = "0";
    
    const popupRect = popup.getBoundingClientRect();
    
    // Orijinal değerleri geri yükle
    popup.style.display = originalDisplay;
    popup.style.visibility = originalVisibility;
    popup.style.opacity = originalOpacity;

    // Viewport boyutları
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left, top;

    if (
      rect &&
      typeof rect.left === "number" &&
      typeof rect.top === "number" &&
      typeof rect.width === "number" &&
      typeof rect.bottom === "number"
    ) {
      // Pozisyon hesapla - rect mevcut ve geçerli
      left = rect.left + rect.width / 2 - popupRect.width / 2;
      top = rect.bottom + this.popupOffset;

      // Viewport sınırlarını kontrol et
      if (left < 10) {
        left = 10;
      } else if (left + popupRect.width > viewportWidth - 10) {
        left = viewportWidth - popupRect.width - 10;
      }

      if (top + popupRect.height > viewportHeight - 10) {
        // Yukarıda göster
        top = rect.top - popupRect.height - this.popupOffset;
      }
    } else {
      // Rect mevcut değilse - mouse pozisyonuna göre göster veya merkezde göster
      console.warn(
        "Selection rect mevcut değil veya geçersiz, varsayılan pozisyon kullanılıyor",
      );

      // Mouse pozisyonunu almaya çalış
      const mouseX = window.mouseX || viewportWidth / 2;
      const mouseY = window.mouseY || viewportHeight / 2;

      left = mouseX - popupRect.width / 2;
      top = mouseY + 20; // Mouse'un altında göster

      // Viewport sınırlarını kontrol et
      if (left < 10) left = 10;
      if (left + popupRect.width > viewportWidth - 10)
        left = viewportWidth - popupRect.width - 10;
      if (top + popupRect.height > viewportHeight - 10)
        top = viewportHeight - popupRect.height - 10;
      if (top < 10) top = 10;
    }

    // Set position
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
  }

  /**
   * Detect language
   */
  async detectLanguage() {
    const detectionContent = this.popup.querySelector(".detected-language");
    detectionContent.textContent = "Detecting...";

    try {
      // Send language detection request to background script
      const response = await this.sendMessageToBackground({
        type: APP_CONSTANTS.MESSAGE_TYPES.DETECT_LANGUAGE,
        data: { text: this.currentSelection.text },
      });

      if (response && response.success) {
        const language = response.data;
        detectionContent.textContent = `Source: ${language.name}`;
      } else if (response && response.contextLost) {
        detectionContent.textContent = "Extension disconnected";
        this.showError("Extension reloaded. Please refresh the page manually.");
      } else {
        detectionContent.textContent = "Language detection failed";
      }
    } catch (error) {
      console.error("Language detection error:", error);

      // Close popup on extension context loss
      if (
        error.message.includes("Extension context invalidated") ||
        error.message.includes("context invalidated") ||
        (error.message && error.message.includes("runtime"))
      ) {
        detectionContent.textContent = "Extension disconnected";
        this.showError("Extension reloaded. Please refresh the page manually.");

        // Close popup after 2 seconds (let user refresh manually)
        setTimeout(() => {
          this.hidePopup();
        }, 2000);
      } else {
        detectionContent.textContent = "Language detection failed";
      }
    }
  }

  /**
   * Translate text
   */
  async translateText() {
    if (this.isTranslating) return;

    try {
      this.isTranslating = true;
      this.showLoadingState();

      const targetLanguage = this.popup.querySelector(".target-language").value;

      // Send translation request to background script
      const response = await this.sendMessageToBackground({
        type: APP_CONSTANTS.MESSAGE_TYPES.TRANSLATE_TEXT,
        data: {
          text: this.currentSelection.text,
          targetLanguage: targetLanguage,
        },
      });

      if (response.success) {
        this.showTranslationResult(response.data);
      } else if (response.contextLost) {
        this.showError("Extension reloaded. Please refresh the page manually.");
      } else {
        this.showError(response.error || "Translation failed");
      }
    } catch (error) {
      console.error("Translation error:", error);

      // Close popup on extension context loss
      if (
        error.message.includes("Extension context invalidated") ||
        error.message.includes("context invalidated") ||
        (error.message && error.message.includes("runtime"))
      ) {
        this.showError("Extension reloaded. Please refresh the page manually.");

        // Close popup after 2 seconds (let user refresh manually)
        setTimeout(() => {
          this.hidePopup();
        }, 2000);
      } else {
        this.showError("Translation process failed");
      }
    } finally {
      this.isTranslating = false;
      this.hideLoadingState();
    }
  }

  /**
   * Show translation result
   */
  showTranslationResult(translation) {
    const resultDiv = this.popup.querySelector(".translation-result");
    const resultContent = this.popup.querySelector(".result-content");

    resultContent.textContent = translation.translatedText;
    resultDiv.style.display = "block";

    // Enable copy button
    this.popup.querySelector(".copy-btn").disabled = false;

    // Stop auto-hide
    this.clearAutoHide();
  }

  /**
   * Show error
   */
  showError(message) {
    const resultDiv = this.popup.querySelector(".translation-result");
    const resultContent = this.popup.querySelector(".result-content");

    resultContent.textContent = `Error: ${message}`;
    resultContent.style.background = "#ffebee";
    resultContent.style.color = "#c62828";
    resultDiv.style.display = "block";
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    this.popup.querySelector(".loading-indicator").style.display = "flex";
    this.popup.querySelector(".translate-btn").disabled = true;
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    this.popup.querySelector(".loading-indicator").style.display = "none";
    this.popup.querySelector(".translate-btn").disabled = false;
  }

  /**
   * Copy result
   */
  async copyResult() {
    const resultContent = this.popup.querySelector(".result-content");
    const text = resultContent.textContent;

    try {
      await navigator.clipboard.writeText(text);

      // Success indicator
      const copyBtn = this.popup.querySelector(".copy-btn");
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML =
        '<span class="btn-icon">✓</span><span class="btn-text">Copied!</span>';
      copyBtn.style.background = "#e8f5e8";
      copyBtn.style.color = "#2e7d32";

      setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.style.background = "";
        copyBtn.style.color = "";
      }, 2000);
    } catch (error) {
      console.error("Copy error:", error);
    }
  }

  /**
   * Handle language change
   */
  onLanguageChange() {
    // If translation was done, translate again with new language
    if (
      this.popup.querySelector(".translation-result").style.display !== "none"
    ) {
      this.translateText();
    }
  }

  /**
   * Start auto-hide
   */
  startAutoHide() {
    this.clearAutoHide();
    this.autoHideTimeout = setTimeout(() => {
      if (!this.isHovered) { // Don't close if hovering
        this.hidePopup();
      }
    }, this.autoHideDelay);
  }

  /**
   * Clear auto-hide
   */
  clearAutoHide() {
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
      this.autoHideTimeout = null;
    }
  }

  /**
   * Send message to background script
   */
  async sendMessageToBackground(message) {
    try {
      const compatibilityLayer = window.compatibilityLayer || chrome;

      // Extension context check
      if (!compatibilityLayer || !compatibilityLayer.runtime) {
        this.handleContextLoss();
        return {
          success: false,
          error: "Extension context invalidated",
          contextLost: true,
        };
      }

      // Extension ID check (early context loss detection)
      if (!compatibilityLayer.runtime.id) {
        // Don't trigger context loss immediately, try to continue
        // Context loss will be detected in runtime.sendMessage error handling
      }

      // Send message with Promise
      return new Promise((resolve, reject) => {
        try {
          compatibilityLayer.runtime.sendMessage(message, (response) => {
            // Chrome runtime error check
            if (chrome.runtime.lastError) {
              const errorMessage = chrome.runtime.lastError.message;

              // Extension context invalidated check
              if (
                errorMessage.includes("Extension context invalidated") ||
                errorMessage.includes("context invalidated") ||
                errorMessage.includes("Could not establish connection")
              ) {
                this.handleContextLoss();
                resolve({
                  success: false,
                  error: "Extension context invalidated",
                  contextLost: true,
                });
              } else {
                resolve({
                  success: false,
                  error: errorMessage,
                });
              }
            } else {
              resolve(response || { success: false, error: "No response" });
            }
          });
        } catch (syncError) {
          if (syncError.message.includes("context invalidated")) {
            this.handleContextLoss();
          }
          resolve({
            success: false,
            error: syncError.message,
            contextLost: syncError.message.includes("context invalidated"),
          });
        }
      });
    } catch (error) {
      // Special check for extension context invalidated error
      if (
        error.message.includes("Extension context invalidated") ||
        error.message.includes("context invalidated")
      ) {
        this.handleContextLoss();

        // Immediately return context lost
        return {
          success: false,
          error: "Extension reloaded. Please refresh the page manually.",
          contextLost: true,
        };
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Handle context loss
   */
  handleContextLoss() {
    // Close popup
    this.hidePopup();

    // Show notification to user (let user refresh manually)
    this.showContextLossNotification();
  }

  /**
   * Show context loss notification
   */
  showContextLossNotification() {
    // Clear existing notifications
    const existingNotification = document.querySelector('.gemini-context-loss-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create new notification
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
          <div style="font-weight: 600; margin-bottom: 4px;">Extension Updated</div>
          <div style="font-size: 12px; opacity: 0.9;">Please refresh the page manually</div>
        </div>
      </div>
    `;

    // Add CSS animation
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

    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  /**
   * Check if popup is visible
   */
  isPopupVisible() {
    return this._isVisible;
  }

  /**
   * Check if popup is visible
   */
  isVisible() {
    return this._isVisible;
  }

  /**
   * Update popup position (for scroll)
   */
  updatePosition() {
    if (this._isVisible && this.currentSelection) {
      this.positionPopup();
    }
  }

  /**
   * Clean up instant translator
   */
  destroy() {
    this.hidePopup();
    this.clearAutoHide();

    if (this.popup && this.popup.parentNode) {
      this.popup.parentNode.removeChild(this.popup);
    }

    this.popup = null;
    this.currentSelection = null;
  }
}

// Export for different module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = InstantTranslator;
}

if (typeof window !== "undefined" && !window.InstantTranslator) {
  window.InstantTranslator = InstantTranslator;
}
