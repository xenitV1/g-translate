module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  globals: {
    chrome: "readonly",
    APP_CONSTANTS: "readonly",
    GeminiAPIHandler: "readonly",
    OpenAIAPIHandler: "readonly",
    ClaudeAPIHandler: "readonly",
    BaseAPIHandler: "readonly",
  },
  rules: {
    "no-unused-vars": "warn",
    "no-console": "off",
    "no-undef": "error",
    semi: ["error", "always"],
    quotes: ["error", "single"],
    indent: ["error", 2],
    "comma-dangle": ["error", "never"],
  },
  ignorePatterns: ["dist/", "node_modules/", "*.min.js", "*.map"],
};
