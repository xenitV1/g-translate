const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "production",
  entry: {
    // Background script - tüm background dosyalarını bir arada bundle eder
    background: "./background/background.js",

    // Content scripts - tüm content dosyalarını ayrı ayrı bundle eder
    "content-script-controller": "./content/content-script-controller.js",
    "selection-handler": "./content/selection-handler.js",
    "instant-translator": "./content/instant-translator.js",
    "context-menu": "./content/context-menu.js",
    "translation-overlay": "./content/translation-overlay.js",
    "content-main": "./content/content.js",


    // Popup scripts
    popup: "./popup/popup.js",
    "history-popup": "./popup/history-popup.js",

    // Options script
    options: "./options/options.js",

    // Cross-browser utilities
    "browser-detector": "./cross-browser/browser-detector.js",
    "compatibility-layer": "./cross-browser/compatibility-layer.js",

    // Utilities - constants ve language codes ayrı bundle'lar
    constants: "./utils/constants.js",
    "language-codes": "./utils/language-codes.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              ["@babel/preset-env", {
                modules: false, // ES6 modüllerini koru
                targets: {
                  browsers: ["chrome >= 88", "firefox >= 78", "safari >= 14"]
                }
              }]
            ],
            plugins: [
              // ES modules support is handled by preset-env
            ]
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".js", ".json"],
  },
  plugins: [
    new webpack.DefinePlugin({
      APP_CONSTANTS: JSON.stringify(require("./utils/constants.js").default),
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
      },
    },
  },
  devtool: "source-map",
};
