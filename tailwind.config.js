/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -4px rgba(15, 31, 51, 0.1), 0 2px 8px -2px rgba(15, 31, 51, 0.06)',
        lift: '0 16px 40px -12px rgba(15, 31, 51, 0.16), 0 4px 12px -4px rgba(15, 31, 51, 0.08)',
        glow: '0 8px 28px -6px rgba(201, 169, 98, 0.35)',
        nav: '0 4px 24px -4px rgba(15, 31, 51, 0.25)',
      },
      backgroundImage: {
        'nav-gradient':
          'linear-gradient(135deg, #0a1829 0%, #0f1f33 40%, #1a3348 70%, #0f1f33 100%)',
        'panel-gradient':
          'linear-gradient(160deg, #0a1829 0%, #0f1f33 45%, #1a3a40 100%)',
        'btn-primary-gradient':
          'linear-gradient(135deg, #0f1f33 0%, #1a3348 55%, #0f1f33 100%)',
        'surface-warm': 'linear-gradient(180deg, #f3efe8 0%, #faf7f2 100%)',
        'icon-ring': 'linear-gradient(135deg, rgba(47, 107, 102, 0.14) 0%, rgba(201, 169, 98, 0.1) 100%)',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        eb5base: {
          primary: '#0f1f33',
          'primary-content': '#f5f1ea',
          secondary: '#2f6b66',
          'secondary-content': '#ffffff',
          accent: '#c9a962',
          'accent-content': '#0f1f33',
          neutral: '#2c3338',
          'neutral-content': '#faf7f2',
          'base-100': '#faf7f2',
          'base-200': '#f3efe8',
          'base-300': '#e6dfd4',
          info: '#3d6b8c',
          success: '#3d7a5c',
          warning: '#a67c3a',
          error: '#b54a4a',
        },
      },
    ],
  },
};
