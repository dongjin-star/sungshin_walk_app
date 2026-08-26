// PRD 16.2 — 파생본(thumb/view)은 업로드 전 클라이언트에서 Canvas로 만든다.
// 원본은 리사이즈하지 않고 그대로 보관한다.

export interface ImageDerivatives {
  thumb: Blob; // 400px
  view: Blob; // 1600px
  original: Blob;
  width: number;
  height: number;
}

function resizeTo(bitmap: ImageBitmap, maxDim: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D 컨텍스트를 생성할 수 없습니다.");
  ctx.drawImage(bitmap, 0, 0, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("이미지 인코딩 실패"))), "image/webp", quality);
  });
}

export async function createImageDerivatives(source: Blob): Promise<ImageDerivatives> {
  const bitmap = await createImageBitmap(source);
  try {
    const [thumb, view] = await Promise.all([resizeTo(bitmap, 400, 0.75), resizeTo(bitmap, 1600, 0.85)]);
    return { thumb, view, original: source, width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}
