export type PodcastVoice = {
  voiceId: string;
  name: string;
  /** ID z ElevenLabs; id pozostaje stabilnym kluczem postaci Notium. */
  providerVoiceId?: string;
  description: string;
  avatarUrl?: string;
  /** Osobny URL próbki dla danego języka; brak URL wyłącza odsłuch. */
  sampleUrls?: Record<string, string>;
  defaultVoiceLine: string;
};

/**
 * id = stabilny klucz postaci Notium (historyczne nazwy Gemini).
 * providerVoiceId = rzeczywiste ID ElevenLabs z mapowania poniżej.
 * name = nazwa postaci w Notium. Opisy to nasza propozycja osobowości,
 * nie oficjalne gwarancje brzmienia ani deklaracje płci/wieku.
 * Celowo nie dodajemy fikcyjnych URL-i avatarów i próbek.
 */

// maya
// cPVuhpOYUJYFLr3qTrKc
export const VOICE_CATALOG: PodcastVoice[] = [
  {
    voiceId: "Nhs7eitvQWFTQBsf0yiT",
    name: "Maya",
    avatarUrl: "/voiceImages/Maya.webp",
    description:
      "A warm, curious guide who makes learning feel like a friendly conversation. Encouraging explanations, relatable examples and a subtle smile in the delivery.",
    defaultVoiceLine:
      "[chuckles] Hi, I'm Maya. You can ask me the same question twice. Or five times, honestly. [playfully] I might find five different ways to explain it. [warmly] Take your time. We'll find the one that clicks. [curious] Now... what's been puzzling you?",
  },
  {
    voiceId: "Aa6nEBJJMKJwJkCx8VU2",
    name: "Theo",
    avatarUrl: "/voiceImages/Theo.png",
    description:
      "A low-toned, informative narrator for science, research and documentary-style lessons. Measured delivery and careful emphasis give each explanation a clear shape.",
    defaultVoiceLine:
      "[thoughtfully] I'm Theo. Somewhere out there... a star is being born. Light begins a journey that could last millions of years. [dryly] Meanwhile, you're deciding whether you like my voice. [chuckles] Fair enough. [curious] Shall we take a closer look at something extraordinary?",
  },
  {
    voiceId: "Bn9xWp6PwkrqKRbq8cX2",
    name: "Nina",
    avatarUrl: "/voiceImages/Nina.webp",
    description:
      "A smooth, composed narrator for flowing explanations and audiobook-style learning. Gently connects ideas without abrupt shifts in energy.",
    defaultVoiceLine:
      "[warmly] Hi, I'm Nina. I've found a story you might like. It begins with a tiny door... and a rather suspicious key. [excited] And behind it there's a— [hesitates] oh! Almost spoiled it. [giggles] I do that when I get excited. [gently] Let's start at the beginning, shall we?",
  },
  {
    voiceId: "UGTtbzgh3HObxRjWaSpr",
    name: "Leo",
    avatarUrl: "/voiceImages/Leo.webp",
    description:
      "A smooth, low-toned storyteller for immersive lessons and reflective conversations. Unhurried delivery that gives important ideas room to settle.",
    defaultVoiceLine:
      "[serious] I'm Leo. A door opens. Someone hesitates... and everything changes. [pause] [dryly] All right. Perhaps we're only opening your notes. [chuckles] I may have made that a little dramatic. [warmly] Still, every good story starts somewhere. Let's find the detail that makes this one worth listening to.",
  },
  {
    voiceId: "ogdhdKeR3Z4pdAMiYkpf",
    name: "Morgan",
    avatarUrl: "/voiceImages/Morgan.webp",
    description:
      "A mature, reflective mentor for thoughtful discussions and big-picture understanding. Measured phrasing brings a sense of perspective to each lesson.",
    defaultVoiceLine:
      "[thoughtfully] I'm Morgan. A missing detail. An unreliable narrator. Three people who remember the same event quite differently... [dryly] Yes, it could be a historical mystery. Or the family group chat. [chuckles] [composed] Let's take our time, examine the evidence, and work out what actually happened.",
  },
  {
    voiceId: "tQbs4WJdeIOdank6mubQ",
    name: "Rowan",
    avatarUrl: "/voiceImages/Rowan.webp",
    description:
      "A low, textured narrator with the character of a seasoned storyteller. A compelling fit for history and mysteries, delivered gently rather than dramatically.",
    defaultVoiceLine:
      "[chuckles] Hey, I'm Rowan. Get comfortable. That subject you've been avoiding? [confidently] We can handle it. And if we get stuck, I'll just pause thoughtfully... [pause] [playfully] See? Sounds like I've figured something out already. [relaxed] Come on. Let's make the first bit simple.",
  },
  {
    voiceId: "IKuPqyuiEnnZFcU4OVzH",
    name: "Chloe",
    avatarUrl: "/voiceImages/Chloe.webp",
    description:
      "A breezy, relaxed host who makes complex subjects feel less intimidating. Everyday analogies and an easy conversational rhythm suit learning on the go.",
    defaultVoiceLine:
      "[warmly] Hi, I'm Chloe. I read something yesterday that I immediately wanted to tell someone about. [animated] So I opened another article, then another, and— [chuckles] there went my evening. [relaxed] But I found a lovely explanation. [curious] Do you ever start with ONE question and somehow end up with six?",
  },
  {
    voiceId: "sf84yoGLtVF8PFioFOTo",
    name: "Zoe",
    avatarUrl: "/voiceImages/Zoe.png",
    description:
      "A light-toned, upbeat guide for fresh starts and quick learning sessions. A cheerful sense of discovery, with restrained energy and gentle emphasis.",
    defaultVoiceLine:
      "[upbeat] Hi, I'm Zoe. I love a good theory. [serious] But I WILL ask for evidence. [quickly] Even if it's exciting, beautifully presented, and involves suspiciously intelligent pigeons. [pause] [dryly] Especially the pigeons. [chuckles] [friendly] Right, let's give your question a fair hearing. What are we investigating?",
  },
  {
    voiceId: "keVdKhqmSInYxwD98sI8",
    name: "Charlie",
    avatarUrl: "/voiceImages/Charlie.webp",
    description:
      "A casual, grounded co-host for everyday explanations and practical learning. Friendly phrasing and understated humour create an approachable conversation.",
    defaultVoiceLine:
      "[chuckles] Hey, I'm Charlie. Prepare to be thoroughly confu— [hesitates] informed. INFORMED. [laughs] Great start. [playfully] I had a clever introduction, but apparently my brain closed that tab. [warmly] Anyway, tell me what you're curious about. We'll talk it through, one slightly less embarrassing sentence at a time.",
  },
];

export const EXAMPLE_VOICES: PodcastVoice[] = VOICE_CATALOG
  .map(voice => ({ ...voice, providerVoiceId: voice.voiceId}))
  .filter(voice => Boolean(voice.providerVoiceId));

// Oddzielone od typu PodcastVoice: metadane UI nie są automatycznie promptem TTS.
export const VOICE_TAGS: Record<string, readonly string[]> = {
  Nhs7eitvQWFTQBsf0yiT: ["Warm", "Curious", "Encouraging"],
  Aa6nEBJJMKJwJkCx8VU2: ["Informative", "Low-toned", "Science"],
  Bn9xWp6PwkrqKRbq8cX2: ["Smooth", "Composed", "Narration"],
  UGTtbzgh3HObxRjWaSpr: ["Smooth", "Low-toned", "Storytelling"],
  ogdhdKeR3Z4pdAMiYkpf: ["Mature", "Reflective", "Big picture"],
  tQbs4WJdeIOdank6mubQ: ["Textured", "Low-toned", "Storytelling"],
  IKuPqyuiEnnZFcU4OVzH: ["Breezy", "Relaxed", "Approachable"],
  sf84yoGLtVF8PFioFOTo: ["Upbeat", "Light-toned", "Encouraging"],
  keVdKhqmSInYxwD98sI8: ["Casual", "Grounded", "Practical"],
};

/** Legacy: instrukcje scenariusza / poprzedniej integracji.
 * ElevenLabs Flash nie przyjmuje tego promptu; nie dopisuj go do czytanego tekstu. */
export const NOTIUM_DELIVERY_STYLE =
  "Comfortable study audio: clear articulation, moderate pace, gentle emphasis, " +
  "natural pauses and subtle vocal warmth. No shouting, squealing, exaggerated " +
  "excitement, forced whispering or added bodily sounds. Read only the script.";

// Krótkie instrukcje do TTS, zamiast wysyłać rozbudowany opis marketingowy.
export const VOICE_DIRECTIONS: Record<string, string> = {
  Nhs7eitvQWFTQBsf0yiT: "Warm and curious, with a subtle smile in the voice.",
  Aa6nEBJJMKJwJkCx8VU2: "Measured documentary narration with careful emphasis.",
  Bn9xWp6PwkrqKRbq8cX2: "Smooth, composed phrasing and gentle transitions.",
  UGTtbzgh3HObxRjWaSpr: "Smooth, reflective storytelling with unhurried phrasing.",
  ogdhdKeR3Z4pdAMiYkpf: "Reflective mentor with measured, thoughtful phrasing.",
  tQbs4WJdeIOdank6mubQ: "Gentle storytelling; do not exaggerate the gravelly texture.",
  IKuPqyuiEnnZFcU4OVzH: "Relaxed and breezy, with clear sentence endings.",
  sf84yoGLtVF8PFioFOTo: "Gently upbeat; avoid squealing or exaggerated excitement.",
  keVdKhqmSInYxwD98sI8: "Casual and friendly, with clear diction and understated humour.",
};

/**
 * Działa z 1 lub 2 mówcami. speaker.name musi odpowiadać nazwie w turns.
 * Wynik mieści się w limicie 500 znaków pola style w przesłanym backendzie.
 */
export function buildNotiumStyle(
  speakers: readonly { name: string; voiceName: string }[],
): string {
  if (speakers.length < 1 || speakers.length > 2) {
    throw new Error("Choose one or two speakers.");
  }
  const directions = speakers.map(s => {
    const direction = VOICE_DIRECTIONS[s.voiceName];
    if (!direction) throw new Error(`Unknown voice: ${s.voiceName}`);
    if (!s.name.trim() || s.name.length > 40) throw new Error("Invalid speaker name.");
    return `${s.name}: ${direction}`;
  });
  const style = [NOTIUM_DELIVERY_STYLE, ...directions].join("\n");
  if (style.length > 500) throw new Error("Delivery instructions exceed the backend limit.");
  return style;
}
