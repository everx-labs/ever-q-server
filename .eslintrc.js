module.exports = {
    root: true,
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
    },
    // overrides: [
    //     {
    //         files: "*.ts",
    //         parser: "@typescript-eslint/parser",
    //         parserOptions: {
    //             project: "./tsconfig.json",
    //         },
    //         rules: {
    //             "@typescript-eslint/strict-boolean-expressions": ["error", {
    //                 allowString: false,
    //                 allowNumber: false,
    //                 allowNullableObject: false,
    //                 allowNullableBoolean: false,
    //                 allowNullableString: false,
    //                 allowNullableNumber: false,
    //                 allowAny: true,
    //             }],
    //         },
    //     },
    // ],
};
