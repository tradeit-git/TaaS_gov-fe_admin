import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    basePath: process.env.NEXT_PUBLIC_BASE_PATH,
    async rewrites() {
        return [
            {
                source: `/api/:path*`,
                destination: `${process.env.NEXT_PUBLIC_BACK_URL}/api/:path*`, // Spring 서버 주소
            },
        ]
    },
    images: {
        remotePatterns: [
            {
                protocol: undefined,
                hostname: '**',
            },
        ],
    },

    // 빌드 시 타입 체크 제외 여부
    typescript: {
        ignoreBuildErrors: true,
    },
    // 빌드 시 ESLint 제외 여부
    eslint: {
        ignoreDuringBuilds: true,
    },

};

export default nextConfig;
