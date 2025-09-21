/**
 * Instant Translator
 * Seçilen metin için anında çeviri popup'ı
 */

class InstantTranslator {
    constructor() {
        this.popup = null;
        this._isVisible = false;
        this.isTranslating = false;
        this.currentSelection = null;
        this.autoHideTimeout = null;
        this.autoHideDelay = 3000;
        this.popupOffset = 10;

        this.init();
    }

    /**
     * Instant translator'ı başlat
     */
    init() {
        this.createPopupElement();
        this.attachEventListeners();
    }

    /**
     * Popup element'ini oluştur
     */
    createPopupElement() {
        this.popup = document.createElement('div');
        this.popup.className = 'gemini-translate-popup';
        this.popup.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #dadce0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 12px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 300px;
            min-width: 200px;
            display: none;
            opacity: 0;
            transform: translateY(-5px);
            transition: all 0.2s ease;
        `;
        
        this.popup.innerHTML = `
            <div class="popup-header">
                <div class="popup-title">
                    <span class="icon">🔤</span>
                    <span class="text">Gemini Translate</span>
                </div>
                <button class="close-btn" aria-label="Kapat">×</button>
            </div>
            
            <div class="popup-content">
                <div class="selected-text">
                    <div class="text-label">Seçilen metin:</div>
                    <div class="text-content"></div>
                </div>
                
                <div class="language-selection">
                    <div class="language-label">Çevir:</div>
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
                    <div class="detection-label">Kaynak dil:</div>
                    <div class="detection-content">
                        <span class="ai-icon">🤖</span>
                        <span class="detected-language">Tespit ediliyor...</span>
                    </div>
                </div>
                
                <div class="action-buttons">
                    <button class="translate-btn" disabled>
                        <span class="btn-icon">🔤</span>
                        <span class="btn-text">Çevir</span>
                    </button>
                    <button class="copy-btn" disabled>
                        <span class="btn-icon">📋</span>
                        <span class="btn-text">Kopyala</span>
                    </button>
                </div>
                
                <div class="translation-result" style="display: none;">
                    <div class="result-label">Çeviri:</div>
                    <div class="result-content"></div>
                </div>
                
                <div class="loading-indicator" style="display: none;">
                    <div class="spinner"></div>
                    <span class="loading-text">Çevriliyor...</span>
                </div>
            </div>
        `;
        
        // Stil ekle
        this.addPopupStyles();
        
        // Document'a ekle
        document.body.appendChild(this.popup);
    }

    /**
     * Popup stillerini ekle
     */
    addPopupStyles() {
        const style = document.createElement('style');
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
     * Event listener'ları ekle
     */
    attachEventListeners() {
        // Close button
        this.popup.querySelector('.close-btn').addEventListener('click', () => {
            this.hidePopup();
        });
        
        // Translate button
        this.popup.querySelector('.translate-btn').addEventListener('click', () => {
            this.translateText();
        });
        
        // Copy button
        this.popup.querySelector('.copy-btn').addEventListener('click', () => {
            this.copyResult();
        });
        
        // Language selection
        this.popup.querySelector('.target-language').addEventListener('change', () => {
            this.onLanguageChange();
        });
        
        // Click outside to close
        document.addEventListener('click', (event) => {
            if (!this.popup.contains(event.target) && this._isVisible) {
                this.hidePopup();
            }
        });
        
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            if (this._isVisible) {
                if (event.key === 'Escape') {
                    this.hidePopup();
                } else if (event.key === 'Enter' && event.ctrlKey) {
                    this.translateText();
                }
            }
        });
    }

    /**
     * Popup'ı göster
     */
    showPopup(selection) {
        if (this.isVisible) {
            this.hidePopup();
        }
        
        this.currentSelection = selection;
        this.updatePopupContent();
        this.positionPopup();
        this.showPopupElement();
        this.startAutoHide();
    }

    /**
     * Popup'ı gizle
     */
    hidePopup() {
        if (!this.isVisible) return;
        
        this.clearAutoHide();
        this.hidePopupElement();
        this.currentSelection = null;
    }

    /**
     * Popup element'ini göster
     */
    showPopupElement() {
        this.popup.style.display = 'block';
        this._isVisible = true;

        // Animation için kısa gecikme
        setTimeout(() => {
            this.popup.classList.add('show');
        }, 10);
    }

    /**
     * Popup element'ini gizle
     */
    hidePopupElement() {
        this.popup.classList.remove('show');
        this._isVisible = false;

        // Animation tamamlandıktan sonra gizle
        setTimeout(() => {
            this.popup.style.display = 'none';
        }, 200);
    }

    /**
     * Popup içeriğini güncelle
     */
    updatePopupContent() {
        if (!this.currentSelection) return;
        
        // Seçilen metni göster
        const textContent = this.popup.querySelector('.text-content');
        textContent.textContent = this.currentSelection.text;
        
        // Dil tespiti başlat
        this.detectLanguage();
        
        // Butonları etkinleştir
        this.popup.querySelector('.translate-btn').disabled = false;
    }

    /**
     * Popup pozisyonunu ayarla
     */
    positionPopup() {
        if (!this.currentSelection) return;

        const rect = this.currentSelection.rect;
        const popup = this.popup;
        const popupRect = popup.getBoundingClientRect();

        // Viewport boyutları
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left, top;

        if (rect && typeof rect.left === 'number' && typeof rect.top === 'number' && typeof rect.width === 'number' && typeof rect.bottom === 'number') {
            // Pozisyon hesapla - rect mevcut ve geçerli
            left = rect.left + (rect.width / 2) - (popupRect.width / 2);
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
            console.warn('Selection rect mevcut değil veya geçersiz, varsayılan pozisyon kullanılıyor');

            // Mouse pozisyonunu almaya çalış
            const mouseX = window.mouseX || (viewportWidth / 2);
            const mouseY = window.mouseY || (viewportHeight / 2);

            left = mouseX - (popupRect.width / 2);
            top = mouseY + 20; // Mouse'un altında göster

            // Viewport sınırlarını kontrol et
            if (left < 10) left = 10;
            if (left + popupRect.width > viewportWidth - 10) left = viewportWidth - popupRect.width - 10;
            if (top + popupRect.height > viewportHeight - 10) top = viewportHeight - popupRect.height - 10;
            if (top < 10) top = 10;
        }

        // Pozisyonu ayarla
        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
    }

    /**
     * Dil tespiti
     */
    async detectLanguage() {
        const detectionContent = this.popup.querySelector('.detected-language');
        detectionContent.textContent = 'Tespit ediliyor...';
        
        try {
            // Background script'e dil tespiti isteği gönder
            const response = await this.sendMessageToBackground({
                type: APP_CONSTANTS.MESSAGE_TYPES.DETECT_LANGUAGE,
                data: { text: this.currentSelection.text }
            });
            
            if (response.success) {
                const language = response.data;
                detectionContent.textContent = `Kaynak dil: ${language.name}`;
            } else if (response.contextLost) {
                detectionContent.textContent = 'Extension bağlantısı kesildi';
                this.showError('Extension yeniden yüklendi. Lütfen sayfayı yenileyin.');
            } else {
                detectionContent.textContent = 'Dil tespit edilemedi';
            }
            
        } catch (error) {
            console.error('Dil tespiti hatası:', error);

            // Extension context kaybı durumunda popup'ı kapat
            if (error.message.includes('Extension context invalidated') ||
                error.message.includes('context invalidated') ||
                (error.message && error.message.includes('runtime'))) {

                detectionContent.textContent = 'Extension bağlantısı kesildi';
                this.showError('Extension yeniden yüklendi. Sayfa yenileniyor...');

                // 2 saniye sonra popup'ı kapat ve sayfayı yenile
                setTimeout(() => {
                    this.hidePopup();
                    window.location.reload();
                }, 2000);
            } else {
                detectionContent.textContent = 'Dil tespiti başarısız';
            }
        }
    }

    /**
     * Metin çevir
     */
    async translateText() {
        if (this.isTranslating) return;
        
        try {
            this.isTranslating = true;
            this.showLoadingState();
            
            const targetLanguage = this.popup.querySelector('.target-language').value;
            
            // Background script'e çeviri isteği gönder
            const response = await this.sendMessageToBackground({
                type: APP_CONSTANTS.MESSAGE_TYPES.TRANSLATE_TEXT,
                data: { 
                    text: this.currentSelection.text,
                    targetLanguage: targetLanguage
                }
            });
            
            if (response.success) {
                this.showTranslationResult(response.data);
            } else if (response.contextLost) {
                this.showError('Extension yeniden yüklendi. Lütfen sayfayı yenileyin.');
            } else {
                this.showError(response.error || 'Çeviri başarısız oldu');
            }
            
        } catch (error) {
            console.error('Çeviri hatası:', error);

            // Extension context kaybı durumunda popup'ı kapat
            if (error.message.includes('Extension context invalidated') ||
                error.message.includes('context invalidated') ||
                (error.message && error.message.includes('runtime'))) {

                this.showError('Extension yeniden yüklendi. Sayfa yenileniyor...');

                // 2 saniye sonra popup'ı kapat ve sayfayı yenile
                setTimeout(() => {
                    this.hidePopup();
                    window.location.reload();
                }, 2000);
            } else {
                this.showError('Çeviri işlemi başarısız oldu');
            }
        } finally {
            this.isTranslating = false;
            this.hideLoadingState();
        }
    }

    /**
     * Çeviri sonucunu göster
     */
    showTranslationResult(translation) {
        const resultDiv = this.popup.querySelector('.translation-result');
        const resultContent = this.popup.querySelector('.result-content');
        
        resultContent.textContent = translation.translatedText;
        resultDiv.style.display = 'block';
        
        // Copy butonunu etkinleştir
        this.popup.querySelector('.copy-btn').disabled = false;
        
        // Auto-hide'ı durdur
        this.clearAutoHide();
    }

    /**
     * Hata göster
     */
    showError(message) {
        const resultDiv = this.popup.querySelector('.translation-result');
        const resultContent = this.popup.querySelector('.result-content');
        
        resultContent.textContent = `Hata: ${message}`;
        resultContent.style.background = '#ffebee';
        resultContent.style.color = '#c62828';
        resultDiv.style.display = 'block';
    }

    /**
     * Loading durumunu göster
     */
    showLoadingState() {
        this.popup.querySelector('.loading-indicator').style.display = 'flex';
        this.popup.querySelector('.translate-btn').disabled = true;
    }

    /**
     * Loading durumunu gizle
     */
    hideLoadingState() {
        this.popup.querySelector('.loading-indicator').style.display = 'none';
        this.popup.querySelector('.translate-btn').disabled = false;
    }

    /**
     * Sonucu kopyala
     */
    async copyResult() {
        const resultContent = this.popup.querySelector('.result-content');
        const text = resultContent.textContent;
        
        try {
            await navigator.clipboard.writeText(text);
            
            // Başarı göstergesi
            const copyBtn = this.popup.querySelector('.copy-btn');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span class="btn-icon">✓</span><span class="btn-text">Kopyalandı!</span>';
            copyBtn.style.background = '#e8f5e8';
            copyBtn.style.color = '#2e7d32';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.background = '';
                copyBtn.style.color = '';
            }, 2000);
            
        } catch (error) {
            console.error('Kopyalama hatası:', error);
        }
    }

    /**
     * Dil değişimi
     */
    onLanguageChange() {
        // Eğer çeviri yapılmışsa, yeni dil ile tekrar çevir
        if (this.popup.querySelector('.translation-result').style.display !== 'none') {
            this.translateText();
        }
    }

    /**
     * Auto-hide başlat
     */
    startAutoHide() {
        this.clearAutoHide();
        this.autoHideTimeout = setTimeout(() => {
            this.hidePopup();
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

            // Extension context kontrolü
            if (!compatibilityLayer || !compatibilityLayer.runtime) {
                throw new Error('Extension context invalidated');
            }

            // Extension ID kontrolü (context kaybının erken tespiti)
            if (!compatibilityLayer.runtime.id) {
                throw new Error('Extension context invalidated');
            }

            // Promise ile mesaj gönder
            return new Promise((resolve, reject) => {
                try {
                    compatibilityLayer.runtime.sendMessage(message, (response) => {
                        // Chrome runtime error kontrolü
                        if (chrome.runtime.lastError) {
                            // Extension context invalidated kontrolü
                            if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
                                reject(new Error('Extension context invalidated'));
                            } else {
                                reject(new Error(chrome.runtime.lastError.message));
                            }
                        } else {
                            resolve(response);
                        }
                    });
                } catch (syncError) {
                    reject(syncError);
                }
            });

        } catch (error) {
            console.error('Background mesaj gönderme hatası:', error);

            // Extension context invalidated hatası için özel kontrol
            if (error.message.includes('Extension context invalidated') ||
                error.message.includes('context invalidated')) {
                console.warn('Extension context kaybı tespit edildi');

                // Hemen context lost döndür
                return {
                    success: false,
                    error: 'Extension yeniden yüklendi. Sayfa yenileniyor...',
                    contextLost: true
                };
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * Popup görünür mü kontrol et
     */
    isPopupVisible() {
        return this._isVisible;
    }

    /**
     * Instant translator'ı temizle
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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InstantTranslator;
}

if (typeof window !== 'undefined' && !window.InstantTranslator) {
    window.InstantTranslator = InstantTranslator;
}
