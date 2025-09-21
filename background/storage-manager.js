/**
 * Storage Manager
 * Veri saklama ve yönetimi
 */

class StorageManager {
    constructor(compatibilityLayer = null) {
        this.isInitialized = false;
        this.compatibilityLayer = compatibilityLayer || self.compatibilityLayer || chrome;

        this.init();
    }

    /**
     * Storage manager'ı başlat
     */
    async init() {
        try {
            // Storage'ı test et
            await this.testStorage();

            this.isInitialized = true;
            console.log('Storage manager başlatıldı');

        } catch (error) {
            console.error('Storage manager başlatma hatası:', error);
        }
    }

    /**
     * Storage'ı test et
     */
    async testStorage() {
        try {
            // Compatibility layer kontrolü
            if (!this.compatibilityLayer || !this.compatibilityLayer.storage || !this.compatibilityLayer.storage.local) {
                throw new Error('Storage API mevcut değil');
            }

            const testKey = 'storage_test';
            const testValue = Date.now();

            console.log('Storage test başlatılıyor...');

            await this.compatibilityLayer.storage.local.set({ [testKey]: testValue });
            const result = await this.compatibilityLayer.storage.local.get([testKey]);

            if (result[testKey] !== testValue) {
                throw new Error('Storage test başarısız');
            }

            await this.compatibilityLayer.storage.local.remove([testKey]);
            console.log('Storage test başarılı');

        } catch (error) {
            console.error('Storage test hatası:', error);
            throw new Error(`Storage test hatası: ${error.message}`);
        }
    }

    /**
     * Ayarları al
     */
    async getSettings() {
        try {
            const result = await chrome.storage.local.get([
                APP_CONSTANTS.STORAGE_KEYS.SETTINGS
            ]);
            
            return result[APP_CONSTANTS.STORAGE_KEYS.SETTINGS] || APP_CONSTANTS.DEFAULT_SETTINGS;
            
        } catch (error) {
            console.error('Ayarlar alma hatası:', error);
            return APP_CONSTANTS.DEFAULT_SETTINGS;
        }
    }

    /**
     * Ayarları kaydet
     */
    async saveSettings(settings) {
        try {
            // Mevcut ayarları al
            const currentSettings = await this.getSettings();
            
            // Yeni ayarları birleştir
            const mergedSettings = { ...currentSettings, ...settings };
            
            // Kaydet
            await chrome.storage.local.set({
                [APP_CONSTANTS.STORAGE_KEYS.SETTINGS]: mergedSettings
            });
            
            return true;
            
        } catch (error) {
            console.error('Ayarlar kaydetme hatası:', error);
            throw error;
        }
    }

    /**
     * Çeviri geçmişini al
     */
    async getTranslationHistory(limit = null, offset = 0) {
        try {
            const result = await this.compatibilityLayer.storage.local.get([
                APP_CONSTANTS.STORAGE_KEYS.HISTORY
            ]);
            
            let history = result[APP_CONSTANTS.STORAGE_KEYS.HISTORY] || [];
            
            // Offset uygula
            if (offset > 0) {
                history = history.slice(offset);
            }
            
            // Limit uygula
            if (limit && limit > 0) {
                history = history.slice(0, limit);
            }
            
            return history;
            
        } catch (error) {
            console.error('Çeviri geçmişi alma hatası:', error);
            return [];
        }
    }

    /**
     * Çeviriyi geçmişe kaydet
     */
    async saveTranslation(translation) {
        try {
            // Geçmişi al
            const history = await this.getTranslationHistory();
            
            // Yeni çeviriyi ekle
            const newTranslation = {
                ...translation,
                id: Date.now() + Math.random(),
                timestamp: Date.now()
            };
            
            history.unshift(newTranslation);
            
            // Maksimum geçmiş limitini kontrol et
            const settings = await this.getSettings();
            const maxHistory = settings.maxHistoryItems || APP_CONSTANTS.MAX_TRANSLATION_HISTORY;
            
            if (history.length > maxHistory) {
                history.splice(maxHistory);
            }
            
            // Kaydet
            await this.compatibilityLayer.storage.local.set({
                [APP_CONSTANTS.STORAGE_KEYS.HISTORY]: history
            });
            
            return newTranslation;
            
        } catch (error) {
            console.error('Çeviri kaydetme hatası:', error);
            throw error;
        }
    }

    /**
     * Çeviri geçmişini temizle
     */
    async clearTranslationHistory() {
        try {
            await this.compatibilityLayer.storage.local.remove([
                APP_CONSTANTS.STORAGE_KEYS.HISTORY
            ]);
            
            return true;
            
        } catch (error) {
            console.error('Çeviri geçmişi temizleme hatası:', error);
            throw error;
        }
    }

    /**
     * Belirli çeviriyi sil
     */
    async deleteTranslation(translationId) {
        try {
            const history = await this.getTranslationHistory();
            const filteredHistory = history.filter(t => t.id !== translationId);
            
            await this.compatibilityLayer.storage.local.set({
                [APP_CONSTANTS.STORAGE_KEYS.HISTORY]: filteredHistory
            });
            
            return true;
            
        } catch (error) {
            console.error('Çeviri silme hatası:', error);
            throw error;
        }
    }

    /**
     * Favori çevirileri al
     */
    async getFavoriteTranslations() {
        try {
            const result = await this.compatibilityLayer.storage.local.get([
                APP_CONSTANTS.STORAGE_KEYS.USER_PREFERENCES
            ]);
            
            const preferences = result[APP_CONSTANTS.STORAGE_KEYS.USER_PREFERENCES] || {};
            return preferences.favorites || [];
            
        } catch (error) {
            console.error('Favori çeviriler alma hatası:', error);
            return [];
        }
    }

    /**
     * Çeviriyi favorilere ekle/çıkar
     */
    async toggleFavorite(translationId) {
        try {
            const preferences = await this.getUserPreferences();
            const favorites = preferences.favorites || [];
            
            const index = favorites.indexOf(translationId);
            
            if (index > -1) {
                // Favorilerden çıkar
                favorites.splice(index, 1);
            } else {
                // Favorilere ekle
                favorites.push(translationId);
            }
            
            preferences.favorites = favorites;
            
            await this.compatibilityLayer.storage.local.set({
                [APP_CONSTANTS.STORAGE_KEYS.USER_PREFERENCES]: preferences
            });
            
            return !favorites.includes(translationId);
            
        } catch (error) {
            console.error('Favori değiştirme hatası:', error);
            throw error;
        }
    }

    /**
     * Kullanıcı tercihlerini al
     */
    async getUserPreferences() {
        try {
            const result = await this.compatibilityLayer.storage.local.get([
                APP_CONSTANTS.STORAGE_KEYS.USER_PREFERENCES
            ]);
            
            return result[APP_CONSTANTS.STORAGE_KEYS.USER_PREFERENCES] || {
                favorites: [],
                recentLanguages: [],
                mostUsedLanguages: {},
                theme: 'light',
                fontSize: 'medium'
            };
            
        } catch (error) {
            console.error('Kullanıcı tercihleri alma hatası:', error);
            return {};
        }
    }

    /**
     * Kullanıcı tercihlerini kaydet
     */
    async saveUserPreferences(preferences) {
        try {
            const currentPreferences = await this.getUserPreferences();
            const mergedPreferences = { ...currentPreferences, ...preferences };
            
            await this.compatibilityLayer.storage.local.set({
                [APP_CONSTANTS.STORAGE_KEYS.USER_PREFERENCES]: mergedPreferences
            });
            
            return true;
            
        } catch (error) {
            console.error('Kullanıcı tercihleri kaydetme hatası:', error);
            throw error;
        }
    }

    /**
     * İstatistikleri al
     */
    async getStatistics() {
        try {
            const result = await this.compatibilityLayer.storage.local.get([
                APP_CONSTANTS.STORAGE_KEYS.STATISTICS
            ]);
            
            return result[APP_CONSTANTS.STORAGE_KEYS.STATISTICS] || {
                totalTranslations: 0,
                totalCharacters: 0,
                languagesUsed: {},
                dailyStats: {},
                weeklyStats: {},
                monthlyStats: {}
            };
            
        } catch (error) {
            console.error('İstatistikler alma hatası:', error);
            return {};
        }
    }

    /**
     * İstatistikleri kaydet
     */
    async saveStatistics(statistics) {
        try {
            const currentStats = await this.getStatistics();
            const mergedStats = { ...currentStats, ...statistics };
            
            await this.compatibilityLayer.storage.local.set({
                [APP_CONSTANTS.STORAGE_KEYS.STATISTICS]: mergedStats
            });
            
            return true;
            
        } catch (error) {
            console.error('İstatistikler kaydetme hatası:', error);
            throw error;
        }
    }

    /**
     * İstatistikleri güncelle
     */
    async updateStatistics(translation) {
        try {
            const stats = await this.getStatistics();
            
            // Toplam çeviri sayısı
            stats.totalTranslations = (stats.totalTranslations || 0) + 1;
            
            // Toplam karakter sayısı
            stats.totalCharacters = (stats.totalCharacters || 0) + translation.originalText.length;
            
            // Dil kullanım istatistikleri
            const targetLang = translation.targetLanguage.code;
            stats.languagesUsed[targetLang] = (stats.languagesUsed[targetLang] || 0) + 1;
            
            // Günlük istatistikler
            const today = new Date().toDateString();
            if (!stats.dailyStats[today]) {
                stats.dailyStats[today] = {
                    translations: 0,
                    characters: 0,
                    languages: {}
                };
            }
            
            stats.dailyStats[today].translations += 1;
            stats.dailyStats[today].characters += translation.originalText.length;
            stats.dailyStats[today].languages[targetLang] = (stats.dailyStats[today].languages[targetLang] || 0) + 1;
            
            // Haftalık istatistikler
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekKey = weekStart.toDateString();
            
            if (!stats.weeklyStats[weekKey]) {
                stats.weeklyStats[weekKey] = {
                    translations: 0,
                    characters: 0,
                    languages: {}
                };
            }
            
            stats.weeklyStats[weekKey].translations += 1;
            stats.weeklyStats[weekKey].characters += translation.originalText.length;
            stats.weeklyStats[weekKey].languages[targetLang] = (stats.weeklyStats[weekKey].languages[targetLang] || 0) + 1;
            
            // Aylık istatistikler
            const monthKey = new Date().toISOString().substring(0, 7); // YYYY-MM
            
            if (!stats.monthlyStats[monthKey]) {
                stats.monthlyStats[monthKey] = {
                    translations: 0,
                    characters: 0,
                    languages: {}
                };
            }
            
            stats.monthlyStats[monthKey].translations += 1;
            stats.monthlyStats[monthKey].characters += translation.originalText.length;
            stats.monthlyStats[monthKey].languages[targetLang] = (stats.monthlyStats[monthKey].languages[targetLang] || 0) + 1;
            
            // Kaydet
            await this.saveStatistics(stats);
            
            return stats;
            
        } catch (error) {
            console.error('İstatistik güncelleme hatası:', error);
            throw error;
        }
    }

    /**
     * Cache verilerini al
     */
    async getCacheData() {
        try {
            const result = await this.compatibilityLayer.storage.local.get([
                APP_CONSTANTS.STORAGE_KEYS.CACHE
            ]);
            
            return result[APP_CONSTANTS.STORAGE_KEYS.CACHE] || {
                translations: {},
                languageDetections: {},
                lastCleanup: Date.now()
            };
            
        } catch (error) {
            console.error('Cache verileri alma hatası:', error);
            return {};
        }
    }

    /**
     * Cache verilerini kaydet
     */
    async saveCacheData(cacheData) {
        try {
            await this.compatibilityLayer.storage.local.set({
                [APP_CONSTANTS.STORAGE_KEYS.CACHE]: cacheData
            });
            
            return true;
            
        } catch (error) {
            console.error('Cache verileri kaydetme hatası:', error);
            throw error;
        }
    }

    /**
     * Cache'i temizle
     */
    async clearCache() {
        try {
            await this.compatibilityLayer.storage.local.remove([
                APP_CONSTANTS.STORAGE_KEYS.CACHE
            ]);
            
            return true;
            
        } catch (error) {
            console.error('Cache temizleme hatası:', error);
            throw error;
        }
    }

    /**
     * Tüm verileri temizle
     */
    async clearAllData() {
        try {
            await this.compatibilityLayer.storage.local.clear();
            
            return true;
            
        } catch (error) {
            console.error('Tüm verileri temizleme hatası:', error);
            throw error;
        }
    }

    /**
     * Storage kullanım bilgilerini al
     */
    async getStorageUsage() {
        try {
            if (this.compatibilityLayer.storage.local.getBytesInUse) {
                const bytesInUse = await this.compatibilityLayer.storage.local.getBytesInUse();
                return {
                    bytesInUse: bytesInUse,
                    quota: this.compatibilityLayer.storage.local.QUOTA_BYTES || 5242880, // 5MB
                    usagePercent: (bytesInUse / (this.compatibilityLayer.storage.local.QUOTA_BYTES || 5242880)) * 100
                };
            }
            
            return null;
            
        } catch (error) {
            console.error('Storage kullanım bilgisi alma hatası:', error);
            return null;
        }
    }

    /**
     * Veri yedekleme
     */
    async exportData() {
        try {
            const allData = await this.compatibilityLayer.storage.local.get();
            
            return {
                version: APP_CONSTANTS.APP_VERSION,
                timestamp: Date.now(),
                data: allData
            };
            
        } catch (error) {
            console.error('Veri yedekleme hatası:', error);
            throw error;
        }
    }

    /**
     * Veri geri yükleme
     */
    async importData(exportedData) {
        try {
            // Veri formatını kontrol et
            if (!exportedData.version || !exportedData.data) {
                throw new Error('Geçersiz veri formatı');
            }
            
            // Mevcut verileri yedekle
            const currentData = await this.exportData();
            
            try {
                // Yeni verileri yükle
                await this.compatibilityLayer.storage.local.set(exportedData.data);
                
                return true;
                
            } catch (error) {
                // Hata durumunda eski verileri geri yükle
                await this.compatibilityLayer.storage.local.set(currentData.data);
                throw error;
            }
            
        } catch (error) {
            console.error('Veri geri yükleme hatası:', error);
            throw error;
        }
    }

    /**
     * Storage manager'ı temizle
     */
    destroy() {
        this.isInitialized = false;
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}

if (typeof self !== 'undefined') {
    self.StorageManager = StorageManager;
}
