/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-dark':       '#111111',
        'surface':       '#141824',
        'surface-2':     '#1c2133',
        'surface-3':     '#232b3e',
        'primary':       '#9333EA',
        'primary-light': '#a855f7',
        'secondary':     '#3B82F6',
        'accent-pink':   '#EC4899',
        'accent-cyan':   '#22D3EE',
        'text-primary':  '#F8FAFC',
        'text-muted':    '#9CA3AF',
        'border':        'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '16px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulse2: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        burst: {
          '0%':   { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        typing: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%':           { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease forwards',
        'fade-in':    'fadeIn 0.3s ease forwards',
        'pulse2':     'pulse2 1.5s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
        'burst':      'burst 0.8s ease-out forwards',
        'float':      'float 3s ease-in-out infinite',
        'typing':     'typing 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
