/**
 * Selection Handler
 * Metin seçimi algılama ve yönetimi
 */

class SelectionHandler {
  constructor() {
    this.currentSelection = null;
    this.selectionTimeout = null;
    this.isEnabled = true;
    this.minSelectionLength = 2;
    this.maxSelectionLength = 500;
    this.debounceDelay = 150;

    this.init();
  }

  /**
   * Selection handler'ı başlat
   */
  init() {
    this.attachEventListeners();
    this.setupSelectionStyles();
  }

  /**
   * Event listener'ları ekle
   */
  attachEventListeners() {
    // Mouse events
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));
    document.addEventListener("mousedown", this.handleMouseDown.bind(this));

    // Keyboard events
    document.addEventListener("keyup", this.handleKeyUp.bind(this));
    document.addEventListener("keydown", this.handleKeyDown.bind(this));

    // Touch events (mobile support)
    document.addEventListener("touchend", this.handleTouchEnd.bind(this));

    // Selection change events
    document.addEventListener(
      "selectionchange",
      this.handleSelectionChange.bind(this),
    );
  }

  /**
   * Mouse up olayı
   */
  handleMouseUp(event) {
    if (!this.isEnabled) return;

    // Kısa gecikme ile seçimi kontrol et
    this.debounceSelection(() => {
      this.processSelection();
    });
  }

  /**
   * Mouse down olayı
   */
  handleMouseDown(event) {
    // Yeni seçim başladığında önceki seçimi temizle
    this.clearCurrentSelection();
  }

  /**
   * Key up olayı
   */
  handleKeyUp(event) {
    if (!this.isEnabled) return;

    // Shift + Arrow keys ile seçim
    if (event.shiftKey && this.isArrowKey(event.key)) {
      this.debounceSelection(() => {
        this.processSelection();
      });
    }
  }

  /**
   * Key down olayı
   */
  handleKeyDown(event) {
    // Escape ile seçimi temizle
    if (event.key === "Escape") {
      this.clearCurrentSelection();
    }
  }

  /**
   * Touch end olayı (mobile)
   */
  handleTouchEnd(event) {
    if (!this.isEnabled) return;

    this.debounceSelection(() => {
      this.processSelection();
    });
  }

  /**
   * Selection change olayı
   */
  handleSelectionChange() {
    if (!this.isEnabled) return;

    this.debounceSelection(() => {
      this.processSelection();
    });
  }

  /**
   * Debounce ile seçim işleme
   */
  debounceSelection(callback) {
    clearTimeout(this.selectionTimeout);
    this.selectionTimeout = setTimeout(callback, this.debounceDelay);
  }

  /**
   * Seçimi işle
   */
  processSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    // Önceki seçimi temizle
    this.clearCurrentSelection();

    // Yeni seçimi kontrol et
    if (this.isValidSelection(selectedText)) {
      this.createSelection(selection, selectedText);
    }
  }

  /**
   * Geçerli seçim kontrolü
   */
  isValidSelection(text) {
    if (!text || text.length === 0) return false;
    if (text.length < this.minSelectionLength) return false;
    if (text.length > this.maxSelectionLength) return false;

    // Sadece metin içeriği (HTML elementleri değil)
    if (text.includes("<") && text.includes(">")) return false;

    // Boş karakterlerden oluşan seçimler
    if (/^\s+$/.test(text)) return false;

    return true;
  }

  /**
   * Seçim oluştur
   */
  createSelection(selection, text) {
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      this.currentSelection = {
        text: text,
        range: range.cloneRange(),
        rect: rect,
        timestamp: Date.now(),
        startOffset: range.startOffset,
        endOffset: range.endOffset,
        startContainer: range.startContainer,
        endContainer: range.endContainer,
      };

      // Seçim event'ini tetikle
      this.triggerSelectionEvent();
    } catch (error) {
      console.error("Seçim oluşturma hatası:", error);
    }
  }

  /**
   * Mevcut seçimi temizle
   */
  clearCurrentSelection() {
    if (this.currentSelection) {
      // Seçim temizleme event'ini tetikle
      this.triggerClearSelectionEvent();

      this.currentSelection = null;
    }
  }

  /**
   * Seçim event'ini tetikle
   */
  triggerSelectionEvent() {
    const event = new CustomEvent("geminiTextSelected", {
      detail: {
        selection: this.currentSelection,
        text: this.currentSelection.text,
        rect: this.currentSelection.rect,
      },
    });

    document.dispatchEvent(event);
  }

  /**
   * Seçim temizleme event'ini tetikle
   */
  triggerClearSelectionEvent() {
    const event = new CustomEvent("geminiTextCleared", {
      detail: {
        previousSelection: this.currentSelection,
      },
    });

    document.dispatchEvent(event);
  }

  /**
   * Arrow key kontrolü
   */
  isArrowKey(key) {
    return ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key);
  }

  /**
   * Seçim stillerini ayarla
   */
  setupSelectionStyles() {
    // Seçim rengini özelleştir
    const style = document.createElement("style");
    style.textContent = `
            ::selection {
                background-color: rgba(66, 133, 244, 0.2);
                color: inherit;
            }
            
            ::-moz-selection {
                background-color: rgba(66, 133, 244, 0.2);
                color: inherit;
            }
            
            .gemini-selection-highlight {
                background-color: rgba(66, 133, 244, 0.15);
                border-radius: 2px;
                transition: background-color 0.2s ease;
            }
        `;

    document.head.appendChild(style);
  }

  /**
   * Seçimi vurgula
   */
  highlightSelection() {
    if (!this.currentSelection) return;

    try {
      const range = this.currentSelection.range;
      const span = document.createElement("span");
      span.className = "gemini-selection-highlight";

      range.surroundContents(span);
    } catch (error) {
      console.error("Seçim vurgulama hatası:", error);
    }
  }

  /**
   * Vurguyu kaldır
   */
  removeHighlight() {
    const highlights = document.querySelectorAll(".gemini-selection-highlight");
    highlights.forEach((highlight) => {
      const parent = highlight.parentNode;
      parent.replaceChild(
        document.createTextNode(highlight.textContent),
        highlight,
      );
      parent.normalize();
    });
  }

  /**
   * Seçim pozisyonunu güncelle
   */
  updateSelectionPosition() {
    if (!this.currentSelection) return;

    try {
      const range = this.currentSelection.range;
      const rect = range.getBoundingClientRect();

      this.currentSelection.rect = rect;
    } catch (error) {
      console.error("Seçim pozisyon güncelleme hatası:", error);
    }
  }

  /**
   * Seçim metnini al
   */
  getSelectedText() {
    return this.currentSelection ? this.currentSelection.text : "";
  }

  /**
   * Seçim pozisyonunu al
   */
  getSelectionRect() {
    return this.currentSelection ? this.currentSelection.rect : null;
  }

  /**
   * Seçim var mı kontrol et
   */
  hasSelection() {
    return this.currentSelection !== null;
  }

  /**
   * Seçim uzunluğunu al
   */
  getSelectionLength() {
    return this.currentSelection ? this.currentSelection.text.length : 0;
  }

  /**
   * Seçim ayarlarını güncelle
   */
  updateSettings(settings) {
    if (settings.minSelectionLength) {
      this.minSelectionLength = settings.minSelectionLength;
    }

    if (settings.maxSelectionLength) {
      this.maxSelectionLength = settings.maxSelectionLength;
    }

    if (settings.debounceDelay) {
      this.debounceDelay = settings.debounceDelay;
    }
  }

  /**
   * Handler'ı etkinleştir/devre dışı bırak
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;

    if (!enabled) {
      this.clearCurrentSelection();
    }
  }

  /**
   * Selection handler'ı temizle
   */
  destroy() {
    // Event listener'ları kaldır
    document.removeEventListener("mouseup", this.handleMouseUp);
    document.removeEventListener("mousedown", this.handleMouseDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("touchend", this.handleTouchEnd);
    document.removeEventListener("selectionchange", this.handleSelectionChange);

    // Timeout'ları temizle
    clearTimeout(this.selectionTimeout);

    // Seçimi temizle
    this.clearCurrentSelection();

    // Vurguyu kaldır
    this.removeHighlight();
  }
}

// Export for different module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = SelectionHandler;
}

if (typeof window !== "undefined" && !window.SelectionHandler) {
  window.SelectionHandler = SelectionHandler;
}
