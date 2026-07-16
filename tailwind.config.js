/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Every color maps to a --cc-* CSS variable set from the active profile's
      // resolved theme, so the whole app repaints per child with no code change.
      colors: {
        favorite: 'var(--cc-favorite)',
        paint: 'var(--cc-paint)',
        'paint-deep': 'var(--cc-paint-deep)',
        accent: 'var(--cc-accent)',
        'accent-soft': 'var(--cc-accent-soft)',
        ink: 'var(--cc-ink)',
        cream: 'var(--cc-cream)',
        sky: 'var(--cc-sky)',
        cc: {
          50: 'var(--cc-50)',
          100: 'var(--cc-100)',
          200: 'var(--cc-200)',
          300: 'var(--cc-300)',
          400: 'var(--cc-400)',
          500: 'var(--cc-500)',
          600: 'var(--cc-600)',
          700: 'var(--cc-700)',
          800: 'var(--cc-800)',
          900: 'var(--cc-900)',
        },
      },
      fontFamily: {
        rounded: ['Fredoka', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        cozy: '1.25rem',
        pill: '999px',
      },
    },
  },
  plugins: [],
};
