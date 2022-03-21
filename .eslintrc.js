module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true,
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "standard",
    "plugin:prettier/recommended",
    "plugin:node/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    camelcase: "off",
    "node/no-missing-require": [
      "error",
      { tryExtensions: [".js", ".ts", ".json"] },
    ],
    "node/no-missing-import": [
      "error",
      { tryExtensions: [".js", ".ts", ".json"] },
    ],
    "node/no-unpublished-import": "off",
    "node/no-unsupported-features/es-syntax": [
      "error",
      { ignores: ["modules"] },
    ],
  },
};
