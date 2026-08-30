import { describe, expect, it } from "vitest";
import { detectAudio, validateAudio } from "./audio-validation";

describe("validación real de audio", () => {
  it.each([
    ["webm", new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0])],
    ["ogg", new TextEncoder().encode("OggS0000")],
    ["wav", new TextEncoder().encode("RIFF0000WAVE")],
    ["m4a", new TextEncoder().encode("0000ftypM4A ")],
    ["mp3", new TextEncoder().encode("ID300000")],
  ])("detecta %s por firma y no por extensión", (extension, bytes) => {
    expect(detectAudio(bytes)?.extension).toBe(extension);
  });

  it("rechaza contenido que contradice el MIME declarado", () => {
    const bytes = new TextEncoder().encode("OggS0000");
    const file = new File([bytes], "engaño.webm", { type: "audio/webm" });
    expect(validateAudio(file, bytes)).toMatchObject({
      ok: false,
      status: 415,
    });
  });
});
