/**
 * API Handler Manager
 * Farklı AI API'lerinin yönetimini sağlar
 */

class APIHandlerManager {
    constructor() {
        this.handlers = new Map();
        this.currentHandler = null;
        this.availableAPIs = [
            {
                id: 'gemini',
                name: 'Google Gemini',
                description: 'Google\'ın güçlü AI modeli',
                class: GeminiAPIHandler,
                requiresKey: true,
                defaultModel: 'gemini-1.5-flash'
            },
            {
                id: 'openai',
                name: 'OpenAI GPT',
                description: 'ChatGPT ve GPT modelleri',
                class: OpenAIAPIHandler,
                requiresKey: true,
                defaultModel: 'gpt-3.5-turbo'
            },
            {
                id: 'claude',
                name: 'Anthropic Claude',
                description: 'Anthropic\'in Claude AI modeli',
                class: ClaudeAPIHandler,
                requiresKey: true,
                defaultModel: 'claude-3-haiku-20240307'
            }
        ];
    }

    /**
     * Kullanılabilir API'leri listele
     */
    getAvailableAPIs() {
        return this.availableAPIs.map(api => ({
            id: api.id,
            name: api.name,
            description: api.description,
            requiresKey: api.requiresKey,
            defaultModel: api.defaultModel
        }));
    }

    /**
     * API handler'ı yükle
     */
    async loadAPIHandler(apiId) {
        const apiConfig = this.availableAPIs.find(api => api.id === apiId);
        if (!apiConfig) {
            throw new Error(`API '${apiId}' bulunamadı`);
        }

        if (!this.handlers.has(apiId)) {
            const HandlerClass = apiConfig.class;
            const handler = new HandlerClass();
            await handler.initialize();
            this.handlers.set(apiId, handler);
        }

        this.currentHandler = this.handlers.get(apiId);
        return this.currentHandler;
    }

    /**
     * Geçerli API handler'ı al
     */
    getCurrentHandler() {
        if (!this.currentHandler) {
            throw new Error('Hiçbir API handler seçilmemiş');
        }
        return this.currentHandler;
    }

    /**
     * API handler değiştir
     */
    async switchAPI(apiId) {
        const handler = await this.loadAPIHandler(apiId);
        this.currentHandler = handler;
        return handler;
    }

    /**
     * Çeviri işlemi
     */
    async translateText(text, targetLanguage, sourceLanguage = null) {
        return await this.getCurrentHandler().translateText(text, targetLanguage, sourceLanguage);
    }

    /**
     * Dil tespiti
     */
    async detectLanguage(text) {
        return await this.getCurrentHandler().detectLanguage(text);
    }

    /**
     * API anahtarı ayarla
     */
    async setApiKey(apiId, apiKey) {
        const handler = await this.loadAPIHandler(apiId);
        await handler.setApiKey(apiKey);
        return true;
    }

    /**
     * API durumu kontrolü
     */
    async checkAPIStatus(apiId = null) {
        if (apiId) {
            const handler = await this.loadAPIHandler(apiId);
            return await handler.checkStatus();
        } else if (this.currentHandler) {
            return await this.currentHandler.checkStatus();
        } else {
            return { status: 'error', message: 'API seçilmemiş' };
        }
    }

    /**
     * Desteklenen dilleri al
     */
    getSupportedLanguages(apiId = null) {
        if (apiId) {
            const apiConfig = this.availableAPIs.find(api => api.id === apiId);
            if (apiConfig && this.handlers.has(apiId)) {
                return this.handlers.get(apiId).getSupportedLanguages();
            }
            return [];
        } else if (this.currentHandler) {
            return this.currentHandler.getSupportedLanguages();
        }
        return [];
    }

    /**
     * Cache'i temizle
     */
    async clearCache() {
        if (this.currentHandler) {
            await this.currentHandler.clearCache();
        }
    }

    /**
     * Geçerli API bilgilerini al
     */
    getCurrentAPIInfo() {
        if (!this.currentHandler) {
            return null;
        }

        const apiId = this.currentHandler.getId();
        const apiConfig = this.availableAPIs.find(api => api.id === apiId);

        return {
            id: apiId,
            name: this.currentHandler.getName(),
            description: apiConfig?.description || '',
            config: this.currentHandler.getConfig()
        };
    }
}

// Global API manager instance
const apiManager = new APIHandlerManager();

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIHandlerManager, apiManager };
}

if (typeof window !== 'undefined') {
    window.APIHandlerManager = APIHandlerManager;
    window.apiManager = apiManager;
}

if (typeof window !== 'undefined') {
    window.GeminiAPIHandler = GeminiAPIHandler;
    window.RateLimiter = RateLimiter;
    window.TranslationCache = TranslationCache;
}
