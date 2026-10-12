import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Il manque SUPABASE_URL ou SUPABASE_KEY dans le fichier .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);