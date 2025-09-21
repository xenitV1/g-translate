/**
 * Background Script - Service Worker
 * Extension'ın arka plan işlemleri ve API yönetimi
 */

// Import required modules
importScripts(
    '../utils/constants.js',
    '../utils/language-codes.js',
    'base-api-handler.js',
    'gemini-api-handler.js',
    'openai-api-handler.js',
    'claude-api-handler.js',
    'api-handler.js',
    'storage-manager.js'
);

// Browser API detection ve fallback
const browserAPI = (() => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        return chrome;
    } else if (typeof browser !== 'undefined' && browser.runtime) {
        return browser;
    } else {
        console.error('No browser API found');
        return null;
    }
})();

if (!browserAPI) {
    console.error('Browser API not available');
}

class BackgroundService {
    constructor() {
        this.apiManager = null;
        this.storageManager = null;
        this.isInitialized = false;

        this.init();
    }

    /**
     * Background service'i başlat
     */
    async init() {
        try {
            // Cross-browser compatibility layer yükle
            await this.loadCompatibilityLayer();

            // Storage manager'ı başlat (önce settings için)
            this.storageManager = new StorageManager(self.compatibilityLayer);

            // API manager'ı başlat
            this.apiManager = apiManager;

            // Kullanıcı ayarlarından seçili API'yi al
            const settings = await this.storageManager.getSettings();
            const selectedAPI = settings.selectedAPI || 'gemini';

            // Seçili API'yi yükle
            await this.apiManager.loadAPIHandler(selectedAPI);

            // Event listener'ları ekle
            this.attachEventListeners();

            // Extension kurulumunu kontrol et
            await this.handleInstallation();

            this.isInitialized = true;
            console.log('Background service başlatıldı');

        } catch (error) {
            console.error('Background service başlatma hatası:', error);
        }
    }

    /**
     * Compatibility layer yükle
     */
    async loadCompatibilityLayer() {
        // Cross-browser compatibility için gerekli polyfill'ler
        if (!self.compatibilityLayer) {
            // Browser detection
            const isFirefox = typeof browser !== 'undefined' && browser.runtime;
            const isChrome = typeof chrome !== 'undefined' && chrome.runtime;

            // API seçimi - Chrome öncelikli, Firefox fallback
            const api = browserAPI || (isChrome ? chrome : (isFirefox ? browser : chrome));

            if (!api) {
                throw new Error('No browser API available');
            }

            // Service Worker context kontrolü
            const isServiceWorker = typeof self !== 'undefined' &&
                                   self instanceof ServiceWorkerGlobalScope;

            console.log('Browser API detection:', {
                isChrome,
                isFirefox,
                isServiceWorker,
                hasStorage: !!(api.storage && api.storage.local),
                hasRuntime: !!api.runtime
            });

            self.compatibilityLayer = {
                runtime: api.runtime,
                storage: api.storage,
                contextMenus: api.contextMenus,
                tabs: api.tabs,
                scripting: api.scripting,
                notifications: api.notifications,
                alarms: api.alarms,
                isChrome: isChrome,
                isFirefox: isFirefox,
                isServiceWorker: isServiceWorker
            };
        }
    }

    /**
     * Event listener'ları ekle
     */
    attachEventListeners() {
        const compatibilityLayer = self.compatibilityLayer || browserAPI;
        
        if (!compatibilityLayer) {
            console.error('Compatibility layer not available');
            return;
        }
        
        // Runtime mesajları
        compatibilityLayer.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Async response için
        });
        
        // Extension kurulumu
        compatibilityLayer.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });
        
        // Extension başlatılması
        compatibilityLayer.runtime.onStartup.addListener(() => {
            this.handleStartup();
        });
        
        // Tab güncellemeleri
        compatibilityLayer.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.handleTabUpdate(tabId, changeInfo, tab);
        });
        
        // Tab kapatılması
        compatibilityLayer.tabs.onRemoved.addListener((tabId, removeInfo) => {
            this.handleTabRemoved(tabId, removeInfo);
        });
        
        // Alarm events (scheduled tasks)
        if (compatibilityLayer.alarms) {
            compatibilityLayer.alarms.onAlarm.addListener((alarm) => {
                this.handleAlarm(alarm);
            });
        }
        
        // Keyboard shortcuts
        if (compatibilityLayer.commands) {
            compatibilityLayer.commands.onCommand.addListener((command) => {
                this.handleKeyboardShortcut(command);
            });
        }
    }

    /**
     * Mesaj işleyici
     */
    async handleMessage(message, sender, sendResponse) {
        try {
            let response = { success: false, error: 'Unknown message type' };
            
            switch (message.type) {
                case APP_CONSTANTS.MESSAGE_TYPES.TRANSLATE_TEXT:
                    response = await this.handleTranslateText(message.data, sender);
                    break;
                    
                case APP_CONSTANTS.MESSAGE_TYPES.DETECT_LANGUAGE:
                    response = await this.handleDetectLanguage(message.data, sender);
                    break;
                    
                case APP_CONSTANTS.MESSAGE_TYPES.GET_HISTORY:
                    response = await this.handleGetHistory(message.data, sender);
                    break;
                    
                case APP_CONSTANTS.MESSAGE_TYPES.SAVE_HISTORY:
                    response = await this.handleSaveHistory(message.data, sender);
                    break;
                    
                case APP_CONSTANTS.MESSAGE_TYPES.CLEAR_HISTORY:
                    response = await this.handleClearHistory(message.data, sender);
                    break;
                    
                case APP_CONSTANTS.MESSAGE_TYPES.GET_SETTINGS:
                    response = await this.handleGetSettings(message.data, sender);
                    break;
                    
                case APP_CONSTANTS.MESSAGE_TYPES.SAVE_SETTINGS:
                    response = await this.handleSaveSettings(message.data, sender);
                    break;
                    
                case APP_CONSTANTS.MESSAGE_TYPES.SHOW_NOTIFICATION:
                    response = await this.handleShowNotification(message.data, sender);
                    break;
                    
                case APP_CONSTANTS.MESSAGE_TYPES.OPEN_POPUP:
                    response = await this.handleOpenPopup(message.data, sender);
                    break;
                    
                case APP_CONSTANTS.MESSAGE_TYPES.CLOSE_POPUP:
                    response = await this.handleClosePopup(message.data, sender);
                    break;

                case APP_CONSTANTS.MESSAGE_TYPES.GET_AVAILABLE_APIS:
                    response = await this.handleGetAvailableAPIs(message.data, sender);
                    break;

                case APP_CONSTANTS.MESSAGE_TYPES.SWITCH_API:
                    response = await this.handleSwitchAPI(message.data, sender);
                    break;

                case APP_CONSTANTS.MESSAGE_TYPES.SET_API_KEY:
                    response = await this.handleSetAPIKey(message.data, sender);
                    break;

                case APP_CONSTANTS.MESSAGE_TYPES.GET_CURRENT_API:
                    response = await this.handleGetCurrentAPI(message.data, sender);
                    break;

                case 'GET_SELECTED_TEXT':
                    response = await this.handleGetSelectedText(message.data, sender);
                    break;

                case 'PING':
                    response = { success: true, message: 'pong' };
                    break;

                default:
                    console.log('Bilinmeyen mesaj tipi:', message.type);
            }
            
            sendResponse(response);
            
        } catch (error) {
            console.error('Mesaj işleme hatası:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    /**
     * Metin çevirisi işleyici
     */
    async handleTranslateText(data, sender) {
        try {
            const { text, targetLanguage, sourceLanguage } = data;

            if (!text || text.trim().length === 0) {
                return { success: false, error: 'Metin boş olamaz' };
            }

            // API manager ile çeviri yap
            const result = await this.apiManager.translateText(text, targetLanguage, sourceLanguage);

            // Geçmişe kaydet
            await this.storageManager.saveTranslation(result);

            return { success: true, data: result };

        } catch (error) {
            console.error('Çeviri işlemi hatası:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Dil tespiti işleyici
     */
    async handleDetectLanguage(data, sender) {
        try {
            const { text } = data;

            if (!text || text.trim().length === 0) {
                return { success: false, error: 'Metin boş olamaz' };
            }

            // API manager ile dil tespiti yap
            const result = await this.apiManager.detectLanguage(text);

            return { success: true, data: result };

        } catch (error) {
            console.error('Dil tespiti hatası:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Geçmiş alma işleyici
     */
    async handleGetHistory(data, sender) {
        try {
            const { limit, offset } = data || {};
            const history = await this.storageManager.getTranslationHistory(limit, offset);
            
            return { success: true, data: history };
            
        } catch (error) {
            console.error('Geçmiş alma hatası:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Geçmişe kaydetme işleyici
     */
    async handleSaveHistory(data, sender) {
        try {
            await this.storageManager.saveTranslation(data);
            
            return { success: true };
            
        } catch (error) {
            console.error('Geçmişe kaydetme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Geçmiş temizleme işleyici
     */
    async handleClearHistory(data, sender) {
        try {
            await this.storageManager.clearTranslationHistory();
            
            return { success: true };
            
        } catch (error) {
            console.error('Geçmiş temizleme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Ayarları alma işleyici
     */
    async handleGetSettings(data, sender) {
        try {
            const settings = await this.storageManager.getSettings();
            
            return { success: true, data: settings };
            
        } catch (error) {
            console.error('Ayarlar alma hatası:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Ayarları kaydetme işleyici
     */
    async handleSaveSettings(data, sender) {
        try {
            await this.storageManager.saveSettings(data);
            
            return { success: true };
            
        } catch (error) {
            console.error('Ayarlar kaydetme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Bildirim gösterme işleyici
     */
    async handleShowNotification(data, sender) {
        try {
            const { message, type = 'basic', title = 'Gemini Translate' } = data;
            
            await this.showNotification(title, message, type);
            
            return { success: true };
            
        } catch (error) {
            console.error('Bildirim gösterme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Popup açma işleyici
     */
    async handleOpenPopup(data, sender) {
        try {
            const compatibilityLayer = self.compatibilityLayer || chrome;
            
            // Popup'ı aç
            await compatibilityLayer.action.openPopup();
            
            // Eğer metin varsa, popup'a gönder
            if (data.text) {
                setTimeout(() => {
                    this.sendMessageToPopup({
                        type: 'SET_TEXT',
                        data: { text: data.text }
                    });
                }, 100);
            }
            
            return { success: true };
            
        } catch (error) {
            console.error('Popup açma hatası:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Popup kapatma işleyici
     */
    async handleClosePopup(data, sender) {
        try {
            // Content script'lere popup kapatma mesajı gönder
            await this.broadcastMessage({
                type: 'CLOSE_POPUP',
                data: {}
            });
            
            return { success: true };
            
        } catch (error) {
            console.error('Popup kapatma hatası:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Klavye kısayolu işleyici
     */
    async handleKeyboardShortcut(command) {
        try {
            console.log('Klavye kısayolu tetiklendi:', command);
            
            switch (command) {
                case 'translate-selected':
                    await this.handleTranslateSelected();
                    break;
                    
                case 'open-history':
                    await this.handleOpenHistory();
                    break;
                    
                case 'open-settings':
                    await this.handleOpenSettings();
                    break;
                    
                case 'close-popup':
                    await this.handleClosePopup();
                    break;
                    
                default:
                    console.log('Bilinmeyen kısayol:', command);
            }
            
        } catch (error) {
            console.error('Klavye kısayolu işleme hatası:', error);
        }
    }

    /**
     * Seçili metni çevir kısayolu
     */
    async handleTranslateSelected() {
        try {
            const compatibilityLayer = self.compatibilityLayer || chrome;
            
            // Aktif tab'ı al
            const tabs = await compatibilityLayer.tabs.query({ active: true, currentWindow: true });
            if (tabs.length === 0) return;
            
            const activeTab = tabs[0];
            
            // Content script'e seçili metni çevir mesajı gönder
            await compatibilityLayer.scripting.executeScript({
                target: { tabId: activeTab.id },
                function: () => {
                    // Seçili metni al
                    const selectedText = window.getSelection().toString().trim();
                    if (selectedText) {
                        // Instant translator'ı tetikle
                        if (window.contentScriptController && window.contentScriptController.instantTranslator) {
                            window.contentScriptController.instantTranslator.showPopup(selectedText);
                        }
                    } else {
                        // Popup'ı aç
                        if (window.contentScriptController) {
                            window.contentScriptController.openMainPopup();
                        }
                    }
                }
            });
            
        } catch (error) {
            console.error('Seçili metin çevirme hatası:', error);
        }
    }

    /**
     * Geçmişi aç kısayolu
     */
    async handleOpenHistory() {
        try {
            const compatibilityLayer = self.compatibilityLayer || chrome;
            
            // Geçmiş popup'ını aç
            await compatibilityLayer.tabs.create({
                url: compatibilityLayer.runtime.getURL('popup/history-popup.html'),
                active: true
            });
            
        } catch (error) {
            console.error('Geçmiş açma hatası:', error);
        }
    }

    /**
     * Ayarları aç kısayolu
     */
    async handleOpenSettings() {
        try {
            const compatibilityLayer = self.compatibilityLayer || chrome;
            
            // Ayarlar sayfasını aç
            if (compatibilityLayer.runtime.openOptionsPage) {
                await compatibilityLayer.runtime.openOptionsPage();
            } else {
                await compatibilityLayer.tabs.create({
                    url: compatibilityLayer.runtime.getURL('options/options.html'),
                    active: true
                });
            }
            
        } catch (error) {
            console.error('Ayarlar açma hatası:', error);
        }
    }

    /**
     * Extension kurulumu işleyici
     */
    async handleInstallation(details) {
        try {
            console.log('Extension kuruldu:', details);

            // details parametresi kontrolü
            if (!details || typeof details !== 'object') {
                console.log('Kurulum detayları alınamadı, varsayılan kurulum yapılıyor');
                await this.handleFirstInstall();
                return;
            }

            // İlk kurulum
            if (details.reason === 'install') {
                await this.handleFirstInstall();
            }

            // Güncelleme
            if (details.reason === 'update') {
                await this.handleUpdate(details.previousVersion);
            }

        } catch (error) {
            console.error('Kurulum işlemi hatası:', error);
        }
    }

    /**
     * İlk kurulum
     */
    async handleFirstInstall() {
        try {
            // Varsayılan ayarları kaydet
            await this.storageManager.saveSettings(APP_CONSTANTS.DEFAULT_SETTINGS);
            
            // Hoş geldin bildirimi
            await this.showNotification(
                'Gemini Translate Kuruldu!',
                'Artık metinleri kolayca çevirebilirsiniz. Sağ tıklayarak başlayın.',
                'basic'
            );
            
        } catch (error) {
            console.error('İlk kurulum hatası:', error);
        }
    }

    /**
     * Güncelleme işlemi
     */
    async handleUpdate(previousVersion) {
        try {
            console.log(`Extension güncellendi: ${previousVersion} -> ${APP_CONSTANTS.APP_VERSION}`);
            
            // Güncelleme bildirimi
            await this.showNotification(
                'Gemini Translate Güncellendi!',
                `Yeni özellikler ve iyileştirmeler eklendi.`,
                'basic'
            );
            
        } catch (error) {
            console.error('Güncelleme hatası:', error);
        }
    }

    /**
     * Extension başlatılması
     */
    async handleStartup() {
        try {
            console.log('Extension başlatıldı');
            
            // Cache temizleme
            await this.apiHandler.clearCache();
            
        } catch (error) {
            console.error('Başlatma hatası:', error);
        }
    }

    /**
     * Tab güncelleme işleyici
     */
    async handleTabUpdate(tabId, changeInfo, tab) {
        try {
            // Tab yüklendiğinde content script'i enjekte et
            if (changeInfo.status === 'complete' && tab.url) {
                await this.injectContentScript(tabId);
            }
            
        } catch (error) {
            console.error('Tab güncelleme hatası:', error);
        }
    }

    /**
     * Tab kaldırma işleyici
     */
    async handleTabRemoved(tabId, removeInfo) {
        try {
            console.log(`Tab kapatıldı: ${tabId}`);
            
        } catch (error) {
            console.error('Tab kaldırma hatası:', error);
        }
    }

    /**
     * Alarm işleyici
     */
    async handleAlarm(alarm) {
        try {
            switch (alarm.name) {
                case 'cache-cleanup':
                    await this.cleanupCache();
                    break;
                    
                case 'statistics-update':
                    await this.updateStatistics();
                    break;
                    
                default:
                    console.log('Bilinmeyen alarm:', alarm.name);
            }
            
        } catch (error) {
            console.error('Alarm işleme hatası:', error);
        }
    }

    /**
     * Content script enjekte et
     */
    async injectContentScript(tabId) {
        try {
            const compatibilityLayer = self.compatibilityLayer || chrome;
            
            // Sadece http/https sayfalarda enjekte et
            const tab = await compatibilityLayer.tabs.get(tabId);
            if (!tab.url.startsWith('http')) {
                return;
            }
            
            // Content script'i enjekte et
            await compatibilityLayer.scripting.executeScript({
                target: { tabId: tabId },
                files: [
                    'content/content.js',
                    'content/selection-handler.js',
                    'content/instant-translator.js',
                    'content/context-menu.js',
                    'content/translation-overlay.js'
                ]
            });
            
        } catch (error) {
            // Content script zaten enjekte edilmiş olabilir
            console.log('Content script enjeksiyonu atlandı:', error.message);
        }
    }

    /**
     * Bildirim göster
     */
    async showNotification(title, message, type = 'basic') {
        try {
            const compatibilityLayer = self.compatibilityLayer || chrome;
            
            if (compatibilityLayer.notifications) {
                await compatibilityLayer.notifications.create({
                    type: type,
                    iconUrl: 'assets/icons/icon-48.png',
                    title: title,
                    message: message
                });
            }
            
        } catch (error) {
            console.error('Bildirim gösterme hatası:', error);
        }
    }

    /**
     * Popup'a mesaj gönder
     */
    async sendMessageToPopup(message) {
        try {
            const compatibilityLayer = self.compatibilityLayer || chrome;
            
            // Tüm tab'lara mesaj gönder
            const tabs = await compatibilityLayer.tabs.query({});
            
            for (const tab of tabs) {
                try {
                    await compatibilityLayer.tabs.sendMessage(tab.id, message);
                } catch (error) {
                    // Tab mesaj gönderemeyebilir
                }
            }
            
        } catch (error) {
            console.error('Popup mesaj gönderme hatası:', error);
        }
    }

    /**
     * Tüm tab'lara mesaj gönder
     */
    async broadcastMessage(message) {
        try {
            const compatibilityLayer = self.compatibilityLayer || chrome;
            
            const tabs = await compatibilityLayer.tabs.query({});
            
            for (const tab of tabs) {
                try {
                    await compatibilityLayer.tabs.sendMessage(tab.id, message);
                } catch (error) {
                    // Tab mesaj gönderemeyebilir
                }
            }
            
        } catch (error) {
            console.error('Broadcast mesaj gönderme hatası:', error);
        }
    }

    /**
     * Cache temizleme
     */
    async cleanupCache() {
        try {
            await this.apiHandler.clearCache();
            console.log('Cache temizlendi');
            
        } catch (error) {
            console.error('Cache temizleme hatası:', error);
        }
    }

    /**
     * İstatistikleri güncelle
     */
    async updateStatistics() {
        try {
            // Günlük istatistikleri hesapla
            const history = await this.storageManager.getTranslationHistory();
            const today = new Date().toDateString();
            const todayTranslations = history.filter(t => 
                new Date(t.timestamp).toDateString() === today
            );
            
            // İstatistikleri kaydet
            await this.storageManager.saveStatistics({
                date: today,
                translations: todayTranslations.length,
                languages: [...new Set(todayTranslations.map(t => t.targetLanguage.code))],
                characters: todayTranslations.reduce((sum, t) => sum + t.originalText.length, 0)
            });
            
        } catch (error) {
            console.error('İstatistik güncelleme hatası:', error);
        }
    }

    /**
     * Kullanılabilir API'leri alma işleyici
     */
    async handleGetAvailableAPIs(data, sender) {
        try {
            const apis = this.apiManager.getAvailableAPIs();
            return { success: true, data: apis };
        } catch (error) {
            console.error('API listesi alma hatası:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * API değiştirme işleyici
     */
    async handleSwitchAPI(data, sender) {
        try {
            const { apiId } = data;

            if (!apiId) {
                return { success: false, error: 'API ID gerekli' };
            }

            // API'yi değiştir
            await this.apiManager.switchAPI(apiId);

            // Ayarları güncelle
            const currentSettings = await this.storageManager.getSettings();
            await this.storageManager.saveSettings({
                ...currentSettings,
                selectedAPI: apiId
            });

            return { success: true };

        } catch (error) {
            console.error('API değiştirme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * API anahtarı ayarlama işleyici
     */
    async handleSetAPIKey(data, sender) {
        try {
            const { apiId, apiKey } = data;

            if (!apiId || !apiKey) {
                return { success: false, error: 'API ID ve anahtar gerekli' };
            }

            await this.apiManager.setApiKey(apiId, apiKey);
            return { success: true };

        } catch (error) {
            console.error('API anahtarı ayarlama hatası:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Geçerli API bilgilerini alma işleyici
     */
    async handleGetCurrentAPI(data, sender) {
        try {
            const currentAPI = this.apiManager.getCurrentAPIInfo();
            return { success: true, data: currentAPI };
        } catch (error) {
            console.error('Geçerli API alma hatası:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Seçili metni alma işleyici
     */
    async handleGetSelectedText(data, sender) {
        try {
            const compatibilityLayer = self.compatibilityLayer || chrome;

            // Aktif tab'ı al
            const tabs = await compatibilityLayer.tabs.query({ active: true, currentWindow: true });
            if (tabs.length === 0) {
                return { success: false, error: 'Aktif tab bulunamadı' };
            }

            const activeTab = tabs[0];

            // Content script'e mesaj gönder
            const response = await compatibilityLayer.tabs.sendMessage(activeTab.id, {
                type: 'GET_SELECTED_TEXT'
            });

            return { success: true, text: response?.text || null };
        } catch (error) {
            console.error('Seçili metin alma hatası:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Background service'i temizle
     */
    destroy() {
        this.apiManager = null;
        this.storageManager = null;
        this.isInitialized = false;
    }
}

// Background service'i başlat
const backgroundService = new BackgroundService();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundService;
}
