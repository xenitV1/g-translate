/**
 * Selection Handler
 * Text selection detection and management
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
   * Initialize selection handler
   */
  init() {
    this.attachEventListeners();
    this.setupSelectionStyles();
  }

  /**
   * Attach event listeners
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
   * Handle mouse up event
   */
  handleMouseUp(event) {
    if (!this.isEnabled) return;

    // Check selection with short delay
    this.debounceSelection(() => {
      this.processSelection();
    });
  }

  /**
   * Handle mouse down event
   */
  handleMouseDown(event) {
    // Clear previous selection when new selection starts
    this.clearCurrentSelection();
  }

  /**
   * Handle key up event
   */
  handleKeyUp(event) {
    if (!this.isEnabled) return;

    // Shift + Arrow keys for selection
    if (event.shiftKey && this.isArrowKey(event.key)) {
      this.debounceSelection(() => {
        this.processSelection();
      });
    }
  }

  /**
   * Handle key down event
   */
  handleKeyDown(event) {
    // Clear selection with Escape
    if (event.key === "Escape") {
      this.clearCurrentSelection();
    }
  }

  /**
   * Handle touch end event (mobile)
   */
  handleTouchEnd(event) {
    if (!this.isEnabled) return;

    this.debounceSelection(() => {
      this.processSelection();
    });
  }

  /**
   * Handle selection change event
   */
  handleSelectionChange() {
    if (!this.isEnabled) return;

    this.debounceSelection(() => {
      this.processSelection();
    });
  }

  /**
   * Debounce selection processing
   */
  debounceSelection(callback) {
    clearTimeout(this.selectionTimeout);
    this.selectionTimeout = setTimeout(callback, this.debounceDelay);
  }

  /**
   * Process selection
   */
  processSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    // Clear previous selection
    this.clearCurrentSelection();

    // Check new selection
    if (this.isValidSelection(selectedText)) {
      this.createSelection(selection, selectedText);
      // Translate button removed - selection handler only
    }
  }

  /**
   * Validate selection
   */
  isValidSelection(text) {
    if (!text || text.length === 0) return false;
    if (text.length < this.minSelectionLength) return false;
    if (text.length > this.maxSelectionLength) return false;

    // Only text content (not HTML elements)
    if (text.includes("<") && text.includes(">")) return false;

    // Selections consisting only of whitespace
    if (/^\s+$/.test(text)) return false;

    return true;
  }

  /**
   * Create selection
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

      // Don't trigger selection event here - only show translate button
      // Full popup will be triggered when button is clicked
    } catch (error) {
      console.error("Selection creation error:", error);
    }
  }

  /**
   * Clear current selection
   */
  clearCurrentSelection() {
    if (this.currentSelection) {
      // Trigger selection clear event
      this.triggerClearSelectionEvent();

      this.currentSelection = null;
      // Translate button removed
    }
  }

  /**
   * Trigger selection event
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
   * Trigger selection clear event
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
   * Check if key is arrow key
   */
  isArrowKey(key) {
    return ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key);
  }


  /**
   * Setup selection styles
   */
  setupSelectionStyles() {
    // Customize selection color
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
   * Highlight selection
   */
  highlightSelection() {
    if (!this.currentSelection) return;

    try {
      const range = this.currentSelection.range;
      const span = document.createElement("span");
      span.className = "gemini-selection-highlight";

      range.surroundContents(span);
    } catch (error) {
      console.error("Selection highlighting error:", error);
    }
  }

  /**
   * Remove highlight
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
   * Update selection position
   */
  updateSelectionPosition() {
    if (!this.currentSelection) return;

    try {
      const range = this.currentSelection.range;
      const rect = range.getBoundingClientRect();

      this.currentSelection.rect = rect;
      // Translate button removed
    } catch (error) {
      console.error("Selection position update error:", error);
    }
  }

  /**
   * Get selected text
   */
  getSelectedText() {
    return this.currentSelection ? this.currentSelection.text : "";
  }

  /**
   * Get selection rect
   */
  getSelectionRect() {
    return this.currentSelection ? this.currentSelection.rect : null;
  }

  /**
   * Check if selection exists
   */
  hasSelection() {
    return this.currentSelection !== null;
  }

  /**
   * Get selection length
   */
  getSelectionLength() {
    return this.currentSelection ? this.currentSelection.text.length : 0;
  }

  /**
   * Update selection settings
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
   * Enable/disable handler
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;

    if (!enabled) {
      this.clearCurrentSelection();
    }
  }

  /**
   * Clean up selection handler
   */
  destroy() {
    // Remove event listeners
    document.removeEventListener("mouseup", this.handleMouseUp);
    document.removeEventListener("mousedown", this.handleMouseDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("touchend", this.handleTouchEnd);
    document.removeEventListener("selectionchange", this.handleSelectionChange);

    // Clear timeouts
    clearTimeout(this.selectionTimeout);

    // Clear selection
    this.clearCurrentSelection();

    // Remove highlight
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
