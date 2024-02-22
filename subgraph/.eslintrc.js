const path = require("path");

module.exports = {
  root: true,
  extends: ["../.eslintrc.js", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
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
  globals: {
    BigInt: true,
  },
  rules: {
    "@typescript-eslint/ban-types": [
      "error",
      {
        types: {
          BigInt: true,
        },
        extendDefaults: true,
      },
    ],
  },
};
