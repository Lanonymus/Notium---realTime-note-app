// Funkcja czyszcząca niewidzialne znaki i bezpiecznie parsująca JSON
export default function SafeParseJson<T = any>(rawText: string): T {
  // 1. Usuwamy niewidzialne znaki UTF (BOM, Zero-Width Spaces itp.)
  const sanitizedText = rawText
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // czyszczenie ukrytych bajtów
    .trim();

  // 2. Wyciągamy dokładnie to, co znajduje się między pierwszą '{' a ostatnią '}'
  const jsonMatch = sanitizedText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Model nie zwrócił prawidłowej struktury JSON.");
  }

  // 3. Parsujemy wyczyszczony ciąg
  return JSON.parse(jsonMatch[0]);
}