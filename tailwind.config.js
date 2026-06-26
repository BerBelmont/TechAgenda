/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff8ff',
          100: '#dbefff',
          300: '#7cc7ff',
          500: '#2498f2',
          600: '#0f78d4',
          800: '#0f3f6d',
          900: '#102f50'
        }
      },
      boxShadow: {
        soft: '0 18px 45px rgba(15, 63, 109, 0.10)'
      }
    }
  },
  plugins: []
};
