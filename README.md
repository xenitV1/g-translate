# G-Translate - AI Powered Translation Extension

Google Gemini API ile güçlendirilmiş, çoklu AI API desteği sunan modern çeviri eklentisi.

## 🚨 GÜVENLİK UYARISI

**API ANAHTARLARI ASLA KODA YAZILMAMALI!**

Bu proje açık kaynak olsa da, API anahtarları **hiçbir zaman** kod dosyalarına yazılmamalıdır. API anahtarları:

- ✅ Options sayfasından ayarlanmalı
- ✅ Tarayıcı localStorage'da saklanmalı
- ✅ Git'e yüklenmemeli
- ❌ Kod dosyalarına yazılmamalı
- ❌ Açık kaynak depolarına konulmamalı

### API Anahtarı Ayarlama

1. Extension'ı yükleyin
2. Tarayıcıda extension ikonuna sağ tıklayıp "Seçenekler"i açın
3. "API Ayarları" sekmesine gidin
4. İstediğiniz AI API'sini seçin (Gemini, OpenAI, Claude)
5. API anahtarınızı girin
6. "Kaydet" butonuna tıklayın

## Özellikler

- 🌍 **Çoklu Dil Desteği**: 50+ dil
- 🤖 **Çoklu AI API**: Gemini, OpenAI GPT, Claude
- ⚡ **Anlık Çeviri**: Metin seçildiğinde otomatik çeviri
- 📱 **Responsive Tasarım**: Tüm ekran boyutlarında çalışır
- 🔒 **Güvenli Depolama**: API anahtarları yerel olarak saklanır
- 📊 **İstatistikler**: Kullanım takibi
- 🎨 **Koyu/Açık Tema**: Göz yorgunluğunu azaltır
- ⌨️ **Kısayollar**: Klavye ile hızlı erişim

## Kurulum

### Gereksinimler

- Google Chrome 88+
- Mozilla Firefox 78+
- Microsoft Edge 88+
- Apple Safari 14+

### Yükleme

1. **Chrome Web Store**'dan yükleyin (yakında)
2. Veya geliştirici modu ile yükleyin:
   - `chrome://extensions/` adresine gidin
   - "Geliştirici modu"nu etkinleştirin
   - "Paketlenmemiş uzantıyı yükle"ye tıklayın
   - Bu klasörü seçin

## Kullanım

### Temel Kullanım

1. Web sayfasında metin seçin
2. Extension popup'ı açılır
3. Hedef dili seçin
4. Çeviriyi görün

### Klavye Kısayolları

- `Ctrl+Shift+T`: Seçili metni çevir
- `Ctrl+Shift+H`: Geçmiş popup'ı
- `Ctrl+Shift+S`: Ayarlar sayfası
- `Escape`: Popup'ı kapat

### Context Menu

- Metin seçildiğinde sağ tıklayıp "Translate with G-Translate" seçeneği

## API Desteği

### Google Gemini

- Ücretsiz tier mevcut
- Güçlü çeviri kalitesi
- 50+ dil desteği

### OpenAI GPT

- GPT-3.5-turbo ve GPT-4 modelleri
- Ücretli API
- En yüksek çeviri kalitesi

### Anthropic Claude

- Claude 3 modelleri
- Ücretli API
- Güvenli ve tutarlı çeviriler

## Geliştirme

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme için build
npm run build

# Testleri çalıştır
npm test
```

### Proje Yapısı

```
├── background/          # Service worker ve API handler'lar
│   ├── base-api-handler.js     # Base API sınıfı
│   ├── gemini-api-handler.js   # Google Gemini API
│   ├── openai-api-handler.js   # OpenAI GPT API
│   ├── claude-api-handler.js   # Anthropic Claude API
│   ├── api-handler.js          # API manager
│   └── background.js           # Service worker
├── content/            # Content script'ler
├── popup/              # Extension popup'ı
├── options/            # Ayarlar sayfası
├── utils/              # Yardımcı fonksiyonlar
│   ├── constants.js            # Uygulama sabitleri
│   └── language-codes.js       # Dil kodları
├── cross-browser/      # Tarayıcı uyumluluğu
└── tests/              # Test dosyaları
```

### Yeni API Eklemek

1. `background/your-api-handler.js` dosyası oluşturun
2. `BaseAPIHandler`'dan inherit edin
3. `background/api-handler.js`'teki `availableAPIs` dizisine ekleyin
4. Manifest dosyasına yeni dosyayı ekleyin

## Güvenlik

### API Anahtarları

- ✅ **Tarayıcı localStorage'da saklanır** (şifrelenmemiş)
- ✅ **Hiçbir sunucuya gönderilmez**
- ✅ **Sadece çeviri işlemleri için kullanılır**
- ✅ **Koddan tamamen ayrıştırılmıştır**

### Güvenlik Önlemleri

- 🔒 **.gitignore ile hassas dosyalar korunur**
- 🛡️ **API anahtarları kodda bulunmaz**
- ⚠️ **Console uyarıları şüpheli durumları yakalar**
- 🚫 **Güvenlik riski taşıyan dosyalar kaldırıldı**

### Tehlikeli Dosyalar

- ❌ ~~`utils/api-config.js`~~ - **Kaldırıldı** (API anahtarları içeriyordu)
- ✅ Sadece `constants.js` ve `language-codes.js` utils'ta kaldı

## Lisans

MIT License - bkz. [LICENSE](LICENSE) dosyası

## Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## Sorun Giderme

### Yaygın Problemler

**API anahtarı çalışmıyor:**

- API anahtarınızın doğru olduğundan emin olun
- API limitlerinizi kontrol edin
- Console'da hata mesajlarını inceleyin

**Extension yüklenmiyor:**

- Manifest dosyasının geçerli JSON olduğundan emin olun
- Tüm gerekli dosyaların mevcut olduğunu kontrol edin

**Çeviri çalışmıyor:**

- İnternet bağlantınızı kontrol edin
- API durumunu options sayfasından kontrol edin

## İletişim

- Issues: [GitHub Issues](https://github.com/yourusername/g-translate/issues)
- Email: your.email@example.com

---

**Not:** Bu extension üçüncü parti API servislerini kullanır. API kullanımından doğabilecek maliyetler kullanıcı sorumluluğundadır.
