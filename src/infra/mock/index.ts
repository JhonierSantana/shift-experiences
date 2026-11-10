// Mock implementations of the core repository contracts. Swapping to REST means
// adding src/infra/rest with the same factories' return types; UI is untouched.
export { MockBackend, defaultBackendOptions, type MockBackendOptions } from './backend'
export {
  DEFAULT_PAGE_SIZE,
  createMockProductRepository,
  normalizeText,
  type MockCatalog,
  type MockProductRepositoryOptions,
} from './products'
export { createMockOrderRepository, type MockOrderRepositoryOptions } from './orders'
export { createMockLookRepository, createMockReviewRepository } from './content'
export { placeholderMedia } from './media'
export { showcaseMedia } from './showcase'
