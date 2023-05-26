/** @type {import("tailwindcss").Config} */

const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  mode: 'jit',  // <--- enable JIT
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}',
    './node_modules/flowbite/**/*.js',
    'node_modules/flowbite-vue/**/*.{js,jsx,ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      spacing: {
        13: '3.25rem'
      },
      colors: {
        ui: {
          900: 'rgb(var(--tw-ui-content1) / <alpha-value>)',
          800: 'rgb(var(--tw-ui-content2) / <alpha-value>)',
          700: 'rgb(var(--tw-ui-content3) / <alpha-value>)',
          300: 'rgb(var(--tw-ui-border) / <alpha-value>)',
          200: 'rgb(var(--tw-ui-bg-secondary) / <alpha-value>)',
          100: 'rgb(var(--tw-ui-bg-primary) / <alpha-value>)'
        },
        primary: {
          600: 'rgb(var(--tw-primary-pressed) / <alpha-value>)',
          500: 'rgb(var(--tw-primary-base) / <alpha-value>)',
          400: 'rgb(var(--tw-primary-hover) / <alpha-value>)',
          200: 'rgb(var(--tw-primary-border) / <alpha-value>)',
          100: 'rgb(var(--tw-primary-bg) / <alpha-value>)'
        }
      },
      boxShadow: {
        // focus: 'var(--tw-primary-focus)',
        focus: '0 0 2px 2px rgba(0, 133, 255, 0.18)'
      },
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
        serif: ['Bitter', ...defaultTheme.fontFamily.serif]
      },
      fontSize: {
        '2xs': ['0.625rem', '1rem']
      }
    }
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ]
};
