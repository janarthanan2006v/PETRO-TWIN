/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        petro: {
          950: '#070d18',
          900: '#0c1527',
          850: '#111d35',
          800: '#162544',
          700: '#1f345e',
          600: '#2d4b85',
          500: '#3d66b5',
          400: '#5a85dc',
          amber: '#f59e0b',
          cyan: '#06b6d4',
          emerald: '#10b981',
          crimson: '#ef4444'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
