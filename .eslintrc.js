module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ["plugin:vue/essential", "@vue/prettier", "@vue/typescript"],
  rules: {
    // "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-console": "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    // @see https://github.com/typescript-eslint/typescript-eslint/issues/291
    "no-dupe-class-members": "off"
  },
  parserOptions: {
    parser: "@typescript-eslint/parser"
  }
};
