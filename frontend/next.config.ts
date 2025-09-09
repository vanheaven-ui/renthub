import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aujlnnzdadcbyiwqnogk.supabase.co",
        pathname: "/storage/**", 
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com", 
      },
    ],
  },
};

export default nextConfig;
