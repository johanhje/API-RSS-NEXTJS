/**
 * Babel configuration for Jest testing
 */

export default {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
  ],
  plugins: [
    '@babel/plugin-syntax-import-attributes'
  ]
}; 