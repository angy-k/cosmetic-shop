/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Configure image domains if needed
  images: {
    domains: ['localhost'],
  },
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Enable experimental features if needed
  experimental: {
    // serverActions: true,
  },
  
  // Suppress hydration warnings in development
  reactStrictMode: true,
  
  // Handle development environment
  ...(process.env.NODE_ENV === 'development' && {
    // Development-specific configurations
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
  }),
};

export default nextConfig;
