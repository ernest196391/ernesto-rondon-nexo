export const AUDIO_MAX_BYTES = Number(
  process.env.NEXO_AUDIO_MAX_BYTES || 10 * 1024 * 1024,
);

const formats = {
  webm: { mime: "audio/webm", extension: "webm" },
  ogg: { mime: "audio/ogg", extension: "ogg" },
  wav: { mime: "audio/wav", extension: "wav" },
  mp4: { mime: "audio/mp4", extension: "m4a" },
  mp3: { mime: "audio/mpeg", extension: "mp3" },
} as const;

export function detectAudio(bytes: Uint8Array) {
  const text = (start: number, end: number) =>
    new TextDecoder().decode(bytes.slice(start, end));
  if (text(0, 4) === "RIFF" && text(8, 12) === "WAVE") return formats.wav;
  if (text(0, 4) === "OggS") return formats.ogg;
  if (
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  )
    return formats.webm;
  if (text(4, 8) === "ftyp") return formats.mp4;
  if (text(0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0))
    return formats.mp3;
  return null;
}

export function validateAudio(file: File, bytes: Uint8Array) {
  if (!file.size || file.size > AUDIO_MAX_BYTES)
    return {
      ok: false as const,
      status: 413,
      message: "El audio está vacío o supera el límite permitido.",
    };
  const detected = detectAudio(bytes);
  if (!detected)
    return {
      ok: false as const,
      status: 415,
      message: "El formato de audio no es compatible.",
    };
  const declared = file.type.toLowerCase().split(";")[0];
  const compatible =
    !declared ||
    declared === detected.mime ||
    (declared === "audio/x-m4a" && detected.mime === "audio/mp4") ||
    (declared === "audio/x-wav" && detected.mime === "audio/wav");
  if (!compatible)
    return {
      ok: false as const,
      status: 415,
      message: "El contenido del audio no coincide con su formato.",
    };
  return { ok: true as const, ...detected };
}
