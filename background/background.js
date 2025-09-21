/**
 * Background Script - Service Worker
 * Extension'ın arka plan işlemleri ve API yönetimi
 */

// Import required modules using ES modules for service worker compatibility
import constants from "../utils/constants.js";
import { BaseAPIHandler, RateLimiter, TranslationCache } from "./base-api-handler.js";
import { GeminiAPIHandler } from "./gemini-api-handler.js";
import { OpenAIAPIHandler } from "./openai-api-handler.js";
import { ClaudeAPIHandler } from "./claude-api-handler.js";
import { APIHandlerManager, apiManager } from "./api-handler.js";
import { StorageManager } from "./storage-manager.js";

// Make constants globally available
const APP_CONSTANTS = constants;

// Make classes globally available for service worker environment
if (typeof self !== "undefined") {
  self.APP_CONSTANTS = APP_CONSTANTS;
  self.BaseAPIHandler = BaseAPIHandler;
  self.RateLimiter = RateLimiter;
  self.TranslationCache = TranslationCache;
  self.GeminiAPIHandler = GeminiAPIHandler;
  self.OpenAIAPIHandler = OpenAIAPIHandler;
  self.ClaudeAPIHandler = ClaudeAPIHandler;
  self.APIHandlerManager = APIHandlerManager;
  self.apiManager = apiManager;
  self.StorageManager = StorageManager;
}

// Browser API detection ve fallback
const browserAPI = (() => {
  if (typeof chrome !== "undefined" && chrome.runtime) {
    return chrome;
  } else if (typeof browser !== "undefined" && browser.runtime) {
    return browser;
  } else {
    console.error("No browser API found");
    return null;
  }
})();

if (!browserAPI) {
  console.error("Browser API not available");
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
      const selectedAPI = settings.selectedAPI || "gemini";

      // Seçili API'yi yükle
      await this.apiManager.loadAPIHandler(selectedAPI);

      // API key'i yükle ve ayarla
      await this.loadAndSetAPIKey(selectedAPI);

      // Event listener'ları ekle
      this.attachEventListeners();

      // Context menu'yu oluştur
      await this.createContextMenu();

      // Extension kurulumunu kontrol et
      await this.handleInstallation();

      this.isInitialized = true;
      console.log("Background service başlatıldı");
    } catch (error) {
      console.error("Background service başlatma hatası:", error);
    }
  }

  /**
   * Compatibility layer yükle
   */
  async loadCompatibilityLayer() {
    // Cross-browser compatibility için gerekli polyfill'ler
    if (!self.compatibilityLayer) {
      // Browser detection
      const isFirefox = typeof browser !== "undefined" && browser.runtime;
      const isChrome = typeof chrome !== "undefined" && chrome.runtime;

      // API seçimi - Chrome öncelikli, Firefox fallback
      const api =
        browserAPI || (isChrome ? chrome : isFirefox ? browser : chrome);

      if (!api) {
        throw new Error("No browser API available");
      }

      // Service Worker context kontrolü
      const isServiceWorker =
        typeof self !== "undefined" && self instanceof ServiceWorkerGlobalScope;

      console.log("Browser API detection:", {
        isChrome,
        isFirefox,
        isServiceWorker,
        hasStorage: !!(api.storage && api.storage.local),
        hasRuntime: !!api.runtime,
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
        isServiceWorker: isServiceWorker,
      };
    }
  }

  /**
   * Event listener'ları ekle
   */
  attachEventListeners() {
    const compatibilityLayer = self.compatibilityLayer || browserAPI;

    if (!compatibilityLayer) {
      console.error("Compatibility layer not available");
      return;
    }

    // Runtime mesajları
    compatibilityLayer.runtime.onMessage.addListener(
      (message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true; // Async response için
      },
    );

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

    // Context menu events
    if (compatibilityLayer.contextMenus) {
      compatibilityLayer.contextMenus.onClicked.addListener((info, tab) => {
        this.handleContextMenuClick(info, tab);
      });
    }

  }

  /**
   * Mesaj işleyici
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      let response = { success: false, error: "Unknown message type" };

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

        case "GET_SELECTED_TEXT":
          response = await this.handleGetSelectedText(message.data, sender);
          break;

        case "PING":
          response = { success: true, message: "pong" };
          break;

        case "EXTENSION_CONTEXT_TEST":
          response = { success: true, message: "extension_context_valid" };
          break;

        default:
          console.log("Bilinmeyen mesaj tipi:", message.type);
      }

      sendResponse(response);
    } catch (error) {
      console.error("Mesaj işleme hatası:", error);
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
        return { success: false, error: "Metin boş olamaz" };
      }

      // API manager ile çeviri yap
      const result = await this.apiManager.translateText(
        text,
        targetLanguage,
        sourceLanguage,
      );

      // Geçmişe kaydet
      await this.storageManager.saveTranslation(result);

      return { success: true, data: result };
    } catch (error) {
      console.error("Çeviri işlemi hatası:", error);
      
      // Rate limit hatası durumunda özel bildirim gönder
      if (error.message.includes("Rate limit") || error.message.includes("limit")) {
        await this.showRateLimitNotification(error.message);
      }
      
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
        return { success: false, error: "Metin boş olamaz" };
      }

      // API manager ile dil tespiti yap
      const result = await this.apiManager.detectLanguage(text);

      return { success: true, data: result };
    } catch (error) {
      console.error("Dil tespiti hatası:", error);
      
      // Rate limit hatası durumunda özel bildirim gönder
      if (error.message.includes("Rate limit") || error.message.includes("limit")) {
        await this.showRateLimitNotification(error.message);
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Geçmiş alma işleyici
   */
  async handleGetHistory(data, sender) {
    try {
      const { limit, offset } = data || {};
      const history = await this.storageManager.getTranslationHistory(
        limit,
        offset,
      );

      return { success: true, data: history };
    } catch (error) {
      console.error("Geçmiş alma hatası:", error);
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
      console.error("Geçmişe kaydetme hatası:", error);
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
      console.error("Geçmiş temizleme hatası:", error);
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
      console.error("Ayarlar alma hatası:", error);
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
      console.error("Ayarlar kaydetme hatası:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Bildirim gösterme işleyici
   */
  async handleShowNotification(data, sender) {
    try {
      const { message, type = "basic", title = "Gemini Translate" } = data;

      await this.showNotification(title, message, type);

      return { success: true };
    } catch (error) {
      console.error("Bildirim gösterme hatası:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Popup açma işleyici
   */
  async handleOpenPopup(data, sender) {
    try {
      const compatibilityLayer = self.compatibilityLayer || browserAPI;

      // Popup'ı aç
      await compatibilityLayer.action.openPopup();

      // Eğer metin varsa, popup'a gönder
      if (data.text) {
        setTimeout(() => {
          this.sendMessageToPopup({
            type: "SET_TEXT",
            data: { text: data.text },
          });
        }, 100);
      }

      return { success: true };
    } catch (error) {
      console.error("Popup açma hatası:", error);
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
        type: "CLOSE_POPUP",
        data: {},
      });

      return { success: true };
    } catch (error) {
      console.error("Popup kapatma hatası:", error);
      return { success: false, error: error.message };
    }
  }


  /**
   * Seçili metni çevir kısayolu
   */
  async handleTranslateSelected() {
    try {
      const compatibilityLayer = self.compatibilityLayer || browserAPI;

      // Aktif tab'ı al
      const tabs = await compatibilityLayer.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs.length === 0) return;

      const activeTab = tabs[0];

      // Content script'e seçili metni çevir mesajı gönder
      await compatibilityLayer.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: () => {
          // Seçili metni al
          const selection = window.getSelection();
          const selectedText = selection.toString().trim();

          if (selectedText) {
            // Seçim objesi oluştur
            const selectionObj = {
              text: selectedText,
              rect: selection.getRangeAt(0).getBoundingClientRect(),
              range: selection.getRangeAt(0)
            };

            // Instant translator'ı tetikle
            if (
              window.contentScriptController &&
              window.contentScriptController.instantTranslator
            ) {
              window.contentScriptController.instantTranslator.showPopup(selectionObj);
            }
          } else {
            // Popup'ı aç
            if (window.contentScriptController) {
              window.contentScriptController.openMainPopup();
            }
          }
        },
      });
    } catch (error) {
      console.error("Seçili metin çevirme hatası:", error);
    }
  }

  /**
   * Geçmişi aç kısayolu
   */
  async handleOpenHistory() {
    try {
      const compatibilityLayer = self.compatibilityLayer || browserAPI;

      if (!compatibilityLayer) {
        console.error("Compatibility layer not available");
        return;
      }

      // Geçmiş popup'ını aç
      await compatibilityLayer.tabs.create({
        url: compatibilityLayer.runtime.getURL("popup/history-popup.html"),
        active: true,
      });
    } catch (error) {
      console.error("Geçmiş açma hatası:", error);
    }
  }

  /**
   * Ayarları aç kısayolu
   */
  async handleOpenSettings() {
    try {
      const compatibilityLayer = self.compatibilityLayer || browserAPI;

      if (!compatibilityLayer) {
        console.error("Compatibility layer not available");
        return;
      }

      // Ayarlar sayfasını aç
      if (compatibilityLayer.runtime.openOptionsPage) {
        await compatibilityLayer.runtime.openOptionsPage();
      } else {
        await compatibilityLayer.tabs.create({
          url: compatibilityLayer.runtime.getURL("options/options.html"),
          active: true,
        });
      }
    } catch (error) {
      console.error("Ayarlar açma hatası:", error);
    }
  }

  /**
   * Extension kurulumu işleyici
   */
  async handleInstallation(details) {
    try {
      console.log("Extension kuruldu:", details);

      // details parametresi kontrolü
      if (!details || typeof details !== "object") {
        console.log(
          "Kurulum detayları alınamadı, varsayılan kurulum yapılıyor",
        );
        await this.handleFirstInstall();
        return;
      }

      // İlk kurulum
      if (details.reason === "install") {
        await this.handleFirstInstall();
      }

      // Güncelleme
      if (details.reason === "update") {
        await this.handleUpdate(details.previousVersion);
      }
    } catch (error) {
      console.error("Kurulum işlemi hatası:", error);
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
        "Gemini Translate Kuruldu!",
        "Artık metinleri kolayca çevirebilirsiniz. Sağ tıklayarak başlayın.",
        "basic",
      );
    } catch (error) {
      console.error("İlk kurulum hatası:", error);
    }
  }

  /**
   * Güncelleme işlemi
   */
  async handleUpdate(previousVersion) {
    try {
      console.log(
        `Extension güncellendi: ${previousVersion} -> ${APP_CONSTANTS.APP_VERSION}`,
      );

      // Güncelleme bildirimi
      await this.showNotification(
        "Gemini Translate Güncellendi!",
        `Yeni özellikler ve iyileştirmeler eklendi.`,
        "basic",
      );
    } catch (error) {
      console.error("Güncelleme hatası:", error);
    }
  }

  /**
   * Extension başlatılması
   */
  async handleStartup() {
    try {
      console.log("Extension başlatıldı");

      // Cache temizleme
      await this.apiHandler.clearCache();
    } catch (error) {
      console.error("Başlatma hatası:", error);
    }
  }

  /**
   * Tab güncelleme işleyici
   */
  async handleTabUpdate(tabId, changeInfo, tab) {
    try {
      // Tab yüklendiğinde content script'i enjekte et
      if (changeInfo.status === "complete" && tab.url) {
        await this.injectContentScript(tabId);
      }
    } catch (error) {
      console.error("Tab güncelleme hatası:", error);
    }
  }

  /**
   * Tab kaldırma işleyici
   */
  async handleTabRemoved(tabId, removeInfo) {
    try {
      console.log(`Tab kapatıldı: ${tabId}`);
    } catch (error) {
      console.error("Tab kaldırma hatası:", error);
    }
  }

  /**
   * Alarm işleyici
   */
  async handleAlarm(alarm) {
    try {
      switch (alarm.name) {
        case "cache-cleanup":
          await this.cleanupCache();
          break;

        case "statistics-update":
          await this.updateStatistics();
          break;

        default:
          console.log("Bilinmeyen alarm:", alarm.name);
      }
    } catch (error) {
      console.error("Alarm işleme hatası:", error);
    }
  }

  /**
   * Content script enjekte et
   */
  async injectContentScript(tabId) {
    try {
      const compatibilityLayer = self.compatibilityLayer || browserAPI;

      // Sadece http/https sayfalarda enjekte et
      const tab = await compatibilityLayer.tabs.get(tabId);
      if (!tab.url.startsWith("http")) {
        return;
      }

      // Content script'i enjekte et
      await compatibilityLayer.scripting.executeScript({
        target: { tabId: tabId },
        files: [
          "dist/content-script-controller.js",
          "dist/selection-handler.js",
          "dist/instant-translator.js",
          "dist/context-menu.js",
          "dist/translation-overlay.js",
          "dist/content-main.js"
        ],
      });
    } catch (error) {
      // Content script zaten enjekte edilmiş olabilir
      console.log("Content script enjeksiyonu atlandı:", error.message);
    }
  }

  /**
   * Bildirim göster
   */
  async showNotification(title, message, type = "basic") {
    try {
      const compatibilityLayer = self.compatibilityLayer || browserAPI;

      if (compatibilityLayer.notifications) {
        await compatibilityLayer.notifications.create({
          type: type,
          iconUrl: "assets/icons/icon-48.png",
          title: title,
          message: message,
        });
      }
    } catch (error) {
      console.error("Bildirim gösterme hatası:", error);
    }
  }

  /**
   * Rate limit bildirimi göster
   */
  async showRateLimitNotification(errorMessage) {
    try {
      const title = "🚫 API Limit Aşıldı";
      let message = "Günlük çeviri limitiniz aşıldı. ";
      
      // Gemini API için özel mesaj
      if (errorMessage.includes("Günlük istek limiti aşıldı")) {
        message += "Google Gemini API'nin ücretsiz tier'ında günlük 50 istek limiti bulunmaktadır. ";
        message += "Limit yarın sıfırlanacak veya ücretli plana geçebilirsiniz.";
      } else if (errorMessage.includes("Saatlik istek limiti aşıldı")) {
        message += "Saatlik istek limitiniz aşıldı. Bir saat sonra tekrar deneyebilirsiniz.";
      } else {
        message += "Lütfen daha sonra tekrar deneyin veya farklı bir API kullanın.";
      }
      
      message += "\n\n💡 Öneriler:\n";
      message += "• Cache'lenmiş çevirileri kullanın\n";
      message += "• Farklı bir AI API'si deneyin\n";
      message += "• Ayarlardan API değiştirin";
      
      await this.showNotification(title, message, "basic");
    } catch (error) {
      console.error("Rate limit bildirimi hatası:", error);
    }
  }

  /**
   * Popup'a mesaj gönder
   */
  async sendMessageToPopup(message) {
    try {
      const compatibilityLayer = self.compatibilityLayer || browserAPI;

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
      console.error("Popup mesaj gönderme hatası:", error);
    }
  }

  /**
   * Tüm tab'lara mesaj gönder
   */
  async broadcastMessage(message) {
    try {
      const compatibilityLayer = self.compatibilityLayer || browserAPI;

      const tabs = await compatibilityLayer.tabs.query({});

      for (const tab of tabs) {
        try {
          await compatibilityLayer.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Tab mesaj gönderemeyebilir
        }
      }
    } catch (error) {
      console.error("Broadcast mesaj gönderme hatası:", error);
    }
  }

  /**
   * Cache temizleme
   */
  async cleanupCache() {
    try {
      await this.apiHandler.clearCache();
      console.log("Cache temizlendi");
    } catch (error) {
      console.error("Cache temizleme hatası:", error);
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
      const todayTranslations = history.filter(
        (t) => new Date(t.timestamp).toDateString() === today,
      );

      // İstatistikleri kaydet
      await this.storageManager.saveStatistics({
        date: today,
        translations: todayTranslations.length,
        languages: [
          ...new Set(todayTranslations.map((t) => t.targetLanguage.code)),
        ],
        characters: todayTranslations.reduce(
          (sum, t) => sum + t.originalText.length,
          0,
        ),
      });
    } catch (error) {
      console.error("İstatistik güncelleme hatası:", error);
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
      console.error("API listesi alma hatası:", error);
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
        return { success: false, error: "API ID gerekli" };
      }

      // API'yi değiştir
      await this.apiManager.switchAPI(apiId);

      // API key'i yükle ve ayarla
      await this.loadAndSetAPIKey(apiId);

      // Ayarları güncelle
      const currentSettings = await this.storageManager.getSettings();
      await this.storageManager.saveSettings({
        ...currentSettings,
        selectedAPI: apiId,
      });

      return { success: true };
    } catch (error) {
      console.error("API değiştirme hatası:", error);
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
        return { success: false, error: "API ID ve anahtar gerekli" };
      }

      // API key'i ayarla
      await this.apiManager.setApiKey(apiId, apiKey);

      // Eğer bu API şu anda aktifse, API handler'ı yeniden yükle
      const currentSettings = await this.storageManager.getSettings();
      if (currentSettings.selectedAPI === apiId) {
        await this.loadAndSetAPIKey(apiId);
      }

      return { success: true };
    } catch (error) {
      console.error("API anahtarı ayarlama hatası:", error);
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
      console.error("Geçerli API alma hatası:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Seçili metni alma işleyici
   */
  async handleGetSelectedText(data, sender) {
    try {
      const compatibilityLayer = self.compatibilityLayer || browserAPI;

      // Aktif tab'ı al
      const tabs = await compatibilityLayer.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs.length === 0) {
        return { success: false, error: "Aktif tab bulunamadı" };
      }

      const activeTab = tabs[0];

      // Content script'e mesaj gönder
      const response = await compatibilityLayer.tabs.sendMessage(activeTab.id, {
        type: "GET_SELECTED_TEXT",
      });

      return { success: true, text: response?.text || null };
    } catch (error) {
      console.error("Seçili metin alma hatası:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Context menu oluştur
   */
  async createContextMenu() {
    try {
      const compatibilityLayer = self.compatibilityLayer || browserAPI;

      if (!compatibilityLayer || !compatibilityLayer.contextMenus) {
        console.warn("Context menu API mevcut değil");
        return;
      }

      // Önce mevcut menüleri temizle
      await this.removeExistingMenus();

      // Ana context menu'yu oluştur
      await compatibilityLayer.contextMenus.create({
        id: "gemini-translate-context-menu",
        title: "🔤 G-Translate ile Çevir",
        contexts: ["selection"],
        visible: true,
      });

      // Alt menüleri oluştur
      await this.createSubMenus();

      console.log("Context menu oluşturuldu");
    } catch (error) {
      console.error("Context menu oluşturma hatası:", error);
    }
  }

  /**
   * Alt menüleri oluştur
   */
  async createSubMenus() {
    try {
      const compatibilityLayer = self.compatibilityLayer || browserAPI;

      // Popüler diller için alt menüler
      const popularLanguages = [
        { code: "tr", name: "Türkçe", flag: "🇹🇷" },
        { code: "en", name: "English", flag: "🇺🇸" },
        { code: "es", name: "Español", flag: "🇪🇸" },
        { code: "fr", name: "Français", flag: "🇫🇷" },
        { code: "de", name: "Deutsch", flag: "🇩🇪" },
        { code: "it", name: "Italiano", flag: "🇮🇹" },
        { code: "pt", name: "Português", flag: "🇵🇹" },
        { code: "ru", name: "Русский", flag: "🇷🇺" },
        { code: "ja", name: "日本語", flag: "🇯🇵" },
        { code: "ko", name: "한국어", flag: "🇰🇷" },
        { code: "zh", name: "中文", flag: "🇨🇳" },
        { code: "ar", name: "العربية", flag: "🇸🇦" },
      ];

      // Dil seçenekleri menüsü
      await compatibilityLayer.contextMenus.create({
        id: "gemini-translate-languages",
        title: "Dil Seçenekleri",
        contexts: ["selection"],
        parentId: "gemini-translate-context-menu",
      });

      // Her dil için alt menü oluştur
      for (const lang of popularLanguages) {
        await compatibilityLayer.contextMenus.create({
          id: `gemini-translate-${lang.code}`,
          title: `${lang.flag} ${lang.name}`,
          contexts: ["selection"],
          parentId: "gemini-translate-languages",
        });
      }

      // Ayırıcı
      await compatibilityLayer.contextMenus.create({
        id: "gemini-translate-separator-1",
        type: "separator",
        contexts: ["selection"],
        parentId: "gemini-translate-context-menu",
      });

      // Dil tespit et
      await compatibilityLayer.contextMenus.create({
        id: "gemini-detect-language",
        title: "🤖 Dil Tespit Et",
        contexts: ["selection"],
        parentId: "gemini-translate-context-menu",
      });

      // Hızlı çeviri (varsayılan dil)
      await compatibilityLayer.contextMenus.create({
        id: "gemini-quick-translate",
        title: "⚡ Hızlı Çeviri",
        contexts: ["selection"],
        parentId: "gemini-translate-context-menu",
      });

      // Ayırıcı
      await compatibilityLayer.contextMenus.create({
        id: "gemini-translate-separator-2",
        type: "separator",
        contexts: ["selection"],
        parentId: "gemini-translate-context-menu",
      });

      // Ayarlar
      await compatibilityLayer.contextMenus.create({
        id: "gemini-open-settings",
        title: "⚙️ Ayarlar",
        contexts: ["selection"],
        parentId: "gemini-translate-context-menu",
      });

      // Yardım
      await compatibilityLayer.contextMenus.create({
        id: "gemini-open-help",
        title: "❓ Yardım",
        contexts: ["selection"],
        parentId: "gemini-translate-context-menu",
      });
    } catch (error) {
      console.error("Alt menü oluşturma hatası:", error);
    }
  }

  /**
   * Mevcut menüleri kaldır
   */
  async removeExistingMenus() {
    try {
      const compatibilityLayer = self.compatibilityLayer || browserAPI;

      if (compatibilityLayer && compatibilityLayer.contextMenus) {
        await compatibilityLayer.contextMenus.removeAll();
      }
    } catch (error) {
      console.error("Mevcut menüleri kaldırma hatası:", error);
    }
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
      if (menuItemId === "gemini-quick-translate") {
        await this.handleQuickTranslate(selectedText, tab);
      } else if (
        menuItemId.startsWith("gemini-translate-") &&
        menuItemId !== "gemini-translate-languages"
      ) {
        const languageCode = menuItemId.replace("gemini-translate-", "");
        await this.handleTranslateToLanguage(selectedText, languageCode, tab);
      } else if (menuItemId === "gemini-detect-language") {
        await this.handleDetectLanguageFromMenu(selectedText, tab);
      } else if (menuItemId === "gemini-open-settings") {
        await this.handleOpenSettings();
      } else if (menuItemId === "gemini-open-help") {
        await this.handleOpenHelp();
      }
    } catch (error) {
      console.error("Context menu click hatası:", error);
    }
  }

  /**
   * Hızlı çeviri işleyici
   */
  async handleQuickTranslate(text, tab) {
    try {
      // Varsayılan hedef dili al
      const settings = await this.storageManager.getSettings();
      const targetLanguage = settings.targetLanguage || "tr";

      // Çeviri işlemini başlat
      await this.handleTranslateToLanguage(text, targetLanguage, tab);
    } catch (error) {
      console.error("Hızlı çeviri hatası:", error);
    }
  }

  /**
   * Belirli dile çevir işleyici
   */
  async handleTranslateToLanguage(text, targetLanguage, tab) {
    try {
      // Background script'te çeviri yap
      const result = await this.apiManager.translateText(text, targetLanguage);

      if (result) {
        // Geçmişe kaydet
        await this.storageManager.saveTranslation(result);

        // Content script'e çeviri sonucunu göster
        await this.sendMessageToTab(tab.id, {
          type: "SHOW_TRANSLATION_RESULT",
          data: result,
        });
      } else {
        await this.sendMessageToTab(tab.id, {
          type: "SHOW_ERROR",
          data: { message: "Çeviri başarısız oldu" },
        });
      }
    } catch (error) {
      console.error("Dil çevirisi hatası:", error);
      await this.sendMessageToTab(tab.id, {
        type: "SHOW_ERROR",
        data: { message: "Çeviri işlemi başarısız oldu" },
      });
    }
  }

  /**
   * Dil tespit et işleyici
   */
  async handleDetectLanguageFromMenu(text, tab) {
    try {
      // Background script'te dil tespiti yap
      const result = await this.apiManager.detectLanguage(text);

      if (result) {
        // Content script'e dil tespiti sonucunu göster
        await this.sendMessageToTab(tab.id, {
          type: "SHOW_LANGUAGE_DETECTION_RESULT",
          data: result,
        });
      } else {
        await this.sendMessageToTab(tab.id, {
          type: "SHOW_ERROR",
          data: { message: "Dil tespiti başarısız oldu" },
        });
      }
    } catch (error) {
      console.error("Dil tespiti hatası:", error);
      await this.sendMessageToTab(tab.id, {
        type: "SHOW_ERROR",
        data: { message: "Dil tespiti işlemi başarısız oldu" },
      });
    }
  }

  /**
   * Ayarları aç işleyici
   */
  async handleOpenSettings() {
    try {
      const compatibilityLayer = self.compatibilityLayer || browserAPI;

      if (compatibilityLayer.runtime.openOptionsPage) {
        await compatibilityLayer.runtime.openOptionsPage();
      } else {
        await compatibilityLayer.tabs.create({
          url: compatibilityLayer.runtime.getURL("options/options.html"),
          active: true,
        });
      }
    } catch (error) {
      console.error("Ayarlar açma hatası:", error);
    }
  }

  /**
   * Yardım aç işleyici
   */
  async handleOpenHelp() {
    try {
      const compatibilityLayer = self.compatibilityLayer || browserAPI;

      await compatibilityLayer.tabs.create({
        url: "https://github.com/your-username/gemini-translate-extension",
        active: true,
      });
    } catch (error) {
      console.error("Yardım açma hatası:", error);
    }
  }

  /**
   * Tab'a mesaj gönder
   */
  async sendMessageToTab(tabId, message) {
    try {
      const compatibilityLayer = self.compatibilityLayer || browserAPI;
      return await compatibilityLayer.tabs.sendMessage(tabId, message);
    } catch (error) {
      console.error("Tab mesaj gönderme hatası:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * API key'i yükle ve ayarla
   */
  async loadAndSetAPIKey(apiId) {
    try {
      const compatibilityLayer = self.compatibilityLayer || browserAPI;
      const storageKey = `${apiId}_api_key`;
      
      // Storage'dan API key'i al
      const result = await compatibilityLayer.storage.local.get([storageKey]);
      const apiKey = result[storageKey];

      if (apiKey) {
        // API key'i ayarla
        await this.apiManager.setApiKey(apiId, apiKey);
        console.log(`${apiId} API key yüklendi`);
      } else {
        console.warn(`${apiId} API key bulunamadı`);
      }
    } catch (error) {
      console.error("API key yükleme hatası:", error);
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
export { BackgroundService };
