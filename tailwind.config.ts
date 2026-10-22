import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#F8FAFC",
        paper: "#0F172A",
        turmeric: "#F59E0B",
        sumac: "#F97316",
        surface: "#1E293B",
        "surface-raised": "#334155",
      },
      fontFamily: { sans: ["var(--font-ar)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;
