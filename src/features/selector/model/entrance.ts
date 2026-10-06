import type { Variants } from 'motion/react'

/** Shared entrance language for the selector: blocks rise out of a soft blur, one after another. */
export const EASE = [0.22, 1, 0.36, 1] as const

export const rise: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 1, ease: EASE },
  },
}

/** Staggers its children; the delay lets a block start while the previous one is still moving. */
export function stagger(delayChildren: number, staggerChildren = 0.12): Variants {
  return { hidden: {}, visible: { transition: { staggerChildren, delayChildren } } }
}
