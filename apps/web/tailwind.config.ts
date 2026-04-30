import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1B6B3A",
          dark: "#14532d",
          light: "#e8f5ec",
        },
      },
    },
  },
  plugins: [],
};

export default config;
