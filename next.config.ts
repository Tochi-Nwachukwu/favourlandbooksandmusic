import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      { pathname: '/images/**' },
    ],
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
  },
  // Keep links from Google and old bookmarks to the WordPress site working
  async redirects() {
    return [
      { source: '/product-category/:slug/:rest*', destination: '/shop?category=:slug', permanent: true },
      { source: '/online-store-books', destination: '/shop?category=books', permanent: true },
      { source: '/online-store-ebooks', destination: '/shop?category=ebooks', permanent: true },
      { source: '/online-store-songs', destination: '/shop?category=songs', permanent: true },
      { source: '/online-store-souvenirs', destination: '/shop?category=souvenirs', permanent: true },
      { source: '/my-account/:rest*', destination: '/shop', permanent: false },
      { source: '/blog', destination: '/', permanent: false },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
