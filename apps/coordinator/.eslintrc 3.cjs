const path = require("path");

module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
  },
  extends: ["../../.eslintrc.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: path.resolve(__dirname, "./tsconfig.json"),
    sourceType: "module",
    typescript: true,
    ecmaVersion: 2022,
    experimentalDecorators: true,
    requireConfigFile: false,
    ecmaFeatures: {
      classes: true,
      impliedStrict: true,
    },
    warnOnUnsupportedTypeScriptVersion: true,
  },
  overrides: [
    {
      files: ["./ts/**/*.module.ts"],
      rules: {
        "@typescript-eslint/no-extraneous-class": "off",
      },
    },
  ],
};
