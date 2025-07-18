import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Noto Sans"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        github: {
          canvas: {
            default: '#ffffff',
            subtle: '#f6f8fa',
            inset: '#f6f8fa',
          },
          fg: {
            default: '#24292f',
            muted: '#656d76',
            subtle: '#6e7781',
            onEmphasis: '#ffffff',
          },
          border: {
            default: '#d0d7de',
            muted: '#d8dee4',
            subtle: '#d0d7de',
          },
          neutral: {
            emphasisPlus: '#24292f',
            emphasis: '#6e7781',
            muted: 'rgba(175,184,193,0.2)',
            subtle: 'rgba(234,238,242,0.5)',
          },
          accent: {
            fg: '#0969da',
            emphasis: '#0969da',
            muted: 'rgba(84,174,255,0.4)',
            subtle: '#ddf4ff',
          },
          success: {
            fg: '#1a7f37',
            emphasis: '#2da44e',
            muted: 'rgba(74,194,107,0.4)',
            subtle: '#dafbe1',
          },
          attention: {
            fg: '#9a6700',
            emphasis: '#d1242f',
            muted: 'rgba(212,167,44,0.4)',
            subtle: '#fff8c5',
          },
          severe: {
            fg: '#bc4c00',
            emphasis: '#bc4c00',
            muted: 'rgba(251,143,68,0.4)',
            subtle: '#fff1e5',
          },
          danger: {
            fg: '#cf222e',
            emphasis: '#cf222e',
            muted: 'rgba(255,129,130,0.4)',
            subtle: '#ffebe9',
          },
          done: {
            fg: '#8250df',
            emphasis: '#8250df',
            muted: 'rgba(194,151,255,0.4)',
            subtle: '#fbefff',
          },
          btn: {
            text: '#24292f',
            bg: '#f6f8fa',
            border: '#d0d7de',
            shadow: '0 1px 0 rgba(31,35,40,0.04)',
            insetShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
            hoverBg: '#f3f4f6',
            hoverBorder: '#d0d7de',
            activeBg: 'hsla(220,14%,93%,1)',
            activeBorder: '#d0d7de',
            selectedBg: 'hsla(220,14%,94%,1)',
            primary: {
              text: '#ffffff',
              bg: '#2da44e',
              border: 'rgba(31,35,40,0.15)',
              shadow: '0 1px 0 rgba(31,35,40,0.1)',
              insetShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
              hoverBg: '#2c974b',
              hoverBorder: 'rgba(31,35,40,0.15)',
              selectedBg: 'hsla(137,66%,28%,1)',
              selectedShadow: 'inset 0 1px 0 rgba(0,45,17,0.2)',
              disabledText: 'rgba(255,255,255,0.8)',
              disabledBg: '#94d3a2',
              disabledBorder: 'rgba(31,35,40,0.15)',
            },
          },
        },
        // Dark mode colors
        'github-dark': {
          canvas: {
            default: '#0d1117',
            subtle: '#161b22',
            inset: '#010409',
          },
          fg: {
            default: '#e6edf3',
            muted: '#7d8590',
            subtle: '#6e7681',
            onEmphasis: '#ffffff',
          },
          border: {
            default: '#30363d',
            muted: '#21262d',
            subtle: 'rgba(240,246,252,0.1)',
          },
          neutral: {
            emphasisPlus: '#f0f6fc',
            emphasis: '#6e7681',
            muted: 'rgba(110,118,129,0.4)',
            subtle: 'rgba(110,118,129,0.1)',
          },
          accent: {
            fg: '#58a6ff',
            emphasis: '#1f6feb',
            muted: 'rgba(56,139,253,0.4)',
            subtle: 'rgba(56,139,253,0.15)',
          },
          success: {
            fg: '#3fb950',
            emphasis: '#238636',
            muted: 'rgba(46,160,67,0.4)',
            subtle: 'rgba(46,160,67,0.15)',
          },
          attention: {
            fg: '#d29922',
            emphasis: '#9e6a03',
            muted: 'rgba(187,128,9,0.4)',
            subtle: 'rgba(187,128,9,0.15)',
          },
          severe: {
            fg: '#db6d28',
            emphasis: '#bc4c00',
            muted: 'rgba(219,109,40,0.4)',
            subtle: 'rgba(219,109,40,0.15)',
          },
          danger: {
            fg: '#f85149',
            emphasis: '#da3633',
            muted: 'rgba(248,81,73,0.4)',
            subtle: 'rgba(248,81,73,0.15)',
          },
          done: {
            fg: '#a5a2ff',
            emphasis: '#8b949e',
            muted: 'rgba(163,113,247,0.4)',
            subtle: 'rgba(163,113,247,0.15)',
          },
          btn: {
            text: '#f0f6fc',
            bg: '#21262d',
            border: '#30363d',
            shadow: '0 0 transparent',
            insetShadow: '0 0 transparent',
            hoverBg: '#30363d',
            hoverBorder: '#8b949e',
            activeBg: 'hsla(212,12%,18%,1)',
            activeBorder: '#6e7681',
            selectedBg: 'hsla(212,12%,18%,1)',
            primary: {
              text: '#ffffff',
              bg: '#238636',
              border: 'rgba(240,246,252,0.1)',
              shadow: '0 0 transparent',
              insetShadow: '0 0 transparent',
              hoverBg: '#2ea043',
              hoverBorder: 'rgba(240,246,252,0.1)',
              selectedBg: 'hsla(137,66%,28%,1)',
              selectedShadow: '0 0 transparent',
              disabledText: 'rgba(240,246,252,0.5)',
              disabledBg: 'rgba(35,134,54,0.6)',
              disabledBorder: 'rgba(240,246,252,0.1)',
            },
          },
        },
      },
    },
  },
  plugins: [
    forms,
  ],
}

export default config
