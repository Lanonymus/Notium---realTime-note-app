import type { SupabaseClient } from "@supabase/supabase-js";

export interface SampleStorage {
  upload(key: string, audio: Buffer): Promise<void>;
  signedUrl(key: string): Promise<string | null>;
  remove(key: string): Promise<void>;
}

export const SIGNED_URL_SECONDS = 900;
export function sampleStorage(supabase: SupabaseClient, bucketName = "Notium_Media"): SampleStorage {
  const bucket = supabase.storage.from(bucketName);
  
  return {

    async upload(key, audio) {
      const { error } = await bucket.upload(key, audio, {
        contentType: "audio/wav", cacheControl: "86400", upsert: false,
      });
      if (error) throw new Error("Sample storage upload failed.");
    },

    async signedUrl(key) {
      const { data, error } = await bucket.createSignedUrl(key, SIGNED_URL_SECONDS);
      if (error) {
        // Supabase może zwrócić HTTP 400 z kodem NoSuchKey / not_found.
        const e = error as { statusCode?: string | number; code?: string };
        if (String(e.statusCode) === "404" || ["NoSuchKey", "not_found", "ObjectNotFound"].includes(e.code ?? "")) return null;
        throw new Error("Sample storage temporarily unavailable.");
      }
      if (!data?.signedUrl) throw new Error("Missing signed URL.");
      return data.signedUrl;
    },

    async remove(key) {
      const { error } = await bucket.remove([key]);
      if (error) throw new Error("Orphan sample cleanup failed.");
    },
  };
}
