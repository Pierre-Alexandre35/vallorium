import tdsPreset from '@qtm/tailwind-preset';

/** @type {import('tailwindcss').Config} */
export default {
  /**
   * Replace Tailwind’s default configuration for the default colors, spacing,
   * fontSize, fontFamily, fontWeight, boxShadow so none of these default utilities will be generated.
   *
   * All other utilities such as flex or text alignement for example are still generated.
   *
   * For example, text-pink-500 is not generated anymore but text-primary-500
   * is generated and related to our Quantum color palette.
   *
   * With margins, m-4 is not generated anymore but m-m is generated and related to our Quantum spacing scale.
   * w-9xl, h-9xl, etc. are still generated because the spacing scale is inherited by the padding, margin, width,
   * height, maxHeight, gap, inset, space, and translate core plugins.
   *
   * @see: https://developers.quantum.thalesdigital.io/react/1.4.0/customization/what-is-tailwind-quantum-preset
   * @see: https://developers.quantum.thalesdigital.io/react/1.4.0/customization/
   */
  presets: [tdsPreset],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  important: true, // needed to override quantum components
  darkMode: 'class', // needed to support dark mode
  plugins: [],
};
