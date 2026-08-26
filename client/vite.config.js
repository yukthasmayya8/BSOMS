const path = require('path');
const react = require('@vitejs/plugin-react');
const { defineConfig } = require('vite');

module.exports = defineConfig({
    root: __dirname,
    plugins: [react()],
    build: {
        outDir: path.resolve(__dirname, '../dist'),
        emptyOutDir: true
    }
});
