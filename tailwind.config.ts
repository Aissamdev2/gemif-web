import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss/types/config').PluginCreator} */

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
  	extend: {
      screens: {
        // Creates a 'short' breakpoint for screens shorter than 800px
        'short': { 'raw': '(max-height: 700px)' },
        // You can add 'tall' too if needed
        'tall': { 'raw': '(min-height: 700px)' },
      },
  		fontFamily: {
  			sans: [
  				'Inter',
  				'ui-sans-serif',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		animation: {
  			'spin-slow': 'spin 3s linear infinite',
  			'pulse-slow': 'pulse 3s linear infinite',
  			'pulse-fast': 'pulse 1s linear infinite',
  			'fade-in': 'fadeIn 0.3s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
  		},
  		keyframes: {
  			fadeIn: {
  				from: {
  					opacity: '0',
  					transform: 'translateY(4px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			shimmer: {
          from: {
            backgroundPosition: "0 0",
          },
          to: {
            backgroundPosition: "-200% 0",
          },
        }
  		},
			// colors: {
      //   // Backgrounds
      //   bg: "#f6f8fa",
      //   surface: "#ffffff",
      //   "surface-hover": "#f2f2f2",
      //   "surface-hover-dark": "#e8e8e8",

      //   // Text
      //   "text-primary": "#1f2328",
      //   "text-secondary": "#57606a",
      //   "text-placeholder": "#8c959f",
      //   "text-disabled": "#8c959f",
      //   "text-on-accent": "#ffffff",

      //   // Borders
      //   border: "#d0d7de",
      //   "border-interactive": "#8c959f",
      //   "border-hover": "#24292f",

      //   // Brand & Action
      //   primary: "#1f2328",
      //   "primary-hover": "#33383e",
      //   link: "#0969da",

      //   // Semantic colors
      //   success: "#1f883d",
      //   danger: "#d73a49",
      //   warning: "#d4a72c",
      //   info: "#0969da",
      // },
      // borderRadius: {
      //   DEFAULT: "5px",
      //   sm: "2px",
      // },
      // boxShadow: {
      //   "focus-ring": "0 0 0 3px #096bda77",
      // },
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
      require("tailwindcss-animate")
]
} satisfies Config;

export default config;
