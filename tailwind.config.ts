import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'pxl-black': '#030203',
        'pxl-black-light': '#333333',
        'pxl-white': '#FFFFFF',
        'pxl-gold': '#AE9A64',
        'pxl-gold-hover': '#9A8756',
        'pxl-gold-light': '#F5F0E6',
        'pxl-gray-light': '#F5F5F5',
        'pxl-gray-border': '#E0E0E0',
      },
      fontFamily: {
        heading: ['var(--font-raleway)', 'Arial', 'sans-serif'],
        body: ['system-ui', 'Arial', 'sans-serif'],
        raleway: ['var(--font-raleway)', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'pxl': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}

export default config
