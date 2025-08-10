import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss/types/config').PluginCreator} */

const config: Config = {
  mode: "jit",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "pulse-slow": "pulse 3s linear infinite",
        "pulse-fast": "pulse 1s linear infinite",
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        'l11-1': {
          '100%': {top:'-0.2px'}
        },
        'l11-2': {
          '4%, 96%': {transform: 'scaleY(1)'}
        },
        'l11-3': {
          '100%': {transform: 'scaleY(0.3)'}
        },
        "shimmer": {
          "100%": {"transform": "translateX(100%)",},
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    }
  },
  plugins: [
    plugin(({ addUtilities, addVariant }: { addUtilities: any, addVariant: any }) => {
    addUtilities({
      /* Chrome, Safari and Opera */
      ".scrollbar-hidden::-webkit-scrollbar": {
        display: "none",
      },
      ".scrollbar-hidden": {
        "scrollbar-width": "none" /* Firefox */,
        "-ms-overflow-style": "none" /* IE and Edge */,
      },
    })
    addVariant("starting", "@starting-style");
  }),
]
};

export default config;
