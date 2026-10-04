export type VoiceSampleResponse =
  | { status: "ready"; id: string; url: string; expiresIn: number }
  | { status: "pending"; id: string; retryAfterMs: number }
  | { status: "failed"; id?: string; message: string };
