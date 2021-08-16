module.exports = {
    root: true,
    ignorePatterns: [
        "src/server/graphql/blockchain/resolvers-types-generated.ts"
    ],
    parser: "@typescript-eslint/parser",
    plugins: [
        "@typescript-eslint",
    ],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
    ],
    rules: {
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "quotes": "off",
        "@typescript-eslint/quotes": ["error", "double"],
        "semi": "off",
        "@typescript-eslint/semi": ["error"],
        "eol-last": ["error", "always"],
    },
};
