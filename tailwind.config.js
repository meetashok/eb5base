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
        /**
         * Opposite-side brand pair to forest green + gold:
         * blue (~230°) cools data/info; rose (~335°) is the sparse status accent.
         */
        blue: {
          DEFAULT: '#2f6f8f',
          light: '#4a8bab',
          dark: '#245a75',
        },
        rose: {
          DEFAULT: '#9a5b6e',
          light: '#b57a8b',
          dark: '#7a4657',
        },
      },
      boxShadow: {
        soft: '0 4px 20px -4px rgba(10, 22, 40, 0.12), 0 2px 8px -2px rgba(10, 22, 40, 0.06)',
        lift: '0 16px 40px -12px rgba(10, 22, 40, 0.18), 0 4px 12px -4px rgba(10, 22, 40, 0.08)',
        glow: '0 8px 32px -6px rgba(212, 175, 55, 0.4)',
        'glow-green': '0 8px 28px -6px rgba(45, 90, 71, 0.35)',
        'glow-copper': '0 8px 28px -6px rgba(184, 115, 51, 0.35)',
        'glow-blue': '0 8px 28px -6px rgba(47, 111, 143, 0.35)',
        'glow-rose': '0 8px 28px -6px rgba(154, 91, 110, 0.35)',
        nav: '0 4px 24px -4px rgba(10, 22, 40, 0.3)',
      },
      backgroundImage: {
        'nav-gradient':
          'linear-gradient(135deg, #060f1a 0%, #0a1628 35%, #1a3d32 70%, #0a1628 100%)',
        'panel-gradient':
          'linear-gradient(160deg, #060f1a 0%, #0a1628 40%, #2d5a47 100%)',
        'page-hero-gradient':
          'linear-gradient(135deg, #060f1a 0%, #0a1628 30%, #1a3d32 65%, #0a1628 100%)',
        'page-hero-surface':
          'linear-gradient(180deg, #ebe4d8 0%, #f5f0e8 48%, #faf7f2 100%)',
        'btn-primary-gradient':
          'linear-gradient(135deg, #0a1628 0%, #1a3d32 50%, #0a1628 100%)',
        'surface-warm': 'linear-gradient(180deg, #f0ebe3 0%, #faf7f2 100%)',
        'panel-copper':
          'linear-gradient(135deg, rgba(184, 115, 51, 0.12) 0%, rgba(212, 175, 55, 0.08) 100%)',
        'panel-blue':
          'linear-gradient(135deg, rgba(47, 111, 143, 0.12) 0%, rgba(47, 111, 143, 0.05) 100%)',
        'panel-rose':
          'linear-gradient(135deg, rgba(154, 91, 110, 0.12) 0%, rgba(154, 91, 110, 0.05) 100%)',
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
          // Gold stays the brand highlight (CTAs, active nav, hover) — not status chips.
          accent: '#d4af37',
          'accent-content': '#0a1628',
          neutral: '#2c3338',
          'neutral-content': '#faf7f2',
          'base-100': '#faf7f2',
          'base-200': '#f3efe8',
          'base-300': '#e6dfd4',
          // Cool informational support (data chrome, info callouts).
          info: '#2f6f8f',
          success: '#2d5a47',
          warning: '#b87333',
          error: '#9e3a3a',
        },
      },
    ],
  },
};
