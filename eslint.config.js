import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'

// Architectural boundaries (see plan §8). Regexes match both alias and relative specifiers.
const experienceIds = ['selector', 'fashion', 'food', 'market']

// Features already organised as components/ hooks/ model/ pages/ (+ tests/) with an index.ts barrel each.
// Inside them, sibling folders are reached through the barrel, never through a deep path.
const structuredFeatures = ['selector']

const importsFeatures = {
  regex: '(^@/features(/|$))|(^(\\.\\.?/)+(.*/)?features(/|$))',
  message: 'Only src/engine/registry.ts (and src/app) may import features.',
}
const importsApp = {
  regex: '(^@/app(/|$))|(^(\\.\\./)+app(/|$))',
  message: 'Nothing depends on the app bootstrap layer.',
}
const importsEngine = {
  regex: '(^@/engine(/|$))|(^(\\.\\./)+engine(/|$))',
  message:
    'core, infra and design-system are experience-agnostic and must not depend on the engine.',
}
const importsInfra = {
  regex: '(^@/infra(/|$))|(^(\\.\\./)+infra(/|$))',
  message: 'core defines contracts; implementations in infra depend on core, never the reverse.',
}
// Layers are consumed through their entry points: @/core/{domain,repositories,cart}, @/infra/{mock,query}.
const deepLayerImports = {
  regex: '^@/(core|infra)/[^/]+/.+',
  message: 'Import core/infra through their entry points (e.g. @/core/domain, @/infra/query).',
}

const siblingBarrels = {
  regex: '^(\\.\\./)+(components|hooks|model|services|store|pages)/.+',
  message: "Import sibling folders through their index.ts barrel (e.g. '../model').",
}
// The app reaches a feature only through its barrel (@/features/<id>).
const deepFeatureImports = {
  regex: '^@/features/[^/]+/.+',
  message: "Import a feature through its barrel: '@/features/<id>'.",
}

function experienceBoundary(id) {
  const others = experienceIds.filter((other) => other !== id).join('|')
  return {
    files: [`src/features/${id}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: `(^@/features/(${others})(/|$))|(^(\\.\\./)+(${others})(/|$))`,
              message: `Experience "${id}" must not import another experience. Share via core/design-system/engine.`,
            },
            {
              regex: '^@/engine/.+',
              message: "Import the engine's public API from '@/engine'.",
            },
            importsApp,
            deepLayerImports,
            ...(structuredFeatures.includes(id) ? [siblingBarrels] : []),
          ],
        },
      ],
    },
  }
}

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['src/core/**/*.{ts,tsx}', 'src/design-system/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [importsFeatures, importsApp, importsEngine, importsInfra] },
      ],
    },
  },
  {
    // infra implements core contracts; it may import @/core/* but nothing above it.
    files: ['src/infra/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [importsFeatures, importsApp, importsEngine] },
      ],
    },
  },
  {
    files: ['src/engine/**/*.{ts,tsx}'],
    ignores: ['src/engine/registry.ts', 'src/engine/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [importsFeatures, importsApp, deepLayerImports] },
      ],
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [deepLayerImports, deepFeatureImports] }],
    },
  },
  ...experienceIds.map(experienceBoundary),
  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
)
