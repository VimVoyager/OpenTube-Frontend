/** @type {import('tailwindcss').Config} */
export const theme = {
    colors: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Main accent
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
    },
    fontFamily: {
        sans: ['Graphik', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
    },
    extend: {
        spacing: {
            '128': '32rem',
            '144': '36rem',
        },
        borderRadius: {
            '4xl': '2rem',
        }
    }
}
export const variants = {
    extend: {
        borderColor: ['focus-visible'],
        opacity: ['disabled'],
    }
}
  1 Change shaka player imports from to dynamic imports in VideoPlayer
  2 
  3 - Remove static shaka player imports
  4 - Create dynamic shaka player imports in onMount so it only works in the
  5 with no SSR
  6 - Add browser check as an extra safety guide