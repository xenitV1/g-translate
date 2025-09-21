/**
 * Base API Handler
 * Tüm AI API handler'larının temel sınıfı
 */

class BaseAPIHandler {
  constructor(config) {
    this.config = config;
    this.cache = new TranslationCache();
    this.isInitialized = false;
  }

  /**
   * Handler'ı başlat
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.loadConfiguration();
      this.isInitialized = true;
      console.log(`${this.constructor.name} initialized`);
    } catch (error) {
      console.error(`${this.constructor.name} initialization failed:`, error);
      throw error;
    }
  }

  /**
   * Konfigürasyon yükle
   */
  async loadConfiguration() {
    // Alt sınıflar tarafından implement edilecek
    throw new Error("loadConfiguration() must be implemented by subclass");
  }

  /**
   * API anahtarını ayarla
   */
  async setApiKey(apiKey) {
    this.config.apiKey = apiKey;
    await this.saveApiKey(apiKey);
  }

  /**
   * API anahtarını kaydet
   */
  async saveApiKey(apiKey) {
    try {
      const storageKey = `${this.constructor.name.toLowerCase()}_api_key`;
      const compatibilityLayer = self.compatibilityLayer || chrome;

      if (
        compatibilityLayer &&
        compatibilityLayer.storage &&
        compatibilityLayer.storage.local
      ) {
        await compatibilityLayer.storage.local.set({
          [storageKey]: apiKey,
        });
      } else {
        console.error("Storage API mevcut değil");
      }
    } catch (error) {
      console.error("API key kaydetme hatası:", error);
    }
  }

  /**
   * API anahtarını yükle
   */
  async loadApiKey() {
    try {
      const storageKey = `${this.constructor.name.toLowerCase()}_api_key`;
      const compatibilityLayer = self.compatibilityLayer || chrome;

      if (
        compatibilityLayer &&
        compatibilityLayer.storage &&
        compatibilityLayer.storage.local
      ) {
        const result = await compatibilityLayer.storage.local.get([storageKey]);
        return result[storageKey] || null;
      } else {
        console.error("Storage API mevcut değil");
        return null;
      }
    } catch (error) {
      console.error("API key yükleme hatası:", error);
      return null;
    }
  }

  /**
   * API durumunu kontrol et
   */
  async checkStatus() {
    try {
      await this.loadConfiguration();
      return { status: "healthy", message: `${this.constructor.name} hazır` };
    } catch (error) {
      return { status: "error", message: error.message };
    }
  }

  /**
   * Metin çevirisi (alt sınıflar tarafından implement edilecek)
   */
  async translateText(text, targetLanguage, sourceLanguage = null) {
    throw new Error("translateText() must be implemented by subclass");
  }

  /**
   * Dil tespiti (alt sınıflar tarafından implement edilecek)
   */
  async detectLanguage(text) {
    throw new Error("detectLanguage() must be implemented by subclass");
  }

  /**
   * Desteklenen dilleri döndür
   */
  getSupportedLanguages() {
    return this.config.supportedLanguages || [];
  }

  /**
   * API spesifik konfigürasyonu al
   */
  getConfig() {
    return this.config;
  }

  /**
   * Cache'i temizle
   */
  async clearCache() {
    await this.cache.clear();
  }

  /**
   * API ismini döndür
   */
  getName() {
    return this.constructor.name.replace("APIHandler", "");
  }

  /**
   * API kimliğini döndür
   */
  getId() {
    return this.constructor.name.toLowerCase().replace("apihandler", "");
  }
}


/**
 * Translation Cache - Tüm API'ler için ortak
 */
class TranslationCache {
  constructor() {
    this.translations = new Map();
    this.languageDetections = new Map();
    this.maxSize = APP_CONSTANTS.MAX_CACHE_SIZE;
  }

  async getTranslation(key) {
    const cached = this.translations.get(key);
    if (cached && Date.now() - cached.timestamp < APP_CONSTANTS.CACHE_EXPIRY) {
      return cached.data;
    }
    return null;
  }

  async setTranslation(key, data) {
    if (this.translations.size >= this.maxSize) {
      const firstKey = this.translations.keys().next().value;
      this.translations.delete(firstKey);
    }

    this.translations.set(key, {
      data: data,
      timestamp: Date.now(),
    });
  }

  async getLanguageDetection(text) {
    const cached = this.languageDetections.get(text);
    if (cached && Date.now() - cached.timestamp < APP_CONSTANTS.CACHE_EXPIRY) {
      return cached.data;
    }
    return null;
  }

  async setLanguageDetection(text, data) {
    if (this.languageDetections.size >= this.maxSize) {
      const firstKey = this.languageDetections.keys().next().value;
      this.languageDetections.delete(firstKey);
    }

    this.languageDetections.set(text, {
      data: data,
      timestamp: Date.now(),
    });
  }

  async clear() {
    this.translations.clear();
    this.languageDetections.clear();
  }
}

// Export for ES modules
export { BaseAPIHandler, TranslationCache };

// Make classes globally available for service worker environment
if (typeof self !== "undefined") {
  self.BaseAPIHandler = BaseAPIHandler;
  self.TranslationCache = TranslationCache;
}
