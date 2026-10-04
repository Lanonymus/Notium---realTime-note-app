import { eq } from "drizzle-orm";
import { db } from "../../db/db.js";
import { users } from "../../db/schema.js";

type GoogleUserInput = {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  profile?: unknown;
  consentRequestId?: string;
};

export class AccountLinkRequiredError extends Error {
  constructor() {
    super("An account with this email already exists.");
  }
}

export async function findOrCreateGoogleUser(
  input: GoogleUserInput,
) {
  const email = input.email.trim().toLowerCase();

  return db.transaction(async (tx) => {

    const [existingGoogleUser] = await tx
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
      })
      .from(users)
      .where(eq(users.googleId, input.googleId))
      .limit(1);

    if (existingGoogleUser) {
      return existingGoogleUser;
    }

    const [existingEmailUser] = await tx
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Nie podpinaj automatycznie Google do istniejącego konta hasłowego.
    // Użytkownik powinien najpierw zalogować się hasłem i potwierdzić połączenie.
    if (existingEmailUser) {
      throw new AccountLinkRequiredError();
    }

    const username =
      [input.firstName, input.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || email.split("@")[0];

    

    const [createdUser] = await tx
      .insert(users)
      .values({
        email,
        username,
        googleId: input.googleId,
        avatarUrl: input.avatarUrl,
        authProvider: "google",
        passwordHash: null,
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
      });

    if (!createdUser) {
      throw new Error("Google user could not be created.");
    }

    /*
      Tutaj zapisz input.profile w swojej tabeli profilu/statystyk.

      Przed zapisem:
      - zweryfikuj wiek,
      - zweryfikuj consentRequestId,
      - nie ufaj bezpośrednio danym z frontendu.
    */

    return createdUser;
  });
}