/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./mocks/**/*.html",
  ],
  theme: {
    extend: {
      animation: {
        'border': 'border 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'border': {
          'to': { '--border-angle': '360deg' },
        },
      },
      colors: {
        primary: {
          50: '#E6FAFF',
          100: '#B3F5FF',
          200: '#80EFFf',
          300: '#4DE9FF',
          400: '#1AE3FF',
          500: '#00D9FF',
          600: '#00A8CC',
          700: '#007799',
          800: '#004666',
          900: '#001533',
        },
        secondary: {
          50: '#F5FFE6',
          100: '#EAFFCC',
          200: '#DFFFB3',
          300: '#D4FF99',
          400: '#CAFF80',
          500: '#B8FF00',
          600: '#93CC00',
          700: '#6E9900',
          800: '#496600',
          900: '#243300',
        },
        accent: {
          400: '#FF33EB',
          500: '#FF00E6',
          600: '#CC00B9',
        },
        success: {
          400: '#66FFB3',
          500: '#00FF94',
          600: '#00CC77',
        },
        warning: {
          400: '#FFD366',
          500: '#FFC700',
          600: '#CCA300',
        },
        error: {
          400: '#FF6699',
          500: '#FF3366',
          600: '#CC2952',
        },
      },
    },
  },
  plugins: [],
}
