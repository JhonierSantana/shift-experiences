import type { ReactNode } from 'react'
import { useOptionalExperience } from './context'
import type { CapabilityName } from './types'

/** Single source of truth for feature gating. False outside any experience. */
export function useCapability(name: CapabilityName): boolean {
  return useOptionalExperience()?.capabilities.has(name) ?? false
}

interface CapabilityProps {
  readonly name: CapabilityName
  readonly children: ReactNode
  readonly fallback?: ReactNode
}

export function Capability({ name, children, fallback = null }: CapabilityProps) {
  return useCapability(name) ? children : fallback
}
