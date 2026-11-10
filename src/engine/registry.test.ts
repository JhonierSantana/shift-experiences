import { experiencePath, isExperienceId, listExperiences, loadExperience } from './registry'

describe('experience registry', () => {
  it('only accepts registered ids', () => {
    expect(isExperienceId('food')).toBe(true)
    expect(isExperienceId('selector')).toBe(false)
    expect(isExperienceId('toString')).toBe(false)
    expect(isExperienceId(undefined)).toBe(false)
  })

  it('lists the eager manifests without loading definitions', () => {
    expect(listExperiences().map((m) => m.id)).toEqual(['fashion', 'food', 'market'])
  })

  it('loads each definition once and matches its id', async () => {
    const first = loadExperience('market')
    expect(loadExperience('market')).toBe(first)
    const definition = await first
    expect(definition.id).toBe('market')
    expect(definition.brand.name).toBe('Plaza')
  })

  it('maps scopes to paths', () => {
    expect(experiencePath('selector')).toBe('/')
    expect(experiencePath('fashion')).toBe('/fashion')
  })
})
