import { parseSupabaseConfig } from "../src/data/config";

describe("parseSupabaseConfig", () => {
  it("returns the config when both values are set", () => {
    expect(
      parseSupabaseConfig("https://example.supabase.co", "sb_publishable_test"),
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_test",
    });
  });

  it("names every missing variable", () => {
    expect(() => parseSupabaseConfig(undefined, "")).toThrow(
      "EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  });
});

describe("supabase client", () => {
  it("builds a client from the env vars", () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    // React Native and browsers provide WebSocket; Node 20 (which runs Jest) doesn't.
    globalThis.WebSocket ??= class {} as unknown as typeof WebSocket;

    jest.isolateModules(() => {
      const { supabase } = require("../src/data/client");
      expect(typeof supabase.from).toBe("function");
      expect(typeof supabase.auth.signInWithPassword).toBe("function");
    });
  });
});
