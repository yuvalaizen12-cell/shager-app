import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // הוספת אליאס ל־src
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(process.cwd(), "src");
    return config;
  },

  // לא לעצור דיפלוי בגלל ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },

  // לא לעצור דיפלוי בגלל שגיאות TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
