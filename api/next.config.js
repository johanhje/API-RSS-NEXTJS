/**
 * Next.js configuration
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use serverExternalPackages for better-sqlite3
  serverExternalPackages: ['better-sqlite3'],
  // Disable static generation for API routes
  output: 'standalone',
  // Configure headers for CORS
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  // Only include node-fetch in transpilePackages to avoid conflicts
  // We don't want to transpile better-sqlite3 as it conflicts with serverExternalPackages
  transpilePackages: [],
  // Custom webpack configuration for native modules
  webpack: (config, { isServer }) => {
    // If on the server side, add externals for native modules
    if (isServer) {
      // Make sure better-sqlite3 is properly externalized
      const existingExternals = config.externals || [];
      
      // Handle both array externals and function externals
      if (Array.isArray(existingExternals)) {
        // Check if better-sqlite3 is already in the externals, add it if not
        if (!existingExternals.includes('better-sqlite3')) {
          config.externals = [...existingExternals, 'better-sqlite3'];
        }
      } else if (typeof existingExternals === 'function') {
        // Wrap the existing externals function
        const originalExternals = existingExternals;
        config.externals = (ctx, req, cb) => {
          if (req === 'better-sqlite3') {
            return cb(null, 'commonjs better-sqlite3');
          }
          return originalExternals(ctx, req, cb);
        };
      } else {
        config.externals = ['better-sqlite3'];
      }
    }
    return config;
  }
};

export default nextConfig; 