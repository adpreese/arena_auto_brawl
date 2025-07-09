import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'rgb(var(--border))',
				input: 'rgb(var(--input))',
				ring: 'rgb(var(--ring))',
				background: 'rgb(var(--background))',
				foreground: 'rgb(var(--foreground))',
				primary: {
					DEFAULT: 'rgb(var(--primary))',
					foreground: 'rgb(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'rgb(var(--secondary))',
					foreground: 'rgb(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'rgb(var(--destructive))',
					foreground: 'rgb(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'rgb(var(--muted))',
					foreground: 'rgb(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'rgb(var(--accent))',
					foreground: 'rgb(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'rgb(var(--popover))',
					foreground: 'rgb(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'rgb(var(--card))',
					foreground: 'rgb(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'rgb(var(--sidebar-background))',
					foreground: 'rgb(var(--sidebar-foreground))',
					primary: 'rgb(var(--sidebar-primary))',
					'primary-foreground': 'rgb(var(--sidebar-primary-foreground))',
					accent: 'rgb(var(--sidebar-accent))',
					'accent-foreground': 'rgb(var(--sidebar-accent-foreground))',
					border: 'rgb(var(--sidebar-border))',
					ring: 'rgb(var(--sidebar-ring))'
				},
				// Game-specific colors
				arena: {
					bg: 'rgb(var(--arena-bg))',
					border: 'rgb(var(--arena-border))'
				},
				neon: {
					blue: 'rgb(var(--neon-blue))',
					green: 'rgb(var(--neon-green))',
					red: 'rgb(var(--neon-red))',
					yellow: 'rgb(var(--neon-yellow))',
					purple: 'rgb(var(--neon-purple))',
					cyan: 'rgb(var(--neon-cyan))'
				},
				gold:'rgb(var(--gold))',
				particle: {
					hit: 'rgb(var(--particle-hit))',
					death: 'rgb(var(--particle-death))'
				},
				hp: {
					full: 'rgb(var(--hp-full))',
					mid: 'rgb(var(--hp-mid))',
					low: 'rgb(var(--hp-low))'
				},
				ui: {
					panel: 'rgb(var(--ui-panel))',
					border: 'rgb(var(--ui-border))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				// Game animations
				'glow-pulse': {
					'0%, 100%': { boxShadow: '0 0 20px rgb(var(--primary) / 0.5)' },
					'50%': { boxShadow: '0 0 40px rgb(var(--primary) / 0.8), 0 0 60px rgb(var(--primary) / 0.4)' }
				},
				'neon-flicker': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				},
				'combat-shake': {
					'0%, 100%': { transform: 'translateX(0)' },
					'25%': { transform: 'translateX(-2px)' },
					'75%': { transform: 'translateX(2px)' }
				},
				'particle-burst': {
					'0%': { transform: 'scale(0.5)', opacity: '1' },
					'100%': { transform: 'scale(2)', opacity: '0' }
				},
				'hp-danger': {
					'0%, 100%': { backgroundColor: 'rgb(var(--hp-low))' },
					'50%': { backgroundColor: 'rgb(var(--destructive))' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
				'neon-flicker': 'neon-flicker 0.1s ease-in-out infinite',
				'combat-shake': 'combat-shake 0.2s ease-in-out',
				'particle-burst': 'particle-burst 0.5s ease-out forwards',
				'hp-danger': 'hp-danger 1s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
