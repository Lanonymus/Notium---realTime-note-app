/** ElevenLabs Flash v2.5: 32 languages, verified 2026-09-15.
 * https://elevenlabs.io/docs/overview/models#flash-v25
 * Flags are UI illustrations, not accent controls. Translations retained from
 * the supplied file; AI-authored drafts, not native-speaker reviewed.
 */
export type PodcastLanguage = { id: string; label: string; flag: string };
export const SAMPLE_MODEL_ID = "eleven_v3_conversational";
export const SAMPLE_VERSION = "memory-elevenlabs-v1";
/** Legacy metadata only; NOT passed as spoken text or a prompt to ElevenLabs. */
export const SAMPLE_STYLE = "Clear, comfortable conversational study audio.";
export const EXAMPLE_LANGUAGES = [
  {
    "id": "en",
    "label": "English",
    "flag": "us"
  },
  {
    "id": "sv",
    "label": "Svenska",
    "flag": "se"
  },
  {
    "id": "no",
    "label": "Norsk",
    "flag": "no"
  },
  {
    "id": "da",
    "label": "Dansk",
    "flag": "dk"
  },
  {
    "id": "fi",
    "label": "Suomi",
    "flag": "fi"
  },
  {
    "id": "de",
    "label": "Deutsch",
    "flag": "de"
  },
  {
    "id": "es",
    "label": "Español",
    "flag": "es"
  },
  {
    "id": "fr",
    "label": "Français",
    "flag": "fr"
  },
  {
    "id": "it",
    "label": "Italiano",
    "flag": "it"
  },
  {
    "id": "pl",
    "label": "Polski",
    "flag": "pl"
  },
  {
    "id": "ar",
    "label": "العربية",
    "flag": "sa"
  },
  {
    "id": "nl",
    "label": "Nederlands",
    "flag": "nl"
  },
  {
    "id": "hi",
    "label": "हिन्दी",
    "flag": "in"
  },
  {
    "id": "id",
    "label": "Bahasa Indonesia",
    "flag": "id"
  },
  {
    "id": "ja",
    "label": "日本語",
    "flag": "jp"
  },
  {
    "id": "ko",
    "label": "한국어",
    "flag": "kr"
  },
  {
    "id": "pt",
    "label": "Português",
    "flag": "pt"
  },
  {
    "id": "ro",
    "label": "Română",
    "flag": "ro"
  },
  {
    "id": "ru",
    "label": "Русский",
    "flag": "ru"
  },
  {
    "id": "ta",
    "label": "தமிழ்",
    "flag": "in"
  },
  {
    "id": "tr",
    "label": "Türkçe",
    "flag": "tr"
  },
  {
    "id": "uk",
    "label": "Українська",
    "flag": "ua"
  },
  {
    "id": "vi",
    "label": "Tiếng Việt",
    "flag": "vn"
  },
  {
    "id": "bg",
    "label": "Български",
    "flag": "bg"
  },
  {
    "id": "zh",
    "label": "中文（普通话）",
    "flag": "cn"
  },
  {
    "id": "hr",
    "label": "Hrvatski",
    "flag": "hr"
  },
  {
    "id": "cs",
    "label": "Čeština",
    "flag": "cz"
  },
  {
    "id": "fil",
    "label": "Filipino",
    "flag": "ph"
  },
  {
    "id": "el",
    "label": "Ελληνικά",
    "flag": "gr"
  },
  {
    "id": "hu",
    "label": "Magyar",
    "flag": "hu"
  },
  {
    "id": "ms",
    "label": "Bahasa Melayu",
    "flag": "my"
  },
  {
    "id": "sk",
    "label": "Slovenčina",
    "flag": "sk"
  }
] as const satisfies readonly PodcastLanguage[];
export type LanguageId = (typeof EXAMPLE_LANGUAGES)[number]["id"];

  // "en": "Why do we remember some things and forget others? Let's explore a simple example together, one step at a time.",

export const SAMPLE_TEXTS: Record<LanguageId, string> = {
  "en": "Why do we remember some things and forget others? Let's explore a simple example together, one step at a time.",
  "sv": "Varför minns vi vissa saker och glömmer andra? Låt oss utforska ett enkelt exempel tillsammans, steg för steg.",
  "no": "Hvorfor husker vi noen ting og glemmer andre? La oss utforske et enkelt eksempel sammen, steg for steg.",
  "da": "Hvorfor husker vi nogle ting og glemmer andre? Lad os udforske et enkelt eksempel sammen, trin for trin.",
  "fi": "Miksi muistamme joitakin asioita ja unohdamme toisia? Tutkitaan yhdessä yksinkertaista esimerkkiä, askel kerrallaan.",
  "de": "Warum erinnern wir uns an manche Dinge und vergessen andere? Schauen wir uns gemeinsam ein einfaches Beispiel an, Schritt für Schritt.",
  "es": "¿Por qué recordamos algunas cosas y olvidamos otras? Exploremos juntos un ejemplo sencillo, paso a paso.",
  "fr": "Pourquoi nous souvenons-nous de certaines choses et en oublions-nous d'autres ? Explorons ensemble un exemple simple, étape par étape.",
  "it": "Perché ricordiamo alcune cose e ne dimentichiamo altre? Esploriamo insieme un esempio semplice, un passo alla volta.",
  "pl": "Dlaczego pewne rzeczy pamiętamy, a inne zapominamy? Przyjrzyjmy się wspólnie prostemu przykładowi, krok po kroku.",
  "ar": "لماذا نتذكر بعض الأشياء وننسى أشياء أخرى؟ لنستكشف معًا مثالًا بسيطًا، خطوة بخطوة.",
  "nl": "Waarom onthouden we sommige dingen en vergeten we andere? Laten we samen een eenvoudig voorbeeld bekijken, stap voor stap.",
  "hi": "हम कुछ बातें याद रखते हैं और दूसरी बातें भूल क्यों जाते हैं? आइए, साथ मिलकर एक आसान उदाहरण को चरण दर चरण समझें।",
  "id": "Mengapa kita mengingat beberapa hal dan melupakan yang lain? Mari kita pelajari contoh sederhana bersama, selangkah demi selangkah.",
  "ja": "覚えていることもあれば、忘れてしまうこともあるのはなぜでしょうか。簡単な例を使って、一緒に一歩ずつ考えてみましょう。",
  "ko": "왜 어떤 것은 기억하고 다른 것은 잊어버릴까요? 간단한 예를 통해 함께 하나씩 살펴봅시다.",
  "pt": "Por que nos lembramos de algumas coisas e esquecemos outras? Vamos explorar juntos um exemplo simples, passo a passo.",
  "ro": "De ce ne amintim unele lucruri și le uităm pe altele? Să explorăm împreună un exemplu simplu, pas cu pas.",
  "ru": "Почему одни вещи мы помним, а другие забываем? Давайте вместе разберём простой пример, шаг за шагом.",
  "ta": "சில விஷயங்களை நினைவில் வைத்துக்கொண்டு மற்றவற்றை ஏன் மறந்துவிடுகிறோம்? ஒரு எளிய உதாரணத்தை ஒன்றாகப் படிப்படியாக ஆராய்வோம்.",
  "tr": "Neden bazı şeyleri hatırlayıp diğerlerini unuturuz? Basit bir örneği birlikte, adım adım inceleyelim.",
  "uk": "Чому одні речі ми пам’ятаємо, а інші забуваємо? Розгляньмо разом простий приклад, крок за кроком.",
  "vi": "Tại sao chúng ta nhớ một số điều nhưng lại quên những điều khác? Hãy cùng tìm hiểu một ví dụ đơn giản, từng bước một.",
  "bg": "Защо помним някои неща, а забравяме други? Нека заедно разгледаме един прост пример, стъпка по стъпка.",
  "zh": "为什么有些事情我们记得，有些却忘了？让我们一起通过一个简单的例子，一步一步来了解。",
  "hr": "Zašto neke stvari pamtimo, a druge zaboravljamo? Istražimo zajedno jednostavan primjer, korak po korak.",
  "cs": "Proč si některé věci pamatujeme a jiné zapomínáme? Podívejme se společně na jednoduchý příklad, krok za krokem.",
  "fil": "Bakit natin naaalala ang ilang bagay at nakakalimutan ang iba? Sama-sama nating suriin ang isang simpleng halimbawa, hakbang-hakbang.",
  "el": "Γιατί θυμόμαστε κάποια πράγματα και ξεχνάμε άλλα; Ας εξετάσουμε μαζί ένα απλό παράδειγμα, βήμα προς βήμα.",
  "hu": "Miért emlékszünk bizonyos dolgokra, míg másokat elfelejtünk? Nézzünk meg együtt egy egyszerű példát, lépésről lépésre.",
  "ms": "Mengapa kita mengingati sesetengah perkara tetapi melupakan yang lain? Mari kita teliti satu contoh mudah bersama-sama, langkah demi langkah.",
  "sk": "Prečo si niektoré veci pamätáme a iné zabúdame? Pozrime sa spolu na jednoduchý príklad, krok za krokom."
};
// export const BASE_SAMPLE_TEXT = SAMPLE_TEXTS.en;

export function normalizeLanguageId(value: string): LanguageId | null {
  const base = value.trim().toLowerCase().replaceAll("_", "-").split("-")[0];
  const aliases: Record<string, string> = { nb: "no", cmn: "zh", tl: "fil" };
  const id = aliases[base] ?? base;
  return EXAMPLE_LANGUAGES.some(l => l.id === id) ? id as LanguageId : null;
}

export function getSampleText(value: string): string {
  const id = normalizeLanguageId(value);
  if (!id) throw new Error(`Unsupported sample language: ${value}`);
  return SAMPLE_TEXTS[id];
}

export function languageDirection(id: string): "rtl" | "ltr" {
  return normalizeLanguageId(id) === "ar" ? "rtl" : "ltr";
}
