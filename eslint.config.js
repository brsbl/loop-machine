import js from "@eslint/js";
import jest from "eslint-plugin-jest";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
  // Base JavaScript configuration
  js.configs.recommended,
  
  // Prettier configuration (disables conflicting rules)
  prettier,
  
  // Global ignores
  {
    ignores: [
      "node_modules/",
      "coverage/",
      "dist/",
      "build/",
      "*.min.js"
    ]
  },
  
  // Configuration for all JavaScript files
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021
      }
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "prefer-const": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"]
    }
  },
  
  // Jest configuration for test files
  {
    files: ["tests/**/*.js", "**/*.test.js", "**/*.spec.js"],
    plugins: {
      jest
    },
    languageOptions: {
      globals: {
        ...globals.jest,
        global: "readonly"
      }
    },
    rules: {
      ...jest.configs.recommended.rules
    }
  }
];