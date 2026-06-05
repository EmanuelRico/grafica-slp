/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue:        '#01AEF0',
          'blue-mid':  '#0098D4',
          'blue-deep': '#0073A8',
          'blue-light':'#5EC1F4',
          'blue-pale': '#E8F7FD',
          yellow:      '#F5C518',
          'yellow-bright': '#FFF84E',
          'yellow-pale':   '#FFFAE6',
          slate:       '#48708C',
          ink:         '#0D1B2A',
        },
      },
      fontFamily: {
        sans:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'blue-glow':   '0 0 40px rgba(1,174,240,0.25)',
        'yellow-glow': '0 0 30px rgba(245,197,24,0.3)',
        'soft-xl':     '0 20px 60px rgba(0,0,0,0.08)',
        'soft-2xl':    '0 32px 80px rgba(0,0,0,0.12)',
        'inner-shine': 'inset 0 1px 1px rgba(255,255,255,0.25)',
      },
      animation: {
        'float-slow':  'float 4s ease-in-out infinite',
        'float-med':   'float 3s ease-in-out infinite',
        'spin-slow':   'spin 8s linear infinite',
        'pulse-soft':  'pulseSoft 3s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':     { opacity: '1',   transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
