module.exports = {
  root: true,                       // חשוב! מונע חיפוש קונפיג בתיקיות אב
  env: { node: true, es2021: true },
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2021, sourceType: "module" },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended"],   // בסיס מינימלי, בלי React/Next
  ignorePatterns: ["lib/**", "dist/**", "node_modules/**"],
  rules: {
    // אפשר להוסיף חוקים מותאמים אם תרצה
  },
};
