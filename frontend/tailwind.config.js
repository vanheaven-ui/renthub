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
      },
      animation: {
        statusChange: "statusChange 1.5s ease-in-out",
        unreadBounce: "unreadBounce 0.8s ease-in-out",
      },
    },
  },
  plugins: [],
};
