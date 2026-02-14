/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
      allowedOrigins: ['localhost:3000', 'localhost:3001'],
    },
    // Next.js 16+ 使用 proxyClientMaxBodySize 替代 middlewareClientMaxBodySize
    proxyClientMaxBodySize: '500mb',
  },
  // 配置外部包,避免被打包
  serverExternalPackages: ['@cloudbase/node-sdk'],
}

export default nextConfig
