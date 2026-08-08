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
    ];
  },
};

export default nextConfig;
