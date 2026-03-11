import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number | string | undefined | null) {
  if (amount === undefined || amount === null) return "0.00"
  const val = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(val)) return "0.00"
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val).replace(/,/g, '\u00A0')
}
