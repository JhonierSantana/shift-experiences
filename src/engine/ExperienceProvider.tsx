import type { ReactNode } from 'react'
import { ExperienceContext } from './context'
import { useFonts } from './fonts'
import { useDocumentScope } from './scope'
import type { ExperienceDefinition } from './types'

interface ExperienceProviderProps {
  readonly definition: ExperienceDefinition
  readonly children: ReactNode
}

/**
 * Activates an experience: sets `data-experience` on <html> (which switches every
 * semantic CSS variable declared in that experience's tokens.css), loads its fonts
 * and exposes the definition to Slot/Capability consumers.
 */
export function ExperienceProvider({ definition, children }: ExperienceProviderProps) {
  useDocumentScope(definition.id)
  useFonts(definition.fonts)

  return (
    <ExperienceContext value={definition}>
      {/* React 19 hoists these into <head>. */}
      <title>{`${definition.brand.name} · SHIFT`}</title>
      <meta name="theme-color" content={definition.theme.themeColor} />
      {children}
    </ExperienceContext>
  )
}
