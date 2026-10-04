export default function createWaveform(
  waves: number,
  frames: number,
  pcm: Buffer
): number[] {

  const waveform = Array<number>(waves).fill(0);
  const counts = Array<number>(waves).fill(0);
  const EXPONENT = 1.6;
  const MIN_HEIGHT = 0.08;

  // 1. Odczytaj próbki i przypisz je do przedziałów czasowych.
  for (let frame = 0; frame < frames; frame++) {
    const index = Math.min(
      waves - 1,
      Math.floor((frame / frames) * waves)
    );

    // PCM mono 16-bit: jedna próbka zajmuje 2 bajty.
    const sample = pcm.readInt16LE(frame * 2) / 32768;

    waveform[index] += sample * sample;
    counts[index]++;
  }

  // 2. Oblicz RMS dla każdego przedziału.
  for (let i = 0; i < waves; i++) {
    waveform[i] = counts[i] > 0
      ? Math.sqrt(waveform[i] / counts[i])
      : 0;
  }

  // 3. Normalizuj i przelicz na wysokości słupków.
  const maxRms = Math.max(...waveform);

  for (let i = 0; i < waves; i++) {
    const normalized = maxRms > 0 ? waveform[i] / maxRms : 0;
    const curved = Math.pow(normalized, EXPONENT);

    waveform[i] = MIN_HEIGHT + (1 - MIN_HEIGHT) * curved;
  }

  return waveform;
}