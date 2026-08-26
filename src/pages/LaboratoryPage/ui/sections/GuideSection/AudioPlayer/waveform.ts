/** Скільки семплів знімаємо з доріжки; під кількість рисок ресемплимо вже на льоту. */
const RESOLUTION = 512;

const cache = new Map<string, Promise<number[]>>();

/* OfflineAudioContext, а не AudioContext: декодування не потребує жесту користувача
   і не тримає живий аудіовихід. Один на весь застосунок. */
let decoder: OfflineAudioContext | null = null;

const getDecoder = () => {
  decoder ??= new OfflineAudioContext(1, 1, 44100);
  return decoder;
};

const decode = async (src: string): Promise<number[]> => {
  const response = await fetch(src);
  const buffer = await response.arrayBuffer();

  const audio = await getDecoder().decodeAudioData(buffer);
  const channel = audio.getChannelData(0);
  const block = Math.max(1, Math.floor(channel.length / RESOLUTION));

  const peaks: number[] = [];
  for (let index = 0; index < RESOLUTION; index += 1) {
    const start = index * block;
    let sum = 0;

    for (let offset = 0; offset < block; offset += 1) {
      const value = channel[start + offset] ?? 0;
      sum += value * value;
    }

    peaks.push(Math.sqrt(sum / block));
  }

  const loudest = Math.max(...peaks);
  return loudest > 0 ? peaks.map((peak) => peak / loudest) : peaks;
};

/** Профіль гучності 0..1. Кешується за URL — повторний вибір зброї безкоштовний. */
export const loadWaveform = (src: string): Promise<number[]> => {
  const cached = cache.get(src);
  if (cached) return cached;

  const request = decode(src).catch(() => {
    cache.delete(src);
    return [];
  });

  cache.set(src, request);
  return request;
};

/** Стискає профіль до потрібної кількості рисок усередненням. */
export const resampleWaveform = (peaks: number[], count: number): number[] => {
  if (count <= 0) return [];
  if (peaks.length === 0) return Array.from({ length: count }, () => 0);

  return Array.from({ length: count }, (_, index) => {
    const start = Math.floor((index * peaks.length) / count);
    const end = Math.max(start + 1, Math.floor(((index + 1) * peaks.length) / count));

    let sum = 0;
    for (let cursor = start; cursor < end; cursor += 1) sum += peaks[cursor];

    return sum / (end - start);
  });
};
