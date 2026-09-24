import { createClient } from "@supabase/supabase-js";
import { parseSupabaseConfig } from "./config";

const { url, publishableKey } = parseSupabaseConfig(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

// Native gets globalThis.localStorage from `expo-sqlite/localStorage/install`,
// imported at the app entry; web uses the browser's own. Keep this file free of
// react-native imports so a web client can reuse the data layer.
export const supabase = createClient(url, publishableKey, {
  auth: {
    storage: globalThis.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
