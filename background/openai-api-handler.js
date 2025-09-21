/**
 * OpenAI API Handler
 * OpenAI GPT modelleri ile iletişim ve çeviri işlemleri
 */

// Import base class
import { BaseAPIHandler } from "./base-api-handler.js";

class OpenAIAPIHandler extends BaseAPIHandler {
  constructor() {
    const config = {
      apiKey: null,
      baseURL: "https://api.openai.com/v1",
      model: "gpt-3.5-turbo",
      temperature: 0.3,
      maxTokens: 1000,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,

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
        apiKeyMissing: "OpenAI API anahtarı bulunamadı",
        apiKeyInvalid: "Geçersiz OpenAI API anahtarı",
        networkError: "OpenAI ağ hatası",
        translationError: "OpenAI çeviri hatası",
      },
    };

    super(config);
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  /**
   * Konfigürasyon yükle
   */
  async loadConfiguration() {
    this.config.apiKey = await this.loadApiKey();
  }

  /**
   * API anahtarı kontrolü
   */
  validateApiKey() {
    if (!this.config.apiKey) {
      throw new Error(APP_CONSTANTS.ERROR_CODES.API_KEY_MISSING);
    }
    if (!this.config.apiKey.startsWith("sk-")) {
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

      // Cache kontrolü
      const cached = await this.cache.getLanguageDetection(text);
      if (cached) {
        return cached;
      }

      const messages = [
        {
          role: "system",
          content:
            "Sen bir dil tespit uzmanısın. Verilen metnin hangi dilde yazıldığını tespit et ve sadece dil kodunu döndür (örn: tr, en, es, fr, de, it, pt, ru, ja, ko, zh, ar).",
        },
        {
          role: "user",
          content: `Bu metnin dilini tespit et: "${text}"`,
        },
      ];

      const response = await this.callOpenAIAPI(messages);
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

      // Cache kontrolü
      const cacheKey = `${text}_${sourceLanguage || "auto"}_${targetLanguage}`;
      const cached = await this.cache.getTranslation(cacheKey);
      if (cached) {
        return cached;
      }

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

      const messages = [
        {
          role: "system",
          content: `Sen bir çeviri uzmanısın. Metnin ana yapısını ve anlamını bozma, direkt kullanıcının anlayacağı dile çevir. Başka bir şey ekleme veya çıkarma, sadece çeviriyi döndür.`,
        },
        {
          role: "user",
          content: `Bu metni ${targetLangObj.name} diline çevir: "${text}"`,
        },
      ];

      // OpenAI ile çevir
      const response = await this.callOpenAIAPI(messages);

      const result = {
        originalText: text,
        translatedText: response.text.trim(),
        sourceLanguage: sourceLangObj || {
          code: sourceLang,
          name: "Bilinmeyen",
        },
        targetLanguage: targetLangObj,
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
   * OpenAI API çağrısı
   */
  async callOpenAIAPI(messages) {
    const url = `${this.config.baseURL}/chat/completions`;

    const requestBody = {
      model: this.config.model,
      messages: messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      top_p: this.config.topP,
      frequency_penalty: this.config.frequencyPenalty,
      presence_penalty: this.config.presencePenalty,
    };

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
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

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error("Geçersiz API yanıtı");
        }

        const text = data.choices[0].message.content;
        const finishReason = data.choices[0].finish_reason;
        const confidence = finishReason === "stop" ? 0.95 : 0.8;

        return {
          text: text,
          confidence: confidence,
          usage: data.usage,
        };
      } catch (error) {
        lastError = error;
        console.warn(
          `OpenAI API çağrısı başarısız (deneme ${attempt + 1}/${this.maxRetries}):`,
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
      return new Error(this.config.errorMessages.rateLimitExceeded);
    }

    if (error.message.includes("network") || error.message.includes("fetch")) {
      return new Error(this.config.errorMessages.networkError);
    }

    return new Error(this.config.errorMessages.translationError);
  }
}

// Export for ES modules
export { OpenAIAPIHandler };

// Make class globally available for service worker environment
if (typeof self !== "undefined") {
  self.OpenAIAPIHandler = OpenAIAPIHandler;
}
