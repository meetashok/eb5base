/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'sans-serif'],
      },
      colors: {
        copper: {
          DEFAULT: '#b87333',
          light: '#d4954a',
          dark: '#8f5a28',
        },
      },
      boxShadow: {
        soft: '0 4px 20px -4px rgba(10, 22, 40, 0.12), 0 2px 8px -2px rgba(10, 22, 40, 0.06)',
        lift: '0 16px 40px -12px rgba(10, 22, 40, 0.18), 0 4px 12px -4px rgba(10, 22, 40, 0.08)',
        glow: '0 8px 32px -6px rgba(212, 175, 55, 0.4)',
        'glow-green': '0 8px 28px -6px rgba(45, 90, 71, 0.35)',
        'glow-copper': '0 8px 28px -6px rgba(184, 115, 51, 0.35)',
        nav: '0 4px 24px -4px rgba(10, 22, 40, 0.3)',
      },
      backgroundImage: {
        'nav-gradient':
          'linear-gradient(135deg, #060f1a 0%, #0a1628 35%, #1a3d32 70%, #0a1628 100%)',
        'panel-gradient':
          'linear-gradient(160deg, #060f1a 0%, #0a1628 40%, #2d5a47 100%)',
        'page-hero-gradient':
          'linear-gradient(135deg, #060f1a 0%, #0a1628 30%, #1a3d32 65%, #0a1628 100%)',
        'btn-primary-gradient':
          'linear-gradient(135deg, #0a1628 0%, #1a3d32 50%, #0a1628 100%)',
        'surface-warm': 'linear-gradient(180deg, #f0ebe3 0%, #faf7f2 100%)',
        'panel-copper':
          'linear-gradient(135deg, rgba(184, 115, 51, 0.12) 0%, rgba(212, 175, 55, 0.08) 100%)',
        'icon-ring':
          'linear-gradient(135deg, rgba(45, 90, 71, 0.18) 0%, rgba(212, 175, 55, 0.12) 100%)',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        eb5base: {
          primary: '#0a1628',
          'primary-content': '#f5f1ea',
          secondary: '#2d5a47',
          'secondary-content': '#ffffff',
          accent: '#d4af37',
          'accent-content': '#0a1628',
          neutral: '#2c3338',
          'neutral-content': '#faf7f2',
          'base-100': '#faf7f2',
          'base-200': '#f3efe8',
          'base-300': '#e6dfd4',
          info: '#4a6274',
          success: '#2d5a47',
          warning: '#b87333',
          error: '#9e3a3a',
        },
      },
    ],
  },
};
