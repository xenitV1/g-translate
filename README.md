# G-Translate 🌐

**Turn Any AI Into Your Personal Translation Assistant**

Transform ChatGPT, Gemini, Claude, or any AI into a powerful translation tool. One-click translations with AI quality, directly in your browser.

[![Browser Support](https://img.shields.io/badge/Browser-Chrome%20%7C%20Firefox%20%7C%20Edge%20%7C%20Safari-blue)](https://github.com/xenitV1/g-translate)
[![Languages](https://img.shields.io/badge/Languages-50+-green)](https://github.com/xenitV1/g-translate)
[![License](https://img.shields.io/badge/License-MIT-yellow)](https://github.com/xenitV1/g-translate/blob/main/LICENSE)

## ✨ What Makes G-Translate Special?

Unlike traditional translation extensions, G-Translate lets you **connect any AI** to your translation workflow. Use the latest AI models from Google, OpenAI, Anthropic, or any compatible API.

### 🚀 Key Features

- **🤖 Any AI Integration**: Connect Gemini, ChatGPT, Claude, or any AI API
- **⚡ Instant Translation**: Select text → Get translation instantly
- **🌍 50+ Languages**: Professional translations in any language
- **🎨 Modern UI**: Clean, responsive design with dark/light themes
- **⌨️ Smart Shortcuts**: Keyboard shortcuts for power users
- **📱 Cross-Browser**: Works on Chrome, Firefox, Edge, and Safari
- **🔒 Privacy First**: API keys stored locally, never sent to our servers
- **📊 Usage Analytics**: Track your translation statistics
- **💾 Translation History**: Save and review past translations

## 📥 Quick Start

### 1. Download & Install

**Option A: From Chrome Web Store** (Coming Soon)
- Visit Chrome Web Store
- Search for "G-Translate"
- Click "Add to Chrome"

**Option B: Developer Mode**
```bash
# Clone the repository
git clone https://github.com/xenitV1/g-translate.git
cd g-translate

# Install dependencies
npm install

# Build the extension
npm run build
```

Then load in your browser:
- **Chrome**: `chrome://extensions/` → Enable Developer Mode → Load Unpacked → Select `dist/` folder
- **Firefox**: `about:debugging` → Load Temporary Add-on → Select `manifest.firefox.json`
- **Edge/Safari**: Similar process as Chrome

### 2. Setup Your AI API

1. Get an API key from your preferred AI provider:
   - **Google Gemini**: [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **OpenAI**: [OpenAI API](https://platform.openai.com/api-keys)
   - **Anthropic Claude**: [Anthropic Console](https://console.anthropic.com/)

2. In the extension:
   - Click the extension icon
   - Click the settings (⚙️) button
   - Go to "API Settings" tab
   - Select your AI provider
   - Enter your API key
   - Click "Save Settings"

### 3. Start Translating!

- Select any text on any webpage
- Choose your target language
- Get instant AI-powered translations

---

## 🎯 How It Works

```
Select Text → Choose AI → Get Translation
     ↓           ↓           ↓
  Any Website  Gemini/   Professional
                GPT/Claude  Translation
```

**Supported AIs:**
- 🤖 **Google Gemini** (Free tier available)
- 🧠 **OpenAI GPT-4/3.5** (Premium quality)
- 🎭 **Anthropic Claude** (Balanced performance)

## 🎮 Usage Guide

### Basic Translation
1. **Select Text**: Highlight any text on any webpage
2. **Choose Language**: Pick your target language from the dropdown
3. **Get Translation**: Instant AI-powered translation appears

### Advanced Features

#### ⌨️ Keyboard Shortcuts
- `Ctrl+Shift+T` - Quick translate selected text
- `Ctrl+Shift+H` - Open translation history
- `Ctrl+Shift+S` - Open settings
- `Escape` - Close any popup

#### 🎯 Context Menu
Right-click on selected text → "Translate with G-Translate"

#### 📚 Translation History
- Access past translations anytime
- Search through your translation history
- Favorite important translations
- Export your translation data

### ⚙️ Customization Options

**Language Settings:**
- Set your default target language
- Choose from 50+ supported languages

**Appearance:**
- Light/Dark/Auto theme switching
- Adjustable font sizes
- Customizable interface

**Advanced:**
- API usage statistics
- Cache management
- Data reset options

## 🛠️ For Developers

### Local Development

```bash
# Clone and setup
git clone https://github.com/xenitV1/g-translate.git
cd g-translate

# Install dependencies
npm install

# Development build with watch mode
npm run build:dev

# Production build
npm run build

# Run tests
npm test
```

### 🏗️ Project Structure

```
g-translate/
├── background/          # Service worker & API integration
│   ├── base-api-handler.js     # Base API class
│   ├── gemini-api-handler.js   # Google Gemini integration
│   ├── openai-api-handler.js   # OpenAI GPT integration
│   ├── claude-api-handler.js   # Anthropic Claude integration
│   └── api-handler.js          # API manager
├── content/             # Content scripts for web pages
├── popup/               # Extension popup interface
├── options/             # Settings page
├── utils/               # Shared utilities
├── cross-browser/       # Browser compatibility layer
└── dist/               # Built extension files
```

### 🔌 Adding New AI APIs

1. Create new handler in `background/your-api-handler.js`
2. Extend `BaseAPIHandler` class
3. Implement required methods: `translate()`, `getModels()`, etc.
4. Register in `background/api-handler.js`
5. Update manifest files

### 🛡️ Security & Privacy

**Your API keys are:**
- 🔐 **Stored locally** in browser storage only
- 🚫 **Never sent** to our servers
- 🎯 **Used only** for translation requests
- 🗂️ **Protected** by .gitignore

**Data handling:**
- No user data collection
- No analytics or tracking
- All processing happens locally

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute
- 🐛 **Bug Reports**: Found a bug? [Open an issue](https://github.com/xenitV1/g-translate/issues)
- 💡 **Feature Requests**: Have an idea? [Suggest it](https://github.com/xenitV1/g-translate/issues)
- 🔧 **Code**: Help improve G-Translate
- 📖 **Documentation**: Improve docs or translations

### Development Workflow
1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Adding New AI Providers
We're always looking to support more AI APIs! See the developer docs above.

## ❓ Troubleshooting

### 🔑 API Issues
**"API key not working"**
- Verify your API key is correct and active
- Check your API provider's dashboard for usage limits
- Ensure you have sufficient credits/billing set up

**"Translation quality is poor"**
- Try a different AI model (GPT-4 usually gives best results)
- Check if your selected text is in a supported language
- Some languages work better with specific AI models

### 🔌 Extension Issues
**"Extension not loading"**
- Try refreshing the extension in browser settings
- Check browser console for errors (F12 → Console)
- Reinstall the extension if needed

**"Popup not appearing"**
- Check if the extension icon is visible in toolbar
- Try right-clicking the extension icon and selecting "Show"
- Restart your browser

### 🌐 Network Issues
**"No internet connection"**
- Verify your internet connection
- Check if your firewall blocks the extension
- Try disabling VPN if you're using one

## 📞 Support

- 📧 **Email**: your.email@example.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/xenitV1/g-translate/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/xenitV1/g-translate/discussions)

## 👤 Author

**xenitV1** - *Creator & Main Developer*

- GitHub: [@xenitV1](https://github.com/xenitV1)
- Email: your.email@example.com (update this with your actual email)

## ⚖️ License

**MIT License** - Copyright (c) 2024 xenitV1

You're free to use, modify, and distribute this project under the MIT License.
See [LICENSE](LICENSE) file for full license text.

---

## ⚠️ Important Notes

- **API Costs**: This extension uses third-party AI APIs. You're responsible for any costs incurred.
- **Rate Limits**: Each AI provider has usage limits - check their documentation.
- **Privacy**: Your API keys are stored locally and never sent to our servers.
- **Updates**: Keep your extension updated for the latest features and security fixes.

---

**Made with ❤️ by xenitV1 - for translators, by a translator.**