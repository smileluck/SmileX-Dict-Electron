export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f8ff',
          100: '#dbeeff',
          200: '#bfe0ff',
          300: '#93cdff',
          400: '#61b2ff',
          500: '#3a93f5',
          600: '#2a75d2',
          700: '#225da8',
          800: '#1f4b87',
          900: '#1d3e6f',
          950: '#0f2744',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.70)',
          dark: 'rgba(17, 24, 39, 0.70)',
          border: 'rgba(255, 255, 255, 0.18)',
          borderDark: 'rgba(55, 65, 81, 0.50)',
        },
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0, 0, 0, 0.06)',
        'glass-lg': '0 8px 40px rgba(0, 0, 0, 0.08)',
        'glass-xl': '0 12px 50px rgba(0, 0, 0, 0.10)',
        glow: '0 0 20px rgba(58, 147, 245, 0.15)',
        'glow-lg': '0 0 40px rgba(58, 147, 245, 0.20)',
        card: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 30px rgba(0, 0, 0, 0.08)',
        elevated: '0 20px 60px rgba(0, 0, 0, 0.12)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.25s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 3s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.99)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(58, 147, 245, 0.1)' },
          '100%': { boxShadow: '0 0 25px rgba(58, 147, 245, 0.25)' },
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #3a93f5 0%, #2a75d2 50%, #225da8 100%)',
        'gradient-brand-light': 'linear-gradient(135deg, #dbeeff 0%, #bfe0ff 50%, #93cdff 100%)',
        'gradient-warm': 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
        'gradient-cool': 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        'gradient-green': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        'gradient-purple': 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, rgba(58, 147, 245, 0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(34, 197, 94, 0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(139, 92, 246, 0.06) 0px, transparent 50%)',
        'gradient-mesh-dark': 'radial-gradient(at 40% 20%, rgba(58, 147, 245, 0.06) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(34, 197, 94, 0.04) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(139, 92, 246, 0.04) 0px, transparent 50%)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      transitionTimingFunction: {
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
