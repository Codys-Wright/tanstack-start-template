import { defineVirtualSubtreeConfig, index, route } from '@tanstack/virtual-file-routes';

export default defineVirtualSubtreeConfig([
  // /example - Features list page
  index('home.tsx'),
  // /example/$featureId - Feature detail page
  route('$featureId', 'detail.tsx'),
  // /example/testing - Testing routes
  route('testing', 'testing.tsx', [
    // /example/testing - Testing index
    index('testing-index.tsx'),
    // /example/testing/testing1 - Nested testing route
    route('testing1', 'testing1.tsx'),
  ]),
]);
