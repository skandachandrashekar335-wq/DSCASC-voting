/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#070b18",
          800: "#0b1124",
          700: "#111a35",
          600: "#16223f",
        },
        electric: "#2f6bff",
        violet: "#8b5cf6",
        cyan: "#22d3ee",
        nb: {
          yellow: "#ffe17c",
          charcoal: "#171e19",
          sage: "#b7c6c2",
          dark: "#272727",
          star: "#ffbc2e",
        },
      },
      fontFamily: {
        display: ["'Cabinet Grotesk'", "'Space Grotesk'", "Inter", "system-ui", "sans-serif"],
        sans: ["'Satoshi'", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(47,107,255,0.55)",
        glowv: "0 0 40px -10px rgba(139,92,246,0.55)",
        "nb-sm": "4px 4px 0px 0px #000000",
        "nb": "8px 8px 0px 0px #000000",
        "nb-lg": "12px 12px 0px 0px #000000",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%,100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(400%)" },
        },
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        floaty: "floaty 5s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        pulseGlow: "pulseGlow 2.4s ease-in-out infinite",
        scan: "scan 2.5s linear infinite",
        riseIn: "riseIn 0.6s ease-out both",
        marquee: "marquee 28s linear infinite",
      },
    },
  },
  plugins: [],
};
