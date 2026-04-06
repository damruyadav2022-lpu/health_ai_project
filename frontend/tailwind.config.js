/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#070b11",
          800: "#0d1117",
          700: "#111827",
          600: "#1a2236",
          500: "#1e2d42",
          400: "#243447",
        },
        brand: {
          50: "#eef9ff",
          100: "#d8f1ff",
          200: "#b3e5ff",
          300: "#7dd4fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        accent: {
          purple: "#8b5cf6",
          pink: "#ec4899",
          amber: "#0b3ef5ff",
          green: "#10b981",
          red: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "mesh-gradient": "linear-gradient(135deg, #070b11 0%, #0d1117 50%, #111827 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-left": "slideLeft 0.3s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { transform: "translateY(20px)", opacity: 0 }, to: { transform: "translateY(0)", opacity: 1 } },
        slideLeft: { from: { transform: "translateX(-20px)", opacity: 0 }, to: { transform: "translateX(0)", opacity: 1 } },
        pulseGlow: { "0%, 100%": { boxShadow: "0 0 15px rgba(14,165,233,0.3)" }, "50%": { boxShadow: "0 0 30px rgba(14,165,233,0.7)" } },
      },
      boxShadow: {
        glow: "0 0 20px rgba(14,165,233,0.35)",
        "glow-lg": "0 0 40px rgba(14,165,233,0.5)",
        "glow-red": "0 0 20px rgba(239, 82, 68, 0.41)",
        card: "0 4px 24px rgba(0,0,0,0.5)",
      },
      borderRadius: {
        xl2: "1rem",
        xl3: "1.5rem",
      },
    },
  },
  plugins: [],
};
