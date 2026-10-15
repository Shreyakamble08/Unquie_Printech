// Tailwind theme configuration
// Must be loaded AFTER the Tailwind CDN script.

tailwind.config = {
  theme: {
    extend: {
      colors: {
        'brand-cyan':    '#00AEEF',
        'brand-magenta': '#EC008C',
        'brand-yellow':  '#FFD400',
        'brand-ink':     '#1A1A1A',
        'brand-slate':   '#F5F6F8',
        'brand-dark':    '#0E1116',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        head:    ['Poppins', 'system-ui', 'sans-serif'],
        display: ['Anton', 'Impact', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px -10px rgba(0,0,0,0.12)',
      },
    },
  },
};