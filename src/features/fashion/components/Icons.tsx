interface IconProps {
  readonly filled?: boolean
  readonly className?: string
}

const shared = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  'aria-hidden': true,
  focusable: false,
} as const

export function BagIcon({ className = 'size-6' }: IconProps) {
  return (
    <svg {...shared} className={className}>
      <path d="M5 8h14l-1 12H6L5 8Z M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

export function HeartIcon({ filled = false, className = 'size-6' }: IconProps) {
  return (
    <svg {...shared} className={className}>
      <path
        d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  )
}

export function CloseIcon({ className = 'size-6' }: IconProps) {
  return (
    <svg {...shared} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}
