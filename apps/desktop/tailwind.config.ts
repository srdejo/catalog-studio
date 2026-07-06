import type { Config } from 'tailwindcss';

/**
 * Tema base portado del proyecto de diseño "Catálogo de productos Electron"
 * (paleta, tipografías) — se reutiliza en todas las pantallas futuras.
 */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./renderer/index.html', './renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        text: 'var(--text)',
        'text-2': 'var(--text-2)',
        'text-3': 'var(--text-3)',
        accent: 'var(--accent)',
        'accent-strong': 'var(--accent-strong)',
        'accent-weak': 'var(--accent-weak)',
        'on-accent': 'var(--on-accent)',
        ink: 'var(--ink)',
        amber: 'var(--amber)',
        red: 'var(--red)',
        green: 'var(--green)',
      },
      fontFamily: {
        sans: ['Onest', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['Archivo', 'sans-serif'],
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        lg: 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
} satisfies Config;
