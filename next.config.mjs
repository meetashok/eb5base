/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/nrpm',
        destination: '/nprm',
        permanent: true,
      },
      {
        source: '/nrpm/:path*',
        destination: '/nprm/:path*',
        permanent: true,
      },
      {
        source: '/status-update',
        destination: '/status',
        permanent: true,
      },
      {
        source: '/case-tracker',
        destination: '/tracker',
        permanent: true,
      },
      {
        source: '/disclaimer',
        destination: '/about#disclaimer',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/maintenance',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/login',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/login/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/auth/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/((?!admin|maintenance|login|auth).*)',
        headers: [{ key: 'X-Robots-Tag', value: 'index, follow' }],
      },
    ];
  },
};

export default nextConfig;
