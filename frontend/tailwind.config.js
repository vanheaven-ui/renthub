/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        statusChange: {
          "0%": { transform: "scale(1)", boxShadow: "0 0 0 rgba(0,0,0,0)" },
          "50%": {
            transform: "scale(1.03)",
            boxShadow: "0 0 20px rgba(128,0,128,0.5)",
          },
          "100%": { transform: "scale(1)", boxShadow: "0 0 0 rgba(0,0,0,0)" },
        },
        unreadBounce: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.4)" },
        },

        // 🌬 Floating abstract shapes
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(5deg)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-40px) rotate(-10deg)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: 0.4, transform: "scale(1)" },
          "50%": { opacity: 0.8, transform: "scale(1.1)" },
        },

        // ✨ Trail fade for glassy shapes
        shimmer: {
          "0%": { opacity: 0.1, transform: "translateX(-10px)" },
          "50%": { opacity: 0.5, transform: "translateX(10px)" },
          "100%": { opacity: 0.1, transform: "translateX(-10px)" },
        },
      },
      animation: {
        statusChange: "statusChange 1.5s ease-in-out",
        unreadBounce: "unreadBounce 0.8s ease-in-out",
        float: "float 6s ease-in-out infinite",
        floatSlow: "floatSlow 10s ease-in-out infinite",
        pulseGlow: "pulseGlow 8s ease-in-out infinite",
        shimmer: "shimmer 5s ease-in-out infinite",
      },

      colors: {
        gradientStart: "#c084fc",
        gradientEnd: "#9333ea",
        glassLight: "rgba(255,255,255,0.15)",
        glassBorder: "rgba(255,255,255,0.2)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
