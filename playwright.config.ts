import { defineConfig, devices } from '@playwright/test'

/**
 * Minimal smoke-test config: one happy-path flow per experience, run locally with
 * `npm run test:e2e` (add `-- --headed` / `-- --ui` to watch it). Not wired into CI.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Serves the production build: closer to reality than the dev server, and fast to boot.
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
