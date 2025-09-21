/**
 * Application Constants
 * Uygulama sabitleri ve konfigürasyon değerleri
 */

const APP_CONSTANTS = {
    // Application Info
    APP_NAME: 'G-Translate',
    APP_VERSION: '1.0.0',
    APP_DESCRIPTION: 'Google Gemini API ile güçlü çeviri eklentisi',
    
    // Extension Info
    EXTENSION_ID: 'gemini-translate-extension',
    STORAGE_KEY_PREFIX: 'gemini_translate_',
    
    // API Limits
    MAX_TEXT_LENGTH: 5000,
    MIN_TEXT_LENGTH: 1,
    MAX_TRANSLATION_HISTORY: 100,
    MAX_FAVORITES: 50,
    
    // UI Constants
    POPUP_WIDTH: 350,
    POPUP_HEIGHT: 500,
    POPUP_MIN_WIDTH: 300,
    POPUP_MIN_HEIGHT: 400,
    
    // Timing Constants
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 200,
    AUTO_HIDE_DELAY: 3000,
    API_TIMEOUT: 10000,
    
    // Cache Constants
    CACHE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
    MAX_CACHE_SIZE: 100,
    
    // Theme Constants
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark',
        AUTO: 'auto'
    },
    
    // Translation Status
    STATUS: {
        IDLE: 'idle',
        LOADING: 'loading',
        SUCCESS: 'success',
        ERROR: 'error',
        DETECTING: 'detecting'
    },
    
    // Message Types
    MESSAGE_TYPES: {
        TRANSLATE_TEXT: 'translate_text',
        DETECT_LANGUAGE: 'detect_language',
        GET_HISTORY: 'get_history',
        SAVE_HISTORY: 'save_history',
        CLEAR_HISTORY: 'clear_history',
        GET_SETTINGS: 'get_settings',
        SAVE_SETTINGS: 'save_settings',
        SHOW_NOTIFICATION: 'show_notification',
        OPEN_POPUP: 'open_popup',
        CLOSE_POPUP: 'close_popup',
        GET_AVAILABLE_APIS: 'get_available_apis',
        SWITCH_API: 'switch_api',
        SET_API_KEY: 'set_api_key',
        GET_CURRENT_API: 'get_current_api'
    },
    
    // Storage Keys
    STORAGE_KEYS: {
        SETTINGS: 'settings',
        HISTORY: 'history',
        API_KEY: 'api_key',
        USER_PREFERENCES: 'user_preferences',
        CACHE: 'cache',
        STATISTICS: 'statistics'
    },
    
    // Default Settings
    DEFAULT_SETTINGS: {
        sourceLanguage: 'auto',
        targetLanguage: 'tr',
        theme: 'light',
        showConfidence: true,
        enableHistory: true,
        maxHistoryItems: 100,
        enableNotifications: true,
        enableSound: false,
        autoDetect: true,
        instantTranslation: true,
        contextMenu: true,
        keyboardShortcuts: true,
        popupPosition: 'cursor',
        fontSize: 'medium',
        selectedAPI: 'gemini'
    },
    
    // Keyboard Shortcuts
    SHORTCUTS: {
        TRANSLATE: 'Ctrl+Shift+T',
        HISTORY: 'Ctrl+Shift+H',
        SETTINGS: 'Ctrl+Shift+S',
        CLOSE: 'Escape'
    },
    
    // Context Menu IDs
    CONTEXT_MENU_IDS: {
        TRANSLATE_SELECTED: 'translate-selected',
        TRANSLATE_PAGE: 'translate-page',
        DETECT_LANGUAGE: 'detect-language'
    },
    
    // Error Codes
    ERROR_CODES: {
        API_KEY_MISSING: 'API_KEY_MISSING',
        API_KEY_INVALID: 'API_KEY_INVALID',
        RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
        NETWORK_ERROR: 'NETWORK_ERROR',
        TRANSLATION_ERROR: 'TRANSLATION_ERROR',
        LANGUAGE_NOT_SUPPORTED: 'LANGUAGE_NOT_SUPPORTED',
        TEXT_TOO_LONG: 'TEXT_TOO_LONG',
        TEXT_EMPTY: 'TEXT_EMPTY',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR',
        PERMISSION_DENIED: 'PERMISSION_DENIED',
        STORAGE_ERROR: 'STORAGE_ERROR'
    },
    
    // Success Codes
    SUCCESS_CODES: {
        TRANSLATION_COMPLETE: 'TRANSLATION_COMPLETE',
        LANGUAGE_DETECTED: 'LANGUAGE_DETECTED',
        SETTINGS_SAVED: 'SETTINGS_SAVED',
        HISTORY_CLEARED: 'HISTORY_CLEARED',
        CACHE_CLEARED: 'CACHE_CLEARED'
    },
    
    // File Paths
    PATHS: {
        POPUP: 'popup/popup.html',
        OPTIONS: 'options/options.html',
        BACKGROUND: 'background/background.js',
        CONTENT: 'content/content.js',
        ICONS: 'assets/icons/',
        IMAGES: 'assets/images/',
        FONTS: 'assets/fonts/'
    },
    
    // Icon Sizes
    ICON_SIZES: [16, 32, 48, 128],
    
    // Supported File Types
    SUPPORTED_FILE_TYPES: ['text/plain', 'text/html', 'application/json'],
    
    // Browser Support
    BROWSER_SUPPORT: {
        CHROME_MIN_VERSION: 88,
        FIREFOX_MIN_VERSION: 78,
        EDGE_MIN_VERSION: 88,
        SAFARI_MIN_VERSION: 14,
        OPERA_MIN_VERSION: 74
    },
    
    // Performance Thresholds
    PERFORMANCE: {
        MAX_LOAD_TIME: 200, // ms
        MAX_TRANSLATION_TIME: 2000, // ms
        MAX_MEMORY_USAGE: 50, // MB
        MAX_BUNDLE_SIZE: 1 // MB
    },
    
    // Feature Flags
    FEATURES: {
        INSTANT_TRANSLATION: true,
        LANGUAGE_DETECTION: true,
        TRANSLATION_HISTORY: true,
        KEYBOARD_SHORTCUTS: true,
        CONTEXT_MENU: true,
        NOTIFICATIONS: true,
        THEMES: true,
        CACHING: true,
        OFFLINE_MODE: false,
        VOICE_TRANSLATION: false,
        IMAGE_TRANSLATION: false
    },
    
    // Analytics Events
    ANALYTICS_EVENTS: {
        TRANSLATION_STARTED: 'translation_started',
        TRANSLATION_COMPLETED: 'translation_completed',
        TRANSLATION_FAILED: 'translation_failed',
        LANGUAGE_DETECTED: 'language_detected',
        SETTINGS_CHANGED: 'settings_changed',
        HISTORY_VIEWED: 'history_viewed',
        SHORTCUT_USED: 'shortcut_used',
        CONTEXT_MENU_USED: 'context_menu_used'
    },
    
    // Regex Patterns
    REGEX_PATTERNS: {
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        URL: /^https?:\/\/.+/,
        PHONE: /^[\+]?[1-9][\d]{0,15}$/,
        LANGUAGE_CODE: /^[a-z]{2}(-[A-Z]{2})?$/,
        TEXT_WITH_SPECIAL_CHARS: /[^\w\s]/g
    },
    
    // Color Schemes
    COLORS: {
        PRIMARY: '#4285f4',
        SECONDARY: '#34a853',
        ERROR: '#ea4335',
        WARNING: '#fbbc04',
        SUCCESS: '#34a853',
        INFO: '#4285f4',
        TEXT_PRIMARY: '#202124',
        TEXT_SECONDARY: '#5f6368',
        BACKGROUND: '#ffffff',
        SURFACE: '#f8f9fa',
        BORDER: '#dadce0'
    },
    
    // Dark Theme Colors
    DARK_COLORS: {
        PRIMARY: '#4285f4',
        SECONDARY: '#34a853',
        ERROR: '#ea4335',
        WARNING: '#fbbc04',
        SUCCESS: '#34a853',
        INFO: '#4285f4',
        TEXT_PRIMARY: '#ffffff',
        TEXT_SECONDARY: '#9aa0a6',
        BACKGROUND: '#1a1a1a',
        SURFACE: '#2d2d2d',
        BORDER: '#3c4043'
    },
    
    // Supported Languages
    SUPPORTED_LANGUAGES: [
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
        { code: 'ar', name: 'العربية', flag: '🇸🇦' },
        { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
        { code: 'th', name: 'ไทย', flag: '🇹🇭' },
        { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
        { code: 'pl', name: 'Polski', flag: '🇵🇱' },
        { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
        { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
        { code: 'da', name: 'Dansk', flag: '🇩🇰' },
        { code: 'no', name: 'Norsk', flag: '🇳🇴' },
        { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
        { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
        { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
        { code: 'ro', name: 'Română', flag: '🇷🇴' },
        { code: 'bg', name: 'Български', flag: '🇧🇬' },
        { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
        { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
        { code: 'sl', name: 'Slovenščina', flag: '🇸🇮' },
        { code: 'et', name: 'Eesti', flag: '🇪🇪' },
        { code: 'lv', name: 'Latviešu', flag: '🇱🇻' },
        { code: 'lt', name: 'Lietuvių', flag: '🇱🇹' },
        { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
        { code: 'he', name: 'עברית', flag: '🇮🇱' },
        { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
        { code: 'ur', name: 'اردو', flag: '🇵🇰' },
        { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
        { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
        { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
        { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
        { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
        { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
        { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
        { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
        { code: 'ne', name: 'नेपाली', flag: '🇳🇵' },
        { code: 'si', name: 'සිංහල', flag: '🇱🇰' },
        { code: 'my', name: 'မြန်မာ', flag: '🇲🇲' },
        { code: 'km', name: 'ខ្មែរ', flag: '🇰🇭' },
        { code: 'lo', name: 'ລາວ', flag: '🇱🇦' },
        { code: 'ka', name: 'ქართული', flag: '🇬🇪' },
        { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
        { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
        { code: 'zu', name: 'IsiZulu', flag: '🇿🇦' },
        { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
        { code: 'sq', name: 'Shqip', flag: '🇦🇱' },
        { code: 'mk', name: 'Македонски', flag: '🇲🇰' },
        { code: 'mt', name: 'Malti', flag: '🇲🇹' },
        { code: 'is', name: 'Íslenska', flag: '🇮🇸' },
        { code: 'ga', name: 'Gaeilge', flag: '🇮🇪' },
        { code: 'cy', name: 'Cymraeg', flag: '🇬🇧' },
        { code: 'eu', name: 'Euskera', flag: '🇪🇸' },
        { code: 'ca', name: 'Català', flag: '🇪🇸' },
        { code: 'gl', name: 'Galego', flag: '🇪🇸' }
    ]
};

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONSTANTS;
}

if (typeof window !== 'undefined') {
    window.APP_CONSTANTS = APP_CONSTANTS;
}
