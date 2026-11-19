// @ts-check
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Compone clases de Tailwind resolviendo conflictos.
 *
 * @param {...import('tailwind-merge').ClassNameValue} inputs
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
