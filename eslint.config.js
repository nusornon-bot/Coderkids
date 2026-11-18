import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'dist-worker/**/*', 'node_modules/**/*'],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
