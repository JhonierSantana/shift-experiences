import type { ReactNode, SVGProps } from 'react'

function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1.25em"
      height="1.25em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

type P = SVGProps<SVGSVGElement>

export const PlusIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)
export const MinusIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
)
export const CloseIcon = (p: P) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
)
export const SearchIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
)
export const BagIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 8h14l-1 12H6L5 8Z" />
    <path d="M9 8V7a3 3 0 0 1 6 0v1" />
  </Icon>
)
export const HomeIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 11 12 4l8 7v9H4v-9Z" />
    <path d="M10 20v-5h4v5" />
  </Icon>
)
export const MenuIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 4v7a2 2 0 0 0 4 0V4M7 11v9M15 20V4c3 1 4 4 4 8h-4" />
  </Icon>
)
export const SwapIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 8h14l-3-3M20 16H6l3 3" />
  </Icon>
)
export const ClockIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
)
export const FlameIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 3 3 5 1-2 1-6 1-9Z" />
  </Icon>
)
export const BikeIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="6" cy="17" r="3" />
    <circle cx="18" cy="17" r="3" />
    <path d="M6 17l4-8h5l3 8M10 9 8 6H6" />
  </Icon>
)
export const StoreIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 9 5 4h14l1 5M4 9a3 3 0 0 0 5 2 3 3 0 0 0 6 0 3 3 0 0 0 5-2M5 12v8h14v-8" />
  </Icon>
)
export const CheckIcon = (p: P) => (
  <Icon {...p}>
    <path d="m5 12 5 5 9-10" />
  </Icon>
)
export const TagIcon = (p: P) => (
  <Icon {...p}>
    <path d="M3 12V4h8l10 10-8 8L3 12Z" />
    <circle cx="8" cy="8" r="1" />
  </Icon>
)
export const SlidersIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </Icon>
)
