import { and, eq, sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { voiceSamples } from "../../db/schema.js"
import type { SampleDefinition } from "./sampleDefinition.js";

export type SampleDatabase = Pick<
  PgDatabase<any, any, any>,
  "insert" | "select" | "update"
>;


export function sampleRepository(db: SampleDatabase) {
  const owner = (id: string, token: string) =>
    and(
      eq(voiceSamples.id, id),
      eq(voiceSamples.status, "pending"),
      eq(voiceSamples.leaseToken, token),
      sql`${voiceSamples.leaseExpiresAt} > now()`,
    );
  return {

    async ensure(d: SampleDefinition) {
      await db
        .insert(voiceSamples)
        .values({
          cacheKey: d.cacheKey,
          provider: d.provider,
          modelId: d.modelId,
          voiceId: d.voiceId,
          languageId: d.languageId,
        })
        .onConflictDoNothing({ target: voiceSamples.cacheKey });
      const [row] = await db.select().from(voiceSamples).where(eq(voiceSamples.cacheKey, d.cacheKey));
      if (!row) throw new Error("Sample row disappeared.");

      return row;
    },

    async find(id: string) {
      
      const [row] = await db.select().from(voiceSamples).where(eq(voiceSamples.id, id));
      return row;
    },

    async claim(id: string, token: string) {
      // Jedno atomowe UPDATE. Bez trzymania transakcji przez czas wywołania ElevenLabs.
      const [row] = await db
        .update(voiceSamples)
        .set({
          status: "pending",
          leaseToken: token,
          leaseExpiresAt: sql`now() + interval '3 minutes'`,
          attempts: sql`${voiceSamples.attempts} + 1`,
          errorCode: null,
          retryAfter: null,
          updatedAt: sql`now()`,
        })
        .where(
          and(
            eq(voiceSamples.id, id),
            sql`${voiceSamples.attempts} < 3`,
            sql`(
        (${voiceSamples.status} = 'pending' and (${voiceSamples.leaseExpiresAt} is null or ${voiceSamples.leaseExpiresAt} <= now()))
        or (${voiceSamples.status} = 'failed' and ${voiceSamples.retryAfter} <= now())
      )`,
          ),
        )
        .returning();
      return row;
    },

    async exhaust(id: string) {
      await db
        .update(voiceSamples)
        .set({
          status: "failed",
          errorCode: "ATTEMPTS_EXHAUSTED",
          leaseToken: null,
          leaseExpiresAt: null,
          updatedAt: sql`now()`,
        })
        .where(
          and(
            eq(voiceSamples.id, id),
            eq(voiceSamples.status, "pending"),
            sql`${voiceSamples.attempts} >= 3`,
            sql`(${voiceSamples.leaseExpiresAt} is null or ${voiceSamples.leaseExpiresAt} <= now())`,
          ),
        );
    },

    async ready(id: string, token: string, key: string) {
      const rows = await db
        .update(voiceSamples)
        .set({
          status: "ready",
          storageKey: key,
          leaseToken: null,
          leaseExpiresAt: null,
          errorCode: null,
          retryAfter: null,
          updatedAt: sql`now()`,
        })
        .where(owner(id, token))
        .returning({ id: voiceSamples.id });
      return rows.length === 1;
    },

    async fail(id: string, token: string) {
      await db
        .update(voiceSamples)
        .set({
          status: "failed",
          errorCode: "GENERATION_FAILED",
          leaseToken: null,
          leaseExpiresAt: null,
          retryAfter: sql`now() + interval '30 seconds'`,
          updatedAt: sql`now()`,
        })
        .where(owner(id, token));
    },
    
    async missing(id: string, key: string) {
      // Tylko potwierdzony brak obiektu; awaria Storage nie kasuje poprawnego wpisu.
      await db
        .update(voiceSamples)
        .set({
          status: "pending",
          storageKey: null,
          attempts: 0,
          leaseToken: null,
          leaseExpiresAt: null,
          updatedAt: sql`now()`,
        })
        .where(and(eq(voiceSamples.id, id), eq(voiceSamples.status, "ready"), eq(voiceSamples.storageKey, key)));
    },
  };
}
