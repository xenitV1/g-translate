/**
 * Content Script - Main Entry Point
 * Sayfa etkileşimi ve metin seçimi yönetimi
 */

// Ana content script başlatma kodu
(function () {
  "use strict";

  // ContentScriptController instance oluştur (diğer script'ler tarafından tanımlanmış)
  if (typeof window !== "undefined" && window.ContentScriptController) {
    const contentController = new window.ContentScriptController();

    // Global olarak erişilebilir yap
    window.contentController = contentController;
  }
})();
