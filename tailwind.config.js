/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,css}'],
  theme: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
    extend: {
      colors: {
        background: '#000000',
        card: '#1C1C1E',
        primary: '#FFFFFF',
        secondary: '#8E8E93',
        accent: '#FF3B30',
      },
      borderRadius: {
        card: '1rem',
      },
    },
  },
  plugins: [],
};
