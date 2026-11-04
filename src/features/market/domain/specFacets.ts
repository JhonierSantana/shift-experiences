import type { MarketProduct } from '@/core/domain'

export interface SpecFacetOption {
  readonly id: string
  readonly label: string
  readonly test: (product: MarketProduct) => boolean
}

export interface SpecFacet {
  readonly id: string
  readonly label: string
  readonly options: readonly SpecFacetOption[]
}

const anySpec = (product: MarketProduct, pattern: RegExp) =>
  product.specs.some((s) => pattern.test(s.value))
const hasLabel = (product: MarketProduct, label: string) =>
  product.specs.some((s) => s.label === label)
const hasGroup = (product: MarketProduct, group: string) =>
  product.specs.some((s) => s.group === group)

/**
 * Department-specific facets. Curated on purpose: spec values in a real catalog are
 * free text, so a facet is a named predicate over specs. Departments without an entry
 * simply show the shared facets.
 */
export const SPEC_FACETS: Readonly<Record<string, readonly SpecFacet[]>> = {
  tecnologia: [
    {
      id: 'conexion',
      label: 'Conectividad',
      options: [
        { id: 'bluetooth', label: 'Bluetooth', test: (p) => anySpec(p, /bluetooth/i) },
        { id: 'usbc', label: 'USB-C', test: (p) => anySpec(p, /usb-c/i) },
      ],
    },
    {
      id: 'bateria',
      label: 'Batería',
      options: [{ id: 'con', label: 'Con batería propia', test: (p) => hasLabel(p, 'Autonomía') }],
    },
  ],
  hogar: [
    {
      id: 'energia',
      label: 'Alimentación',
      options: [{ id: 'electrico', label: 'Eléctrico', test: (p) => hasGroup(p, 'Energía') }],
    },
    {
      id: 'material',
      label: 'Material',
      options: [
        { id: 'natural', label: 'Natural', test: (p) => anySpec(p, /algod|roble|lino/i) },
        { id: 'metal', label: 'Metal', test: (p) => anySpec(p, /aluminio|acero/i) },
      ],
    },
  ],
  belleza: [
    {
      id: 'tipo',
      label: 'Tipo',
      options: [
        {
          id: 'piel',
          label: 'Cuidado de la piel',
          test: (p) => hasLabel(p, 'Tipo de piel') || hasLabel(p, 'Protección'),
        },
        { id: 'electro', label: 'Electrodoméstico', test: (p) => hasGroup(p, 'Energía') },
      ],
    },
  ],
}

export function specFacetsFor(departmentId: string | undefined): readonly SpecFacet[] {
  return (departmentId && SPEC_FACETS[departmentId]) || []
}

/** Facet options are grouped: OR within a facet, AND across facets. Ids are `facet.option`. */
export function matchesSpecSelection(
  product: MarketProduct,
  departmentId: string | undefined,
  selected: readonly string[],
): boolean {
  if (selected.length === 0) return true
  return specFacetsFor(departmentId).every((facet) => {
    const chosen = facet.options.filter((o) => selected.includes(`${facet.id}.${o.id}`))
    return chosen.length === 0 || chosen.some((o) => o.test(product))
  })
}
