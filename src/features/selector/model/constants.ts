/** Shared shapes so the doors, the demo frame and the demo card stay in step. */
export const PANEL_RADIUS = 'rounded-[1.75rem]'
export const PANEL_INNER_RADIUS = 'rounded-[1.25rem]'

/** SVG `rx` for the demo outline: the panel radius (1.75rem = 28px) minus half the stroke. */
export const PANEL_OUTLINE_RX = 27

/** How long each brand stays in the spotlight before the selector moves to the next one. */
export const CYCLE_MS = 2800

/** Selector chrome plus one display face per brand: the wordmark itself is the demo. */
export const SELECTOR_FONTS = [
  {
    href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400..700&family=Instrument+Serif:ital@0;1&family=Bricolage+Grotesque:wght@800&family=Archivo:wght@800&display=swap',
  },
]

/** Each letter of SHIFT wears a different brand's display face. */
export const WORDMARK = [
  { letter: 'S', className: "font-['Instrument_Serif'] italic" },
  { letter: 'H', className: "font-['Bricolage_Grotesque'] font-extrabold" },
  { letter: 'I', className: "font-['Archivo'] font-extrabold" },
  { letter: 'F', className: "font-['Instrument_Serif']" },
  { letter: 'T', className: "font-['Bricolage_Grotesque'] font-extrabold" },
] as const

export const FACTS = ['Navegación propia', 'Datos propios', 'Carrito propio'] as const
