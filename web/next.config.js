/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static file serving from public folder
  staticPageGenerationTimeout: 120,

  // Configure static file headers for proper MIME type
  async headers() {
    return [
      {
        source: "/downloads/:path*",
        headers: [
          {
            key: "Content-Disposition",
            value: "attachment; filename*=UTF-8''wamdh.apk",
          },
          {
            key: "Content-Type",
            value: "application/vnd.android.package-archive",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
