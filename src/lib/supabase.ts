import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ghmakdfajutcosscobye.supabase.co";
const supabaseAnonKey = "sb_publishable_xq6h-bLigksEgXXxbzYjkQ_VHfhhG9w";

export const supabase = createClient(
  supabaseUrl.trim(),
  supabaseAnonKey.trim()
);