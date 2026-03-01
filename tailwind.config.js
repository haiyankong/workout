/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,css}'],
  theme: {
    fontFamily: {
      sans: [
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'Oxygen-Sans',
        'Ubuntu',
        'Cantarell',
        'Helvetica Neue',
        'sans-serif',
      ],
    },
    extend: {
      colors: {
        background: '#F5F5F5',
        card: '#FFFFFF',
        primary: '#024A71',
        secondary: '#5A8A9F',
        accent: '#EE3E35',
      },
      borderRadius: {
        card: '1rem',
      },
    },
  },
  plugins: [],
};
