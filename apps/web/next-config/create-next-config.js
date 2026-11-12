const path = require('path');
const { headers } = require('./headers');
const { images } = require('./images');
const { outputFileTracingExcludes, serverExternalPackages } = require('./tracing');
const { createWebpackConfig } = require('./webpack-config');

function createNextConfig(appDir) {
  // TS_STRICT_BUILD=true enforces type-check and ESLint at build time.
  // Default is false during the migration window; flip to true once
  // all type-check:* slices pass cleanly in CI (see docs/tech-debt/td-001-resolution.md).
  const strictBuild = process.env.TS_STRICT_BUILD === 'true';
  return {
    poweredByHeader: false,
    productionBrowserSourceMaps: false,
    typescript: {
      ignoreBuildErrors: !strictBuild,
    },
    eslint: {
      ignoreDuringBuilds: !strictBuild,
    },
    transpilePackages: ['@aprende-y-aplica/shared', '@aprende-y-aplica/ui'],
    outputFileTracingRoot: path.resolve(appDir, '../../'),
    experimental: {
      externalDir: true,
      // Transforma imports de barril en imports directos -> menos JS por ruta y
      // mejor tree-shaking. Cubre framer-motion, recharts, headlessui, todos los
      // radix-ui usados en el proyecto y tremor (además de los defaults de Next:
      // lucide-react, heroicons, date-fns). recharts emite un warning propio
      // (selectPolarChartLayout) preexistente y no relacionado con esta opción.
      optimizePackageImports: [
        'lucide-react',
        'framer-motion',
        'recharts',
        '@headlessui/react',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-popover',
        '@radix-ui/react-select',
        '@radix-ui/react-tabs',
        '@radix-ui/react-tooltip',
        '@radix-ui/react-accordion',
        '@radix-ui/react-checkbox',
        '@radix-ui/react-switch',
        '@radix-ui/react-avatar',
        '@radix-ui/react-label',
        '@radix-ui/react-separator',
        '@radix-ui/react-progress',
        '@radix-ui/react-scroll-area',
        '@radix-ui/react-slot',
        '@radix-ui/react-toast',
        '@tremor/react',
      ],
    },
    outputFileTracingExcludes,
    serverExternalPackages,
    images,
    env: {
      NEXT_PUBLIC_APP_NAME: 'SofLIA Academy',
      NEXT_PUBLIC_APP_VERSION: '1.0.0',
    },
    headers,
    webpack: createWebpackConfig(appDir),
  };
}

module.exports = { createNextConfig };
