/**
 * Language Codes and Utilities
 * Dil kodları ve yardımcı fonksiyonlar
 */

const LANGUAGE_CODES = {
  // ISO 639-1 Language Codes
  af: "Afrikaans",
  am: "Amharic",
  ar: "Arabic",
  az: "Azerbaijani",
  be: "Belarusian",
  bg: "Bulgarian",
  bn: "Bengali",
  bs: "Bosnian",
  ca: "Catalan",
  cs: "Czech",
  cy: "Welsh",
  da: "Danish",
  de: "German",
  el: "Greek",
  en: "English",
  es: "Spanish",
  et: "Estonian",
  eu: "Basque",
  fa: "Persian",
  fi: "Finnish",
  fr: "French",
  gl: "Galician",
  gu: "Gujarati",
  he: "Hebrew",
  hi: "Hindi",
  hr: "Croatian",
  hu: "Hungarian",
  hy: "Armenian",
  id: "Indonesian",
  is: "Icelandic",
  it: "Italian",
  ja: "Japanese",
  ka: "Georgian",
  kk: "Kazakh",
  km: "Khmer",
  kn: "Kannada",
  ko: "Korean",
  ky: "Kyrgyz",
  lo: "Lao",
  lt: "Lithuanian",
  lv: "Latvian",
  mk: "Macedonian",
  ml: "Malayalam",
  mn: "Mongolian",
  mr: "Marathi",
  ms: "Malay",
  my: "Myanmar",
  ne: "Nepali",
  nl: "Dutch",
  no: "Norwegian",
  pa: "Punjabi",
  pl: "Polish",
  pt: "Portuguese",
  ro: "Romanian",
  ru: "Russian",
  si: "Sinhala",
  sk: "Slovak",
  sl: "Slovenian",
  sq: "Albanian",
  sr: "Serbian",
  sv: "Swedish",
  sw: "Swahili",
  ta: "Tamil",
  te: "Telugu",
  th: "Thai",
  tr: "Turkish",
  uk: "Ukrainian",
  ur: "Urdu",
  uz: "Uzbek",
  vi: "Vietnamese",
  zh: "Chinese",
  zu: "Zulu",
};

const LANGUAGE_FLAGS = {
  af: "🇿🇦",
  am: "🇪🇹",
  ar: "🇸🇦",
  az: "🇦🇿",
  be: "🇧🇾",
  bg: "🇧🇬",
  bn: "🇧🇩",
  bs: "🇧🇦",
  ca: "🇪🇸",
  cs: "🇨🇿",
  cy: "🇬🇧",
  da: "🇩🇰",
  de: "🇩🇪",
  el: "🇬🇷",
  en: "🇺🇸",
  es: "🇪🇸",
  et: "🇪🇪",
  eu: "🇪🇸",
  fa: "🇮🇷",
  fi: "🇫🇮",
  fr: "🇫🇷",
  gl: "🇪🇸",
  gu: "🇮🇳",
  he: "🇮🇱",
  hi: "🇮🇳",
  hr: "🇭🇷",
  hu: "🇭🇺",
  hy: "🇦🇲",
  id: "🇮🇩",
  is: "🇮🇸",
  it: "🇮🇹",
  ja: "🇯🇵",
  ka: "🇬🇪",
  kk: "🇰🇿",
  km: "🇰🇭",
  kn: "🇮🇳",
  ko: "🇰🇷",
  ky: "🇰🇬",
  lo: "🇱🇦",
  lt: "🇱🇹",
  lv: "🇱🇻",
  mk: "🇲🇰",
  ml: "🇮🇳",
  mn: "🇲🇳",
  mr: "🇮🇳",
  ms: "🇲🇾",
  my: "🇲🇲",
  ne: "🇳🇵",
  nl: "🇳🇱",
  no: "🇳🇴",
  pa: "🇮🇳",
  pl: "🇵🇱",
  pt: "🇵🇹",
  ro: "🇷🇴",
  ru: "🇷🇺",
  si: "🇱🇰",
  sk: "🇸🇰",
  sl: "🇸🇮",
  sq: "🇦🇱",
  sr: "🇷🇸",
  sv: "🇸🇪",
  sw: "🇰🇪",
  ta: "🇮🇳",
  te: "🇮🇳",
  th: "🇹🇭",
  tr: "🇹🇷",
  uk: "🇺🇦",
  ur: "🇵🇰",
  uz: "🇺🇿",
  vi: "🇻🇳",
  zh: "🇨🇳",
  zu: "🇿🇦",
};

class LanguageUtils {
  /**
   * Dil kodundan dil adını al
   */
  static getLanguageName(code) {
    return LANGUAGE_CODES[code] || "Unknown";
  }

  /**
   * Dil kodundan bayrağı al
   */
  static getLanguageFlag(code) {
    return LANGUAGE_FLAGS[code] || "🌐";
  }

  /**
   * Dil adından kodu al
   */
  static getLanguageCode(name) {
    const entry = Object.entries(LANGUAGE_CODES).find(
      ([code, langName]) => langName.toLowerCase() === name.toLowerCase(),
    );
    return entry ? entry[0] : null;
  }

  /**
   * Desteklenen dilleri al
   */
  static getSupportedLanguages() {
    return Object.keys(LANGUAGE_CODES).map((code) => ({
      code,
      name: LANGUAGE_CODES[code],
      flag: LANGUAGE_FLAGS[code],
    }));
  }

  /**
   * Dil kodunu doğrula
   */
  static isValidLanguageCode(code) {
    return code in LANGUAGE_CODES;
  }

  /**
   * Dil adını doğrula
   */
  static isValidLanguageName(name) {
    return Object.values(LANGUAGE_CODES).includes(name);
  }

  /**
   * Aynı dil kontrolü
   */
  static isSameLanguage(code1, code2) {
    return code1 === code2;
  }

  /**
   * Dil ailesi bilgisi
   */
  static getLanguageFamily(code) {
    const families = {
      tr: "Turkic",
      en: "Germanic",
      es: "Romance",
      fr: "Romance",
      de: "Germanic",
      it: "Romance",
      pt: "Romance",
      ru: "Slavic",
      ja: "Japonic",
      ko: "Koreanic",
      zh: "Sino-Tibetan",
      ar: "Semitic",
      hi: "Indo-Aryan",
      th: "Tai-Kadai",
      vi: "Austroasiatic",
    };
    return families[code] || "Unknown";
  }

  /**
   * Yazı sistemi bilgisi
   */
  static getWritingSystem(code) {
    const systems = {
      en: "Latin",
      tr: "Latin",
      es: "Latin",
      fr: "Latin",
      de: "Latin",
      it: "Latin",
      pt: "Latin",
      ru: "Cyrillic",
      ja: "Hiragana/Katakana/Kanji",
      ko: "Hangul",
      zh: "Han",
      ar: "Arabic",
      hi: "Devanagari",
      th: "Thai",
      vi: "Latin",
    };
    return systems[code] || "Unknown";
  }

  /**
   * Dil yönü (RTL/LTR)
   */
  static getTextDirection(code) {
    const rtlLanguages = ["ar", "he", "fa", "ur"];
    return rtlLanguages.includes(code) ? "rtl" : "ltr";
  }

  /**
   * Dil seçenekleri için format
   */
  static formatLanguageOption(code) {
    const name = this.getLanguageName(code);
    const flag = this.getLanguageFlag(code);
    return {
      value: code,
      label: `${flag} ${name}`,
      name: name,
      flag: flag,
      code: code,
    };
  }

  /**
   * Tüm dilleri seçenek formatında al
   */
  static getAllLanguageOptions() {
    return Object.keys(LANGUAGE_CODES)
      .map((code) => this.formatLanguageOption(code))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Popüler dilleri al
   */
  static getPopularLanguages() {
    const popularCodes = [
      "en",
      "tr",
      "es",
      "fr",
      "de",
      "it",
      "pt",
      "ru",
      "ja",
      "ko",
      "zh",
      "ar",
      "hi",
    ];
    return popularCodes.map((code) => this.formatLanguageOption(code));
  }
}

// Export for ES modules
export { LANGUAGE_CODES, LANGUAGE_FLAGS, LanguageUtils };

// Make constants and classes globally available for service worker environment
if (typeof self !== "undefined") {
  self.LANGUAGE_CODES = LANGUAGE_CODES;
  self.LANGUAGE_FLAGS = LANGUAGE_FLAGS;
  self.LanguageUtils = LanguageUtils;
}
