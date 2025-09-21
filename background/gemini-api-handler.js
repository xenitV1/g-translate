/**
 * Gemini API Handler
 * Google Gemini API ile iletişim ve çeviri işlemleri
 */

// Import base class
import { BaseAPIHandler } from "./base-api-handler.js";

class GeminiAPIHandler extends BaseAPIHandler {
  constructor() {
    const config = {
      apiKey: null,
      baseURL: "https://generativelanguage.googleapis.com/v1beta",
      model: "gemini-2.5-flash",
      temperature: 0.3,
      topP: 0.8,
      topK: 40,
      maxTokens: 1000,

      // Rate limiting - Google Gemini Free Tier limits (Updated 2024)
      rateLimit: {
        requestsPerMinute: 10,  // Gemini 2.5 Flash free tier limit
        requestsPerDay: 250,    // Gemini 2.5 Flash free tier limit
        requestsPerHour: 50,    // Additional safety limit
        tokensPerMinute: 250000 // Token limit for free tier
      },

      // Supported languages
      supportedLanguages: [
        { code: "auto", name: "Otomatik Algıla", nativeName: "Auto Detect" },
        { code: "tr", name: "Türkçe", nativeName: "Türkçe" },
        { code: "en", name: "İngilizce", nativeName: "English" },
        { code: "es", name: "İspanyolca", nativeName: "Español" },
        { code: "fr", name: "Fransızca", nativeName: "Français" },
        { code: "de", name: "Almanca", nativeName: "Deutsch" },
        { code: "it", name: "İtalyanca", nativeName: "Italiano" },
        { code: "pt", name: "Portekizce", nativeName: "Português" },
        { code: "ru", name: "Rusça", nativeName: "Русский" },
        { code: "ja", name: "Japonca", nativeName: "日本語" },
        { code: "ko", name: "Korece", nativeName: "한국어" },
        { code: "zh", name: "Çince", nativeName: "中文" },
        { code: "ar", name: "Arapça", nativeName: "العربية" },
        { code: "hi", name: "Hintçe", nativeName: "हिन्दी" },
      ],

      // Error messages
      errorMessages: {
        apiKeyMissing: "API anahtarı bulunamadı",
        apiKeyInvalid: "Geçersiz API anahtarı",
        rateLimitExceeded: "Rate limit aşıldı",
        networkError: "Ağ hatası",
        translationError: "Çeviri hatası",
      },
    };

    super(config);
    this.retryCount = 0;
    this.maxRetries = 3;
    this.dailyRequestCount = 0;
    this.hourlyRequestCount = 0;
    this.lastResetDate = new Date().toDateString();
    this.lastResetHour = new Date().getHours();
  }

  /**
   * Konfigürasyon yükle
   */
  async loadConfiguration() {
    this.config.apiKey = await this.loadApiKey();
    await this.loadRequestCounters();
  }

  /**
   * İstek sayaçlarını yükle
   */
  async loadRequestCounters() {
    try {
      const storageKey = 'gemini_request_counters';
      const compatibilityLayer = self.compatibilityLayer || chrome;
      
      if (compatibilityLayer && compatibilityLayer.storage && compatibilityLayer.storage.local) {
        const result = await compatibilityLayer.storage.local.get([storageKey]);
        const counters = result[storageKey] || {};
        
        const today = new Date().toDateString();
        const currentHour = new Date().getHours();
        
        // Günlük sayaç sıfırlama
        if (counters.lastResetDate !== today) {
          this.dailyRequestCount = 0;
          this.lastResetDate = today;
        } else {
          this.dailyRequestCount = counters.dailyRequestCount || 0;
          this.lastResetDate = counters.lastResetDate || today;
        }
        
        // Saatlik sayaç sıfırlama
        if (counters.lastResetHour !== currentHour) {
          this.hourlyRequestCount = 0;
          this.lastResetHour = currentHour;
        } else {
          this.hourlyRequestCount = counters.hourlyRequestCount || 0;
          this.lastResetHour = counters.lastResetHour || currentHour;
        }
      }
    } catch (error) {
      console.error("İstek sayaçları yükleme hatası:", error);
    }
  }

  /**
   * İstek sayaçlarını kaydet
   */
  async saveRequestCounters() {
    try {
      const storageKey = 'gemini_request_counters';
      const compatibilityLayer = self.compatibilityLayer || chrome;
      
      if (compatibilityLayer && compatibilityLayer.storage && compatibilityLayer.storage.local) {
        await compatibilityLayer.storage.local.set({
          [storageKey]: {
            dailyRequestCount: this.dailyRequestCount,
            hourlyRequestCount: this.hourlyRequestCount,
            lastResetDate: this.lastResetDate,
            lastResetHour: this.lastResetHour,
          }
        });
      }
    } catch (error) {
      console.error("İstek sayaçları kaydetme hatası:", error);
    }
  }

  /**
   * Rate limit kontrolü (gelişmiş)
   */
  async checkAdvancedRateLimit() {
    const now = new Date();
    const today = now.toDateString();
    const currentHour = now.getHours();
    
    // Günlük sayaç sıfırlama
    if (this.lastResetDate !== today) {
      this.dailyRequestCount = 0;
      this.lastResetDate = today;
    }
    
    // Saatlik sayaç sıfırlama
    if (this.lastResetHour !== currentHour) {
      this.hourlyRequestCount = 0;
      this.lastResetHour = currentHour;
    }
    
    // Günlük limit kontrolü
    if (this.dailyRequestCount >= this.config.rateLimit.requestsPerDay) {
      const nextReset = new Date();
      nextReset.setDate(nextReset.getDate() + 1);
      nextReset.setHours(0, 0, 0, 0);
      const waitTime = nextReset.getTime() - now.getTime();
      
      throw new Error(`Günlük istek limiti aşıldı (${this.config.rateLimit.requestsPerDay}/gün). Limit ${nextReset.toLocaleString('tr-TR')} tarihinde sıfırlanacak. Gemini 2.5 Flash free tier limiti.`);
    }
    
    // Saatlik limit kontrolü
    if (this.hourlyRequestCount >= this.config.rateLimit.requestsPerHour) {
      const nextReset = new Date();
      nextReset.setHours(nextReset.getHours() + 1, 0, 0, 0);
      const waitTime = nextReset.getTime() - now.getTime();
      
      throw new Error(`Saatlik istek limiti aşıldı (${this.config.rateLimit.requestsPerHour}/saat). Limit ${nextReset.toLocaleString('tr-TR')} tarihinde sıfırlanacak. Gemini 2.5 Flash free tier limiti.`);
    }
    
    // Dakikalık limit kontrolü (mevcut sistem)
    await this.rateLimiter.checkLimit(this.config.rateLimit.requestsPerMinute);
  }

  /**
   * İstek sayacını artır
   */
  async incrementRequestCounters() {
    this.dailyRequestCount++;
    this.hourlyRequestCount++;
    await this.saveRequestCounters();
  }

  /**
   * API anahtarını kontrolü
   */
  validateApiKey() {
    if (!this.config.apiKey) {
      throw new Error(APP_CONSTANTS.ERROR_CODES.API_KEY_MISSING);
    }
    if (this.config.apiKey.length < 20) {
      throw new Error(APP_CONSTANTS.ERROR_CODES.API_KEY_INVALID);
    }
    return true;
  }

  /**
   * Dil tespiti
   */
  async detectLanguage(text) {
    try {
      this.validateApiKey();

      // Cache kontrolü - daha agresif cache kullanımı
      const cached = await this.cache.getLanguageDetection(text);
      if (cached) {
        console.log("Dil tespiti cache'den döndürüldü:", cached);
        return cached;
      }

      // Gelişmiş rate limiting
      await this.checkAdvancedRateLimit();

      const prompt = `Bu metnin hangi dilde yazıldığını tespit et.
            Sadece dil kodunu döndür (örn: tr, en, es, fr, de, it, pt, ru, ja, ko, zh, ar).
            Metin: "${text}"
            Dil kodu:`;

      const response = await this.callGeminiAPI(prompt);
      
      // İstek sayacını artır
      await this.incrementRequestCounters();
      
      const detectedLang = response.text.trim().toLowerCase();

      // Desteklenen diller listesinde kontrol et
      const supportedLang = this.config.supportedLanguages.find(
        (lang) => lang.code === detectedLang,
      );

      const result = supportedLang || { code: "auto", name: "Otomatik Tespit" };

      // Cache'e kaydet
      await this.cache.setLanguageDetection(text, result);

      return result;
    } catch (error) {
      console.error("Dil tespiti hatası:", error);

      // Fallback: karakter seti analizi
      const fallbackLang = this.detectByCharacterSet(text);
      return fallbackLang || { code: "auto", name: "Bilinmeyen" };
    }
  }

  /**
   * Karakter seti ile dil tespiti (fallback)
   */
  detectByCharacterSet(text) {
    const characterSets = {
      tr: /[çğıöşüÇĞIİÖŞÜ]/,
      en: /[a-zA-Z]/,
      ru: /[а-яёА-ЯЁ]/,
      zh: /[\u4e00-\u9fff]/,
      ja: /[\u3040-\u309f\u30a0-\u30ff]/,
      ko: /[\uac00-\ud7af]/,
      ar: /[\u0600-\u06ff]/,
      hi: /[\u0900-\u097f]/,
    };

    for (const [code, regex] of Object.entries(characterSets)) {
      if (regex.test(text)) {
        return this.config.supportedLanguages.find(
          (lang) => lang.code === code,
        );
      }
    }

    return null;
  }

  /**
   * Çeviri işlemi
   */
  async translateText(text, targetLanguage, sourceLanguage = null) {
    try {
      this.validateApiKey();

      // Input validasyonu
      this.validateText(text);

      // Cache kontrolü - daha agresif cache kullanımı
      const cacheKey = `${text}_${sourceLanguage || "auto"}_${targetLanguage}`;
      const cached = await this.cache.getTranslation(cacheKey);
      if (cached) {
        console.log("Çeviri cache'den döndürüldü:", cached);
        return cached;
      }

      // Gelişmiş rate limiting
      await this.checkAdvancedRateLimit();

      let sourceLang = sourceLanguage;

      // Kaynak dil tespiti
      if (!sourceLang || sourceLang === "auto") {
        sourceLang = await this.detectLanguage(text);
        sourceLang = sourceLang.code;
      }

      // Çeviri prompt'u hazırla
      const targetLangObj = this.config.supportedLanguages.find(
        (lang) => lang.code === targetLanguage,
      );

      const sourceLangObj = this.config.supportedLanguages.find(
        (lang) => lang.code === sourceLang,
      );

      const translationPrompt = `Bu metni ${targetLangObj.name} diline çevir. Metnin ana yapısını ve anlamını bozma, direkt kullanıcının anlayacağı dile çevir. Başka bir şey ekleme veya çıkarma, sadece çeviriyi döndür.

Metin: "${text}"`;

      // Gemini ile çevir
      const response = await this.callGeminiAPI(translationPrompt);
      
      // İstek sayacını artır
      await this.incrementRequestCounters();

      const result = {
        originalText: text,
        translatedText: response.text.trim(),
        sourceLanguage: sourceLangObj || {
          code: sourceLang,
          name: "Bilinmeyen",
        },
        targetLanguage: targetLangObj || {
          code: targetLanguage,
          name: "Bilinmeyen",
        },
        confidence: response.confidence || 0.95,
        timestamp: Date.now(),
      };

      // Cache'e kaydet
      await this.cache.setTranslation(cacheKey, result);

      return result;
    } catch (error) {
      console.error("Çeviri hatası:", error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Gemini API çağrısı
   */
  async callGeminiAPI(prompt) {
    const url = `${this.config.baseURL}/models/${this.config.model}:generateContent`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: this.config.temperature,
        topP: this.config.topP,
        topK: this.config.topK,
        maxOutputTokens: this.config.maxTokens,
      },
    };

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.config.apiKey,
      },
      body: JSON.stringify(requestBody),
    };

    let lastError;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `HTTP ${response.status}: ${errorData.error?.message || response.statusText}`,
          );
        }

        const data = await response.json();

        if (
          !data.candidates ||
          !data.candidates[0] ||
          !data.candidates[0].content
        ) {
          throw new Error("Geçersiz API yanıtı");
        }

        const text = data.candidates[0].content.parts[0].text;
        const confidence =
          data.candidates[0].finishReason === "STOP" ? 0.95 : 0.8;

        return {
          text: text,
          confidence: confidence,
          usage: data.usageMetadata,
        };
      } catch (error) {
        lastError = error;
        console.warn(
          `API çağrısı başarısız (deneme ${attempt + 1}/${this.maxRetries}):`,
          error,
        );

        if (attempt < this.maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Metin validasyonu
   */
  validateText(text) {
    if (!text || typeof text !== "string") {
      throw new Error(APP_CONSTANTS.ERROR_CODES.TEXT_EMPTY);
    }

    if (text.trim().length === 0) {
      throw new Error(APP_CONSTANTS.ERROR_CODES.TEXT_EMPTY);
    }

    if (text.length > APP_CONSTANTS.MAX_TEXT_LENGTH) {
      throw new Error(APP_CONSTANTS.ERROR_CODES.TEXT_TOO_LONG);
    }

    if (text.length < APP_CONSTANTS.MIN_TEXT_LENGTH) {
      throw new Error(APP_CONSTANTS.ERROR_CODES.TEXT_EMPTY);
    }
  }

  /**
   * API hata yönetimi
   */
  handleAPIError(error) {
    if (error.message.includes("API_KEY_MISSING")) {
      return new Error(this.config.errorMessages.apiKeyMissing);
    }

    if (error.message.includes("API_KEY_INVALID")) {
      return new Error(this.config.errorMessages.apiKeyInvalid);
    }

    if (error.message.includes("429") || error.message.includes("quota")) {
      // Detaylı rate limit hatası
      if (error.message.includes("Günlük istek limiti aşıldı")) {
        return new Error(error.message);
      }
      if (error.message.includes("Saatlik istek limiti aşıldı")) {
        return new Error(error.message);
      }
      return new Error(`Rate limit aşıldı. Günlük limit: ${this.config.rateLimit.requestsPerDay} istek (Gemini 2.5 Flash free tier). Kalan: ${this.config.rateLimit.requestsPerDay - this.dailyRequestCount} istek.`);
    }

    if (error.message.includes("network") || error.message.includes("fetch")) {
      return new Error(this.config.errorMessages.networkError);
    }

    return new Error(this.config.errorMessages.translationError);
  }

  /**
   * Rate limit durumu bilgisi
   */
  getRateLimitStatus() {
    return {
      daily: {
        used: this.dailyRequestCount,
        limit: this.config.rateLimit.requestsPerDay,
        remaining: this.config.rateLimit.requestsPerDay - this.dailyRequestCount,
        resetTime: this.getNextResetTime('daily')
      },
      hourly: {
        used: this.hourlyRequestCount,
        limit: this.config.rateLimit.requestsPerHour,
        remaining: this.config.rateLimit.requestsPerHour - this.hourlyRequestCount,
        resetTime: this.getNextResetTime('hourly')
      }
    };
  }

  /**
   * Sonraki sıfırlama zamanını hesapla
   */
  getNextResetTime(type) {
    const now = new Date();
    const nextReset = new Date();
    
    if (type === 'daily') {
      nextReset.setDate(nextReset.getDate() + 1);
      nextReset.setHours(0, 0, 0, 0);
    } else if (type === 'hourly') {
      nextReset.setHours(nextReset.getHours() + 1, 0, 0, 0);
    }
    
    return nextReset.toLocaleString('tr-TR');
  }
}

// Export for ES modules
export { GeminiAPIHandler };

// Make class globally available for service worker environment
if (typeof self !== "undefined") {
  self.GeminiAPIHandler = GeminiAPIHandler;
}
