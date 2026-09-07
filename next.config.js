/** @type {import('next').NextConfig} */
const nextConfig = {
  // Headers básicos de seguridad — sin CSP porque layout.tsx usa <script>
  // inline (tema + JSON-LD) sin nonce; una CSP estricta los bloquearía.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
