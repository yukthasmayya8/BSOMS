module.exports = {
    ignorePatterns: ['dist/', 'legacy/', 'data/'],
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    extends: ['eslint:recommended'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
    },
    plugins: ['react', 'react-hooks'],
    settings: {
        react: { version: 'detect' }
    },
    rules: {
        'no-unused-vars': 'off',
        'react/jsx-uses-react': 'error',
        'react/jsx-uses-vars': 'error',
        'react/prop-types': 'off',
        'react/react-in-jsx-scope': 'off',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'off'
    }
};
