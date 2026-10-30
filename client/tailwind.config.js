// Colours come from CSS variables set by the shop theme (see src/theme.js and src/index.css)
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: v('brand'), hover: v('brand-hover'), accent: v('accent'), ink: v('brand-ink') },
        accent: v('accent'),
        app: v('app'),         // darkest background
        sunken: v('sunken'),   // inputs, footers
        card: v('card'),       // cards
        raised: v('raised'),   // buttons on cards
        raised2: v('raised2'), // hover
        page: v('page'),       // light-mode page background
        surface: { DEFAULT: v('card'), border: v('line') },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
