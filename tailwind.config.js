/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        field: {
          50: "#f1f8f4",
          100: "#ddeee4",
          200: "#bcdccb",
          300: "#8fc3aa",
          400: "#5ea585",
          500: "#2D6A4F",
          600: "#255a43",
          700: "#1f4937",
          800: "#1a3b2d",
          900: "#153126",
        },
        harvest: {
          50: "#fbf8ea",
          100: "#f5edc9",
          200: "#ebd98e",
          300: "#e0bf54",
          400: "#D4A72C",
          500: "#c79222",
          600: "#a8731d",
          700: "#86571c",
          800: "#70471e",
          900: "#5f3b1e",
        },
        soil: {
          50: "#f9f6f2",
          100: "#f1ebe1",
          200: "#e2d5c0",
          300: "#d0b897",
          400: "#bd976c",
          500: "#b08050",
          600: "#a36e44",
          700: "#885739",
          800: "#6f4734",
          900: "#5b3c2d",
        },
        sky: {
          50: "#f3f8fb",
          100: "#e6eff5",
          200: "#c7deec",
          300: "#97c4db",
          400: "#60a5c5",
          500: "#457B9D",
          600: "#3d6a8c",
          700: "#355773",
          800: "#304960",
          900: "#2c3e50",
        },
        tomato: {
          400: "#ef876d",
          500: "#E76F51",
          600: "#d55a3c",
          700: "#b34830",
        },
      },
      fontFamily: {
        song: ['"Noto Serif SC"', '"Source Han Serif SC"', '"SimSun"', "serif"],
        sans: ['"Noto Sans SC"', '"Source Han Sans SC"', '"PingFang SC"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        paper: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
        card: "0 2px 8px rgba(45,106,79,0.08), 0 8px 24px rgba(45,106,79,0.06)",
        hover: "0 4px 16px rgba(45,106,79,0.12), 0 12px 32px rgba(45,106,79,0.08)",
      },
      backgroundImage: {
        "field-pattern":
          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D6A4F' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        "grain-texture":
          "linear-gradient(135deg, rgba(212,167,44,0.03) 0%, rgba(45,106,79,0.05) 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
        "grow": "grow 0.6s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        grow: {
          "0%": { transform: "scaleY(0)", transformOrigin: "bottom" },
          "100%": { transform: "scaleY(1)", transformOrigin: "bottom" },
        },
      },
    },
  },
  plugins: [],
};
