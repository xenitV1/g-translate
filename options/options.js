/**
 * Options Page Logic
 * Ayarlar sayfası için JavaScript fonksiyonları
 */

class OptionsController {
    constructor() {
        this.settings = null;
        this.isLoading = false;
        this.hasUnsavedChanges = false;
        
        this.init();
    }

    /**
     * Options sayfasını başlat
     */
    async init() {
        try {
            // DOM elementlerini al
            this.elements = this.getElements();
            
            // Ayarları yükle
            await this.loadSettings();
            
            // Event listener'ları ekle
            this.attachEventListeners();
            
            // UI'ı güncelle
            this.updateUI();
            
            // API durumunu kontrol et
            await this.checkAPIStatus();
            
            console.log('Options sayfası başlatıldı');
        } catch (error) {
            console.error('Options başlatma hatası:', error);
            this.showError('Ayarlar yüklenemedi');
        }
    }

    /**
     * DOM elementlerini al
     */
    getElements() {
        return {
            // Navigation
            navItems: document.querySelectorAll('.nav-item'),
            panels: document.querySelectorAll('.settings-panel'),
            
            // General settings
            autoDetect: document.getElementById('auto-detect'),
            instantTranslation: document.getElementById('instant-translation'),
            contextMenu: document.getElementById('context-menu'),
            notifications: document.getElementById('notifications'),
            
            // API settings
            apiProvider: document.getElementById('api-provider'),
            apiKey: document.getElementById('api-key'),
            apiKeyDescription: document.getElementById('api-key-description'),
            toggleApiKey: document.getElementById('toggle-api-key'),
            apiStatus: document.getElementById('api-status'),
            apiUsage: document.getElementById('api-usage'),
            
            // Language settings
            defaultTargetLanguage: document.getElementById('default-target-language'),
            supportedLanguages: document.getElementById('supported-languages'),
            
            // Shortcuts
            shortcutsList: document.getElementById('shortcuts-list'),
            
            // Appearance
            themeRadios: document.querySelectorAll('input[name="theme"]'),
            fontSize: document.getElementById('font-size'),
            showConfidence: document.getElementById('show-confidence'),
            
            // Advanced
            maxHistory: document.getElementById('max-history'),
            clearCache: document.getElementById('clear-cache'),
            resetData: document.getElementById('reset-data'),
            
            // Footer
            saveSettings: document.getElementById('save-settings'),
            resetSettings: document.getElementById('reset-settings'),
            lastSaved: document.getElementById('last-saved')
        };
    }

    /**
     * Event listener'ları ekle
     */
    attachEventListeners() {
        // Navigation
        this.elements.navItems.forEach(item => {
            item.addEventListener('click', () => {
                this.switchTab(item.dataset.tab);
            });
        });
        
        // General settings
        this.elements.autoDetect.addEventListener('change', this.markAsChanged.bind(this));
        this.elements.instantTranslation.addEventListener('change', this.markAsChanged.bind(this));
        this.elements.contextMenu.addEventListener('change', this.markAsChanged.bind(this));
        this.elements.notifications.addEventListener('change', this.markAsChanged.bind(this));
        
        // API settings
        this.elements.apiProvider.addEventListener('change', this.handleAPIProviderChange.bind(this));
        this.elements.apiKey.addEventListener('input', this.markAsChanged.bind(this));
        this.elements.toggleApiKey.addEventListener('click', this.toggleApiKeyVisibility.bind(this));
        
        // Language settings
        this.elements.defaultTargetLanguage.addEventListener('change', this.markAsChanged.bind(this));
        
        // Appearance
        this.elements.themeRadios.forEach(radio => {
            radio.addEventListener('change', this.markAsChanged.bind(this));
        });
        this.elements.fontSize.addEventListener('change', this.markAsChanged.bind(this));
        this.elements.showConfidence.addEventListener('change', this.markAsChanged.bind(this));
        
        // Advanced
        this.elements.maxHistory.addEventListener('input', this.markAsChanged.bind(this));
        this.elements.clearCache.addEventListener('click', this.clearCache.bind(this));
        this.elements.resetData.addEventListener('click', this.resetData.bind(this));
        
        // Footer
        this.elements.saveSettings.addEventListener('click', this.saveSettings.bind(this));
        this.elements.resetSettings.addEventListener('click', this.resetSettings.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    /**
     * Ayarları yükle
     */
    async loadSettings() {
        try {
            const result = await chrome.storage.local.get([APP_CONSTANTS.STORAGE_KEYS.SETTINGS]);
            this.settings = result[APP_CONSTANTS.STORAGE_KEYS.SETTINGS] || APP_CONSTANTS.DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Ayarlar yükleme hatası:', error);
            this.settings = APP_CONSTANTS.DEFAULT_SETTINGS;
        }
    }

    /**
     * UI'ı güncelle
     */
    updateUI() {
        // General settings
        this.elements.autoDetect.checked = this.settings.autoDetect;
        this.elements.instantTranslation.checked = this.settings.instantTranslation;
        this.elements.contextMenu.checked = this.settings.contextMenu;
        this.elements.notifications.checked = this.settings.enableNotifications;

        // API settings
        if (this.settings.selectedAPI) {
            this.elements.apiProvider.value = this.settings.selectedAPI;
        }
        
        // Language settings
        this.elements.defaultTargetLanguage.value = this.settings.targetLanguage;
        
        // Appearance
        document.querySelector(`input[name="theme"][value="${this.settings.theme}"]`).checked = true;
        this.elements.fontSize.value = this.settings.fontSize;
        this.elements.showConfidence.checked = this.settings.showConfidence;
        
        // Advanced
        this.elements.maxHistory.value = this.settings.maxHistoryItems;
        
        // Desteklenen dilleri yükle
        this.loadSupportedLanguages();
        
        // Kısayolları yükle
        this.loadShortcuts();
        
        // Son kaydetme zamanını güncelle
        this.updateLastSavedTime();
    }

    /**
     * Desteklenen dilleri yükle
     */
    loadSupportedLanguages() {
        const languages = APP_CONSTANTS.SUPPORTED_LANGUAGES || [];
        this.elements.supportedLanguages.innerHTML = '';
        
        languages.forEach(lang => {
            const tag = document.createElement('div');
            tag.className = 'language-tag';
            tag.innerHTML = `
                <span>${lang.flag}</span>
                <span>${lang.name}</span>
            `;
            this.elements.supportedLanguages.appendChild(tag);
        });
    }

    /**
     * Kısayolları yükle
     */
    loadShortcuts() {
        const shortcuts = [
            {
                name: 'Hızlı Çeviri',
                description: 'Seçili metni çevir veya popup aç',
                key: 'Ctrl+Shift+T'
            },
            {
                name: 'Geçmişi Aç',
                description: 'Çeviri geçmişini göster',
                key: 'Ctrl+Shift+H'
            },
            {
                name: 'Ayarları Aç',
                description: 'Bu ayarlar sayfasını aç',
                key: 'Ctrl+Shift+S'
            },
            {
                name: 'Popup Kapat',
                description: 'Açık popup\'ları kapat',
                key: 'Escape'
            }
        ];
        
        this.elements.shortcutsList.innerHTML = '';
        
        shortcuts.forEach(shortcut => {
            const item = document.createElement('div');
            item.className = 'shortcut-item';
            item.innerHTML = `
                <div class="shortcut-info">
                    <div class="shortcut-name">${shortcut.name}</div>
                    <div class="shortcut-description">${shortcut.description}</div>
                </div>
                <div class="shortcut-key">${shortcut.key}</div>
            `;
            this.elements.shortcutsList.appendChild(item);
        });
    }

    /**
     * Tab değiştir
     */
    switchTab(tabName) {
        // Navigation güncelle
        this.elements.navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.tab === tabName) {
                item.classList.add('active');
            }
        });
        
        // Panel güncelle
        this.elements.panels.forEach(panel => {
            panel.classList.remove('active');
            if (panel.id === `${tabName}-panel`) {
                panel.classList.add('active');
            }
        });
    }

    /**
     * API anahtarı görünürlüğünü değiştir
     */
    toggleApiKeyVisibility() {
        const input = this.elements.apiKey;
        const button = this.elements.toggleApiKey;
        
        if (input.type === 'password') {
            input.type = 'text';
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94,17.94A10.07,10.07 0 0,1 12,20c-7,0 -11,-8 -11,-8a18.45,18.45 0 0,1 5.06,-5.94M9.9,4.24A9.12,9.12 0 0,1 12,4c7,0 11,8 11,8a18.5,18.5 0 0,1 -2.16,3.19m-6.72,-1.07a3,3 0 1,1 -4.24,-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
            `;
        } else {
            input.type = 'password';
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1,12s4-8 11-8 11,8 11,8-4,8-11,8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
            `;
        }
    }

    /**
     * API durumunu kontrol et
     */
    async checkAPIStatus() {
        try {
            // Kullanılabilir API'leri yükle
            await this.loadAvailableAPIs();

            // Geçerli API'yi al
            const currentAPIResult = await chrome.runtime.sendMessage({
                type: APP_CONSTANTS.MESSAGE_TYPES.GET_CURRENT_API
            });

            if (currentAPIResult.success) {
                const currentAPI = currentAPIResult.data;
                this.elements.apiProvider.value = currentAPI.id;

                // API anahtarını yükle
                const storageKey = `${currentAPI.id}_api_key`;
                const apiKeyResult = await chrome.storage.local.get([storageKey]);
                const apiKey = apiKeyResult[storageKey];

                if (apiKey) {
                    this.elements.apiKey.value = apiKey;
                    this.updateAPIStatus('connected', `${currentAPI.name} bağlantısı aktif`);
                    this.updateAPIKeyDescription(currentAPI.name);
                } else {
                    this.updateAPIStatus('error', `${currentAPI.name} API anahtarı bulunamadı`);
                    this.updateAPIKeyDescription(currentAPI.name);
                }
            }

            // API kullanım istatistiklerini yükle
            await this.loadAPIUsage();

        } catch (error) {
            console.error('API durumu kontrol hatası:', error);
            this.updateAPIStatus('error', 'API durumu kontrol edilemedi');
        }
    }

    /**
     * API durumunu güncelle
     */
    /**
     * Kullanılabilir API'leri yükle
     */
    async loadAvailableAPIs() {
        try {
            const result = await chrome.runtime.sendMessage({
                type: APP_CONSTANTS.MESSAGE_TYPES.GET_AVAILABLE_APIS
            });

            if (result.success) {
                const apis = result.data;
                const select = this.elements.apiProvider;

                // Mevcut seçenekleri temizle (ilk seçenek hariç)
                while (select.options.length > 1) {
                    select.remove(1);
                }

                // API'leri ekle
                apis.forEach(api => {
                    const option = document.createElement('option');
                    option.value = api.id;
                    option.textContent = `${api.name} - ${api.description}`;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('API listesi yükleme hatası:', error);
        }
    }

    /**
     * API anahtarı açıklamasını güncelle
     */
    updateAPIKeyDescription(apiName) {
        const description = this.elements.apiKeyDescription;
        description.textContent = `${apiName} API anahtarınızı girin`;
    }

    /**
     * API sağlayıcısı değişikliğini işle
     */
    async handleAPIProviderChange(event) {
        const selectedAPI = event.target.value;

        if (!selectedAPI) return;

        try {
            // API'yi değiştir
            const result = await chrome.runtime.sendMessage({
                type: APP_CONSTANTS.MESSAGE_TYPES.SWITCH_API,
                data: { apiId: selectedAPI }
            });

            if (result.success) {
                // API anahtarını yükle
                const storageKey = `${selectedAPI}_api_key`;
                const apiKeyResult = await chrome.storage.local.get([storageKey]);
                const apiKey = apiKeyResult[storageKey];

                // UI'ı güncelle
                this.elements.apiKey.value = apiKey || '';

                // API bilgilerini al
                const selectedAPIData = await chrome.runtime.sendMessage({
                    type: APP_CONSTANTS.MESSAGE_TYPES.GET_CURRENT_API
                });

                if (selectedAPIData.success) {
                    this.updateAPIKeyDescription(selectedAPIData.data.name);
                }

                // API durumunu kontrol et
                await this.checkAPIStatus();

                this.markAsChanged();
                this.showSuccess('API sağlayıcısı değiştirildi');
            } else {
                this.showError('API sağlayıcısı değiştirilemedi: ' + result.error);
            }
        } catch (error) {
            console.error('API sağlayıcısı değiştirme hatası:', error);
            this.showError('API sağlayıcısı değiştirilemedi');
        }
    }

    /**
     * API durumunu güncelle
     */
    updateAPIStatus(status, message) {
        const indicator = this.elements.apiStatus.querySelector('.status-indicator');
        const text = this.elements.apiStatus.querySelector('.status-text');
        
        indicator.className = 'status-indicator';
        if (status === 'connected') {
            indicator.classList.add('connected');
        } else if (status === 'error') {
            indicator.classList.add('error');
        }
        
        text.textContent = message;
    }

    /**
     * API kullanım istatistiklerini yükle
     */
    async loadAPIUsage() {
        try {
            const compatibilityLayer = window.compatibilityLayer || chrome;
            const result = await compatibilityLayer.getStorageData([APP_CONSTANTS.STORAGE_KEYS.STATISTICS]);
            const stats = result[APP_CONSTANTS.STORAGE_KEYS.STATISTICS] || { daily: 0, monthly: 0 };
            
            const todayUsage = this.elements.apiUsage.querySelector('.usage-item:first-child .usage-value');
            const monthlyUsage = this.elements.apiUsage.querySelector('.usage-item:last-child .usage-value');
            
            todayUsage.textContent = `${stats.daily} çeviri`;
            monthlyUsage.textContent = `${stats.monthly} çeviri`;
            
        } catch (error) {
            console.error('API kullanım istatistikleri yükleme hatası:', error);
        }
    }

    /**
     * Değişiklik işaretle
     */
    markAsChanged() {
        this.hasUnsavedChanges = true;
        this.elements.saveSettings.disabled = false;
        this.elements.saveSettings.style.opacity = '1';
    }

    /**
     * Ayarları kaydet
     */
    async saveSettings() {
        try {
            this.setLoadingState(true);
            
            // Form verilerini topla
            const newSettings = {
                autoDetect: this.elements.autoDetect.checked,
                instantTranslation: this.elements.instantTranslation.checked,
                contextMenu: this.elements.contextMenu.checked,
                enableNotifications: this.elements.notifications.checked,
                targetLanguage: this.elements.defaultTargetLanguage.value,
                theme: document.querySelector('input[name="theme"]:checked').value,
                fontSize: this.elements.fontSize.value,
                showConfidence: this.elements.showConfidence.checked,
                maxHistoryItems: parseInt(this.elements.maxHistory.value),
                selectedAPI: this.elements.apiProvider.value
            };

            // API anahtarını kaydet (seçili API'ye göre)
            if (this.elements.apiKey.value.trim() && this.elements.apiProvider.value) {
                const storageKey = `${this.elements.apiProvider.value}_api_key`;
                await chrome.storage.local.set({
                    [storageKey]: this.elements.apiKey.value.trim()
                });

                // API anahtarını background'a gönder
                await chrome.runtime.sendMessage({
                    type: APP_CONSTANTS.MESSAGE_TYPES.SET_API_KEY,
                    data: {
                        apiId: this.elements.apiProvider.value,
                        apiKey: this.elements.apiKey.value.trim()
                    }
                });
            }
            
            // Ayarları kaydet
            await chrome.storage.local.set({
                [APP_CONSTANTS.STORAGE_KEYS.SETTINGS]: newSettings
            });
            
            this.settings = newSettings;
            this.hasUnsavedChanges = false;
            this.elements.saveSettings.disabled = true;
            this.elements.saveSettings.style.opacity = '0.6';
            
            this.updateLastSavedTime();
            this.showSuccess('Ayarlar başarıyla kaydedildi');
            
        } catch (error) {
            console.error('Ayarlar kaydetme hatası:', error);
            this.showError('Ayarlar kaydedilemedi');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Ayarları sıfırla
     */
    async resetSettings() {
        try {
            if (confirm('Tüm ayarları varsayılan değerlere sıfırlamak istediğinizden emin misiniz?')) {
                this.settings = { ...APP_CONSTANTS.DEFAULT_SETTINGS };
                this.updateUI();
                this.markAsChanged();
                this.showSuccess('Ayarlar sıfırlandı');
            }
        } catch (error) {
            console.error('Ayarlar sıfırlama hatası:', error);
            this.showError('Ayarlar sıfırlanamadı');
        }
    }

    /**
     * Cache temizle
     */
    async clearCache() {
        try {
            if (confirm('Önbelleği temizlemek istediğinizden emin misiniz?')) {
                const compatibilityLayer = window.compatibilityLayer || chrome;
                await compatibilityLayer.setStorageData({
                    [APP_CONSTANTS.STORAGE_KEYS.CACHE]: {}
                });
                
                this.showSuccess('Önbellek temizlendi');
            }
        } catch (error) {
            console.error('Cache temizleme hatası:', error);
            this.showError('Önbellek temizlenemedi');
        }
    }

    /**
     * Tüm verileri sıfırla
     */
    async resetData() {
        try {
            if (confirm('TÜM VERİLERİ SİLMEK İSTEDİĞİNİZDEN EMİN MİSİNİZ?\n\nBu işlem geri alınamaz ve tüm ayarlar, geçmiş ve veriler silinecektir.')) {
                const compatibilityLayer = window.compatibilityLayer || chrome;
                await compatibilityLayer.setStorageData({
                    [APP_CONSTANTS.STORAGE_KEYS.SETTINGS]: APP_CONSTANTS.DEFAULT_SETTINGS,
                    [APP_CONSTANTS.STORAGE_KEYS.HISTORY]: [],
                    [APP_CONSTANTS.STORAGE_KEYS.CACHE]: {},
                    [APP_CONSTANTS.STORAGE_KEYS.STATISTICS]: { daily: 0, monthly: 0 }
                });
                
                this.settings = { ...APP_CONSTANTS.DEFAULT_SETTINGS };
                this.updateUI();
                this.markAsChanged();
                this.showSuccess('Tüm veriler sıfırlandı');
            }
        } catch (error) {
            console.error('Veri sıfırlama hatası:', error);
            this.showError('Veriler sıfırlanamadı');
        }
    }

    /**
     * Son kaydetme zamanını güncelle
     */
    updateLastSavedTime() {
        const now = new Date();
        const timeString = now.toLocaleString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        this.elements.lastSaved.textContent = timeString;
    }

    /**
     * Loading durumunu ayarla
     */
    setLoadingState(loading) {
        this.isLoading = loading;
        
        if (loading) {
            document.body.classList.add('loading');
        } else {
            document.body.classList.remove('loading');
        }
    }

    /**
     * Başarı mesajı göster
     */
    showSuccess(message) {
        // Basit başarı göstergesi
        console.log('✅', message);
        alert(message);
    }

    /**
     * Hata mesajı göster
     */
    showError(message) {
        console.error('❌', message);
        alert('Hata: ' + message);
    }

    /**
     * Klavye olayları
     */
    handleKeyboard(event) {
        // Ctrl+S ile kaydet
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            if (this.hasUnsavedChanges) {
                this.saveSettings();
            }
        }
        
        // Escape ile kapat
        if (event.key === 'Escape') {
            if (this.hasUnsavedChanges) {
                if (confirm('Kaydedilmemiş değişiklikler var. Sayfayı kapatmak istediğinizden emin misiniz?')) {
                    window.close();
                }
            } else {
                window.close();
            }
        }
    }
}

// Options sayfasını başlat
document.addEventListener('DOMContentLoaded', () => {
    window.optionsController = new OptionsController();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OptionsController;
}
