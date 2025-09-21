/**
 * Gemini Translate Popup Logic
 * Popup arayüzü için JavaScript fonksiyonları
 */

class PopupController {
    constructor() {
        this.currentTranslation = null;
        this.isTranslating = false;
        this.settings = null;

        this.init();
    }

    /**
     * Background'a mesaj gönder
     */
    async sendMessageToBackground(message) {
        return new Promise((resolve, reject) => {
            const compatibilityLayer = window.compatibilityLayer || chrome;

            if (!compatibilityLayer || !compatibilityLayer.runtime) {
                reject(new Error('Browser API mevcut değil'));
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
     * Popup'ı başlat
     */
    async init() {
        try {
            // DOM elementlerini al
            this.elements = this.getElements();
            
            // API handler background'da yönetiliyor
            
            // Ayarları yükle
            await this.loadSettings();
            
            // Event listener'ları ekle
            this.attachEventListeners();
            
            // API durumunu kontrol et
            await this.checkAPIStatus();
            
            // Varsayılan hedef dili ayarla
            this.setDefaultTargetLanguage();
            
            console.log('Popup başlatıldı');
        } catch (error) {
            console.error('Popup başlatma hatası:', error);
            this.showError('Popup başlatılamadı');
        }
    }

    /**
     * DOM elementlerini al
     */
    getElements() {
        return {
            // Input elements
            textInput: document.getElementById('text-input'),
            charCount: document.getElementById('char-count'),
            clearBtn: document.getElementById('clear-btn'),
            
            // Language elements
            targetLanguage: document.getElementById('target-language'),
            detectionIndicator: document.getElementById('detection-indicator'),
            
            // Action elements
            translateBtn: document.getElementById('translate-btn'),
            
            // Result elements
            resultSection: document.getElementById('result-section'),
            translatedText: document.getElementById('translated-text'),
            sourceLang: document.getElementById('source-lang'),
            targetLang: document.getElementById('target-lang'),
            confidenceScore: document.getElementById('confidence-score'),
            copyBtn: document.getElementById('copy-btn'),
            saveBtn: document.getElementById('save-btn'),
            
            // State elements
            loadingSection: document.getElementById('loading-section'),
            loadingText: document.getElementById('loading-text'),
            errorSection: document.getElementById('error-section'),
            errorMessage: document.getElementById('error-message'),
            retryBtn: document.getElementById('retry-btn'),
            
            // Header elements
            settingsBtn: document.getElementById('settings-btn'),
            historyBtn: document.getElementById('history-btn'),
            
            // Footer elements
            apiStatus: document.getElementById('api-status'),
            helpBtn: document.getElementById('help-btn')
        };
    }

    /**
     * Event listener'ları ekle
     */
    attachEventListeners() {
        // Text input events
        this.elements.textInput.addEventListener('input', this.handleTextInput.bind(this));
        this.elements.textInput.addEventListener('paste', this.handlePaste.bind(this));
        
        // Button events
        this.elements.clearBtn.addEventListener('click', this.clearText.bind(this));
        this.elements.translateBtn.addEventListener('click', this.translateText.bind(this));
        this.elements.copyBtn.addEventListener('click', this.copyResult.bind(this));
        this.elements.saveBtn.addEventListener('click', this.saveTranslation.bind(this));
        this.elements.retryBtn.addEventListener('click', this.translateText.bind(this));
        
        // Language selection events
        this.elements.targetLanguage.addEventListener('change', this.handleLanguageChange.bind(this));
        
        // Header button events
        this.elements.settingsBtn.addEventListener('click', this.openSettings.bind(this));
        this.elements.historyBtn.addEventListener('click', this.openHistory.bind(this));
        
        // Footer button events
        this.elements.helpBtn.addEventListener('click', this.openHelp.bind(this));
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
        
        // Auto-resize textarea
        this.elements.textInput.addEventListener('input', this.autoResizeTextarea.bind(this));
    }

    /**
     * Ayarları yükle
     */
    async loadSettings() {
        try {
            const response = await this.sendMessageToBackground({
                type: APP_CONSTANTS.MESSAGE_TYPES.GET_SETTINGS
            });

            if (response.success && response.data) {
                this.settings = response.data;
            } else {
                this.settings = APP_CONSTANTS.DEFAULT_SETTINGS;
            }

            // Hedef dili ayarla
            if (this.settings.targetLanguage) {
                this.elements.targetLanguage.value = this.settings.targetLanguage;
            }

        } catch (error) {
            console.error('Ayarlar yükleme hatası:', error);
            this.settings = APP_CONSTANTS.DEFAULT_SETTINGS;
        }
    }

    /**
     * Ayarları kaydet
     */
    async saveSettings() {
        try {
            await this.sendMessageToBackground({
                type: APP_CONSTANTS.MESSAGE_TYPES.SAVE_SETTINGS,
                data: this.settings
            });
        } catch (error) {
            console.error('Ayarlar kaydetme hatası:', error);
        }
    }

    /**
     * API durumunu kontrol et
     */
    async checkAPIStatus() {
        try {
            const response = await this.sendMessageToBackground({
                type: APP_CONSTANTS.MESSAGE_TYPES.GET_CURRENT_API
            });

            if (response.success && response.data) {
                this.elements.apiStatus.textContent = `${response.data.name} aktif`;
                this.elements.apiStatus.style.color = 'var(--success-color)';
            } else {
                this.elements.apiStatus.textContent = 'API seçilmemiş';
                this.elements.apiStatus.style.color = 'var(--warning-color)';
            }
        } catch (error) {
            console.error('API durumu kontrol hatası:', error);
            this.elements.apiStatus.textContent = 'API bağlantısı hatası';
            this.elements.apiStatus.style.color = 'var(--error-color)';
        }
    }

    /**
     * Varsayılan hedef dili ayarla
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
            this.elements.charCount.style.color = 'var(--error-color)';
            this.elements.textInput.style.borderColor = 'var(--error-color)';
        } else if (count > maxLength * 0.8) {
            this.elements.charCount.style.color = 'var(--warning-color)';
            this.elements.textInput.style.borderColor = 'var(--warning-color)';
        } else {
            this.elements.charCount.style.color = 'var(--text-muted)';
            this.elements.textInput.style.borderColor = '';
        }
    }

    /**
     * Çevir butonunu güncelle
     */
    updateTranslateButton() {
        const text = this.elements.textInput.value.trim();
        const isValid = text.length > 0 && text.length <= APP_CONSTANTS.MAX_TEXT_LENGTH;
        
        this.elements.translateBtn.disabled = !isValid || this.isTranslating;
    }

    /**
     * Otomatik dil tespiti
     */
    async autoDetectLanguage(text) {
        if (!text.trim() || text.length < 3) {
            this.updateDetectionIndicator('Kaynak dil tespit edilecek', 'auto');
            return;
        }

        try {
            this.updateDetectionIndicator('Dil tespit ediliyor...', 'detecting');

            const response = await this.sendMessageToBackground({
                type: APP_CONSTANTS.MESSAGE_TYPES.DETECT_LANGUAGE,
                data: { text: text }
            });

            if (response.success && response.data) {
                const detectedLang = response.data;
                if (detectedLang && detectedLang.code !== 'auto') {
                    this.updateDetectionIndicator(`Kaynak dil: ${detectedLang.name}`, detectedLang.code);
                } else {
                    this.updateDetectionIndicator('Kaynak dil belirsiz', 'unknown');
                }
            } else {
                this.updateDetectionIndicator('Dil tespiti başarısız', 'error');
            }
        } catch (error) {
            console.error('Dil tespiti hatası:', error);
            this.updateDetectionIndicator('Dil tespiti başarısız', 'error');
        }
    }

    /**
     * Dil tespiti göstergesini güncelle
     */
    updateDetectionIndicator(message, status) {
        const detectedLanguage = this.elements.detectionIndicator.querySelector('.detected-language');
        detectedLanguage.textContent = message;
        
        // Status'a göre stil güncelle
        this.elements.detectionIndicator.className = 'detection-indicator';
        
        switch (status) {
            case 'detecting':
                this.elements.detectionIndicator.classList.add('detecting');
                break;
            case 'error':
                this.elements.detectionIndicator.classList.add('error');
                break;
            case 'success':
                this.elements.detectionIndicator.classList.add('success');
                break;
        }
    }

    /**
     * Metin temizle
     */
    clearText() {
        this.elements.textInput.value = '';
        this.updateCharCount('');
        this.updateTranslateButton();
        this.updateDetectionIndicator('Kaynak dil tespit edilecek', 'auto');
        this.hideAllSections();
        this.elements.textInput.focus();
    }

    /**
     * Dil değişimi işleyici
     */
    handleLanguageChange(event) {
        const targetLanguage = event.target.value;
        
        // Ayarları güncelle
        if (this.settings) {
            this.settings.targetLanguage = targetLanguage;
            this.saveSettings();
        }
        
        // Eğer çeviri yapılmışsa, yeni dil ile tekrar çevir
        if (this.currentTranslation) {
            this.translateText();
        }
    }

    /**
     * Çeviri işlemi
     */
    async translateText() {
        const text = this.elements.textInput.value.trim();
        const targetLanguage = this.elements.targetLanguage.value;
        
        if (!text || text.length === 0) {
            this.showError('Lütfen çevrilecek metni girin');
            return;
        }
        
        if (text.length > APP_CONSTANTS.MAX_TEXT_LENGTH) {
            this.showError('Metin çok uzun. Maksimum 5000 karakter olabilir.');
            return;
        }

        try {
            this.setLoadingState(true);
            this.hideAllSections();
            
            this.elements.loadingText.textContent = 'Çevriliyor...';
            this.elements.loadingSection.style.display = 'flex';
            
            // Çeviri işlemi - background'a mesaj gönder
            const response = await this.sendMessageToBackground({
                type: APP_CONSTANTS.MESSAGE_TYPES.TRANSLATE_TEXT,
                data: {
                    text: text,
                    targetLanguage: targetLanguage,
                    sourceLanguage: null
                }
            });

            if (!response.success) {
                throw new Error(response.error || 'Çeviri başarısız oldu');
            }

            const result = response.data;
            
            // Sonucu göster
            this.showTranslationResult(result);
            
            // Geçmişe kaydet
            await this.saveToHistory(result);
            
        } catch (error) {
            console.error('Çeviri hatası:', error);
            this.showError(error.message || 'Çeviri başarısız oldu');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Çeviri sonucunu göster
     */
    showTranslationResult(result) {
        this.currentTranslation = result;

        // Önce tüm bölümleri gizle (özellikle loading section'ı)
        this.hideAllSections();

        // Dil bilgilerini güncelle
        this.elements.sourceLang.textContent = result.sourceLanguage.name;
        this.elements.targetLang.textContent = result.targetLanguage.name;

        // Çeviri metnini göster
        this.elements.translatedText.textContent = result.translatedText;

        // Güven skorunu göster
        if (result.confidence && this.settings.showConfidence) {
            this.elements.confidenceScore.style.display = 'flex';
            this.elements.confidenceScore.querySelector('.confidence-value').textContent =
                `${Math.round(result.confidence * 100)}%`;
        }

        // Sonuç bölümünü göster
        this.elements.resultSection.style.display = 'block';
        this.elements.resultSection.classList.add('fade-in');
    }

    /**
     * Hata göster
     */
    showError(message) {
        // Önce tüm bölümleri gizle (özellikle loading section'ı)
        this.hideAllSections();

        this.elements.errorMessage.textContent = message;
        this.elements.errorSection.style.display = 'block';
        this.elements.errorSection.classList.add('fade-in');
    }

    /**
     * Tüm bölümleri gizle
     */
    hideAllSections() {
        this.elements.resultSection.style.display = 'none';
        this.elements.loadingSection.style.display = 'none';
        this.elements.errorSection.style.display = 'none';
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
                <span>Çevriliyor...</span>
            `;
        } else {
            this.elements.translateBtn.innerHTML = `
                <span class="btn-icon">🔤</span>
                <span class="btn-text">Çevir</span>
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
                <span>Kopyalandı!</span>
            `;
            this.elements.copyBtn.style.color = 'var(--success-color)';
            
            setTimeout(() => {
                this.elements.copyBtn.innerHTML = originalText;
                this.elements.copyBtn.style.color = '';
            }, 2000);
            
        } catch (error) {
            console.error('Kopyalama hatası:', error);
            this.showError('Kopyalama başarısız oldu');
        }
    }

    /**
     * Çeviriyi kaydet
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
                <span>Kaydedildi!</span>
            `;
            this.elements.saveBtn.style.color = 'var(--success-color)';
            
            setTimeout(() => {
                this.elements.saveBtn.innerHTML = originalText;
                this.elements.saveBtn.style.color = '';
            }, 2000);
            
        } catch (error) {
            console.error('Kaydetme hatası:', error);
            this.showError('Kaydetme başarısız oldu');
        }
    }

    /**
     * Geçmişe kaydet
     */
    async saveToHistory(translation) {
        try {
            await this.sendMessageToBackground({
                type: APP_CONSTANTS.MESSAGE_TYPES.SAVE_HISTORY,
                data: translation
            });
        } catch (error) {
            console.error('Geçmişe kaydetme hatası:', error);
        }
    }

    /**
     * Klavye olayları
     */
    handleKeyboard(event) {
        // Ctrl+Enter veya Enter ile çevir
        if ((event.ctrlKey && event.key === 'Enter') || event.key === 'Enter') {
            event.preventDefault();
            if (!this.isTranslating && this.elements.textInput.value.trim()) {
                this.translateText();
            }
        }
        
        // Escape ile temizle veya popup'ı kapat
        if (event.key === 'Escape') {
            if (this.elements.textInput.value.trim()) {
                this.clearText();
            } else {
                // Popup'ı kapat
                window.close();
            }
        }
        
        // Ctrl+Shift+H ile geçmişi aç
        if (event.ctrlKey && event.shiftKey && event.key === 'H') {
            event.preventDefault();
            this.openHistory();
        }
        
        // Ctrl+Shift+S ile ayarları aç
        if (event.ctrlKey && event.shiftKey && event.key === 'S') {
            event.preventDefault();
            this.openSettings();
        }
        
        // Ctrl+A ile tümünü seç (textarea içindeyse)
        if (event.ctrlKey && event.key === 'a' && event.target === this.elements.textInput) {
            // Default davranışı izin ver
            return;
        }
        
        // Ctrl+Shift+T ile hızlı çeviri (seçili metin varsa)
        if (event.ctrlKey && event.shiftKey && event.key === 'T') {
            event.preventDefault();
            this.handleQuickTranslate();
        }
    }

    /**
     * Hızlı çeviri işleyici
     */
    async handleQuickTranslate() {
        try {
            // Eğer metin varsa, direkt çevir
            if (this.elements.textInput.value.trim()) {
                await this.translateText();
                return;
            }
            
            // Eğer metin yoksa, seçili metni al
            const selectedText = await this.getSelectedText();
            if (selectedText) {
                this.elements.textInput.value = selectedText;
                this.updateCharCount(selectedText);
                this.updateTranslateButton();
                this.autoDetectLanguage(selectedText);
                await this.translateText();
            } else {
                this.showError('Çevrilecek metin bulunamadı');
            }
        } catch (error) {
            console.error('Hızlı çeviri hatası:', error);
            this.showError('Hızlı çeviri başarısız oldu');
        }
    }

    /**
     * Seçili metni al
     */
    async getSelectedText() {
        try {
            // Content script'ten seçili metni al - background üzerinden
            const response = await this.sendMessageToBackground({
                type: 'GET_SELECTED_TEXT'
            });

            return response?.text || null;
        } catch (error) {
            console.error('Seçili metin alma hatası:', error);
            return null;
        }
    }

    /**
     * Textarea otomatik boyutlandırma
     */
    autoResizeTextarea() {
        const textarea = this.elements.textInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }

    /**
     * Ayarları aç
     */
    openSettings() {
        // Ayarlar sayfasını aç - Chrome API'sini doğrudan kullan
        if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            // Fallback: options sayfasını manuel olarak aç
            const optionsUrl = chrome.runtime.getURL('options/options.html');
            window.open(optionsUrl, '_blank');
        }
    }

    /**
     * Geçmişi aç
     */
    openHistory() {
        try {
            // Geçmiş popup'ını aç
            const compatibilityLayer = window.compatibilityLayer || chrome;
            if (compatibilityLayer.getRuntime && compatibilityLayer.getRuntime().openOptionsPage) {
                // Yeni tab'da geçmiş popup'ını aç
                window.open('history-popup.html', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            } else {
                // Fallback: Yeni window
                window.open('history-popup.html', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            }
        } catch (error) {
            console.error('Geçmiş açma hatası:', error);
            this.showError('Geçmiş açılamadı');
        }
    }

    /**
     * Yardım aç
     */
    openHelp() {
        // Yardım sayfasını aç
        window.open('https://github.com/your-username/gemini-translate-extension', '_blank');
    }
}

// Popup başlat
document.addEventListener('DOMContentLoaded', () => {
    window.popupController = new PopupController();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PopupController;
}
