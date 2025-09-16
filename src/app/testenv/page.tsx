"use client";
export default function TestEnv() {
  console.log("SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("SUPABASE_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return (
    <div>
      <div>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</div>
      <div>KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 8)}...</div>
      <div>Cloudinary: {process.env.CLOUDINARY_CLOUD_NAME}</div>
    </div>
  );
}
