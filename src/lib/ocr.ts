/**
 * Reads text from a bill photo in the browser with Tesseract (English).
 * The library and language data load on first use (~15 MB, cached afterwards), so it needs internet once.
 * The image never leaves the device.
 */

// Tesseract page layouts: "single column" keeps table rows together (qty, rate and amount on one line);
// "auto" copes better with unusual layouts, so it's the second try.
const LAYOUTS = ["4", "3"] as const;

/** Phone photos and WhatsApp images are often small and low-contrast: resize to a size Tesseract reads well, in greyscale. */
async function prepareImage(image: File): Promise<HTMLCanvasElement | File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(image, { imageOrientation: "from-image" });
  } catch {
    return image;
  }
  const targetWidth = Math.min(2800, Math.max(1600, bitmap.width));
  const scale = targetWidth / bitmap.width;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return image;
  ctx.filter = "grayscale(1) contrast(1.25)";
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

/**
 * Reads the bill and parses it, trying a second page layout if the first doesn't give a
 * complete result. Returns the best parse and the text it came from.
 */
export async function scanBill<T extends object>(
  image: File,
  parse: (text: string) => T,
  isComplete: (result: T) => boolean,
  onProgress?: (fraction: number) => void,
): Promise<{ result: T; text: string }> {
  const { createWorker } = await import("tesseract.js");
  let pass = 0;
  const worker = await createWorker("eng", 1, {
    logger: (message: { status: string; progress: number }) => {
      if (message.status === "recognizing text") onProgress?.((pass + message.progress) / (pass === 0 ? 1 : LAYOUTS.length));
    },
  });
  try {
    const input = await prepareImage(image);
    let best: { result: T; text: string } | undefined;
    for (const layout of LAYOUTS) {
      await worker.setParameters({ tessedit_pageseg_mode: layout as never, preserve_interword_spaces: "1" });
      const { data } = await worker.recognize(input);
      const candidate = { result: parse(data.text), text: data.text };
      if (isComplete(candidate.result)) return candidate;
      if (!best || filledCount(candidate.result) > filledCount(best.result)) best = candidate;
      pass++;
    }
    return best!;
  } finally {
    await worker.terminate();
  }
}

const filledCount = (result: object) => Object.values(result).filter((v) => v !== undefined && v !== "").length;
