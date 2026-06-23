/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        porto: {
          navy: '#1a2332',
          sidebar: '#1e2a3a',
          slate: '#334050',
          red: '#eb3238',
          'red-dark': '#d42d33',
          blue: '#3b82f6',
          'blue-light': '#60a5fa',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
