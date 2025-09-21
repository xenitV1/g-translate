/**
 * Context Menu Handler
 * Akıllı context menu yönetimi
 */

class ContextMenuHandler {
    constructor() {
        this.isInitialized = false;
        this.contextMenuId = 'gemini-translate-context-menu';
        this.isEnabled = true;
        
        this.init();
    }

    /**
     * Context menu handler'ı başlat
     */
    async init() {
        try {
            // Cross-browser compatibility layer yükle
            await this.loadCompatibilityLayer();
            
            // Context menu'yu oluştur
            await this.createContextMenu();
            
            // Event listener'ları ekle
            this.attachEventListeners();
            
            this.isInitialized = true;
            console.log('Context menu handler başlatıldı');
            
        } catch (error) {
            console.error('Context menu handler başlatma hatası:', error);
        }
    }

    /**
     * Compatibility layer yükle
     */
    async loadCompatibilityLayer() {
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
     * Context menu'yu oluştur
     */
    async createContextMenu() {
        try {
            const compatibilityLayer = window.compatibilityLayer || chrome;
            
            // Önce mevcut menu'yu temizle
            await this.removeExistingMenus();
            
            // Ana context menu'yu oluştur
            await compatibilityLayer.contextMenus.create({
                id: this.contextMenuId,
                title: '🔤 Gemini ile Çevir',
                contexts: ['selection'],
                visible: true
            });
            
            // Alt menüleri oluştur
            await this.createSubMenus();
            
        } catch (error) {
            console.error('Context menu oluşturma hatası:', error);
        }
    }

    /**
     * Alt menüleri oluştur
     */
    async createSubMenus() {
        const compatibilityLayer = window.compatibilityLayer || chrome;
        
        // Popüler diller için alt menüler
        const popularLanguages = [
            { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
            { code: 'en', name: 'English', flag: '🇺🇸' },
            { code: 'es', name: 'Español', flag: '🇪🇸' },
            { code: 'fr', name: 'Français', flag: '🇫🇷' },
            { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
            { code: 'it', name: 'Italiano', flag: '🇮🇹' },
            { code: 'pt', name: 'Português', flag: '🇵🇹' },
            { code: 'ru', name: 'Русский', flag: '🇷🇺' },
            { code: 'ja', name: '日本語', flag: '🇯🇵' },
            { code: 'ko', name: '한국어', flag: '🇰🇷' },
            { code: 'zh', name: '中文', flag: '🇨🇳' },
            { code: 'ar', name: 'العربية', flag: '🇸🇦' }
        ];
        
        // Dil seçenekleri menüsü
        await compatibilityLayer.contextMenus.create({
            id: 'gemini-translate-languages',
            title: 'Dil Seçenekleri',
            contexts: ['selection'],
            parentId: this.contextMenuId
        });
        
        // Her dil için alt menü oluştur
        for (const lang of popularLanguages) {
            await compatibilityLayer.contextMenus.create({
                id: `gemini-translate-${lang.code}`,
                title: `${lang.flag} ${lang.name}`,
                contexts: ['selection'],
                parentId: 'gemini-translate-languages'
            });
        }
        
        // Ayırıcı
        await compatibilityLayer.contextMenus.create({
            id: 'gemini-translate-separator-1',
            type: 'separator',
            contexts: ['selection'],
            parentId: this.contextMenuId
        });
        
        // Dil tespit et
        await compatibilityLayer.contextMenus.create({
            id: 'gemini-detect-language',
            title: '🤖 Dil Tespit Et',
            contexts: ['selection'],
            parentId: this.contextMenuId
        });
        
        // Hızlı çeviri (varsayılan dil)
        await compatibilityLayer.contextMenus.create({
            id: 'gemini-quick-translate',
            title: '⚡ Hızlı Çeviri',
            contexts: ['selection'],
            parentId: this.contextMenuId
        });
        
        // Ayırıcı
        await compatibilityLayer.contextMenus.create({
            id: 'gemini-translate-separator-2',
            type: 'separator',
            contexts: ['selection'],
            parentId: this.contextMenuId
        });
        
        // Ayarlar
        await compatibilityLayer.contextMenus.create({
            id: 'gemini-open-settings',
            title: '⚙️ Ayarlar',
            contexts: ['selection'],
            parentId: this.contextMenuId
        });
        
        // Yardım
        await compatibilityLayer.contextMenus.create({
            id: 'gemini-open-help',
            title: '❓ Yardım',
            contexts: ['selection'],
            parentId: this.contextMenuId
        });
    }

    /**
     * Mevcut menüleri kaldır
     */
    async removeExistingMenus() {
        try {
            const compatibilityLayer = window.compatibilityLayer || chrome;
            await compatibilityLayer.contextMenus.removeAll();
        } catch (error) {
            console.error('Mevcut menüleri kaldırma hatası:', error);
        }
    }

    /**
     * Event listener'ları ekle
     */
    attachEventListeners() {
        const compatibilityLayer = window.compatibilityLayer || chrome;
        
        // Context menu click event'i
        compatibilityLayer.contextMenus.onClicked.addListener((info, tab) => {
            this.handleContextMenuClick(info, tab);
        });
        
        // Context menu görünürlük kontrolü
        compatibilityLayer.contextMenus.onShown.addListener((info, tab) => {
            this.handleContextMenuShown(info, tab);
        });
    }

    /**
     * Context menu click işleyici
     */
    async handleContextMenuClick(info, tab) {
        try {
            const menuItemId = info.menuItemId;
            const selectedText = info.selectionText;
            
            if (!selectedText || selectedText.trim().length === 0) {
                return;
            }
            
            // Menu item'a göre işlem yap
            if (menuItemId === 'gemini-quick-translate') {
                await this.quickTranslate(selectedText, tab);
            } else if (menuItemId.startsWith('gemini-translate-') && menuItemId !== 'gemini-translate-languages') {
                const languageCode = menuItemId.replace('gemini-translate-', '');
                await this.translateToLanguage(selectedText, languageCode, tab);
            } else if (menuItemId === 'gemini-detect-language') {
                await this.detectLanguage(selectedText, tab);
            } else if (menuItemId === 'gemini-open-settings') {
                await this.openSettings(tab);
            } else if (menuItemId === 'gemini-open-help') {
                await this.openHelp(tab);
            }
            
        } catch (error) {
            console.error('Context menu click hatası:', error);
        }
    }

    /**
     * Context menu gösterim kontrolü
     */
    async handleContextMenuShown(info, tab) {
        try {
            const selectedText = info.selectionText;
            
            // Seçim yoksa menüyü gizle
            if (!selectedText || selectedText.trim().length < 2) {
                await this.hideContextMenu();
                return;
            }
            
            // Menüyü göster
            await this.showContextMenu();
            
        } catch (error) {
            console.error('Context menu gösterim hatası:', error);
        }
    }

    /**
     * Hızlı çeviri
     */
    async quickTranslate(text, tab) {
        try {
            // Varsayılan hedef dili al
            const settings = await this.getSettings();
            const targetLanguage = settings.targetLanguage || 'tr';
            
            // Çeviri işlemini başlat
            await this.translateToLanguage(text, targetLanguage, tab);
            
        } catch (error) {
            console.error('Hızlı çeviri hatası:', error);
        }
    }

    /**
     * Belirli dile çevir
     */
    async translateToLanguage(text, targetLanguage, tab) {
        try {
            // Background script'e çeviri isteği gönder
            const response = await this.sendMessageToBackground({
                type: APP_CONSTANTS.MESSAGE_TYPES.TRANSLATE_TEXT,
                data: { 
                    text: text,
                    targetLanguage: targetLanguage
                }
            });
            
            if (response.success) {
                // Çeviri sonucunu göster
                await this.showTranslationResult(response.data, tab);
            } else {
                console.error('Çeviri hatası:', response.error);
                await this.showError('Çeviri başarısız oldu', tab);
            }
            
        } catch (error) {
            console.error('Dil çevirisi hatası:', error);
            await this.showError('Çeviri işlemi başarısız oldu', tab);
        }
    }

    /**
     * Dil tespit et
     */
    async detectLanguage(text, tab) {
        try {
            // Background script'e dil tespiti isteği gönder
            const response = await this.sendMessageToBackground({
                type: APP_CONSTANTS.MESSAGE_TYPES.DETECT_LANGUAGE,
                data: { text: text }
            });
            
            if (response.success) {
                const language = response.data;
                await this.showLanguageDetectionResult(language, tab);
            } else {
                console.error('Dil tespiti hatası:', response.error);
                await this.showError('Dil tespiti başarısız oldu', tab);
            }
            
        } catch (error) {
            console.error('Dil tespiti hatası:', error);
            await this.showError('Dil tespiti işlemi başarısız oldu', tab);
        }
    }

    /**
     * Çeviri sonucunu göster
     */
    async showTranslationResult(translation, tab) {
        try {
            // Content script'e çeviri sonucunu göster
            await this.sendMessageToTab(tab.id, {
                type: 'SHOW_TRANSLATION_RESULT',
                data: translation
            });
            
        } catch (error) {
            console.error('Çeviri sonucu gösterme hatası:', error);
        }
    }

    /**
     * Dil tespiti sonucunu göster
     */
    async showLanguageDetectionResult(language, tab) {
        try {
            // Content script'e dil tespiti sonucunu göster
            await this.sendMessageToTab(tab.id, {
                type: 'SHOW_LANGUAGE_DETECTION_RESULT',
                data: language
            });
            
        } catch (error) {
            console.error('Dil tespiti sonucu gösterme hatası:', error);
        }
    }

    /**
     * Hata göster
     */
    async showError(message, tab) {
        try {
            // Content script'e hata göster
            await this.sendMessageToTab(tab.id, {
                type: 'SHOW_ERROR',
                data: { message: message }
            });
            
        } catch (error) {
            console.error('Hata gösterme hatası:', error);
        }
    }

    /**
     * Ayarları aç
     */
    async openSettings(tab) {
        try {
            const compatibilityLayer = window.compatibilityLayer || chrome;
            
            if (compatibilityLayer.runtime.openOptionsPage) {
                compatibilityLayer.runtime.openOptionsPage();
            } else {
                // Fallback: yeni tab'da aç
                await compatibilityLayer.tabs.create({
                    url: compatibilityLayer.runtime.getURL('options/options.html')
                });
            }
            
        } catch (error) {
            console.error('Ayarlar açma hatası:', error);
        }
    }

    /**
     * Yardım aç
     */
    async openHelp(tab) {
        try {
            const compatibilityLayer = window.compatibilityLayer || chrome;
            
            await compatibilityLayer.tabs.create({
                url: 'https://github.com/your-username/gemini-translate-extension'
            });
            
        } catch (error) {
            console.error('Yardım açma hatası:', error);
        }
    }

    /**
     * Context menu'yu göster
     */
    async showContextMenu() {
        try {
            const compatibilityLayer = window.compatibilityLayer || chrome;
            
            await compatibilityLayer.contextMenus.update(this.contextMenuId, {
                visible: true
            });
            
        } catch (error) {
            console.error('Context menu gösterme hatası:', error);
        }
    }

    /**
     * Context menu'yu gizle
     */
    async hideContextMenu() {
        try {
            const compatibilityLayer = window.compatibilityLayer || chrome;
            
            await compatibilityLayer.contextMenus.update(this.contextMenuId, {
                visible: false
            });
            
        } catch (error) {
            console.error('Context menu gizleme hatası:', error);
        }
    }

    /**
     * Ayarları al
     */
    async getSettings() {
        try {
            const compatibilityLayer = window.compatibilityLayer || chrome;
            const result = await compatibilityLayer.storage.local.get([APP_CONSTANTS.STORAGE_KEYS.SETTINGS]);
            return result[APP_CONSTANTS.STORAGE_KEYS.SETTINGS] || APP_CONSTANTS.DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Ayarlar alma hatası:', error);
            return APP_CONSTANTS.DEFAULT_SETTINGS;
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
     * Tab'a mesaj gönder
     */
    async sendMessageToTab(tabId, message) {
        try {
            const compatibilityLayer = window.compatibilityLayer || chrome;
            return await compatibilityLayer.tabs.sendMessage(tabId, message);
        } catch (error) {
            console.error('Tab mesaj gönderme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Context menu handler'ı etkinleştir/devre dışı bırak
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (enabled) {
            this.showContextMenu();
        } else {
            this.hideContextMenu();
        }
    }

    /**
     * Context menu handler'ı temizle
     */
    async destroy() {
        try {
            // Mevcut menüleri kaldır
            await this.removeExistingMenus();
            
            this.isInitialized = false;
            
        } catch (error) {
            console.error('Context menu handler temizleme hatası:', error);
        }
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContextMenuHandler;
}

if (typeof window !== 'undefined' && !window.ContextMenuHandler) {
    window.ContextMenuHandler = ContextMenuHandler;
}
