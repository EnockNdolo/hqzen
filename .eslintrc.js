module.exports = {
  'root': true,
  'parserOptions': {
    'parser': '@babel/eslint-parser',
    'sourceType': 'module'
  },
  'env': {
    'browser': true,
    'commonjs': true,
    'es6': true,
    'node': true
  },
  'extends': [
    'eslint:recommended',
    'plugin:vue/strongly-recommended',
    'plugin:vue/recommended',
    'plugin:vue/base'
  ],
  'globals': {
    '__static': true
  },
  'plugins': [
    'vue'
  ],
  'rules': {
    'max-len': ['error', {'code': 120}],
    'no-console': 'off',
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ],
    'no-unused-vars': ['error', {'args': 'none'}],
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'vue/script-indent': ['error', 4, {
      'baseIndent': 1
    }],
    'vue/html-indent': ['error', 4, {
      'attribute': 1,
      'closeBracket': 0,
      'alignAttributesVertically': true,
      'ignores': []
    }],
    'vue/max-attributes-per-line': ['error', {
      'singleline': 2,
      'multiline': {
        'max': 1,
        'allowFirstLine': false
      }
    }],
    'vue/html-closing-bracket-spacing': ['error'],
    'vue/html-closing-bracket-newline': ['error', {
      'singleline': 'never',
      'multiline': 'always'
    }],
    'vue/require-default-prop': 'off',
    'vue/html-self-closing': 'off'
  }
}
