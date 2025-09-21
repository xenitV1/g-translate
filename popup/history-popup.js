/**
 * History Popup Logic
 * Çeviri geçmişi popup'ı için JavaScript fonksiyonları
 */

class HistoryPopupController {
    constructor() {
        this.history = [];
        this.filteredHistory = [];
        this.settings = null;
        this.isLoading = false;
        
        this.init();
    }

    /**
     * History popup'ı başlat
     */
    async init() {
        try {
            // DOM elementlerini al
            this.elements = this.getElements();
            
            // Ayarları yükle
            await this.loadSettings();
            
            // Event listener'ları ekle
            this.attachEventListeners();
            
            // Geçmişi yükle
            await this.loadHistory();
            
            console.log('History popup başlatıldı');
        } catch (error) {
            console.error('History popup başlatma hatası:', error);
            this.showError('Geçmiş yüklenemedi');
        }
    }

    /**
     * DOM elementlerini al
     */
    getElements() {
        return {
            // Header elements
            historyCount: document.getElementById('history-count'),
            clearHistoryBtn: document.getElementById('clear-history-btn'),
            closeHistoryBtn: document.getElementById('close-history-btn'),
            
            // Control elements
            searchInput: document.getElementById('history-search'),
            languageFilter: document.getElementById('language-filter'),
            
            // Content elements
            historyList: document.getElementById('history-list'),
            emptyState: document.getElementById('empty-state'),
            loadingState: document.getElementById('loading-state'),
            
            // Footer elements
            storageInfo: document.getElementById('storage-info'),
            exportHistoryBtn: document.getElementById('export-history-btn'),
            
            // Template
            historyItemTemplate: document.getElementById('history-item-template')
        };
    }

    /**
     * Event listener'ları ekle
     */
    attachEventListeners() {
        // Header buttons
        this.elements.clearHistoryBtn.addEventListener('click', this.clearHistory.bind(this));
        this.elements.closeHistoryBtn.addEventListener('click', this.closeHistory.bind(this));
        
        // Search and filter
        this.elements.searchInput.addEventListener('input', this.handleSearch.bind(this));
        this.elements.languageFilter.addEventListener('change', this.handleFilter.bind(this));
        
        // Footer buttons
        this.elements.exportHistoryBtn.addEventListener('click', this.exportHistory.bind(this));
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    /**
     * Ayarları yükle
     */
    async loadSettings() {
        try {
            const compatibilityLayer = window.compatibilityLayer || chrome;
            const result = await compatibilityLayer.getStorageData([APP_CONSTANTS.STORAGE_KEYS.SETTINGS]);
            this.settings = result[APP_CONSTANTS.STORAGE_KEYS.SETTINGS] || APP_CONSTANTS.DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Ayarlar yükleme hatası:', error);
            this.settings = APP_CONSTANTS.DEFAULT_SETTINGS;
        }
    }

    /**
     * Geçmişi yükle
     */
    async loadHistory() {
        try {
            this.setLoadingState(true);
            
            const compatibilityLayer = window.compatibilityLayer || chrome;
            const result = await compatibilityLayer.getStorageData([APP_CONSTANTS.STORAGE_KEYS.HISTORY]);
            this.history = result[APP_CONSTANTS.STORAGE_KEYS.HISTORY] || [];
            
            // Favorileri işle
            this.processFavorites();
            
            // Filtrele
            this.filterHistory();
            
            // UI'ı güncelle
            this.updateUI();
            
        } catch (error) {
            console.error('Geçmiş yükleme hatası:', error);
            this.showError('Geçmiş yüklenemedi');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Favorileri işle
     */
    processFavorites() {
        // Favori işaretlerini ekle
        this.history.forEach(item => {
            item.isFavorite = item.isFavorite || false;
        });
    }

    /**
     * Geçmişi filtrele
     */
    filterHistory() {
        const searchTerm = this.elements.searchInput.value.toLowerCase();
        const languageFilter = this.elements.languageFilter.value;
        
        this.filteredHistory = this.history.filter(item => {
            // Arama filtresi
            const matchesSearch = !searchTerm || 
                item.originalText.toLowerCase().includes(searchTerm) ||
                item.translatedText.toLowerCase().includes(searchTerm);
            
            // Dil filtresi
            const matchesLanguage = !languageFilter || 
                item.sourceLanguage.code === languageFilter ||
                item.targetLanguage.code === languageFilter;
            
            return matchesSearch && matchesLanguage;
        });
    }

    /**
     * UI'ı güncelle
     */
    updateUI() {
        // Geçmiş sayısını güncelle
        this.elements.historyCount.textContent = `${this.filteredHistory.length} çeviri`;
        
        // Liste durumunu kontrol et
        if (this.filteredHistory.length === 0) {
            this.showEmptyState();
        } else {
            this.renderHistoryList();
        }
    }

    /**
     * Boş durumu göster
     */
    showEmptyState() {
        this.elements.historyList.style.display = 'none';
        this.elements.emptyState.style.display = 'flex';
    }

    /**
     * Geçmiş listesini render et
     */
    renderHistoryList() {
        this.elements.historyList.style.display = 'block';
        this.elements.emptyState.style.display = 'none';
        
        // Mevcut içeriği temizle
        this.elements.historyList.innerHTML = '';
        
        // Her geçmiş öğesi için template oluştur
        this.filteredHistory.forEach(item => {
            const historyItem = this.createHistoryItem(item);
            this.elements.historyList.appendChild(historyItem);
        });
    }

    /**
     * Geçmiş öğesi oluştur
     */
    createHistoryItem(item) {
        const template = this.elements.historyItemTemplate.content.cloneNode(true);
        const historyItem = template.querySelector('.history-item');
        
        // ID'yi ayarla
        historyItem.setAttribute('data-id', item.id);
        
        // Dil bilgilerini güncelle
        const sourceLang = historyItem.querySelector('.source-lang');
        const targetLang = historyItem.querySelector('.target-lang');
        sourceLang.textContent = item.sourceLanguage.name;
        targetLang.textContent = item.targetLanguage.name;
        
        // Metinleri güncelle
        const originalText = historyItem.querySelector('.original-text .text-content');
        const translatedText = historyItem.querySelector('.translated-text .text-content');
        originalText.textContent = item.originalText;
        translatedText.textContent = item.translatedText;
        
        // Zaman damgasını güncelle
        const timestamp = historyItem.querySelector('.timestamp');
        timestamp.textContent = this.formatTimestamp(item.timestamp);
        
        // Güven skorunu güncelle
        if (item.confidence && this.settings.showConfidence) {
            const confidence = historyItem.querySelector('.confidence');
            confidence.style.display = 'flex';
            confidence.innerHTML = `
                <span>Güven:</span>
                <span class="confidence-value">${Math.round(item.confidence * 100)}%</span>
            `;
        }
        
        // Favori durumunu güncelle
        const favoriteBtn = historyItem.querySelector('.favorite-btn');
        const favoriteTag = historyItem.querySelector('.favorite-tag');
        if (item.isFavorite) {
            favoriteBtn.classList.add('favorited');
            favoriteTag.style.display = 'inline';
        }
        
        // Event listener'ları ekle
        this.attachItemEventListeners(historyItem, item);
        
        return historyItem;
    }

    /**
     * Geçmiş öğesi event listener'larını ekle
     */
    attachItemEventListeners(historyItem, item) {
        // Favori butonu
        const favoriteBtn = historyItem.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(item.id);
        });
        
        // Kopyala butonu
        const copyBtn = historyItem.querySelector('.copy-btn');
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.copyTranslation(item);
        });
        
        // Sil butonu
        const deleteBtn = historyItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTranslation(item.id);
        });
        
        // Metin genişletme
        const textContents = historyItem.querySelectorAll('.text-content');
        textContents.forEach(textContent => {
            textContent.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTextExpansion(textContent);
            });
        });
        
        // Ana öğe tıklama (çeviriyi popup'a gönder)
        historyItem.addEventListener('click', () => {
            this.useTranslation(item);
        });
    }

    /**
     * Arama işleyici
     */
    handleSearch() {
        this.filterHistory();
        this.updateUI();
    }

    /**
     * Filtre işleyici
     */
    handleFilter() {
        this.filterHistory();
        this.updateUI();
    }

    /**
     * Favori durumunu değiştir
     */
    async toggleFavorite(itemId) {
        try {
            const item = this.history.find(h => h.id === itemId);
            if (item) {
                item.isFavorite = !item.isFavorite;
                
                // Storage'a kaydet
                await this.saveHistory();
                
                // UI'ı güncelle
                this.updateUI();
            }
        } catch (error) {
            console.error('Favori değiştirme hatası:', error);
        }
    }

    /**
     * Çeviriyi kopyala
     */
    async copyTranslation(item) {
        try {
            await navigator.clipboard.writeText(item.translatedText);
            
            // Başarı göstergesi
            this.showNotification('Çeviri kopyalandı!');
            
        } catch (error) {
            console.error('Kopyalama hatası:', error);
            this.showError('Kopyalama başarısız oldu');
        }
    }

    /**
     * Çeviriyi sil
     */
    async deleteTranslation(itemId) {
        try {
            if (confirm('Bu çeviriyi silmek istediğinizden emin misiniz?')) {
                this.history = this.history.filter(h => h.id !== itemId);
                
                // Storage'a kaydet
                await this.saveHistory();
                
                // Filtrele ve UI'ı güncelle
                this.filterHistory();
                this.updateUI();
                
                this.showNotification('Çeviri silindi');
            }
        } catch (error) {
            console.error('Silme hatası:', error);
            this.showError('Silme başarısız oldu');
        }
    }

    /**
     * Metin genişletme/daraltma
     */
    toggleTextExpansion(textContent) {
        textContent.classList.toggle('expanded');
    }

    /**
     * Çeviriyi kullan (popup'a gönder)
     */
    useTranslation(item) {
        try {
            // Parent window'a mesaj gönder
            if (window.opener) {
                window.opener.postMessage({
                    type: 'USE_TRANSLATION',
                    data: {
                        originalText: item.originalText,
                        translatedText: item.translatedText,
                        sourceLanguage: item.sourceLanguage,
                        targetLanguage: item.targetLanguage
                    }
                }, '*');
                
                // Popup'ı kapat
                window.close();
            }
        } catch (error) {
            console.error('Çeviri kullanma hatası:', error);
        }
    }

    /**
     * Geçmişi temizle
     */
    async clearHistory() {
        try {
            if (confirm('Tüm çeviri geçmişini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
                this.history = [];
                
                // Storage'dan sil
                const compatibilityLayer = window.compatibilityLayer || chrome;
                await compatibilityLayer.setStorageData({
                    [APP_CONSTANTS.STORAGE_KEYS.HISTORY]: []
                });
                
                // UI'ı güncelle
                this.filterHistory();
                this.updateUI();
                
                this.showNotification('Geçmiş temizlendi');
            }
        } catch (error) {
            console.error('Geçmiş temizleme hatası:', error);
            this.showError('Geçmiş temizlenemedi');
        }
    }

    /**
     * Geçmişi dışa aktar
     */
    async exportHistory() {
        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                totalTranslations: this.history.length,
                translations: this.history.map(item => ({
                    originalText: item.originalText,
                    translatedText: item.translatedText,
                    sourceLanguage: item.sourceLanguage.name,
                    targetLanguage: item.targetLanguage.name,
                    timestamp: new Date(item.timestamp).toISOString(),
                    isFavorite: item.isFavorite,
                    confidence: item.confidence
                }))
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gemini-translate-history-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('Geçmiş dışa aktarıldı');
            
        } catch (error) {
            console.error('Dışa aktarma hatası:', error);
            this.showError('Dışa aktarma başarısız oldu');
        }
    }

    /**
     * Geçmişi kaydet
     */
    async saveHistory() {
        try {
            const compatibilityLayer = window.compatibilityLayer || chrome;
            await compatibilityLayer.setStorageData({
                [APP_CONSTANTS.STORAGE_KEYS.HISTORY]: this.history
            });
        } catch (error) {
            console.error('Geçmiş kaydetme hatası:', error);
        }
    }

    /**
     * Zaman damgasını formatla
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return date.toLocaleTimeString('tr-TR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else if (diffDays === 1) {
            return 'Dün ' + date.toLocaleTimeString('tr-TR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else if (diffDays < 7) {
            return date.toLocaleDateString('tr-TR', { 
                weekday: 'short',
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else {
            return date.toLocaleDateString('tr-TR', { 
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });
        }
    }

    /**
     * Loading durumunu ayarla
     */
    setLoadingState(loading) {
        this.isLoading = loading;
        
        if (loading) {
            this.elements.loadingState.style.display = 'flex';
            this.elements.historyList.style.display = 'none';
            this.elements.emptyState.style.display = 'none';
        } else {
            this.elements.loadingState.style.display = 'none';
        }
    }

    /**
     * Hata göster
     */
    showError(message) {
        console.error(message);
        // Basit hata gösterimi
        alert(message);
    }

    /**
     * Bildirim göster
     */
    showNotification(message) {
        // Basit bildirim gösterimi
        console.log(message);
    }

    /**
     * Klavye olayları
     */
    handleKeyboard(event) {
        // Escape ile kapat
        if (event.key === 'Escape') {
            this.closeHistory();
        }
        
        // Ctrl+F ile arama odakla
        if (event.ctrlKey && event.key === 'f') {
            event.preventDefault();
            this.elements.searchInput.focus();
        }
    }

    /**
     * Geçmiş popup'ını kapat
     */
    closeHistory() {
        window.close();
    }
}

// History popup başlat
document.addEventListener('DOMContentLoaded', () => {
    window.historyPopupController = new HistoryPopupController();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryPopupController;
}
