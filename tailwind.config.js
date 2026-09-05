/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F8F1E6",
        "paper-card": "#FFFCF6",
        ink: "#33281F",
        "ink-soft": "#7A6A5B",
        "ink-faint": "#A6957F",
        line: "#ECDFCA",
        "line-soft": "#F2E8D7",
        clay: "#D9764A",
        "clay-dark": "#BD5C37",
        "clay-light": "#F4D9C8",
        lavender: "#C9B6E4",
        "lavender-shade": "#A98FCB",
        sky: "#A9D4E8",
        "sky-shade": "#7EB4CE",
        mint: "#A7DCC4",
        "mint-shade": "#7CBFA1",
        peach: "#F4B79A",
        "peach-shade": "#E4936A",
        yellow: "#F6D889",
        "yellow-shade": "#E9BE55",
      },
      fontFamily: {
        display: ["Quicksand", "Nunito", "sans-serif"],
        body: ["Nunito", "Quicksand", "sans-serif"],
      },
      boxShadow: {
        flat: "0 2px 0 rgba(51,40,31,.04)",
        pop: "0 10px 30px rgba(51,40,31,.14)",
      },
    },
  },
  plugins: [],
};
