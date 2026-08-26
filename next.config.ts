import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Supabase Storage 프로젝트 URL은 배포 환경마다 다르므로 와일드카드로 허용.
    // 서명 URL만 발급하므로 접근 자체는 여전히 Storage RLS/버킷 정책이 막는다.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
