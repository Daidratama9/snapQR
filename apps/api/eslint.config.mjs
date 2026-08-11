import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default tseslint.config(js.configs.recommended, ...tseslint.configs.recommended, prettier, prettierPlugin, {
  languageOptions: { parserOptions: { projectService: true } },
  ignores: ["dist/**", "node_modules/**"],
});
