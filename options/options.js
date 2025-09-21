/**
 * Options Page Logic
 * JavaScript functions for the options page
 */

class OptionsController {
  constructor() {
    this.settings = null;
    this.isLoading = false;
    this.hasUnsavedChanges = false;

    this.init();
  }

  /**
   * Initialize the options page
   */
  async init() {
    try {
      // Get DOM elements
      this.elements = this.getElements();

      // Load settings
      await this.loadSettings();

      // Add event listeners
      this.attachEventListeners();

      // Update UI
      this.updateUI();

      // API durumunu kontrol et
      await this.checkAPIStatus();

      console.log("Options page initialized");
    } catch (error) {
      console.error("Options initialization error:", error);
      this.showError("Settings could not be loaded");
    }
  }

  /**
   * Get DOM elements
   */
  getElements() {
    const elements = {
      // Navigation
      navItems: document.querySelectorAll(".nav-item"),
      panels: document.querySelectorAll(".settings-panel"),

      // General settings
      autoDetect: document.getElementById("auto-detect"),
      instantTranslation: document.getElementById("instant-translation"),
      contextMenu: document.getElementById("context-menu"),
      notifications: document.getElementById("notifications"),

      // API settings
      apiProvider: document.getElementById("api-provider"),
      apiKey: document.getElementById("api-key"),
      apiKeyDescription: document.getElementById("api-key-description"),
      toggleApiKey: document.getElementById("toggle-api-key"),
      apiStatus: document.getElementById("api-status"),
      apiUsage: document.getElementById("api-usage"),
      rateLimitItem: document.getElementById("rate-limit-item"),
      rateLimitStatus: document.getElementById("rate-limit-status"),
      dailyLimit: document.getElementById("daily-limit"),
      dailyProgress: document.getElementById("daily-progress"),
      dailyReset: document.getElementById("daily-reset"),
      hourlyLimit: document.getElementById("hourly-limit"),
      hourlyProgress: document.getElementById("hourly-progress"),
      hourlyReset: document.getElementById("hourly-reset"),

      // Language settings
      defaultTargetLanguage: document.getElementById("default-target-language"),
      supportedLanguages: document.getElementById("supported-languages"),

      // Shortcuts
      shortcutsList: document.getElementById("shortcuts-list"),

      // Appearance
      themeRadios: document.querySelectorAll('input[name="theme"]'),
      fontSize: document.getElementById("font-size"),
      showConfidence: document.getElementById("show-confidence"),

      // Advanced
      maxHistory: document.getElementById("max-history"),
      clearCache: document.getElementById("clear-cache"),
      resetData: document.getElementById("reset-data"),

      // Footer
      saveSettings: document.getElementById("save-settings"),
      resetSettings: document.getElementById("reset-settings"),
      lastSaved: document.getElementById("last-saved"),
    };

    // Eksik elementleri kontrol et
    const missingElements = [];
    for (const [key, element] of Object.entries(elements)) {
      if (!element) {
        missingElements.push(key);
      }
    }

    if (missingElements.length > 0) {
      console.error("Eksik DOM elementleri:", missingElements);
      throw new Error(`Eksik DOM elementleri: ${missingElements.join(", ")}`);
    }

    return elements;
  }

  /**
   * Add event listeners
   */
  attachEventListeners() {
    // Navigation
    this.elements.navItems.forEach((item) => {
      item.addEventListener("click", () => {
        this.switchTab(item.dataset.tab);
      });
    });

    // General settings
    this.elements.autoDetect.addEventListener(
      "change",
      this.markAsChanged.bind(this),
    );
    this.elements.instantTranslation.addEventListener(
      "change",
      this.markAsChanged.bind(this),
    );
    this.elements.contextMenu.addEventListener(
      "change",
      this.markAsChanged.bind(this),
    );
    this.elements.notifications.addEventListener(
      "change",
      this.markAsChanged.bind(this),
    );

    // API settings
    this.elements.apiProvider.addEventListener(
      "change",
      this.handleAPIProviderChange.bind(this),
    );
    this.elements.apiKey.addEventListener(
      "input",
      this.markAsChanged.bind(this),
    );
    this.elements.apiKey.addEventListener(
      "blur",
      this.handleAPIKeyChange.bind(this),
    );
    this.elements.toggleApiKey.addEventListener(
      "click",
      this.toggleApiKeyVisibility.bind(this),
    );

    // Language settings
    this.elements.defaultTargetLanguage.addEventListener(
      "change",
      this.markAsChanged.bind(this),
    );

    // Appearance
    this.elements.themeRadios.forEach((radio) => {
      radio.addEventListener("change", this.markAsChanged.bind(this));
    });
    this.elements.fontSize.addEventListener(
      "change",
      this.markAsChanged.bind(this),
    );
    this.elements.showConfidence.addEventListener(
      "change",
      this.markAsChanged.bind(this),
    );

    // Advanced
    this.elements.maxHistory.addEventListener(
      "input",
      this.markAsChanged.bind(this),
    );
    this.elements.clearCache.addEventListener(
      "click",
      this.clearCache.bind(this),
    );
    this.elements.resetData.addEventListener(
      "click",
      this.resetData.bind(this),
    );

    // Footer
    this.elements.saveSettings.addEventListener(
      "click",
      this.saveSettings.bind(this),
    );
    this.elements.resetSettings.addEventListener(
      "click",
      this.resetSettings.bind(this),
    );

    // Keyboard shortcuts
    document.addEventListener("keydown", this.handleKeyboard.bind(this));
  }

  /**
   * Ayarları yükle
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.local.get([
        APP_CONSTANTS.STORAGE_KEYS.SETTINGS,
      ]);
      this.settings =
        result[APP_CONSTANTS.STORAGE_KEYS.SETTINGS] ||
        APP_CONSTANTS.DEFAULT_SETTINGS;
    } catch (error) {
      console.error("Ayarlar yükleme hatası:", error);
      this.settings = APP_CONSTANTS.DEFAULT_SETTINGS;
    }
  }

  /**
   * Mevcut ayarları getir
   */
  async getSettings() {
    if (this.settings) {
      return this.settings;
    }
    
    try {
      const result = await chrome.storage.local.get([
        APP_CONSTANTS.STORAGE_KEYS.SETTINGS,
      ]);
      this.settings =
        result[APP_CONSTANTS.STORAGE_KEYS.SETTINGS] ||
        APP_CONSTANTS.DEFAULT_SETTINGS;
      return this.settings;
    } catch (error) {
      console.error("Ayarlar getirme hatası:", error);
      return APP_CONSTANTS.DEFAULT_SETTINGS;
    }
  }

  /**
   * UI'ı güncelle
   */
  updateUI() {
    // General settings - null kontrolü ile güvenli güncelleme
    if (this.elements.autoDetect) {
      this.elements.autoDetect.checked = this.settings.autoDetect;
    }
    if (this.elements.instantTranslation) {
      this.elements.instantTranslation.checked = this.settings.instantTranslation;
    }
    if (this.elements.contextMenu) {
      this.elements.contextMenu.checked = this.settings.contextMenu;
    }
    if (this.elements.notifications) {
      this.elements.notifications.checked = this.settings.enableNotifications;
    }

    // API settings
    if (this.settings.selectedAPI && this.elements.apiProvider) {
      this.elements.apiProvider.value = this.settings.selectedAPI;
    }

    // API anahtarını güncelle (storage'dan al)
    if (this.settings.selectedAPI && this.elements.apiKey) {
      this.updateAPIKeyFromStorage(this.settings.selectedAPI);
    }

    // Language settings
    if (this.elements.defaultTargetLanguage) {
      this.elements.defaultTargetLanguage.value = this.settings.targetLanguage;
    }

    // Appearance
    const themeRadio = document.querySelector(
      `input[name="theme"][value="${this.settings.theme}"]`,
    );
    if (themeRadio) {
      themeRadio.checked = true;
    }
    if (this.elements.fontSize) {
      this.elements.fontSize.value = this.settings.fontSize;
    }
    if (this.elements.showConfidence) {
      this.elements.showConfidence.checked = this.settings.showConfidence;
    }

    // Advanced
    if (this.elements.maxHistory) {
      this.elements.maxHistory.value = this.settings.maxHistoryItems;
    }

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
    if (!this.elements.supportedLanguages) {
      console.warn("supportedLanguages elementi bulunamadı");
      return;
    }

    const languages = APP_CONSTANTS.SUPPORTED_LANGUAGES || [];
    this.elements.supportedLanguages.innerHTML = "";

    languages.forEach((lang) => {
      const tag = document.createElement("div");
      tag.className = "language-tag";
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
  /**
   * Kısayolları yükle
   */
  async loadShortcuts() {
    if (!this.elements.shortcutsList) {
      console.warn("shortcutsList elementi bulunamadı");
      return;
    }

    const shortcuts = [
      {
        id: "translate",
        name: "Quick Translate",
        description: "Translate selected text or open popup",
        defaultKey: "Ctrl+Shift+T",
        currentKey: null,
      },
      {
        id: "history",
        name: "Open History",
        description: "Show translation history",
        defaultKey: "Ctrl+Shift+H",
        currentKey: null,
      },
      {
        id: "settings",
        name: "Open Settings",
        description: "Open this settings page",
        defaultKey: "Ctrl+Shift+S",
        currentKey: null,
      },
      {
        id: "close",
        name: "Close Popup",
        description: "Close open popups",
        defaultKey: "Escape",
        currentKey: null,
      },
    ];

    this.elements.shortcutsList.innerHTML = "";

    // Mevcut ayarları yükle
    const settings = await this.getSettings();
    const customShortcuts = settings.shortcuts || {};

    shortcuts.forEach((shortcut) => {
      // Kullanıcının özel kısayolunu al veya varsayılanı kullan
      shortcut.currentKey = customShortcuts[shortcut.id] || shortcut.defaultKey;

      const item = document.createElement("div");
      item.className = "shortcut-item";

      item.innerHTML = `
        <div class="shortcut-info">
          <div class="shortcut-name">${shortcut.name}</div>
          <div class="shortcut-description">${shortcut.description}</div>
        </div>
        <div class="shortcut-key-container">
          <input
            type="text"
            class="shortcut-input"
            data-shortcut-id="${shortcut.id}"
            value="${shortcut.currentKey}"
            readonly
            placeholder="Enter shortcut"
          />
          <button
            type="button"
            class="shortcut-reset"
            data-shortcut-id="${shortcut.id}"
            title="Reset to default"
          >
            🔄
          </button>
        </div>
      `;

      this.elements.shortcutsList.appendChild(item);
    });

    // Event listener'ları ekle
    this.attachShortcutListeners();
  }

  /**
   * Kısayol event listener'larını ekle
   */
  attachShortcutListeners() {
    // Kısayol input'larına tıklandığında
    this.elements.shortcutsList.querySelectorAll(".shortcut-input").forEach((input) => {
      input.addEventListener("click", (e) => {
        this.startShortcutRecording(e.target);
      });
    });

    // Reset butonlarına
    this.elements.shortcutsList.querySelectorAll(".shortcut-reset").forEach((button) => {
      button.addEventListener("click", (e) => {
        this.resetShortcut(e.target.dataset.shortcutId);
      });
    });
  }

  /**
   * Kısayol kaydetmeyi başlat
   */
  startShortcutRecording(input) {
    const originalValue = input.value;
    input.value = "Waiting for key combination...";
    input.classList.add("recording");

    const handleKeyDown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Modifier tuşları kontrol et
      const modifiers = [];
      if (e.ctrlKey) modifiers.push("Ctrl");
      if (e.altKey) modifiers.push("Alt");
      if (e.shiftKey) modifiers.push("Shift");
      if (e.metaKey) modifiers.push("Cmd");

      let key = e.key;
      
      // Modifier tuşlarını filtrele - bunlar ayrı key olarak gelmemeli
      if (key === "Control" || key === "Alt" || key === "Shift" || key === "Meta") {
        return; // Modifier tuşları tek başına kaydetme
      }

      // Özel tuşları normalize et
      if (key === " ") key = "Space";
      if (key === "Escape") key = "Escape";
      if (key === "Enter") key = "Enter";
      if (key === "Tab") key = "Tab";
      if (key === "Backspace") key = "Backspace";
      if (key === "Delete") key = "Delete";
      if (key === "ArrowUp") key = "ArrowUp";
      if (key === "ArrowDown") key = "ArrowDown";
      if (key === "ArrowLeft") key = "ArrowLeft";
      if (key === "ArrowRight") key = "ArrowRight";

      // Sadece tek harf tuşları için modifier gerekli
      if (key.length === 1 && modifiers.length === 0) {
        return; // Tek harf tuşları modifier olmadan kabul edilmez
      }

      // Escape gibi özel tuşlar modifier olmadan kabul edilebilir
      const specialKeys = ["Escape", "Enter", "Tab", "Space", "Backspace", "Delete"];
      if (specialKeys.includes(key) && modifiers.length === 0) {
        // Özel tuşlar tek başına kabul edilir
      } else if (key.length === 1 && modifiers.length === 0) {
        return; // Normal harfler modifier gerektirir
      }

      const shortcut = [...modifiers, key].join("+");

      // Geçersiz kısayolları kontrol et
      if (this.isValidShortcut(shortcut)) {
        input.value = shortcut;
        input.classList.remove("recording");
        this.saveShortcut(input.dataset.shortcutId, shortcut);
      } else {
        input.value = "Invalid shortcut!";
        setTimeout(() => {
          input.value = originalValue;
          input.classList.remove("recording");
        }, 1000);
      }

      document.removeEventListener("keydown", handleKeyDown);
    };

    document.addEventListener("keydown", handleKeyDown);

    // 5 saniye sonra otomatik iptal
    setTimeout(() => {
      document.removeEventListener("keydown", handleKeyDown);
      input.value = originalValue;
      input.classList.remove("recording");
    }, 5000);
  }

  /**
   * Kısayol geçerliliğini kontrol et
   */
  isValidShortcut(shortcut) {
    if (!shortcut || typeof shortcut !== 'string') {
      return false;
    }

    const parts = shortcut.split("+");
    if (parts.length === 0) {
      return false;
    }

    const key = parts[parts.length - 1];
    
    // Geçersiz tuşları kontrol et
    const invalidKeys = [
      "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
      "Control", "Alt", "Shift", "Meta", "Ctrl", "Alt", "Shift", "Cmd"
    ];

    if (invalidKeys.includes(key)) {
      return false;
    }

    // En az 2 karakterli olmalı veya Escape gibi özel tuşlar
    const specialKeys = ["Escape", "Enter", "Tab", "Space", "Backspace", "Delete"];
    if (shortcut.length < 2 && !specialKeys.includes(key)) {
      return false;
    }

    // Tekrar eden modifier'ları kontrol et
    const uniqueParts = [...new Set(parts)];
    if (uniqueParts.length !== parts.length) {
      return false;
    }

    return true;
  }

  /**
   * Kısayolu kaydet
   */
  async saveShortcut(shortcutId, shortcut) {
    try {
      const settings = await this.getSettings();
      if (!settings.shortcuts) {
        settings.shortcuts = {};
      }

      settings.shortcuts[shortcutId] = shortcut;
      
      // Ayarları storage'a kaydet
      await chrome.storage.local.set({
        [APP_CONSTANTS.STORAGE_KEYS.SETTINGS]: settings,
      });
      
      this.settings = settings;
      console.log(`Shortcut saved: ${shortcutId} = ${shortcut}`);

      // Content script'e bildir (hata olsa da devam et)
      this.notifyContentScript("SHORTCUTS_UPDATED", settings.shortcuts);
      
      // Başarı mesajı göster
      this.showSuccess(`Shortcut saved: ${shortcut}`);
    } catch (error) {
      console.error("Shortcut save error:", error);
      this.showError("Shortcut could not be saved");
    }
  }

  /**
   * Kısayolu sıfırla
   */
  async resetShortcut(shortcutId) {
    const shortcuts = [
      { id: "translate", defaultKey: "Ctrl+Shift+T" },
      { id: "history", defaultKey: "Ctrl+Shift+H" },
      { id: "settings", defaultKey: "Ctrl+Shift+S" },
      { id: "close", defaultKey: "Escape" },
    ];

    const shortcut = shortcuts.find((s) => s.id === shortcutId);
    if (shortcut) {
      const input = this.elements.shortcutsList.querySelector(
        `[data-shortcut-id="${shortcutId}"]`
      );
      input.value = shortcut.defaultKey;

      await this.saveShortcut(shortcutId, shortcut.defaultKey);
    }
  }

  /**
   * Content script'e bildir
   */
  async notifyContentScript(messageType, data) {
    try {
      // Tüm aktif tab'ları kontrol et
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tabs.length > 0) {
        // Her tab'a mesaj göndermeyi dene
        for (const tab of tabs) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: messageType,
              data: data,
            });
            console.log(`Kısayol güncellendi: ${tab.url}`);
            break; // Başarılı olan tab'da dur
          } catch (tabError) {
            // Bu tab'da content script yok, diğerini dene
            console.warn(`Tab ${tab.id} content script hazır değil:`, tabError.message);
            continue;
          }
        }
      } else {
        console.warn("Aktif tab bulunamadı, kısayol güncellemesi atlandı");
      }
    } catch (error) {
      console.warn("Content script bildirim hatası (kritik değil):", error.message);
      // Bu hata kritik değil, kısayollar storage'da kaydedildi
    }
  }

  /**
   * Tab değiştir
   */
  switchTab(tabName) {
    // Navigation güncelle
    this.elements.navItems.forEach((item) => {
      item.classList.remove("active");
      if (item.dataset.tab === tabName) {
        item.classList.add("active");
      }
    });

    // Panel güncelle
    this.elements.panels.forEach((panel) => {
      panel.classList.remove("active");
      if (panel.id === `${tabName}-panel`) {
        panel.classList.add("active");
      }
    });
  }

  /**
   * API anahtarı görünürlüğünü değiştir
   */
  toggleApiKeyVisibility() {
    const input = this.elements.apiKey;
    const button = this.elements.toggleApiKey;

    if (input.type === "password") {
      input.type = "text";
      button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94,17.94A10.07,10.07 0 0,1 12,20c-7,0 -11,-8 -11,-8a18.45,18.45 0 0,1 5.06,-5.94M9.9,4.24A9.12,9.12 0 0,1 12,4c7,0 11,8 11,8a18.5,18.5 0 0,1 -2.16,3.19m-6.72,-1.07a3,3 0 1,1 -4.24,-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
            `;
    } else {
      input.type = "password";
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
      let currentAPIResult;
      try {
        currentAPIResult = await chrome.runtime.sendMessage({
          type: APP_CONSTANTS.MESSAGE_TYPES.GET_CURRENT_API,
        });
      } catch (error) {
        console.warn(
          "Background script hazır değil, API durum kontrol edilemiyor:",
          error,
        );
        currentAPIResult = { success: false };
      }

      if (currentAPIResult.success) {
        const currentAPI = currentAPIResult.data;
        
        // Update UI (sadece gerekli kısımları)
        if (this.elements.apiProvider) {
          this.elements.apiProvider.value = currentAPI.id;
        }

        // API anahtarını yükle
        const storageKey = `${currentAPI.id}_api_key`;
        const apiKeyResult = await chrome.storage.local.get([storageKey]);
        const apiKey = apiKeyResult[storageKey];

        if (apiKey) {
          if (this.elements.apiKey) {
            this.elements.apiKey.value = apiKey;
          }
          
          // Gerçek API bağlantısını test et
          await this.testAPIConnection(currentAPI.id, apiKey);
          this.updateAPIKeyDescription(currentAPI.name);
        } else {
          this.updateAPIStatus(
            "error",
            `${currentAPI.name} API anahtarı bulunamadı`,
          );
          this.updateAPIKeyDescription(currentAPI.name);
        }
      } else {
        this.updateAPIStatus("error", "API durumu kontrol edilemedi");
      }

      // API kullanım istatistiklerini yükle
      await this.loadAPIUsage();
      
      // Rate limit durumunu yükle
      await this.loadRateLimitStatus();
    } catch (error) {
      console.error("API durumu kontrol hatası:", error);
      this.updateAPIStatus("error", "API durumu kontrol edilemedi");
    }
  }

  /**
   * API bağlantısını test et
   */
  async testAPIConnection(apiId, apiKey) {
    try {
      // Test çevirisi yap
      const testResult = await chrome.runtime.sendMessage({
        type: APP_CONSTANTS.MESSAGE_TYPES.TRANSLATE_TEXT,
        data: {
          text: "test",
          targetLanguage: "tr",
          sourceLanguage: "en"
        }
      });

      if (testResult.success) {
        this.updateAPIStatus("connected", `${apiId} bağlantısı aktif`);
      } else {
        this.updateAPIStatus("error", `${apiId} bağlantı hatası: ${testResult.error || "Bilinmeyen hata"}`);
      }
    } catch (error) {
      console.error("API bağlantı testi hatası:", error);
      this.updateAPIStatus("error", `${apiId} bağlantı testi başarısız`);
    }
  }

  /**
   * Kullanılabilir API'leri yükle
   */
  async loadAvailableAPIs() {
    try {
      let result;
      try {
        result = await chrome.runtime.sendMessage({
          type: APP_CONSTANTS.MESSAGE_TYPES.GET_AVAILABLE_APIS,
        });
      } catch (error) {
        console.warn(
          "Background script hazır değil, API listesi alınamıyor:",
          error,
        );
        result = { success: false };
      }

      if (result.success) {
        const apis = result.data;
        const select = this.elements.apiProvider;

        // Mevcut seçenekleri temizle (ilk seçenek hariç)
        while (select.options.length > 1) {
          select.remove(1);
        }

        // API'leri ekle
        apis.forEach((api) => {
          const option = document.createElement("option");
          option.value = api.id;
          option.textContent = `${api.name} - ${api.description}`;
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error("API listesi yükleme hatası:", error);
    }
  }

  /**
   * Kullanılabilir API'leri getir (sadece veri döndürür)
   */
  async getAvailableAPIs() {
    try {
      let result;
      try {
        result = await chrome.runtime.sendMessage({
          type: APP_CONSTANTS.MESSAGE_TYPES.GET_AVAILABLE_APIS,
        });
      } catch (error) {
        console.warn(
          "Background script hazır değil, API listesi alınamıyor:",
          error,
        );
        result = { success: false };
      }

      if (result.success) {
        return result.data;
      }
      return [];
    } catch (error) {
      console.error("API listesi alma hatası:", error);
      return [];
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
   * API anahtarını storage'dan yükle
   */
  async updateAPIKeyFromStorage(apiId) {
    try {
      const storageKey = `${apiId}_api_key`;
      const result = await chrome.storage.local.get([storageKey]);
      const apiKey = result[storageKey];
      
      if (this.elements.apiKey) {
        this.elements.apiKey.value = apiKey || "";
      }
    } catch (error) {
      console.error("API anahtarı yükleme hatası:", error);
    }
  }

  /**
   * API anahtarı değişikliğini işle
   */
  async handleAPIKeyChange(event) {
    const apiKey = event.target.value.trim();
    const apiProvider = this.elements.apiProvider.value;

    if (!apiKey || !apiProvider) {
      return;
    }

    try {
      // API anahtarını kaydet
      const storageKey = `${apiProvider}_api_key`;
      await chrome.storage.local.set({
        [storageKey]: apiKey,
      });

      // Background'a gönder
      try {
        const result = await chrome.runtime.sendMessage({
          type: APP_CONSTANTS.MESSAGE_TYPES.SET_API_KEY,
          data: {
            apiId: apiProvider,
            apiKey: apiKey,
          },
        });

        if (result.success) {
          // Bağlantıyı test et
          await this.testAPIConnection(apiProvider, apiKey);
        } else {
          this.updateAPIStatus("error", "API anahtarı geçersiz: " + (result.error || "Bilinmeyen hata"));
        }
      } catch (runtimeError) {
        console.warn("Background script hazır değil:", runtimeError);
        this.updateAPIStatus("error", "API durumu kontrol edilemedi");
      }
    } catch (error) {
      console.error("API anahtarı kaydetme hatası:", error);
      this.updateAPIStatus("error", "API anahtarı kaydedilemedi");
    }
  }

  /**
   * API sağlayıcısı değişikliğini işle
   */
  async handleAPIProviderChange(event) {
    const selectedAPI = event.target.value;

    if (!selectedAPI) return;

    try {
      // Önce UI'ı güncelle (kullanıcı deneyimi için)
      this.elements.apiProvider.value = selectedAPI;
      
      // API anahtarını yükle
      const storageKey = `${selectedAPI}_api_key`;
      const apiKeyResult = await chrome.storage.local.get([storageKey]);
      const apiKey = apiKeyResult[storageKey];

      // Update UI
      this.elements.apiKey.value = apiKey || "";

      // API bilgilerini al ve açıklamayı güncelle
      const availableAPIs = await this.getAvailableAPIs();
      const selectedAPIData = availableAPIs.find(api => api.id === selectedAPI);
      
      if (selectedAPIData) {
        this.updateAPIKeyDescription(selectedAPIData.name);
      }

      // API'yi değiştir
      let result;
      try {
        result = await chrome.runtime.sendMessage({
          type: APP_CONSTANTS.MESSAGE_TYPES.SWITCH_API,
          data: { apiId: selectedAPI },
        });
      } catch (error) {
        console.warn(
          "Background script hazır değil, API değiştirilemiyor:",
          error,
        );
        result = { success: false };
      }

      if (result.success) {
        // API durumunu güncelle (sadece durum kontrolü)
        if (apiKey) {
          await this.testAPIConnection(selectedAPI, apiKey);
        } else {
          this.updateAPIStatus("error", `${selectedAPIData?.name || selectedAPI} API anahtarı bulunamadı`);
        }

        this.markAsChanged();
        this.showSuccess("API sağlayıcısı değiştirildi");
      } else {
        // Hata durumunda seçimi geri al
        const currentSettings = await this.getSettings();
        this.elements.apiProvider.value = currentSettings.selectedAPI || "gemini";
        this.showError("API sağlayıcısı değiştirilemedi: " + (result.error || "Bilinmeyen hata"));
      }
    } catch (error) {
      console.error("API sağlayıcısı değiştirme hatası:", error);
      // Hata durumunda seçimi geri al
      const currentSettings = await this.getSettings();
      this.elements.apiProvider.value = currentSettings.selectedAPI || "gemini";
      this.showError("API sağlayıcısı değiştirilemedi");
    }
  }

  /**
   * API durumunu güncelle
   */
  updateAPIStatus(status, message) {
    const indicator = this.elements.apiStatus.querySelector(".status-indicator");
    const text = this.elements.apiStatus.querySelector(".status-text");

    indicator.className = "status-indicator";
    if (status === "connected") {
      indicator.classList.add("connected");
    } else if (status === "error") {
      indicator.classList.add("error");
    }

    text.textContent = message;
  }

  /**
   * API kullanım istatistiklerini yükle
   */
  async loadAPIUsage() {
    try {
      // Options sayfasında doğrudan chrome.storage API'sini kullan
      const result = await chrome.storage.local.get([
        APP_CONSTANTS.STORAGE_KEYS.STATISTICS,
      ]);
      const stats = result[APP_CONSTANTS.STORAGE_KEYS.STATISTICS] || {
        daily: 0,
        monthly: 0,
      };

      const todayUsage = this.elements.apiUsage.querySelector(
        ".usage-item:first-child .usage-value",
      );
      const monthlyUsage = this.elements.apiUsage.querySelector(
        ".usage-item:last-child .usage-value",
      );

      todayUsage.textContent = `${stats.daily} çeviri`;
      monthlyUsage.textContent = `${stats.monthly} çeviri`;
    } catch (error) {
      console.error("API kullanım istatistikleri yükleme hatası:", error);
    }
  }

  /**
   * Rate limit durumunu yükle
   */
  async loadRateLimitStatus() {
    try {
      // Gemini API için rate limit durumunu al
      const result = await chrome.storage.local.get(['gemini_request_counters']);
      const counters = result.gemini_request_counters || {
        dailyRequestCount: 0,
        hourlyRequestCount: 0,
        lastResetDate: new Date().toDateString(),
        lastResetHour: new Date().getHours()
      };

      // Rate limit durumunu göster
      this.updateRateLimitDisplay(counters);
    } catch (error) {
      console.error("Rate limit durumu yükleme hatası:", error);
    }
  }

  /**
   * Rate limit görünümünü güncelle
   */
  updateRateLimitDisplay(counters) {
    const dailyUsed = counters.dailyRequestCount || 0;
    const hourlyUsed = counters.hourlyRequestCount || 0;
    const dailyLimit = 250; // Gemini 2.5 Flash free tier (Updated 2024)
    const hourlyLimit = 50; // Updated safety limit

    // Günlük limit
    const dailyPercentage = Math.min((dailyUsed / dailyLimit) * 100, 100);
    this.elements.dailyLimit.textContent = `${dailyUsed}/${dailyLimit}`;
    this.elements.dailyProgress.style.width = `${dailyPercentage}%`;
    
    // Saatlik limit
    const hourlyPercentage = Math.min((hourlyUsed / hourlyLimit) * 100, 100);
    this.elements.hourlyLimit.textContent = `${hourlyUsed}/${hourlyLimit}`;
    this.elements.hourlyProgress.style.width = `${hourlyPercentage}%`;

    // Reset zamanları
    const now = new Date();
    const nextDay = new Date(now);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0);
    
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);

    this.elements.dailyReset.textContent = `Sıfırlanma: ${nextDay.toLocaleString('tr-TR')}`;
    this.elements.hourlyReset.textContent = `Sıfırlanma: ${nextHour.toLocaleString('tr-TR')}`;

    // Uyarı durumları
    const dailyItem = this.elements.rateLimitStatus.querySelector('.limit-item:first-child');
    const hourlyItem = this.elements.rateLimitStatus.querySelector('.limit-item:last-child');

    // Günlük limit uyarıları
    if (dailyPercentage >= 90) {
      dailyItem.classList.add('danger');
      dailyItem.classList.remove('warning');
    } else if (dailyPercentage >= 70) {
      dailyItem.classList.add('warning');
      dailyItem.classList.remove('danger');
    } else {
      dailyItem.classList.remove('warning', 'danger');
    }

    // Saatlik limit uyarıları
    if (hourlyPercentage >= 90) {
      hourlyItem.classList.add('danger');
      hourlyItem.classList.remove('warning');
    } else if (hourlyPercentage >= 70) {
      hourlyItem.classList.add('warning');
      hourlyItem.classList.remove('danger');
    } else {
      hourlyItem.classList.remove('warning', 'danger');
    }

    // Rate limit bölümünü göster (sadece Gemini API için)
    if (this.settings && this.settings.selectedAPI === 'gemini') {
      this.elements.rateLimitItem.style.display = 'block';
    } else {
      this.elements.rateLimitItem.style.display = 'none';
    }
  }

  /**
   * Değişiklik işaretle
   */
  markAsChanged() {
    this.hasUnsavedChanges = true;
    this.elements.saveSettings.disabled = false;
    this.elements.saveSettings.style.opacity = "1";
  }

  /**
   * Ayarları kaydet
   */
  async saveSettings(newSettings = null) {
    try {
      this.setLoadingState(true);

      // Form verilerini topla veya parametre olarak gelen ayarları kullan
      const settingsToSave = newSettings || {
        autoDetect: this.elements.autoDetect.checked,
        instantTranslation: this.elements.instantTranslation.checked,
        contextMenu: this.elements.contextMenu.checked,
        enableNotifications: this.elements.notifications.checked,
        targetLanguage: this.elements.defaultTargetLanguage.value,
        theme: document.querySelector('input[name="theme"]:checked').value,
        fontSize: this.elements.fontSize.value,
        showConfidence: this.elements.showConfidence.checked,
        maxHistoryItems: parseInt(this.elements.maxHistory.value),
        selectedAPI: this.elements.apiProvider.value,
      };

      // API anahtarını kaydet (seçili API'ye göre)
      if (
        this.elements.apiKey.value.trim() &&
        this.elements.apiProvider.value
      ) {
        const storageKey = `${this.elements.apiProvider.value}_api_key`;
        const apiKey = this.elements.apiKey.value.trim();
        
        // Önce storage'a kaydet
        await chrome.storage.local.set({
          [storageKey]: apiKey,
        });

        // API anahtarını background'a gönder ve bağlantıyı test et
        try {
          const result = await chrome.runtime.sendMessage({
            type: APP_CONSTANTS.MESSAGE_TYPES.SET_API_KEY,
            data: {
              apiId: this.elements.apiProvider.value,
              apiKey: apiKey,
            },
          });

          if (result.success) {
            // API durumunu güncelle
            await this.testAPIConnection(apiProvider, apiKey);
            console.log("API anahtarı başarıyla kaydedildi ve test edildi");
          } else {
            console.warn("API anahtarı kaydedildi ancak test başarısız:", result.error);
            this.updateAPIStatus("error", "API anahtarı geçersiz veya bağlantı hatası");
          }
        } catch (runtimeError) {
          console.warn(
            "Background script hazır değil, ancak ayarlar kaydedildi:",
            runtimeError,
          );
          // Bu kritik değil, ayarlar zaten local storage'a kaydedildi
          this.updateAPIStatus("error", "API durumu kontrol edilemedi");
        }
      }

      // Ayarları kaydet
      await chrome.storage.local.set({
        [APP_CONSTANTS.STORAGE_KEYS.SETTINGS]: settingsToSave,
      });

      this.settings = settingsToSave;
      this.hasUnsavedChanges = false;
      this.elements.saveSettings.disabled = true;
      this.elements.saveSettings.style.opacity = "0.6";

      this.updateLastSavedTime();
      this.showSuccess("Settings saved successfully");
    } catch (error) {
      console.error("Settings save error:", error);
      this.showError("Settings could not be saved");
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * Ayarları sıfırla
   */
  async resetSettings() {
    try {
      if (
        confirm(
          "Tüm ayarları varsayılan değerlere sıfırlamak istediğinizden emin misiniz?",
        )
      ) {
        this.settings = { ...APP_CONSTANTS.DEFAULT_SETTINGS };
        this.updateUI();
        this.markAsChanged();
        this.showSuccess("Ayarlar sıfırlandı");
      }
    } catch (error) {
      console.error("Ayarlar sıfırlama hatası:", error);
      this.showError("Ayarlar sıfırlanamadı");
    }
  }

  /**
   * Cache temizle
   */
  async clearCache() {
    try {
      if (confirm("Önbelleği temizlemek istediğinizden emin misiniz?")) {
        await chrome.storage.local.set({
          [APP_CONSTANTS.STORAGE_KEYS.CACHE]: {},
        });

        this.showSuccess("Önbellek temizlendi");
      }
    } catch (error) {
      console.error("Cache temizleme hatası:", error);
      this.showError("Önbellek temizlenemedi");
    }
  }

  /**
   * Tüm verileri sıfırla
   */
  async resetData() {
    try {
      if (
        confirm(
          "TÜM VERİLERİ SİLMEK İSTEDİĞİNİZDEN EMİN MİSİNİZ?\n\nBu işlem geri alınamaz ve tüm ayarlar, geçmiş ve veriler silinecektir.",
        )
      ) {
        await chrome.storage.local.set({
          [APP_CONSTANTS.STORAGE_KEYS.SETTINGS]: APP_CONSTANTS.DEFAULT_SETTINGS,
          [APP_CONSTANTS.STORAGE_KEYS.HISTORY]: [],
          [APP_CONSTANTS.STORAGE_KEYS.CACHE]: {},
          [APP_CONSTANTS.STORAGE_KEYS.STATISTICS]: { daily: 0, monthly: 0 },
        });

        this.settings = { ...APP_CONSTANTS.DEFAULT_SETTINGS };
        this.updateUI();
        this.markAsChanged();
        this.showSuccess("Tüm veriler sıfırlandı");
      }
    } catch (error) {
      console.error("Veri sıfırlama hatası:", error);
      this.showError("Veriler sıfırlanamadı");
    }
  }

  /**
   * Son kaydetme zamanını güncelle
   */
  updateLastSavedTime() {
    if (!this.elements.lastSaved) {
      console.warn("lastSaved elementi bulunamadı");
      return;
    }

    const now = new Date();
    const timeString = now.toLocaleString("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    this.elements.lastSaved.textContent = timeString;
  }

  /**
   * Loading durumunu ayarla
   */
  setLoadingState(loading) {
    this.isLoading = loading;

    if (loading) {
      document.body.classList.add("loading");
    } else {
      document.body.classList.remove("loading");
    }
  }

  /**
   * Başarı mesajı göster
   */
  showSuccess(message) {
    console.log("✅", message);
    
    // Kısayol kaydetme için alert gösterme (çok sık olabilir)
    if (message.includes("Kısayol kaydedildi")) {
      return; // Sessiz başarı
    }
    
    // Diğer başarı mesajları için alert
    alert(message);
  }

  /**
   * Hata mesajı göster
   */
  showError(message) {
    console.error("❌", message);
    alert("Hata: " + message);
  }

  /**
   * Klavye olayları
   */
  handleKeyboard(event) {
    // Ctrl+S ile kaydet
    if (event.ctrlKey && event.key === "s") {
      event.preventDefault();
      if (this.hasUnsavedChanges) {
        this.saveSettings();
      }
    }

    // Escape ile kapat
    if (event.key === "Escape") {
      if (this.hasUnsavedChanges) {
        if (
          confirm(
            "Kaydedilmemiş değişiklikler var. Sayfayı kapatmak istediğinizden emin misiniz?",
          )
        ) {
          window.close();
        }
      } else {
        window.close();
      }
    }
  }
}

// Options sayfasını başlat
document.addEventListener("DOMContentLoaded", () => {
  // Basit test - chrome API mevcut mu kontrol et
  if (typeof chrome === "undefined" || !chrome.storage) {
    console.error("Chrome API mevcut değil!");
    alert(
      "Chrome extension API'si mevcut değil. Bu sayfayı tarayıcı extension'ı içinden açtığınızdan emin olun.",
    );
    return;
  }

  // APP_CONSTANTS mevcut mu kontrol et
  if (typeof APP_CONSTANTS === "undefined") {
    console.error("APP_CONSTANTS yüklenmedi!");
    alert("Uygulama sabitleri yüklenemedi. Sayfa yeniden yükleniyor...");
    location.reload();
    return;
  }

  window.optionsController = new OptionsController();
});

// Export for testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = OptionsController;
}
