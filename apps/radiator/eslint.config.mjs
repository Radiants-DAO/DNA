import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextCoreWebVitals,
  {
    rules: {
      '@next/next/no-img-element': 'off',
      'import/no-anonymous-default-export': 'off',
    },
  },
  {
    ignores: ['radiants-program-library/**'],
  },
];

export default config;
