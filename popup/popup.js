/**
 * Gemini Translate Popup Logic
 * JavaScript functions for the popup interface
 */

class PopupController {
  constructor() {
    this.currentTranslation = null;
    this.isTranslating = false;
    this.settings = null;

    this.init();
  }

  /**
   * Send message to background
   */
  async sendMessageToBackground(message) {
    return new Promise((resolve, reject) => {
      const compatibilityLayer = window.compatibilityLayer || chrome;

      if (!compatibilityLayer || !compatibilityLayer.runtime) {
        reject(new Error("Browser API not available"));
        return;
      }

      compatibilityLayer.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Initialize popup
   */
  async init() {
    try {
      // Get DOM elements
      this.elements = this.getElements();

      // API handler managed in background

      // Load settings
      await this.loadSettings();

      // Attach event listeners
      this.attachEventListeners();

      // Check API status
      await this.checkAPIStatus();

      // Set default target language
      this.setDefaultTargetLanguage();

      console.log("Popup initialized");
    } catch (error) {
      console.error("Popup initialization error:", error);
      this.showError("Popup could not be initialized");
    }
  }

  /**
   * Get DOM elements
   */
  getElements() {
    return {
      // Input elements
      textInput: document.getElementById("text-input"),
      charCount: document.getElementById("char-count"),
      clearBtn: document.getElementById("clear-btn"),

      // Language elements
      targetLanguage: document.getElementById("target-language"),
      detectionIndicator: document.getElementById("detection-indicator"),

      // Action elements
      translateBtn: document.getElementById("translate-btn"),

      // Result elements
      resultSection: document.getElementById("result-section"),
      translatedText: document.getElementById("translated-text"),
      sourceLang: document.getElementById("source-lang"),
      targetLang: document.getElementById("target-lang"),
      confidenceScore: document.getElementById("confidence-score"),
      copyBtn: document.getElementById("copy-btn"),
      saveBtn: document.getElementById("save-btn"),

      // State elements
      loadingSection: document.getElementById("loading-section"),
      loadingText: document.getElementById("loading-text"),
      errorSection: document.getElementById("error-section"),
      errorMessage: document.getElementById("error-message"),
      retryBtn: document.getElementById("retry-btn"),

      // Header elements
      settingsBtn: document.getElementById("settings-btn"),
      historyBtn: document.getElementById("history-btn"),

      // Footer elements
      apiStatus: document.getElementById("api-status"),
      helpBtn: document.getElementById("help-btn"),
    };
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Text input events
    this.elements.textInput.addEventListener(
      "input",
      this.handleTextInput.bind(this),
    );
    this.elements.textInput.addEventListener(
      "paste",
      this.handlePaste.bind(this),
    );

    // Button events
    this.elements.clearBtn.addEventListener("click", this.clearText.bind(this));
    this.elements.translateBtn.addEventListener(
      "click",
      this.translateText.bind(this),
    );
    this.elements.copyBtn.addEventListener("click", this.copyResult.bind(this));
    this.elements.saveBtn.addEventListener(
      "click",
      this.saveTranslation.bind(this),
    );
    this.elements.retryBtn.addEventListener(
      "click",
      this.translateText.bind(this),
    );

    // Language selection events
    this.elements.targetLanguage.addEventListener(
      "change",
      this.handleLanguageChange.bind(this),
    );

    // Header button events
    this.elements.settingsBtn.addEventListener(
      "click",
      this.openSettings.bind(this),
    );
    this.elements.historyBtn.addEventListener(
      "click",
      this.openHistory.bind(this),
    );

    // Footer button events
    this.elements.helpBtn.addEventListener("click", this.openHelp.bind(this));

    // Keyboard events
    document.addEventListener("keydown", this.handleKeyboard.bind(this));

    // Auto-resize textarea
    this.elements.textInput.addEventListener(
      "input",
      this.autoResizeTextarea.bind(this),
    );
  }

  /**
   * Load settings
   */
  async loadSettings() {
    try {
      const response = await this.sendMessageToBackground({
        type: APP_CONSTANTS.MESSAGE_TYPES.GET_SETTINGS,
      });

      if (response.success && response.data) {
        this.settings = response.data;
      } else {
        this.settings = APP_CONSTANTS.DEFAULT_SETTINGS;
      }

      // Set target language
      if (this.settings.targetLanguage) {
        this.elements.targetLanguage.value = this.settings.targetLanguage;
      }
    } catch (error) {
      console.error("Settings loading error:", error);
      this.settings = APP_CONSTANTS.DEFAULT_SETTINGS;
    }
  }

  /**
   * Save settings
   */
  async saveSettings() {
    try {
      await this.sendMessageToBackground({
        type: APP_CONSTANTS.MESSAGE_TYPES.SAVE_SETTINGS,
        data: this.settings,
      });
    } catch (error) {
      console.error("Settings saving error:", error);
    }
  }

  /**
   * Check API status
   */
  async checkAPIStatus() {
    try {
      const response = await this.sendMessageToBackground({
        type: APP_CONSTANTS.MESSAGE_TYPES.GET_CURRENT_API,
      });

      if (response.success && response.data) {
        this.elements.apiStatus.textContent = `${response.data.name} active`;
        this.elements.apiStatus.style.color = "var(--success-color)";
      } else {
        this.elements.apiStatus.textContent = "API not selected";
        this.elements.apiStatus.style.color = "var(--warning-color)";
      }
    } catch (error) {
      console.error("API status check error:", error);
      this.elements.apiStatus.textContent = "API connection error";
      this.elements.apiStatus.style.color = "var(--error-color)";
    }
  }

  /**
   * Set default target language
   */
  setDefaultTargetLanguage() {
    if (this.settings && this.settings.targetLanguage) {
      this.elements.targetLanguage.value = this.settings.targetLanguage;
    }
  }

  /**
   * Text input işleyici
   */
  handleTextInput(event) {
    const text = event.target.value;
    this.updateCharCount(text);
    this.updateTranslateButton();
    this.autoDetectLanguage(text);
  }

  /**
   * Paste işleyici
   */
  handlePaste(event) {
    // Paste sonrası kısa bir gecikme ile dil tespiti yap
    setTimeout(() => {
      const text = event.target.value;
      this.autoDetectLanguage(text);
    }, 100);
  }

  /**
   * Karakter sayısını güncelle
   */
  updateCharCount(text) {
    const count = text.length;
    const maxLength = APP_CONSTANTS.MAX_TEXT_LENGTH;

    this.elements.charCount.textContent = `${count}/${maxLength}`;

    if (count > maxLength) {
      this.elements.charCount.style.color = "var(--error-color)";
      this.elements.textInput.style.borderColor = "var(--error-color)";
    } else if (count > maxLength * 0.8) {
      this.elements.charCount.style.color = "var(--warning-color)";
      this.elements.textInput.style.borderColor = "var(--warning-color)";
    } else {
      this.elements.charCount.style.color = "var(--text-muted)";
      this.elements.textInput.style.borderColor = "";
    }
  }

  /**
   * Çevir butonunu güncelle
   */
  updateTranslateButton() {
    const text = this.elements.textInput.value.trim();
    const isValid =
      text.length > 0 && text.length <= APP_CONSTANTS.MAX_TEXT_LENGTH;

    this.elements.translateBtn.disabled = !isValid || this.isTranslating;
  }

  /**
   * Automatic language detection
   */
  async autoDetectLanguage(text) {
    if (!text.trim() || text.length < 3) {
      this.updateDetectionIndicator("Source language will be detected", "auto");
      return;
    }

    try {
      this.updateDetectionIndicator("Detecting language...", "detecting");

      const response = await this.sendMessageToBackground({
        type: APP_CONSTANTS.MESSAGE_TYPES.DETECT_LANGUAGE,
        data: { text: text },
      });

      if (response.success && response.data) {
        const detectedLang = response.data;
        if (detectedLang && detectedLang.code !== "auto") {
          this.updateDetectionIndicator(
            `Source language: ${detectedLang.name}`,
            detectedLang.code,
          );
        } else {
          this.updateDetectionIndicator("Source language unclear", "unknown");
        }
      } else {
        this.updateDetectionIndicator("Language detection failed", "error");
      }
    } catch (error) {
      console.error("Language detection error:", error);
      this.updateDetectionIndicator("Language detection failed", "error");
    }
  }

  /**
   * Update language detection indicator
   */
  updateDetectionIndicator(message, status) {
    const detectedLanguage =
      this.elements.detectionIndicator.querySelector(".detected-language");
    detectedLanguage.textContent = message;

    // Status'a göre stil güncelle
    this.elements.detectionIndicator.className = "detection-indicator";

    switch (status) {
      case "detecting":
        this.elements.detectionIndicator.classList.add("detecting");
        break;
      case "error":
        this.elements.detectionIndicator.classList.add("error");
        break;
      case "success":
        this.elements.detectionIndicator.classList.add("success");
        break;
    }
  }

  /**
   * Clear text
   */
  clearText() {
    this.elements.textInput.value = "";
    this.updateCharCount("");
    this.updateTranslateButton();
    this.updateDetectionIndicator("Source language will be detected", "auto");
    this.hideAllSections();
    this.elements.textInput.focus();
  }

  /**
   * Language change handler
   */
  handleLanguageChange(event) {
    const targetLanguage = event.target.value;

    // Update settings
    if (this.settings) {
      this.settings.targetLanguage = targetLanguage;
      this.saveSettings();
    }

    // If translation was done, translate again with new language
    if (this.currentTranslation) {
      this.translateText();
    }
  }

  /**
   * Translation process
   */
  async translateText() {
    const text = this.elements.textInput.value.trim();
    const targetLanguage = this.elements.targetLanguage.value;

    if (!text || text.length === 0) {
      this.showError("Please enter text to translate");
      return;
    }

    if (text.length > APP_CONSTANTS.MAX_TEXT_LENGTH) {
      this.showError("Text is too long. Maximum 5000 characters allowed.");
      return;
    }

    try {
      this.setLoadingState(true);
      this.hideAllSections();

      this.elements.loadingText.textContent = "Translating...";
      this.elements.loadingSection.style.display = "flex";

      // Translation process - send message to background
      const response = await this.sendMessageToBackground({
        type: APP_CONSTANTS.MESSAGE_TYPES.TRANSLATE_TEXT,
        data: {
          text: text,
          targetLanguage: targetLanguage,
          sourceLanguage: null,
        },
      });

      if (!response.success) {
        throw new Error(response.error || "Translation failed");
      }

      const result = response.data;

      // Show result
      this.showTranslationResult(result);

      // Save to history
      await this.saveToHistory(result);
    } catch (error) {
      console.error("Translation error:", error);
      this.showError(error.message || "Translation failed");
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * Show translation result
   */
  showTranslationResult(result) {
    this.currentTranslation = result;

    // First hide all sections (especially loading section)
    this.hideAllSections();

    // Update language information
    this.elements.sourceLang.textContent = result.sourceLanguage.name;
    this.elements.targetLang.textContent = result.targetLanguage.name;

    // Show translated text
    this.elements.translatedText.textContent = result.translatedText;

    // Show confidence score
    if (result.confidence && this.settings.showConfidence) {
      this.elements.confidenceScore.style.display = "flex";
      this.elements.confidenceScore.querySelector(
        ".confidence-value",
      ).textContent = `${Math.round(result.confidence * 100)}%`;
    }

    // Show result section
    this.elements.resultSection.style.display = "block";
    this.elements.resultSection.classList.add("fade-in");
  }

  /**
   * Hata göster
   */
  showError(message) {
    // First hide all sections (especially loading section)
    this.hideAllSections();

    this.elements.errorMessage.textContent = message;
    this.elements.errorSection.style.display = "block";
    this.elements.errorSection.classList.add("fade-in");
  }

  /**
   * Tüm bölümleri gizle
   */
  hideAllSections() {
    this.elements.resultSection.style.display = "none";
    this.elements.loadingSection.style.display = "none";
    this.elements.errorSection.style.display = "none";
  }

  /**
   * Loading durumunu ayarla
   */
  setLoadingState(loading) {
    this.isTranslating = loading;
    this.elements.translateBtn.disabled = loading;

    if (loading) {
      this.elements.translateBtn.innerHTML = `
                <div class="loading-spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>
                <span>Translating...</span>
            `;
    } else {
      this.elements.translateBtn.innerHTML = `
                <span class="btn-icon">🔤</span>
                <span class="btn-text">Translate</span>
            `;
    }

    this.updateTranslateButton();
  }

  /**
   * Sonucu kopyala
   */
  async copyResult() {
    try {
      const text = this.elements.translatedText.textContent;
      await navigator.clipboard.writeText(text);

      // Başarı göstergesi
      const originalText = this.elements.copyBtn.innerHTML;
      this.elements.copyBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                <span>Copied!</span>
            `;
      this.elements.copyBtn.style.color = "var(--success-color)";

      setTimeout(() => {
        this.elements.copyBtn.innerHTML = originalText;
        this.elements.copyBtn.style.color = "";
      }, 2000);
    } catch (error) {
      console.error("Copy error:", error);
      this.showError("Copy failed");
    }
  }

  /**
   * Save translation
   */
  async saveTranslation() {
    if (!this.currentTranslation) return;

    try {
      await this.saveToHistory(this.currentTranslation);

      // Başarı göstergesi
      const originalText = this.elements.saveBtn.innerHTML;
      this.elements.saveBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                <span>Saved!</span>
            `;
      this.elements.saveBtn.style.color = "var(--success-color)";

      setTimeout(() => {
        this.elements.saveBtn.innerHTML = originalText;
        this.elements.saveBtn.style.color = "";
      }, 2000);
    } catch (error) {
      console.error("Save error:", error);
      this.showError("Save failed");
    }
  }

  /**
   * Save to history
   */
  async saveToHistory(translation) {
    try {
      await this.sendMessageToBackground({
        type: APP_CONSTANTS.MESSAGE_TYPES.SAVE_HISTORY,
        data: translation,
      });
    } catch (error) {
      console.error("History save error:", error);
    }
  }

  /**
   * Keyboard events
   */
  handleKeyboard(event) {
    // Translate with Ctrl+Enter or Enter
    if ((event.ctrlKey && event.key === "Enter") || event.key === "Enter") {
      event.preventDefault();
      if (!this.isTranslating && this.elements.textInput.value.trim()) {
        this.translateText();
      }
    }

    // Clear with Escape or close popup
    if (event.key === "Escape") {
      if (this.elements.textInput.value.trim()) {
        this.clearText();
      } else {
        // Close popup
        window.close();
      }
    }

    // Open history with Ctrl+Shift+H
    if (event.ctrlKey && event.shiftKey && event.key === "H") {
      event.preventDefault();
      this.openHistory();
    }

    // Open settings with Ctrl+Shift+S
    if (event.ctrlKey && event.shiftKey && event.key === "S") {
      event.preventDefault();
      this.openSettings();
    }

    // Select all with Ctrl+A (if in textarea)
    if (
      event.ctrlKey &&
      event.key === "a" &&
      event.target === this.elements.textInput
    ) {
      // Allow default behavior
      return;
    }

    // Quick translate with Ctrl+Shift+T (if text selected)
    if (event.ctrlKey && event.shiftKey && event.key === "T") {
      event.preventDefault();
      this.handleQuickTranslate();
    }
  }

  /**
   * Quick translate handler
   */
  async handleQuickTranslate() {
    try {
      // If text exists, translate directly
      if (this.elements.textInput.value.trim()) {
        await this.translateText();
        return;
      }

      // If no text, get selected text
      const selectedText = await this.getSelectedText();
      if (selectedText) {
        this.elements.textInput.value = selectedText;
        this.updateCharCount(selectedText);
        this.updateTranslateButton();
        this.autoDetectLanguage(selectedText);
        await this.translateText();
      } else {
        this.showError("No text found to translate");
      }
    } catch (error) {
      console.error("Quick translate error:", error);
      this.showError("Quick translate failed");
    }
  }

  /**
   * Get selected text
   */
  async getSelectedText() {
    try {
      // Get selected text from content script - via background
      const response = await this.sendMessageToBackground({
        type: "GET_SELECTED_TEXT",
      });

      return response?.text || null;
    } catch (error) {
      console.error("Selected text retrieval error:", error);
      return null;
    }
  }

  /**
   * Auto-resize textarea
   */
  autoResizeTextarea() {
    const textarea = this.elements.textInput;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px";
  }

  /**
   * Open settings
   */
  openSettings() {
    // Open settings page - use Chrome API directly
    if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      // Fallback: open options page manually
      const optionsUrl = chrome.runtime.getURL("options/options.html");
      window.open(optionsUrl, "_blank");
    }
  }

  /**
   * Open history
   */
  openHistory() {
    try {
      // Open history popup
      const compatibilityLayer = window.compatibilityLayer || chrome;
      if (
        compatibilityLayer.getRuntime &&
        compatibilityLayer.getRuntime().openOptionsPage
      ) {
        // Open history popup in new tab
        window.open(
          "history-popup.html",
          "_blank",
          "width=800,height=600,scrollbars=yes,resizable=yes",
        );
      } else {
        // Fallback: New window
        window.open(
          "history-popup.html",
          "_blank",
          "width=800,height=600,scrollbars=yes,resizable=yes",
        );
      }
    } catch (error) {
      console.error("History opening error:", error);
      this.showError("History could not be opened");
    }
  }

  /**
   * Open help
   */
  openHelp() {
    // Open help page
    window.open(
      "https://github.com/xenitV1/g-translate",
      "_blank",
    );
  }
}

// Popup başlat
document.addEventListener("DOMContentLoaded", () => {
  window.popupController = new PopupController();
});

// Export for testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = PopupController;
}
