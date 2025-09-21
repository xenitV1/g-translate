/**
 * Translation Overlay
 * Çeviri sonuçlarını göstermek için overlay sistemi
 */

class TranslationOverlay {
    constructor() {
        this.overlay = null;
        this.isVisible = false;
        this.currentTranslation = null;
        this.overlayOffset = 5;
        this.autoHideTimeout = null;
        this.autoHideDelay = 5000;
        
        this.init();
    }

    /**
     * Translation overlay'ı başlat
     */
    init() {
        this.createOverlayElement();
        this.attachEventListeners();
    }

    /**
     * Overlay element'ini oluştur
     */
    createOverlayElement() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'gemini-translate-overlay';
        this.overlay.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #dadce0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 16px;
            z-index: 10001;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 400px;
            min-width: 250px;
            display: none;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            pointer-events: auto;
        `;
        
        this.overlay.innerHTML = `
            <div class="overlay-header">
                <div class="overlay-title">
                    <span class="icon">🔤</span>
                    <span class="text">Çeviri Sonucu</span>
                </div>
                <div class="overlay-actions">
                    <button class="copy-btn" title="Kopyala">
                        <span class="btn-icon">📋</span>
                    </button>
                    <button class="save-btn" title="Kaydet">
                        <span class="btn-icon">💾</span>
                    </button>
                    <button class="close-btn" title="Kapat">×</button>
                </div>
            </div>
            
            <div class="overlay-content">
                <div class="translation-info">
                    <div class="language-pair">
                        <span class="source-lang"></span>
                        <span class="arrow">→</span>
                        <span class="target-lang"></span>
                    </div>
                    <div class="confidence-score" style="display: none;">
                        <span class="confidence-label">Güven:</span>
                        <span class="confidence-value"></span>
                    </div>
                </div>
                
                <div class="original-text">
                    <div class="text-label">Orijinal:</div>
                    <div class="text-content original"></div>
                </div>
                
                <div class="translated-text">
                    <div class="text-label">Çeviri:</div>
                    <div class="text-content translated"></div>
                </div>
                
                <div class="overlay-actions-bottom">
                    <button class="translate-again-btn">
                        <span class="btn-icon">🔄</span>
                        <span class="btn-text">Tekrar Çevir</span>
                    </button>
                    <button class="open-popup-btn">
                        <span class="btn-icon">🔧</span>
                        <span class="btn-text">Ayarlar</span>
                    </button>
                </div>
            </div>
            
            <div class="overlay-footer">
                <div class="timestamp"></div>
                <div class="powered-by">
                    <span>Powered by</span>
                    <span class="gemini-logo">Gemini</span>
                </div>
            </div>
        `;
        
        // Stil ekle
        this.addOverlayStyles();
        
        // Document'a ekle
        document.body.appendChild(this.overlay);
    }

    /**
     * Overlay stillerini ekle
     */
    addOverlayStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .gemini-translate-overlay {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .gemini-translate-overlay .overlay-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid #e8eaed;
            }
            
            .gemini-translate-overlay .overlay-title {
                display: flex;
                align-items: center;
                font-weight: 600;
                color: #202124;
                font-size: 16px;
            }
            
            .gemini-translate-overlay .overlay-title .icon {
                margin-right: 8px;
                font-size: 18px;
            }
            
            .gemini-translate-overlay .overlay-actions {
                display: flex;
                gap: 4px;
            }
            
            .gemini-translate-overlay .overlay-actions button {
                background: none;
                border: none;
                padding: 6px;
                border-radius: 4px;
                cursor: pointer;
                color: #5f6368;
                font-size: 14px;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 32px;
                height: 32px;
            }
            
            .gemini-translate-overlay .overlay-actions button:hover {
                background-color: #f1f3f4;
                color: #202124;
            }
            
            .gemini-translate-overlay .overlay-actions .close-btn {
                font-size: 18px;
                font-weight: bold;
            }
            
            .gemini-translate-overlay .translation-info {
                margin-bottom: 16px;
            }
            
            .gemini-translate-overlay .language-pair {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                color: #5f6368;
                margin-bottom: 8px;
            }
            
            .gemini-translate-overlay .source-lang,
            .gemini-translate-overlay .target-lang {
                background: #f8f9fa;
                padding: 4px 8px;
                border-radius: 4px;
                font-weight: 500;
            }
            
            .gemini-translate-overlay .arrow {
                color: #4285f4;
                font-weight: bold;
            }
            
            .gemini-translate-overlay .confidence-score {
                font-size: 12px;
                color: #5f6368;
            }
            
            .gemini-translate-overlay .confidence-value {
                font-weight: 500;
                color: #34a853;
            }
            
            .gemini-translate-overlay .original-text,
            .gemini-translate-overlay .translated-text {
                margin-bottom: 16px;
            }
            
            .gemini-translate-overlay .text-label {
                font-size: 12px;
                color: #5f6368;
                margin-bottom: 6px;
                font-weight: 500;
            }
            
            .gemini-translate-overlay .text-content {
                background: #f8f9fa;
                padding: 12px;
                border-radius: 6px;
                font-size: 14px;
                line-height: 1.5;
                word-wrap: break-word;
                max-height: 120px;
                overflow-y: auto;
            }
            
            .gemini-translate-overlay .text-content.translated {
                background: #e8f5e8;
                border-left: 3px solid #34a853;
            }
            
            .gemini-translate-overlay .overlay-actions-bottom {
                display: flex;
                gap: 8px;
                margin-top: 16px;
            }
            
            .gemini-translate-overlay .translate-again-btn,
            .gemini-translate-overlay .open-popup-btn {
                flex: 1;
                padding: 10px 16px;
                border: 1px solid #dadce0;
                border-radius: 6px;
                background: white;
                color: #5f6368;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                transition: all 0.2s;
            }
            
            .gemini-translate-overlay .translate-again-btn:hover,
            .gemini-translate-overlay .open-popup-btn:hover {
                background: #f8f9fa;
                border-color: #4285f4;
                color: #4285f4;
            }
            
            .gemini-translate-overlay .overlay-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 16px;
                padding-top: 12px;
                border-top: 1px solid #e8eaed;
                font-size: 11px;
                color: #5f6368;
            }
            
            .gemini-translate-overlay .powered-by {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .gemini-translate-overlay .gemini-logo {
                font-weight: 600;
                color: #4285f4;
            }
            
            .gemini-translate-overlay.show {
                display: block;
                opacity: 1;
                transform: translateY(0);
            }
            
            .gemini-translate-overlay .btn-icon {
                font-size: 12px;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Event listener'ları ekle
     */
    attachEventListeners() {
        // Close button
        this.overlay.querySelector('.close-btn').addEventListener('click', () => {
            this.hideOverlay();
        });
        
        // Copy button
        this.overlay.querySelector('.copy-btn').addEventListener('click', () => {
            this.copyTranslation();
        });
        
        // Save button
        this.overlay.querySelector('.save-btn').addEventListener('click', () => {
            this.saveTranslation();
        });
        
        // Translate again button
        this.overlay.querySelector('.translate-again-btn').addEventListener('click', () => {
            this.translateAgain();
        });
        
        // Open popup button
        this.overlay.querySelector('.open-popup-btn').addEventListener('click', () => {
            this.openMainPopup();
        });
        
        // Click outside to close
        document.addEventListener('click', (event) => {
            if (!this.overlay.contains(event.target) && this.isVisible) {
                this.hideOverlay();
            }
        });
        
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            if (this.isVisible) {
                if (event.key === 'Escape') {
                    this.hideOverlay();
                } else if (event.key === 'c' && event.ctrlKey) {
                    event.preventDefault();
                    this.copyTranslation();
                }
            }
        });
    }

    /**
     * Overlay'ı göster
     */
    showOverlay(translation, position = null) {
        if (this.isVisible) {
            this.hideOverlay();
        }
        
        this.currentTranslation = translation;
        this.updateOverlayContent();
        this.positionOverlay(position);
        this.showOverlayElement();
        this.startAutoHide();
    }

    /**
     * Overlay'ı gizle
     */
    hideOverlay() {
        if (!this.isVisible) return;
        
        this.clearAutoHide();
        this.hideOverlayElement();
        this.currentTranslation = null;
    }

    /**
     * Overlay element'ini göster
     */
    showOverlayElement() {
        this.overlay.style.display = 'block';
        this.isVisible = true;
        
        // Animation için kısa gecikme
        setTimeout(() => {
            this.overlay.classList.add('show');
        }, 10);
    }

    /**
     * Overlay element'ini gizle
     */
    hideOverlayElement() {
        this.overlay.classList.remove('show');
        this.isVisible = false;
        
        // Animation tamamlandıktan sonra gizle
        setTimeout(() => {
            this.overlay.style.display = 'none';
        }, 300);
    }

    /**
     * Overlay içeriğini güncelle
     */
    updateOverlayContent() {
        if (!this.currentTranslation) return;
        
        // Dil bilgilerini güncelle
        const sourceLang = this.overlay.querySelector('.source-lang');
        const targetLang = this.overlay.querySelector('.target-lang');
        sourceLang.textContent = this.currentTranslation.sourceLanguage.name;
        targetLang.textContent = this.currentTranslation.targetLanguage.name;
        
        // Güven skorunu göster
        if (this.currentTranslation.confidence) {
            const confidenceScore = this.overlay.querySelector('.confidence-score');
            const confidenceValue = this.overlay.querySelector('.confidence-value');
            confidenceValue.textContent = `${Math.round(this.currentTranslation.confidence * 100)}%`;
            confidenceScore.style.display = 'block';
        }
        
        // Orijinal metni göster
        const originalText = this.overlay.querySelector('.text-content.original');
        originalText.textContent = this.currentTranslation.originalText;
        
        // Çeviri metnini göster
        const translatedText = this.overlay.querySelector('.text-content.translated');
        translatedText.textContent = this.currentTranslation.translatedText;
        
        // Timestamp'i güncelle
        const timestamp = this.overlay.querySelector('.timestamp');
        timestamp.textContent = new Date(this.currentTranslation.timestamp).toLocaleTimeString();
    }

    /**
     * Overlay pozisyonunu ayarla
     */
    positionOverlay(position = null) {
        if (position) {
            // Belirtilen pozisyonda göster
            this.overlay.style.left = `${position.x}px`;
            this.overlay.style.top = `${position.y}px`;
        } else if (this.currentTranslation && this.currentTranslation.rect) {
            // Seçim pozisyonuna göre ayarla
            const rect = this.currentTranslation.rect;
            const overlayRect = this.overlay.getBoundingClientRect();
            
            // Viewport boyutları
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Pozisyon hesapla
            let left = rect.left + (rect.width / 2) - (overlayRect.width / 2);
            let top = rect.bottom + this.overlayOffset;
            
            // Viewport sınırlarını kontrol et
            if (left < 10) {
                left = 10;
            } else if (left + overlayRect.width > viewportWidth - 10) {
                left = viewportWidth - overlayRect.width - 10;
            }
            
            if (top + overlayRect.height > viewportHeight - 10) {
                // Yukarıda göster
                top = rect.top - overlayRect.height - this.overlayOffset;
            }
            
            // Pozisyonu ayarla
            this.overlay.style.left = `${left}px`;
            this.overlay.style.top = `${top}px`;
        } else {
            // Merkezde göster
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const overlayRect = this.overlay.getBoundingClientRect();
            
            this.overlay.style.left = `${(viewportWidth - overlayRect.width) / 2}px`;
            this.overlay.style.top = `${(viewportHeight - overlayRect.height) / 2}px`;
        }
    }

    /**
     * Çeviriyi kopyala
     */
    async copyTranslation() {
        if (!this.currentTranslation) return;
        
        try {
            await navigator.clipboard.writeText(this.currentTranslation.translatedText);
            
            // Başarı göstergesi
            this.showCopySuccess();
            
        } catch (error) {
            console.error('Kopyalama hatası:', error);
        }
    }

    /**
     * Kopyalama başarı göstergesi
     */
    showCopySuccess() {
        const copyBtn = this.overlay.querySelector('.copy-btn');
        const originalContent = copyBtn.innerHTML;
        
        copyBtn.innerHTML = '<span class="btn-icon">✓</span>';
        copyBtn.style.color = '#34a853';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalContent;
            copyBtn.style.color = '';
        }, 2000);
    }

    /**
     * Çeviriyi kaydet
     */
    async saveTranslation() {
        if (!this.currentTranslation) return;
        
        try {
            // Background script'e kaydetme isteği gönder
            const response = await this.sendMessageToBackground({
                type: APP_CONSTANTS.MESSAGE_TYPES.SAVE_HISTORY,
                data: this.currentTranslation
            });
            
            if (response.success) {
                this.showSaveSuccess();
            } else {
                console.error('Kaydetme hatası:', response.error);
            }
            
        } catch (error) {
            console.error('Kaydetme hatası:', error);
        }
    }

    /**
     * Kaydetme başarı göstergesi
     */
    showSaveSuccess() {
        const saveBtn = this.overlay.querySelector('.save-btn');
        const originalContent = saveBtn.innerHTML;
        
        saveBtn.innerHTML = '<span class="btn-icon">✓</span>';
        saveBtn.style.color = '#34a853';
        
        setTimeout(() => {
            saveBtn.innerHTML = originalContent;
            saveBtn.style.color = '';
        }, 2000);
    }

    /**
     * Tekrar çevir
     */
    translateAgain() {
        if (!this.currentTranslation) return;
        
        // Ana popup'ı aç ve metni gönder
        this.openMainPopup();
        
        // Overlay'ı gizle
        this.hideOverlay();
    }

    /**
     * Ana popup'ı aç
     */
    openMainPopup() {
        // Background script'e popup açma isteği gönder
        this.sendMessageToBackground({
            type: APP_CONSTANTS.MESSAGE_TYPES.OPEN_POPUP,
            data: { 
                text: this.currentTranslation ? this.currentTranslation.originalText : ''
            }
        });
    }

    /**
     * Auto-hide başlat
     */
    startAutoHide() {
        this.clearAutoHide();
        this.autoHideTimeout = setTimeout(() => {
            this.hideOverlay();
        }, this.autoHideDelay);
    }

    /**
     * Auto-hide temizle
     */
    clearAutoHide() {
        if (this.autoHideTimeout) {
            clearTimeout(this.autoHideTimeout);
            this.autoHideTimeout = null;
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
     * Overlay görünür mü kontrol et
     */
    isOverlayVisible() {
        return this.isVisible;
    }

    /**
     * Translation overlay'ı temizle
     */
    destroy() {
        this.hideOverlay();
        this.clearAutoHide();
        
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        
        this.overlay = null;
        this.currentTranslation = null;
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TranslationOverlay;
}

if (typeof window !== 'undefined' && !window.TranslationOverlay) {
    window.TranslationOverlay = TranslationOverlay;
}
