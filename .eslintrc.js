module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
    },
    plugins: ['@typescript-eslint', 'prettier', 'jest'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        // 'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'prettier',
    ],
    rules: {
        'prettier/prettier': 2,
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        'no-implicit-coercion': ['warn', { allow: ['!!'] }],
        'eol-last': ['error', 'always'],
        '@typescript-eslint/no-floating-promises': ['error'],
        'no-implicit-coercion': ['warn', { allow: ['!!'] }],
        curly: ['error', 'all'],
    },
    env: {
        node: true,
        'jest/globals': true,
    },
}
