import { createContext, useContext } from 'react'
import type { ExperienceDefinition } from './types'

export const ExperienceContext = createContext<ExperienceDefinition | null>(null)

/** Active definition, or null outside any experience (selector, root 404). */
export function useOptionalExperience(): ExperienceDefinition | null {
  return useContext(ExperienceContext)
}

export function useExperience(): ExperienceDefinition {
  const definition = useContext(ExperienceContext)
  if (!definition) throw new Error('useExperience must be used inside <ExperienceProvider>')
  return definition
}
