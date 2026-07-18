/**
 * Maps note color values to Tailwind CSS class pairs for note cards.
 * Lookup by color string, no conditional logic needed.
 * 
 * @type {Record<string, { card: string, header: string }>}
 */
export const NOTE_CARD_STYLES = {
  gray: {
    card: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
    header: 'text-gray-700',
  },
  amber: {
    card: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
    header: 'text-amber-700',
  },
  emerald: {
    card: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
    header: 'text-emerald-700',
  },
  green: {
    card: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
    header: 'text-emerald-700',
  },
};

/**
 * Maps column status codes to column-level Tailwind CSS classes.
 * 
 * @type {Record<string, { card: string, header: string }>}
 */
export const COLUMN_STYLES = {
  C01: {
    card: 'border-gray-200 shadow-gray-100/50',
    header: 'bg-gray-50 text-gray-700',
  },
  C02: {
    card: 'border-amber-200 shadow-amber-100/50',
    header: 'bg-amber-50 text-amber-700',
  },
  C03: {
    card: 'border-emerald-200 shadow-emerald-100/50',
    header: 'bg-emerald-50 text-emerald-700',
  },
};