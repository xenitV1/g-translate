/**
 * Cross-Browser Compatibility Layer
 * Farklı tarayıcılar arasında API uyumluluğu sağlar
 */

class CompatibilityLayer {
    constructor() {
        this.browser = window.browserDetector ? window.browserDetector.browser : 'chrome';
        this.setupAPIs();
    }

    /**
     * API'leri tarayıcıya göre ayarla
     */
    setupAPIs() {
        // Chrome/Edge/Brave için
        if (this.browser === 'chrome' || this.browser === 'edge' || this.browser === 'brave') {
            this.api = chrome;
            this.isChromeBased = true;
        }
        // Firefox için
        else if (this.browser === 'firefox') {
            this.api = browser || chrome;
            this.isChromeBased = false;
        }
        // Safari için
        else if (this.browser === 'safari') {
            this.api = chrome;
            this.isChromeBased = true;
        }
        // Fallback
        else {
            this.api = chrome || browser;
            this.isChromeBased = true;
        }
    }

    /**
     * Storage API'sini normalize et
     */
    getStorage() {
        if (this.isChromeBased) {
            return this.api.storage;
        } else {
            return this.api.storage;
        }
    }

    /**
     * Runtime API'sini normalize et
     */
    getRuntime() {
        return this.api.runtime;
    }

    /**
     * Tabs API'sini normalize et
     */
    getTabs() {
        return this.api.tabs;
    }

    /**
     * Context Menus API'sini normalize et
     */
    getContextMenus() {
        return this.api.contextMenus;
    }

    /**
     * Scripting API'sini kontrol et (Chrome V3 only)
     */
    getScripting() {
        if (this.isChromeBased && this.api.scripting) {
            return this.api.scripting;
        }
        return null;
    }

    /**
     * Cross-browser message gönderme
     */
    sendMessage(message, callback) {
        if (this.isChromeBased) {
            return this.api.runtime.sendMessage(message, callback);
        } else {
            return this.api.runtime.sendMessage(message).then(callback);
        }
    }

    /**
     * Cross-browser message dinleme
     */
    onMessage(callback) {
        this.api.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (this.isChromeBased) {
                return callback(message, sender, sendResponse);
            } else {
                return callback(message, sender);
            }
        });
    }

    /**
     * Storage işlemleri
     */
    async setStorageData(data) {
        const storage = this.getStorage();
        
        if (this.isChromeBased) {
            return new Promise((resolve) => {
                storage.local.set(data, resolve);
            });
        } else {
            return storage.local.set(data);
        }
    }

    async getStorageData(keys) {
        const storage = this.getStorage();
        
        if (this.isChromeBased) {
            return new Promise((resolve) => {
                storage.local.get(keys, resolve);
            });
        } else {
            return storage.local.get(keys);
        }
    }

    async removeStorageData(keys) {
        const storage = this.getStorage();
        
        if (this.isChromeBased) {
            return new Promise((resolve) => {
                storage.local.remove(keys, resolve);
            });
        } else {
            return storage.local.remove(keys);
        }
    }

    /**
     * Tab işlemleri
     */
    async getActiveTab() {
        const tabs = this.getTabs();
        
        if (this.isChromeBased) {
            return new Promise((resolve) => {
                tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    resolve(tabs[0]);
                });
            });
        } else {
            const tabs = await tabs.query({ active: true, currentWindow: true });
            return tabs[0];
        }
    }

    async executeScript(tabId, details) {
        const scripting = this.getScripting();
        const tabs = this.getTabs();
        
        if (scripting) {
            // Chrome V3
            return scripting.executeScript({
                target: { tabId: tabId },
                ...details
            });
        } else {
            // Firefox V2 fallback
            return new Promise((resolve) => {
                tabs.executeScript(tabId, details, resolve);
            });
        }
    }

    /**
     * Context Menu işlemleri
     */
    createContextMenu(options) {
        const contextMenus = this.getContextMenus();
        return contextMenus.create(options);
    }

    onContextMenuClicked(callback) {
        const contextMenus = this.getContextMenus();
        contextMenus.onClicked.addListener(callback);
    }

    /**
     * Permissions işlemleri
     */
    async requestPermissions(permissions) {
        if (this.isChromeBased && this.api.permissions) {
            return new Promise((resolve) => {
                this.api.permissions.request({ permissions }, resolve);
            });
        } else {
            // Firefox permissions are handled in manifest
            return Promise.resolve(true);
        }
    }

    /**
     * Notification işlemleri
     */
    createNotification(options) {
        if (this.api.notifications) {
            return this.api.notifications.create(options);
        } else {
            console.warn('Notifications API not available');
            return null;
        }
    }

    /**
     * Browser info
     */
    getBrowserInfo() {
        return {
            browser: this.browser,
            isChromeBased: this.isChromeBased,
            hasScripting: !!this.getScripting(),
            hasNotifications: !!this.api.notifications,
            hasPermissions: !!this.api.permissions
        };
    }
}

// Global instance oluştur
window.compatibilityLayer = {
    runtime: new CompatibilityLayer().getRuntime(),
    storage: new CompatibilityLayer().getStorage(),
    contextMenus: new CompatibilityLayer().getContextMenus(),
    tabs: new CompatibilityLayer().getTabs(),
    scripting: new CompatibilityLayer().getScripting(),
    notifications: new CompatibilityLayer().api.notifications,
    alarms: new CompatibilityLayer().api.alarms,
    isChrome: new CompatibilityLayer().isChromeBased,
    isFirefox: !new CompatibilityLayer().isChromeBased,
    sendMessage: new CompatibilityLayer().sendMessage.bind(new CompatibilityLayer()),
    onMessage: new CompatibilityLayer().onMessage.bind(new CompatibilityLayer()),
    setStorageData: new CompatibilityLayer().setStorageData.bind(new CompatibilityLayer()),
    getStorageData: new CompatibilityLayer().getStorageData.bind(new CompatibilityLayer())
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CompatibilityLayer;
}

// Export for ES6 modules
if (typeof window !== 'undefined') {
    window.CompatibilityLayer = CompatibilityLayer;
}
