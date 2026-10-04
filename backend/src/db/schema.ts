import { pgTable, text, timestamp, serial,
   jsonb, uuid, integer, check, uniqueIndex,
    boolean, date, 
    primaryKey,
    index} from "drizzle-orm/pg-core"

import { sql } from "drizzle-orm";

type ChatMessage = {
  id: string,
  role: "user" | "chat",
  content: string,
  context: string,
  timestamp?: string
}

type GeneratedResources = {
    hasNotes: boolean,
    hasQuiz: boolean,
    hasFlashcards: boolean,
    hasPodcast: boolean
}

export type ProjectCoverStatus =
  | "not_requested"
  | "pending"
  | "generating"
  | "ready"
  | "failed";


export type QuestionType = {
  id: string,
  text: string,
  options?: string[],
  type: "multipleChoice" | "true/false" | "shortAnswer",
  correctIndex?: number,
  correctAnswer?: boolean,
  explanation: string,
  hint: string,
  timeInSeconds: number
}

export type TopicType = {
    id: string;
    name: string;
    description: string;
    difficulty: string,
    accuracy?: string,
}

export type QuizSettings = {
  spacedRepetition: boolean;
  timeLimit: boolean;
  immediateFeedback: boolean;
};

interface UserAnswer {
  questionId: string,
  selectedOptionIndex: number,
  userAnswer?: string,
  isCorrect: boolean,
  suggestedAnswer?: string
}



export type QuizInstance = {
  id: string;             // np. crypto.randomUUID()
  createdAt: string;      // data w formacie ISO (new Date().toISOString())
  quizFormats: string[];  // np. ['mc', 'fb'] lub nazwy pełne
  topics: TopicType[];
  questions: QuestionType[];
  settings: QuizSettings;
  userAnswers: UserAnswer[];
  selectedTopics: TopicType[];
  finishTime: string
};


export type Flashcard = {
    id: string,
    front: string,
    back: string,
    state: "New" | "Learning" | "Mastered",
    points: number
}

export type FlashcardsSettings = {
    isTrackingProgress: boolean,
    settingsIsFlipOn: boolean,
    starredOnly: boolean,
    isAutoAudio: boolean,
    isRandomCardOn: boolean
}
export type FlashcardsSet = {
    id: string,
    flashcards: Flashcard[],
    tempFlashcards: Flashcard[],
    newFlashcards: Flashcard[],
    learningFlashcards: Flashcard[],
    masteredFlashcards: Flashcard[],
    favoritedFlashcards: Flashcard[],
    currentCardIndex: number,
    mistakesCount: number,
    correctAnswersCount: number,
    settings: FlashcardsSettings,
    createdAt: string,
    startTime: string,
    finishTime: string
};

export type OnboardingProfile = {
  goal: string;
  age: string;
  level: string;
  familiarity: string;
  subject: string;
  minutes: string;
  source: string;
  exam: string;
  streak: string;
};

export type GoogleOAuthResult = {
  userId?: string;
  firstName?: string;
  lastName?: string;
  errorCode?: string;
};

// Short-lived, browser-bound OAuth transactions. Profiles stay on our server.
export const googleOAuthTransactions = pgTable("google_oauth_transactions", {
  stateHash: text("state_hash").primaryKey(),
  browserSecretHash: text("browser_secret_hash").notNull(),
  mode: text("mode").$type<"sign_in" | "sign_up">().notNull(),
  status: text("status")
    .$type<"pending" | "processing" | "succeeded" | "failed">()
    .default("pending").notNull(),
  nonce: text("nonce"),
  codeVerifier: text("code_verifier"),
  profile: jsonb("profile").$type<OnboardingProfile>(),
  consentRequestId: text("consent_request_id"),
  result: jsonb("result").$type<GoogleOAuthResult>(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("google_oauth_transactions_expires_at_idx").on(table.expiresAt)]);


// Podcast types
export type Chapter = {
  id: string;
  title: string;
  description: string;
  start: number;
  end?: number;
  icon: string;
};

export type TranscriptWord = {
  id: string;
  text: string;
  start: number;
  end: number;
  charStart: number;
  charEnd: number;
};


export type Utterance = {
  id: string;
  speaker: string;
  speakerId?: string;
  start: number;
  end?: number;
  text: string;
  words?: TranscriptWord[];
};

export type ScenarioSpeaker = { 
  id: string;
  name: string; 
  description: string
};

export type Podcast = {
  id: string;
  title: string;
  description: string;
  duration: number;
  audioUrl?: string;
  waveform?: number[];
  chapters: Chapter[];
  transcript: Utterance[];
  speakers?: ScenarioSpeaker[];
};

// Tabela użytkowników
export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),

    username: text("username").notNull(),
    email: text("email").notNull().unique(),
    authProvider: text("auth_provider"),
    
    // Konto może używać hasła, Google albo obu metod po świadomym połączeniu.
    passwordHash: text("password_hash"),
    googleId: text("google_id").unique(),
    avatarUrl: text("avatar_url"),

    onboardingProfile: jsonb("onboarding_profile").$type<OnboardingProfile>(),

    onboardingCompletedAt: timestamp("onboarding_completed_at", {
      withTimezone: true,
    }),

    timezone: text("timezone").default("Europe/Warsaw").notNull(),    

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
    
    dailyStreak: integer("daily_streak").default(0).notNull(),
    maxStreak: integer("max_streak").default(0).notNull(),

    lastStreakDate: date("last_streak_date", {
      mode: "string"
    }),
 
    streakFreezes: integer("streak_freezes").default(0).notNull(),    

    keysLeft: integer("keys_left").default(0).notNull(),
    xp: integer("xp").default(0).notNull(), 
})


// zliczanie aktywności ich typy oraz średniej z wyniku quizu
export const activityCompletions = pgTable("activity_completions", {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),

    resourceId: text("resource_id"),

    // Chroni przed podwójnym zapisaniem tego samego ukończenia.
    attemptId: uuid("attempt_id").notNull(),

    activityType: text("activity_type")
      .$type<"notes" | "quiz" | "flashcards" | "podcast">()
      .notNull(),

    // Tylko dla quizów.
    correctAnswers: integer("correct_answers"),
    totalQuestions: integer("total_questions"),

    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
    
  },
  (table) => [
    uniqueIndex("activity_completions_user_attempt_unique").on(
      table.userId,
      table.attemptId,
    ),

    index("activity_completions_user_date_idx").on(
      table.userId,
      table.completedAt,
    ),
  ],
);





// Czas sesji użytkownika - każde ID ma swoje unikalne sesje które mają start i end
export const learningSessions = pgTable("learning_sessions" , {
  id: uuid("id").primaryKey().defaultRandom(),

  userId: uuid("userId")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade"
    }),

  projectId: uuid("project_id")
    .references(() => projects.id, {
      onDelete: "set null"
    }),

  // ID konkretnego quizu, zestawu fiszek lub podcastu. Zasoby są obecnie
  // przechowywane w JSONB projektu, dlatego nie jest to klucz obcy.
  resourceId: text("resource_id"),

  activityType: text("activity_type")
    .$type<| "notes" | "quiz"| "flashcards" | "podcast">()
    .notNull(),

  startedAt: timestamp("started_at", {
    withTimezone: true
  }).defaultNow().notNull(),

  lastHeartbeatAt: timestamp("last_heartbeat_at", {
    withTimezone: true
  }).defaultNow().notNull(),
  
  endedAt: timestamp("ended_at", {
    withTimezone: true
  }),

  endedReason: text("ended_reason")
    .$type<"completed" | "route_changed" | "tab_closed" | "context_changed" | "expired">(),

  activeSeconds: integer("active_seconds").default(0).notNull(),
  },
  (table) => [
    index("learning_sessions_user_started_idx")
      .on(table.userId, table.startedAt),
  ],
)











export const streakDays = pgTable("streak_days", {
  userId: uuid("user_id").notNull()
    .references(() => users.id, { onDelete: "cascade"}),
  
  activityDate: date("activity_date", {
    mode: "string"
  }).notNull(),

  completedAt: timestamp("completed_at", {
    withTimezone: true,
  }).defaultNow().notNull(),

 type: text("type")
  .$type<"activity" | "freeze">()
  .default("activity")
  .notNull(), 

  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.activityDate]
    })
  ]

)

// Tabela projektów
export const projects = pgTable("projects", {
    id: uuid("id").primaryKey().defaultRandom(),
    icon: text("icon").notNull(),
    title: text("title").notNull(),
    type: text("type").notNull(),

    
    resources: jsonb("resources").$type<GeneratedResources>().default({
        hasNotes: false,
        hasQuiz: false,
        hasFlashcards: false,
        hasPodcast: false
    }).notNull(),

    quizes: jsonb("quizes").$type<QuizInstance[]>().default([]),
    flashcardSets: jsonb("flashcardSets").$type<FlashcardsSet[]>().default([]),
    podcasts: jsonb("podcasts").$type<Podcast[]>().default([]),


    flashcardsMastered: integer("flashcards_mastered").default(0).notNull(),
    totalFlashcards: integer("total_flashcards").default(0).notNull(),

    editorContent: jsonb("editor_content").$type<Record<string, any>>().default({}),
    chatMessages: jsonb("chat_messages").default([]),
    userId: uuid("user_id").references(() => users.id).notNull(),
  
    // Obraz znajduje się w Supabase Storage. W bazie przechowujemy jedynie
    // prompt, stan generowania i klucz obiektu w buckecie.
    coverPrompt: text("cover_prompt"),
    coverImageStatus: text("cover_image_status")
      .$type<ProjectCoverStatus>()
      .default("not_requested")
      .notNull(),
    coverImageKey: text("cover_image_key"),
    coverImageMimeType: text("cover_image_mime_type"),
    coverImageErrorCode: text("cover_image_error_code"),
    coverImageAttempts: integer("cover_image_attempts").default(0).notNull(),
    coverImageRetryAfter: timestamp("cover_image_retry_after", {
      withTimezone: true,
    }),
    coverImageLeaseToken: uuid("cover_image_lease_token"),
    coverImageLeaseExpiresAt: timestamp("cover_image_lease_expires_at", {
      withTimezone: true,
    }),
    coverImageUpdatedAt: timestamp("cover_image_updated_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
    check(
      "projects_cover_image_status_check",
      sql`${t.coverImageStatus} in ('not_requested', 'pending', 'generating', 'ready', 'failed')`,
    ),
    check(
      "projects_cover_image_ready_check",
      sql`${t.coverImageStatus} <> 'ready' or ${t.coverImageKey} is not null`,
    ),
    check(
      "projects_cover_image_attempts_check",
      sql`${t.coverImageAttempts} >= 0`,
    ),
])


// katalog umiejętności
export const skillCatalog = pgTable("skill_catalog", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  category: text("category").notNull(),
});

export const projectSkills = pgTable(
  "project_skills",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, {
        onDelete: "cascade",
      }),

    skillKey: text("skill_key")
      .notNull()
      .references(() => skillCatalog.key),

    detectedAt: timestamp("detected_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.projectId, table.skillKey],
    }),

    index("project_skills_detected_idx").on(table.detectedAt),
  ],
);


// Tabela czatów
export const chats = pgTable("chats", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectID: uuid("project_id").references(() => projects.id, { onDelete: "cascade"}),
    title: text("title").notNull(),
    emoji: text("emoji").notNull(),
    messages: jsonb("messages").$type<ChatMessage[]>().default([]).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export const voiceSamples = pgTable("voice_samples", {
  id: uuid("id").primaryKey().defaultRandom(),
  cacheKey: text("cache_key").notNull(),
  provider: text("provider").notNull(),
  modelId: text("model_id").notNull(),
  voiceId: text("voice_id").notNull(),
  languageId: text("language_id").notNull(),
  status: text("status").$type<"pending" | "ready" | "failed">().notNull().default("pending"),
  storageKey: text("storage_key"), // Brak pliku podczas pending / failed.
  mimeType: text("mime_type").notNull().default("audio/wav"),
  leaseToken: uuid("lease_token"),
  leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
  retryAfter: timestamp("retry_after", { withTimezone: true }),
  attempts: integer("attempts").notNull().default(0),
  errorCode: text("error_code"), // Bez treści błędów Google, kluczy i signed URL-i.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("voice_samples_cache_key_unique").on(t.cacheKey),
  check("voice_samples_status_check", sql`${t.status} in ('pending', 'ready', 'failed')`),
  check("voice_samples_ready_check", sql`${t.status} <> 'ready' or ${t.storageKey} is not null`),
  check("voice_samples_attempts_check", sql`${t.attempts} >= 0`),
]);

export type VoiceSampleRow = typeof voiceSamples.$inferSelect;
