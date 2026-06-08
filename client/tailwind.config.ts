import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
          "surface-bright": "#fcf9f8",
          "inverse-primary": "#c6c6c7",
          "background": "#fcf9f8",
          "on-tertiary-fixed-variant": "#00458f",
          "tertiary-fixed-dim": "#abc7ff",
          "on-secondary-container": "#616365",
          "surface-dim": "#dcd9d9",
          "secondary-fixed": "#e2e2e4",
          "on-error-container": "#93000a",
          "inverse-surface": "#313030",
          "primary-fixed": "#e2e2e2",
          "on-secondary-fixed": "#1a1c1d",
          "outline": "#747878",
          "surface-container-highest": "#e5e2e1",
          "on-surface": "#1c1b1b",
          "surface-container-low": "#f6f3f2",
          "primary-container": "#ffffff",
          "tertiary-container": "#ffffff",
          "surface-container-high": "#ebe7e7",
          "secondary-fixed-dim": "#c6c6c8",
          "secondary-container": "#dfdfe1",
          "tertiary": "#005cbb",
          "outline-variant": "#c4c7c8",
          "surface-tint": "#5d5f5f",
          "surface-variant": "#e5e2e1",
          "on-tertiary": "#ffffff",
          "surface-container-lowest": "#ffffff",
          "on-primary-fixed": "#1a1c1c",
          "on-primary-container": "#747676",
          "error": "#ba1a1a",
          "secondary": "#5d5e60",
          "on-secondary-fixed-variant": "#454749",
          "surface-container": "#f0edec",
          "primary-fixed-dim": "#c6c6c7",
          "primary": "#5d5f5f",
          "surface": "#fcf9f8",
          "inverse-on-surface": "#f3f0ef",
          "on-primary-fixed-variant": "#454747",
          "tertiary-fixed": "#d7e2ff",
          "on-tertiary-fixed": "#001b3f",
          "on-secondary": "#ffffff",
          "on-background": "#1c1b1b",
          "on-tertiary-container": "#0973e5",
          "error-container": "#ffdad6",
          "on-error": "#ffffff",
          "on-primary": "#ffffff",
          "on-surface-variant": "#444748"
      },
      "borderRadius": {
          "DEFAULT": "0.25rem",
          "lg": "0.5rem",
          "xl": "0.75rem",
          "full": "9999px"
      },
      "spacing": {
          "gutter": "24px",
          "margin-desktop": "48px",
          "margin-mobile": "16px",
          "scale": "{'xs': '4px', 'sm': '8px', 'md': '16px', 'lg': '24px', 'xl': '48px', 'xxl': '80px'}",
          "base": "8px",
          "container-max": "1200px"
      },
      "fontFamily": {
          "display-md": ["var(--font-hanken)"],
          "body-sm": ["var(--font-inter)"],
          "headline-lg": ["var(--font-hanken)"],
          "title-lg": ["var(--font-inter)"],
          "display-lg": ["var(--font-hanken)"],
          "headline-lg-mobile": ["var(--font-hanken)"],
          "body-lg": ["var(--font-inter)"],
          "label-md": ["var(--font-inter)"]
      },
      "fontSize": {
          "display-md": ["40px", {"lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "600"}],
          "body-sm": ["14px", {"lineHeight": "1.5", "fontWeight": "400"}],
          "headline-lg": ["32px", {"lineHeight": "1.2", "fontWeight": "600"}],
          "title-lg": ["20px", {"lineHeight": "1.4", "fontWeight": "600"}],
          "display-lg": ["56px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700"}],
          "headline-lg-mobile": ["24px", {"lineHeight": "1.2", "fontWeight": "600"}],
          "body-lg": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
          "label-md": ["12px", {"lineHeight": "1", "letterSpacing": "0.02em", "fontWeight": "500"}]
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}

export default config
