/**
 * Content Script - Main Entry Point
 * Sayfa etkileşimi ve metin seçimi yönetimi
 */

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
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
            } else {
                this.initializeComponents();
            }
            
        } catch (error) {
            console.error('Content script başlatma hatası:', error);
        }
    }

    /**
     * Compatibility layer yükle
     */
    async loadCompatibilityLayer() {
        // Cross-browser compatibility için gerekli polyfill'ler
        if (!window.compatibilityLayer) {
            // Browser detection
            const isFirefox = typeof browser !== 'undefined' && browser.runtime;
            const isChrome = typeof chrome !== 'undefined' && chrome.runtime;
            
            // API seçimi - Chrome öncelikli, Firefox fallback
            const api = isChrome ? chrome : (isFirefox ? browser : chrome);
            
            window.compatibilityLayer = {
                runtime: api.runtime,
                storage: api.storage,
                contextMenus: api.contextMenus,
                tabs: api.tabs,
                scripting: api.scripting,
                isChrome: isChrome,
                isFirefox: isFirefox
            };
        }
    }

    /**
     * Component'leri başlat
     */
    async initializeComponents() {
        if (this.isInitialized) return;
        
        try {
            // Selection handler'ı başlat
            this.selectionHandler = new SelectionHandler();
            
            // Instant translator'ı başlat
            this.instantTranslator = new InstantTranslator();
            
            // Context menu'yu başlat
            this.contextMenu = new ContextMenuHandler();
            
            // Translation overlay'ı başlat
            this.translationOverlay = new TranslationOverlay();
            
            // Event listener'ları ekle
            this.attachEventListeners();
            
            // Background script ile iletişimi başlat
            this.setupBackgroundCommunication();
            
            this.isInitialized = true;
            console.log('Content script başlatıldı');
            
        } catch (error) {
            console.error('Component başlatma hatası:', error);
        }
    }

    /**
     * Event listener'ları ekle
     */
    attachEventListeners() {
        // Metin seçimi olayları
        document.addEventListener('mouseup', this.handleTextSelection.bind(this));
        document.addEventListener('keyup', this.handleTextSelection.bind(this));
        
        // Click outside to close
        document.addEventListener('click', this.handleDocumentClick.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        // Scroll events (popup pozisyonunu güncelle)
        window.addEventListener('scroll', this.handleScroll.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));
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

            this.currentSelection = {
                text: selectedText,
                range: range,
                rect: rect,
                timestamp: Date.now()
            };

            // Instant translation popup'ı göster
            this.showInstantTranslationPopup();
        }
    }

    /**
     * Instant translation popup'ı göster
     */
    showInstantTranslationPopup() {
        if (!this.currentSelection || this.isTranslating) return;
        
        try {
            // Popup'ı oluştur ve göster
            this.instantTranslator.showPopup(this.currentSelection);
            
        } catch (error) {
            console.error('Instant popup gösterme hatası:', error);
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
        if (!event.target.closest('.gemini-translate-popup') && 
            !event.target.closest('.gemini-translate-overlay')) {
            this.clearCurrentSelection();
        }
    }

    /**
     * Klavye kısayolları
     */
    handleKeyboardShortcuts(event) {
        // Ctrl+Shift+T ile hızlı çeviri
        if (event.ctrlKey && event.shiftKey && event.key === 'T') {
            event.preventDefault();
            this.quickTranslate();
        }
        
        // Escape ile popup'ları kapat
        if (event.key === 'Escape') {
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
                data: { text: text }
            });
            
            if (response.success) {
                // Çeviri sonucunu göster
                this.translationOverlay.showTranslation(response.data);
            } else {
                console.error('Çeviri hatası:', response.error);
            }
            
        } catch (error) {
            console.error('Çeviri işlemi hatası:', error);
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
        
        if (this.translationOverlay && this.translationOverlay.isVisible()) {
            this.translationOverlay.updatePosition();
        }
    }

    /**
     * Resize olayı işleyici
     */
    handleResize() {
        // Popup pozisyonunu güncelle
        this.handleScroll();
    }

    /**
     * Background script ile iletişim kur
     */
    setupBackgroundCommunication() {
        // Background script'ten gelen mesajları dinle
        const compatibilityLayer = window.compatibilityLayer || chrome;
        compatibilityLayer.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleBackgroundMessage(message, sender, sendResponse);
            return true; // Async response için
        });
    }

    /**
     * Background script mesajlarını işle
     */
    handleBackgroundMessage(message, sender, sendResponse) {
        switch (message.type) {
            case APP_CONSTANTS.MESSAGE_TYPES.SHOW_NOTIFICATION:
                this.showNotification(message.data);
                break;
                
            case APP_CONSTANTS.MESSAGE_TYPES.OPEN_POPUP:
                this.openMainPopup();
                break;
                
            case APP_CONSTANTS.MESSAGE_TYPES.CLOSE_POPUP:
                this.clearCurrentSelection();
                break;
                
            case 'GET_SELECTED_TEXT':
                const selectedText = window.getSelection().toString().trim();
                sendResponse({ text: selectedText });
                break;
                
            default:
                console.log('Bilinmeyen mesaj tipi:', message.type);
        }
    }

    /**
     * Background script'e mesaj gönder
     */
    async sendMessageToBackground(message) {
        try {
            const compatibilityLayer = window.compatibilityLayer || chrome;
            return await compatibilityLayer.runtime.sendMessage(message);
        } catch (error) {
            console.error('Background mesaj gönderme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Bildirim göster
     */
    showNotification(data) {
        // Basit bildirim sistemi
        const notification = document.createElement('div');
        notification.className = 'gemini-notification';
        notification.textContent = data.message;
        
        // Stil ekle
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color, #4285f4);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        // 3 saniye sonra kaldır
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    /**
     * Ana popup'ı aç
     */
    openMainPopup() {
        // Extension popup'ını aç
        const compatibilityLayer = window.compatibilityLayer || chrome;
        if (compatibilityLayer.action && compatibilityLayer.action.openPopup) {
            compatibilityLayer.action.openPopup();
        }
    }

    /**
     * Content script'i temizle
     */
    destroy() {
        // Event listener'ları kaldır
        document.removeEventListener('mouseup', this.handleTextSelection);
        document.removeEventListener('keyup', this.handleTextSelection);
        document.removeEventListener('click', this.handleDocumentClick);
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);
        
        // Component'leri temizle
        if (this.instantTranslator) {
            this.instantTranslator.destroy();
        }
        
        if (this.translationOverlay) {
            this.translationOverlay.destroy();
        }
        
        // Seçimi temizle
        this.clearCurrentSelection();
        
        this.isInitialized = false;
    }
}

// Content script'i başlat
const contentScript = new ContentScriptController();

// Sayfa kapatılırken temizle
window.addEventListener('beforeunload', () => {
    contentScript.destroy();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentScriptController;
}
