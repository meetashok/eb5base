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
      // Legacy query tabs → pretty paths
      {
        source: '/nprm',
        has: [{ type: 'query', key: 'tab', value: 'themes' }],
        destination: '/nprm/themes',
        permanent: false,
      },
      {
        source: '/nprm',
        has: [{ type: 'query', key: 'tab', value: 'comments' }],
        destination: '/nprm/comments',
        permanent: false,
      },
      {
        source: '/nprm',
        has: [{ type: 'query', key: 'tab', value: 'write' }],
        destination: '/nprm/write',
        permanent: false,
      },
      {
        source: '/nprm',
        has: [{ type: 'query', key: 'tab', value: 'about' }],
        destination: '/nprm/about',
        permanent: false,
      },
      {
        source: '/nprm',
        has: [{ type: 'query', key: 'tab', value: 'overview' }],
        destination: '/nprm',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;