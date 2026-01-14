/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Poppins", "system-ui", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        general: {
          100: "hsl(var(--general-100))",
          90: "hsl(var(--general-90))",
          80: "hsl(var(--general-80))",
          70: "hsl(var(--general-70))",
          60: "hsl(var(--general-60))",
          50: "hsl(var(--general-50))",
          40: "hsl(var(--general-40))",
          30: "hsl(var(--general-30))",
          20: "hsl(var(--general-20))",
        },
        green: {
          100: "hsl(var(--green-100))",
          90: "hsl(var(--green-90))",
          80: "hsl(var(--green-80))",
          70: "hsl(var(--green-70))",
          60: "hsl(var(--green-60))",
          50: "hsl(var(--green-50))",
          40: "hsl(var(--green-40))",
          30: "hsl(var(--green-30))",
          20: "hsl(var(--green-20))",
        },
        red: {
          100: "hsl(var(--red-100))",
          90: "hsl(var(--red-90))",
          80: "hsl(var(--red-80))",
          70: "hsl(var(--red-70))",
          60: "hsl(var(--red-60))",
          50: "hsl(var(--red-50))",
          40: "hsl(var(--red-40))",
          30: "hsl(var(--red-30))",
          20: "hsl(var(--red-20))",
        },
        blue: {
          100: "hsl(var(--blue-100))",
          90: "hsl(var(--blue-90))",
          80: "hsl(var(--blue-80))",
          70: "hsl(var(--blue-70))",
          60: "hsl(var(--blue-60))",
          50: "hsl(var(--blue-50))",
          40: "hsl(var(--blue-40))",
          30: "hsl(var(--blue-30))",
          20: "hsl(var(--blue-20))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--general-100))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
