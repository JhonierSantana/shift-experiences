interface IconProps {
  readonly filled?: boolean
  readonly className?: string
}

const shared = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const

export function SearchIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg {...shared} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export function CartIcon({ className = 'size-6' }: IconProps) {
  return (
    <svg {...shared} className={className}>
      <path d="M3 4h2l2.4 11h11l2-8H6.2" />
      <circle cx="9" cy="19.5" r="1.3" />
      <circle cx="17" cy="19.5" r="1.3" />
    </svg>
  )
}

export function HeartIcon({ filled = false, className = 'size-5' }: IconProps) {
  return (
    <svg {...shared} className={className}>
      <path
        d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  )
}

export function CloseIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg {...shared} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function MenuIcon({ className = 'size-5' }: IconProps) {
  return (
    <svg {...shared} className={className}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

export function ChevronIcon({
  direction = 'right',
  className = 'size-5',
}: IconProps & { readonly direction?: 'left' | 'right' | 'down' }) {
  const rotate = { right: 0, left: 180, down: 90 }[direction]
  return (
    <svg {...shared} className={className} style={{ transform: `rotate(${String(rotate)}deg)` }}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

export function CompareIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg {...shared} className={className}>
      <path d="M8 4v16M16 4v16M4 8h8M12 16h8" />
    </svg>
  )
}

export function CheckIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg {...shared} className={className}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

export function TruckIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg {...shared} className={className}>
      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
      <circle cx="7" cy="17.5" r="1.5" />
      <circle cx="17" cy="17.5" r="1.5" />
    </svg>
  )
}
