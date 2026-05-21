import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "InterVariable",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        abyss: {
          900: "#04060c",
          800: "#070a14",
          700: "#0a1020",
          600: "#0e162a",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
