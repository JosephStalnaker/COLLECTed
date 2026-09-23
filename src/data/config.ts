export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

// Takes the values as arguments because Expo only inlines EXPO_PUBLIC_* vars
// when they are read as literal `process.env.EXPO_PUBLIC_…` expressions.
export const parseSupabaseConfig = (
  url: string | undefined,
  publishableKey: string | undefined,
): SupabaseConfig => {
  const missing = [
    !url && "EXPO_PUBLIC_SUPABASE_URL",
    !publishableKey && "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ].filter(Boolean);

  if (missing.length > 0 || !url || !publishableKey) {
    throw new Error(
      `Missing Supabase config: ${missing.join(", ")}. Copy .env.example to .env.local and fill in the dev project values.`,
    );
  }

  return { url, publishableKey };
};
