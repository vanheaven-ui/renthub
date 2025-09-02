// backend/config/supabase.ts
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const supabaseUrl = getEnvVar("SUPABASE_URL");
const supabaseKey = getEnvVar("SUPABASE_SERVICE_ROLE_KEY");
export const supabaseBucket = getEnvVar("SUPABASE_BUCKET_NAME", "listings");

export const supabase = createClient(supabaseUrl, supabaseKey);
